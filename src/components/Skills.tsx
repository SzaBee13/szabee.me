import { useTheme } from "../hooks/useTheme";

export const Skills = () => {
  const { isDarkMode } = useTheme();

  const skillGroups = [
    {
      name: "HTML / CSS / JS",
      icon: (
        <div className="flex space-x-2">
          <img src="/icons/skills/html-5-svgrepo-com.svg" alt="HTML" className="w-6 h-6" />
          <img src="/icons/skills/css-3-svgrepo-com.svg" alt="CSS" className="w-6 h-6" />
          <img src="/icons/skills/js-svgrepo-com.svg" alt="JavaScript" className="w-6 h-6" />
        </div>
      ),
    },
    {
      name: "React",
      icon: <img src="/icons/skills/react-svgrepo-com.svg" alt="React" className="w-6 h-6" />,
    },
    {
      name: "Python",
      icon: <img src="/icons/skills/python-svgrepo-com.svg" alt="Python" className="w-6 h-6" />,
    },
    {
      name: "Bash / PS",
      icon: <img src="/icons/skills/terminal-svgrepo-com.svg" alt="Terminal" className="w-6 h-6" />,
    },
    {
      name: "Lua",
      icon: <img src="/icons/skills/lua-svgrepo-com.svg" alt="Lua" className="w-6 h-6" />,
    },
    {
      name: "C++",
      icon: <img src="/icons/skills/cpp-svgrepo-com.svg" alt="C++" className="w-6 h-6" />,
    },
    {
      name: "Linux",
      icon: <img src="/icons/skills/linux-svgrepo-com.svg" alt="Linux" className="w-6 h-6" />,
    },
  ];

  return (
    <section
      id="skills"
      className={`py-12 ${isDarkMode ? "bg-gray-900 text-white" : "bg-white text-gray-900"}`}
    >
      <div className="max-w-4xl px-4 mx-auto">
        <h2 className="mb-6 text-2xl font-bold text-center md:text-3xl">
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
