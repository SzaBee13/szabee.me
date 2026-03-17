import { useTheme } from '../hooks/useTheme';
import projectsData from '../assets/projects.json';

interface Project {
  title: string;
  description: string;
  tags: string[];
  links?: { label: string; url: string }[];
}

export const Projects = () => {
  const { isDarkMode } = useTheme();
  const projects: Project[] = projectsData.projects;

  const getTagColor = (tag: string) => {
    const colorMap: Record<string, { bg: string; text: string }> = {
      'Javascript': { bg: 'bg-blue-100 dark:bg-blue-900', text: 'text-blue-800 dark:text-blue-300' },
      'Python': { bg: 'bg-blue-100 dark:bg-blue-900', text: 'text-blue-800 dark:text-blue-300' },
      'Backend': { bg: 'bg-green-100 dark:bg-green-900', text: 'text-green-800 dark:text-green-300' },
      'Frontend': { bg: 'bg-green-100 dark:bg-green-900', text: 'text-green-800 dark:text-green-300' },
      'Tools': { bg: 'bg-yellow-100 dark:bg-yellow-900', text: 'text-yellow-800 dark:text-yellow-300' },
      'Utils': { bg: 'bg-yellow-100 dark:bg-yellow-900', text: 'text-yellow-800 dark:text-yellow-300' },
      'Fun': { bg: 'bg-pink-100 dark:bg-pink-900', text: 'text-pink-800 dark:text-pink-300' },
      'Programming Language': { bg: 'bg-purple-100 dark:bg-purple-900', text: 'text-purple-800 dark:text-purple-300' },
      'Windows': { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-800 dark:text-gray-300' },
      'Linux': { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-800 dark:text-gray-300' },
      'MacOS': { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-800 dark:text-gray-300' },
      'Client': { bg: 'bg-red-100 dark:bg-red-900', text: 'text-red-800 dark:text-red-300' },
      'Fortnite': { bg: 'bg-red-100 dark:bg-red-900', text: 'text-red-800 dark:text-red-300' },
      'LSMP': { bg: 'bg-indigo-100 dark:bg-indigo-900', text: 'text-indigo-800 dark:text-indigo-300' },
      'OAuth': { bg: 'bg-indigo-100 dark:bg-indigo-900', text: 'text-indigo-800 dark:text-indigo-300' },
      'Escape': { bg: 'bg-teal-100 dark:bg-teal-900', text: 'text-teal-800 dark:text-teal-300' },
      'Szabfun': { bg: 'bg-pink-100 dark:bg-pink-900', text: 'text-pink-800 dark:text-pink-300' },
      'Chat': { bg: 'bg-purple-100 dark:bg-purple-900', text: 'text-purple-800 dark:text-purple-300' },
      'Spigot': { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-800 dark:text-gray-300' },
    };
    return colorMap[tag] || { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-800 dark:text-gray-300' };
  };

  return (
    <section
      id="projects"
      className={`py-12 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}
    >
      <div className="max-w-6xl px-4 mx-auto">
        <h2 className="mb-6 text-2xl font-bold text-center md:text-3xl">Projects</h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <div
              key={project.title}
              className={`p-4 md:p-6 rounded-lg shadow-lg transition-transform transform hover:scale-105 ${
                isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-gray-50 border border-gray-200'
              }`}
            >
              <h3 className="mb-2 text-lg font-bold md:text-xl">{project.title}</h3>
              <p className="mb-4 text-sm md:text-base">{project.description}</p>
              <div className="flex flex-wrap gap-2 mb-4">
                {project.tags.map((tag) => {
                  const colors = getTagColor(tag);
                  return (
                    <span key={tag} className={`text-xs font-semibold px-2.5 py-0.5 rounded ${colors.bg} ${colors.text}`}>
                      {tag}
                    </span>
                  );
                })}
              </div>
              {project.links && (
                <div className="flex flex-col gap-2">
                  {project.links.map((link) => {
                    const isGitHub = link.label.toLowerCase().includes('github');
                    const isVisit = link.label.toLowerCase().includes('visit');
                    return (
                      <a
                        key={link.label}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex items-center justify-center gap-2 px-3 py-2 rounded text-sm transition ${
                          isGitHub
                            ? 'bg-gray-900 hover:bg-gray-700 text-white'
                            : 'bg-blue-500 hover:bg-blue-600 text-white'
                        }`}
                      >
                        {isGitHub && (
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 .5C5.648.5.5 5.648.5 12c0 5.086 3.292 9.396 7.86 10.93.574.106.786-.25.786-.554 0-.273-.01-1.004-.015-1.97-3.2.696-3.875-1.544-3.875-1.544-.523-1.33-1.277-1.684-1.277-1.684-1.043-.714.08-.7.08-.7 1.152.08 1.756 1.184 1.756 1.184 1.025 1.754 2.69 1.247 3.344.954.104-.743.4-1.247.727-1.534-2.553-.29-5.238-1.277-5.238-5.683 0-1.255.448-2.28 1.184-3.084-.12-.29-.512-1.457.112-3.037 0 0 .96-.307 3.144 1.176a10.94 10.94 0 0 1 5.728 0c2.184-1.483 3.144-1.176 3.144-1.176.624 1.58.232 2.747.112 3.037.736.804 1.184 1.83 1.184 3.084 0 4.417-2.69 5.39-5.252 5.673.408.352.776 1.048.776 2.112 0 1.526-.015 2.756-.015 3.13 0 .308.208.666.792.554C20.708 21.396 24 17.086 24 12 24 5.648 18.352.5 12 .5z" />
                          </svg>
                        )}
                        {isVisit && (
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        )}
                        {link.label}
                      </a>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
