from __future__ import annotations

import base64
import hashlib
import http.server
import json
import os
import secrets
import socket
import subprocess
import threading
import time
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import dataclass
from pathlib import Path
from typing import Any

OAUTH_BASE = "https://oauth.szabee.me"
DEFAULT_API_URL = "https://szabee.me/api/presence"
DEFAULT_CALLBACK_PORT = 8765
CONFIG_DIR = Path.home() / ".config" / "szabee-presence"
CONFIG_FILE = CONFIG_DIR / "config.json"
KEYRING_SERVICE = "szabee-presence"
KEYRING_USER = "oauth"

GAME_LAUNCHERS = {
    "steam": "Steam",
    "steamwebhelper": "Steam",
    "lutris": "Lutris",
    "heroic": "Heroic",
    "legendary": "Legendary",
}

TERMINALS = {
    "konsole": "Konsole",
    "kitty": "Kitty",
    "alacritty": "Alacritty",
    "wezterm-gui": "WezTerm",
    "wezterm": "WezTerm",
    "gnome-terminal": "GNOME Terminal",
    "foot": "Foot",
}

EDITORS = {
    "code": "VS Code",
    "codium": "VSCodium",
    "code-insiders": "VS Code Insiders",
}


@dataclass
class TokenSet:
    access_token: str
    refresh_token: str = ""


def now_iso() -> str:
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())


def run_command(args: list[str], timeout: float = 2.0) -> str:
    try:
        completed = subprocess.run(args, check=False, capture_output=True, text=True, timeout=timeout)
    except (FileNotFoundError, subprocess.SubprocessError):
        return ""

    if completed.returncode != 0:
        return ""

    return completed.stdout.strip()


def read_tokens() -> TokenSet | None:
    try:
        import keyring  # type: ignore

        raw = keyring.get_password(KEYRING_SERVICE, KEYRING_USER)
        if raw:
            data = json.loads(raw)
            return TokenSet(data.get("access_token", ""), data.get("refresh_token", ""))
    except Exception:
        pass

    if not CONFIG_FILE.exists():
        return None

    try:
        data = json.loads(CONFIG_FILE.read_text())
    except (OSError, json.JSONDecodeError):
        return None

    access_token = data.get("access_token", "")
    if not access_token:
        return None

    return TokenSet(access_token, data.get("refresh_token", ""))


def write_tokens(tokens: TokenSet) -> None:
    data = json.dumps(tokens.__dict__)

    try:
        import keyring  # type: ignore

        keyring.set_password(KEYRING_SERVICE, KEYRING_USER, data)
        return
    except Exception:
        pass

    CONFIG_DIR.mkdir(parents=True, exist_ok=True)
    CONFIG_FILE.write_text(data)
    CONFIG_FILE.chmod(0o600)


def b64url(raw: bytes) -> str:
    return base64.urlsafe_b64encode(raw).decode().rstrip("=")


def notify_auth(auth_url: str) -> None:
    def worker() -> None:
        notify_result = run_command(
            [
                "notify-send",
                "--wait",
                "--action=auth=Authenticate",
                "SzaBee Presence",
                "Authentication is required to publish rich presence.",
            ],
            timeout=30,
        )
        if "auth" in notify_result:
            subprocess.Popen(["xdg-open", auth_url])
            return

        kdialog_status = subprocess.run(
            [
                "kdialog",
                "--title",
                "SzaBee Presence",
                "--yesno",
                "Authentication is required to publish rich presence. Open the browser now?",
            ],
            check=False,
        ).returncode
        if kdialog_status == 0:
            subprocess.Popen(["xdg-open", auth_url])

    threading.Thread(target=worker, daemon=True).start()


def exchange_token(payload: dict[str, str]) -> TokenSet:
    request = urllib.request.Request(
        f"{OAUTH_BASE}/oauth2/token",
        data=json.dumps(payload).encode(),
        headers={"content-type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(request, timeout=15) as response:
        data = json.loads(response.read().decode())

    access_token = data.get("access_token", "")
    if not access_token:
        raise RuntimeError(data.get("error", "Token exchange failed."))

    return TokenSet(access_token=access_token, refresh_token=data.get("refresh_token", ""))


def refresh_tokens(client_id: str, tokens: TokenSet) -> TokenSet | None:
    if not tokens.refresh_token:
        return None

    try:
        next_tokens = exchange_token(
            {
                "grant_type": "refresh_token",
                "refresh_token": tokens.refresh_token,
                "client_id": client_id,
            }
        )
        if not next_tokens.refresh_token:
            next_tokens.refresh_token = tokens.refresh_token
        write_tokens(next_tokens)
        return next_tokens
    except Exception:
        return None


def wait_for_oauth_code(client_id: str, port: int) -> TokenSet:
    verifier = b64url(secrets.token_bytes(64))
    challenge = b64url(hashlib.sha256(verifier.encode()).digest())
    state = b64url(secrets.token_bytes(24))
    redirect_uri = f"http://127.0.0.1:{port}/callback"
    result: dict[str, str] = {}

    class CallbackHandler(http.server.BaseHTTPRequestHandler):
        def do_GET(self) -> None:
            parsed = urllib.parse.urlparse(self.path)
            params = urllib.parse.parse_qs(parsed.query)
            if parsed.path != "/callback" or params.get("state", [""])[0] != state:
                self.send_response(400)
                self.end_headers()
                self.wfile.write(b"Invalid OAuth callback.")
                return

            result["code"] = params.get("code", [""])[0]
            self.send_response(200)
            self.end_headers()
            self.wfile.write(b"Authentication complete. You can close this tab.")

        def log_message(self, format: str, *args: object) -> None:
            return

    auth_url = f"{OAUTH_BASE}/oauth2/authorize?{urllib.parse.urlencode({
        'response_type': 'code',
        'client_id': client_id,
        'redirect_uri': redirect_uri,
        'scope': 'openid profile email',
        'state': state,
        'code_challenge': challenge,
        'code_challenge_method': 'S256',
    })}"

    notify_auth(auth_url)
    subprocess.Popen(["xdg-open", auth_url])

    with http.server.HTTPServer(("127.0.0.1", port), CallbackHandler) as server:
        deadline = time.time() + 300
        while time.time() < deadline and not result.get("code"):
            server.timeout = 1
            server.handle_request()

    code = result.get("code")
    if not code:
        raise RuntimeError("OAuth timed out.")

    tokens = exchange_token(
        {
            "grant_type": "authorization_code",
            "code": code,
            "redirect_uri": redirect_uri,
            "client_id": client_id,
            "code_verifier": verifier,
        }
    )
    write_tokens(tokens)
    return tokens


def list_processes() -> list[tuple[str, str]]:
    output = run_command(["ps", "-eo", "comm=,args="], timeout=3)
    processes: list[tuple[str, str]] = []
    for line in output.splitlines():
        parts = line.strip().split(maxsplit=1)
        if not parts:
            continue
        processes.append((parts[0].lower(), parts[1] if len(parts) > 1 else parts[0]))
    return processes


def mpris_services() -> list[str]:
    output = run_command(["qdbus"], timeout=2) or run_command(["busctl", "--user", "list", "--no-legend"], timeout=2)
    services: list[str] = []
    for line in output.splitlines():
        service = line.split()[0]
        if service.startswith("org.mpris.MediaPlayer2."):
            services.append(service)
    return services


def qdbus_property(service: str, prop: str) -> str:
    return run_command(["qdbus", service, "/org/mpris/MediaPlayer2", prop], timeout=2)


def parse_mpris_metadata(raw: str) -> dict[str, str]:
    metadata: dict[str, str] = {}
    for line in raw.splitlines():
        if ":" not in line:
            continue
        key, value = line.split(":", 1)
        metadata[key.strip()] = value.strip()
    return metadata


def detect_music(timestamp: str) -> dict[str, str] | None:
    for service in mpris_services():
        status = qdbus_property(service, "org.mpris.MediaPlayer2.Player.PlaybackStatus")
        if status != "Playing":
            continue

        metadata = parse_mpris_metadata(qdbus_property(service, "org.mpris.MediaPlayer2.Player.Metadata"))
        title = metadata.get("xesam:title")
        artist = metadata.get("xesam:artist", "").strip("[]")
        album = metadata.get("xesam:album")
        art_url = metadata.get("mpris:artUrl")
        player = service.removeprefix("org.mpris.MediaPlayer2.")

        if title:
            return {
                "source": f"MPRIS/{player}",
                "title": title,
                "subtitle": artist,
                "detail": album or "",
                "icon": art_url or "",
                "updatedAt": timestamp,
            }

    return None


def first_window_title(names: list[str]) -> str:
    title = run_command(["kdotool", "getactivewindow", "getwindowname"], timeout=1)
    lowered = title.lower()
    if title and any(name in lowered for name in names):
        return title
    return ""


def detect_process_items(processes: list[tuple[str, str]], candidates: dict[str, str], source: str, timestamp: str) -> list[dict[str, str]]:
    found: dict[str, dict[str, str]] = {}
    for command, args in processes:
        for process_name, label in candidates.items():
            if command == process_name or command.startswith(process_name):
                found[label] = {
                    "source": source,
                    "title": label,
                    "detail": args[:120],
                    "updatedAt": timestamp,
                }
    return list(found.values())


def detect_games(processes: list[tuple[str, str]], timestamp: str) -> list[dict[str, str]]:
    games = detect_process_items(processes, GAME_LAUNCHERS, "Linux desktop", timestamp)
    known_tools = set(GAME_LAUNCHERS) | set(TERMINALS) | set(EDITORS)
    for command, args in processes:
        if command in known_tools:
            continue
        lowered = args.lower()
        if "steamapps/common" in lowered or "/games/" in lowered:
            games.append(
                {
                    "source": "Game process",
                    "title": command,
                    "detail": args[:120],
                    "updatedAt": timestamp,
                }
            )
    return games[:4]


def collect_presence() -> dict[str, Any]:
    timestamp = now_iso()
    processes = list_processes()
    editors = detect_process_items(processes, EDITORS, "KDE/Wayland", timestamp)
    terminals = detect_process_items(processes, TERMINALS, "KDE/Wayland", timestamp)

    editor_title = first_window_title(["code", "codium", "visual studio code"])
    if editor_title and editors:
        editors[0]["detail"] = editor_title

    terminal_title = first_window_title(list(TERMINALS))
    if terminal_title and terminals:
        terminals[0]["detail"] = terminal_title

    return {
        "music": detect_music(timestamp),
        "games": detect_games(processes, timestamp),
        "editors": editors[:2],
        "terminals": terminals[:2],
        "updatedAt": timestamp,
    }


def post_presence(api_url: str, tokens: TokenSet, payload: dict[str, Any]) -> tuple[int, str]:
    request = urllib.request.Request(
        api_url,
        data=json.dumps(payload).encode(),
        headers={
            "authorization": f"Bearer {tokens.access_token}",
            "content-type": "application/json",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=15) as response:
            return response.status, response.read().decode()
    except urllib.error.HTTPError as error:
        return error.code, error.read().decode()
    except (urllib.error.URLError, socket.timeout) as error:
        return 0, str(error)


def compact_payload(payload: dict[str, Any]) -> str:
    def without_timestamps(value: Any) -> Any:
        if isinstance(value, dict):
            return {
                key: without_timestamps(child)
                for key, child in value.items()
                if key not in {"updatedAt", "startedAt"}
            }
        if isinstance(value, list):
            return [without_timestamps(child) for child in value]
        return value

    return json.dumps(without_timestamps(payload), sort_keys=True, separators=(",", ":"))


def main() -> None:
    client_id = os.environ.get("SZABEE_OAUTH_CLIENT_ID") or os.environ.get("VITE_PUBLIC_SZABEE_OAUTH_CLIENT_ID")
    if not client_id:
        raise SystemExit("Set SZABEE_OAUTH_CLIENT_ID to the oauth.szabee.me public client ID.")

    api_url = os.environ.get("SZABEE_PRESENCE_API", DEFAULT_API_URL)
    port = int(os.environ.get("SZABEE_OAUTH_CALLBACK_PORT", str(DEFAULT_CALLBACK_PORT)))
    poll_seconds = int(os.environ.get("SZABEE_PRESENCE_POLL_SECONDS", "5"))
    heartbeat_seconds = int(os.environ.get("SZABEE_PRESENCE_HEARTBEAT_SECONDS", "45"))
    tokens = read_tokens() or wait_for_oauth_code(client_id, port)
    last_payload = ""
    last_sent = 0.0

    while True:
        payload = collect_presence()
        compact = compact_payload(payload)
        should_send = compact != last_payload or time.time() - last_sent >= heartbeat_seconds

        if should_send:
            status, body = post_presence(api_url, tokens, payload)
            if status in {401, 403}:
                refreshed = refresh_tokens(client_id, tokens)
                tokens = refreshed or wait_for_oauth_code(client_id, port)
                status, body = post_presence(api_url, tokens, payload)

            if 200 <= status < 300:
                last_payload = compact
                last_sent = time.time()
            else:
                print(f"presence post failed: {status} {body}", flush=True)

        time.sleep(poll_seconds)


if __name__ == "__main__":
    main()
