import { useTheme } from "../hooks/useTheme";

export const Skills = () => {
  const { isDarkMode } = useTheme();

  const skillGroups = [
    {
      name: "HTML / CSS / JS",
      icon: (
        <div className="flex space-x-2">
          <img src="/icons/html-5-svgrepo-com.svg" alt="HTML" className="w-6 h-6" />
          <img src="/icons/css-3-svgrepo-com.svg" alt="CSS" className="h-6 w-6" />
          <img src="/icons/js-svgrepo-com.svg" alt="JavaScript" className="h-6 w-6" />
        </div>
      ),
    },
    {
      name: "Python",
      icon: <img src="/icons/python-svgrepo-com.svg" alt="Python" className="h-6 w-6" />,
    },
    {
      name: "Bash / PS",
      icon: <img src="/icons/terminal-svgrepo-com.svg" alt="Terminal" className="h-6 w-6" />,
    },
    {
      name: "Lua",
      icon: <img src="/icons/lua-svgrepo-com.svg" alt="Lua" className="h-6 w-6" />,
    },
    {
      name: "C++",
      icon: <img src="/icons/cpp-svgrepo-com.svg" alt="C++" className="h-6 w-6" />,
    },
    {
      name: "Linux",
      icon: <img src="/icons/linux-svgrepo-com.svg" alt="Linux" className="h-6 w-6" />,
    },
  ];

  return (
    <section
      id="skills"
      className={`py-12 ${isDarkMode ? "bg-gray-900 text-white" : "bg-white text-gray-900"}`}
    >
      <div className="max-w-4xl mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-bold mb-6 text-center">
          Skills
        </h2>
        <div className="flex flex-wrap justify-center gap-4">
          {skillGroups.map((skill) => (
            <div
              key={skill.name}
              className={`flex items-center px-4 py-2 rounded-full shadow-lg ${
                isDarkMode
                  ? "bg-gray-800 border border-gray-700"
                  : "bg-gray-50 border border-gray-200"
              }`}
            >
              {skill.icon}
              <span className="ml-2">{skill.name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
