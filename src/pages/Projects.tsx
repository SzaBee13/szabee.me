import { useTheme } from '../hooks/useTheme';
import projectsData from '../assets/projects.json';
import { Navbar } from '../components/Navbar';
import Footer from '../components/Footer';
import ProjectCard from '../components/ProjectCard';
import type { ProjectItem } from '../components/ProjectCard';

export default function ProjectsPage() {
  const { isDarkMode } = useTheme();
  const projects: ProjectItem[] = projectsData.projects;

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
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
      <Navbar />
      <main className="pt-16">
        <section
          id="projects"
          className={`py-20 md:py-24 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}
        >
          <div className="max-w-7xl px-6 mx-auto">
            <h2 className="mb-8 text-3xl font-bold text-center md:text-4xl">Projects</h2>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              {projects.map((project) => (
                <ProjectCard
                  key={project.title}
                  project={project}
                  isDarkMode={isDarkMode}
                  getTagColor={getTagColor}
                  roomy
                />
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
