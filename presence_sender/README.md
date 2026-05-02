# SzaBee Rich Presence Sender

Linux Wayland/KDE Plasma background sender for `szabee.me`.

It collects music from MPRIS, likely games, VS Code/VSCodium, and terminal activity, then posts a normalized payload to `/api/presence`. Authentication uses `oauth.szabee.me` PKCE with the same public client ID used by the web admin page.

## Requirements

- Python 3.11+
- KDE Plasma/Wayland recommended
- `qdbus` or `busctl` for MPRIS music detection
- `notify-send` or `kdialog` for auth prompts
- Optional: Python `keyring` package for secure token storage

## Run

```bash
export SZABEE_OAUTH_CLIENT_ID="your-client-id"
export SZABEE_PRESENCE_API="https://szabee.me/api/presence"
python -m presence_sender
```

The OAuth app must allow the redirect URI:

```text
http://127.0.0.1:8765/callback
```

## Install As User Service

Copy `systemd/szabee-presence.service` to `~/.config/systemd/user/`, adjust the `WorkingDirectory`, then run:

```bash
mkdir -p ~/.config/szabee-presence
printf 'SZABEE_OAUTH_CLIENT_ID=%s\n' "your-client-id" > ~/.config/szabee-presence/env
systemctl --user daemon-reload
systemctl --user enable --now szabee-presence.service
```

Tokens are stored in the user keyring when `keyring` is installed. Otherwise they are written to `~/.config/szabee-presence/config.json` with mode `0600`.
