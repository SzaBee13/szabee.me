import { useTheme } from './hooks/useTheme';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { About } from './components/About';
import { Skills } from './components/Skills';
import { Projects } from './components/Projects';
import { ClassProjects } from './components/ClassProjects';
import { Socials } from './components/Socials';
import { NowPlaying } from './components/NowPlaying';

function App() {
  const { isDarkMode } = useTheme();

  return (
    <div className={`${isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
      <Navbar />
      <div className="pt-16">
        <HeroSection />
        <About />
        <Skills />
        <Projects />
        <ClassProjects />
        <Socials />
        <NowPlaying />
        <footer className={`py-8 text-center border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <p>&copy; 2024-2026 SzaBee13. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}

export default App;
