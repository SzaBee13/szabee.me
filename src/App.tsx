import { useTheme } from './hooks/useTheme';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { About } from './components/About';
import { Skills } from './components/Skills';
import { Projects } from './components/Projects';
import { ClassProjects } from './components/ClassProjects';
import { Socials } from './components/Socials';
import { NowPlaying } from './components/NowPlaying';
import Footer from './components/Footer';

function App() {
  const { isDarkMode } = useTheme();

  return (
    <div className={`${isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
      <Navbar />
      <div>
        <HeroSection />
        <About />
        <Skills />
        <Projects />
        <ClassProjects />
        <Socials />
        <NowPlaying />
        <Footer />
      </div>
    </div>
  );
}

export default App;
