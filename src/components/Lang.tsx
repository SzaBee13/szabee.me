import { useTheme } from "../hooks/useTheme";

export const Lang = () => {
  const { isDarkMode } = useTheme();

  const langs = {
    "hu-HU": {
      name: "Hungarian",
      flag: "https://flagicons.lipis.dev/flags/4x3/hu.svg",
      level: "Native",
    },
    "en-US": {
      name: "English",
      flag: "https://flagicons.lipis.dev/flags/4x3/us.svg",
      level: "B2",
    },
    "de-DE": {
      name: "German",
      flag: "https://flagicons.lipis.dev/flags/4x3/de.svg",
      level: "A2",
    },
  };

  return (
    <section
      id="lang"
      className={`py-12 ${isDarkMode ? "bg-gray-900 text-white" : "bg-white text-gray-900"}`}
    >
      <div className="max-w-4xl mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-bold mb-4 text-center">Languages</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Object.entries(langs).map(([code, { name, flag, level }]) => (
            <div key={code} className="flex items-center space-x-4 p-4 border rounded-lg shadow-sm">
              <img src={flag} alt={`${name} flag`} className="w-12 h-12 rounded-full" />
              <div>
                <h3 className="text-lg font-semibold">{name}</h3>
                <p className="text-sm text-gray-500">{level}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
