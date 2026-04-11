import { useTheme } from '../hooks/useTheme';
import projectsData from '../assets/projects.json';
import { Navbar } from '../components/Navbar';
import Footer from '../components/Footer';
import ProjectCard from '../components/ProjectCard';
import type { ProjectItem } from '../components/ProjectCard';
import { PageMeta } from '../components/PageMeta';

export default function ClassProjectsPage() {
  const { isDarkMode } = useTheme();
  const classProjects: ProjectItem[] = projectsData.classProjects;

  const getTagColor = (tag: string) => {
    const colorMap: Record<string, { bg: string; text: string }> = {
      'Javascript': { bg: 'bg-blue-100 dark:bg-blue-900', text: 'text-blue-800 dark:text-blue-300' },
      'Backend': { bg: 'bg-green-100 dark:bg-green-900', text: 'text-green-800 dark:text-green-300' },
      'Frontend': { bg: 'bg-green-100 dark:bg-green-900', text: 'text-green-800 dark:text-green-300' },
    };
    return colorMap[tag] || { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-800 dark:text-gray-300' };
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
      <PageMeta
        title="Class Projects | SzaBee13"
        description="A collection of class projects built by SzaBee13."
        path="/projects/class"
      />
      <Navbar />
      <main className="pt-16">
        <section
          id="class"
          className={`py-20 md:py-24 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}
        >
          <div className="px-6 mx-auto max-w-7xl">
            <h2 className="mb-8 text-3xl font-bold text-center md:text-4xl">Class Projects</h2>
            <p className="mb-6 text-sm text-center md:text-base">NOTE: These are my projects, you find more of my project at GitHub that are programmed at classes.</p>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              {classProjects.map((project) => (
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
