import { useTheme } from './hooks/useTheme';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { About } from './components/About';
import { Skills } from './components/Skills';
import { Socials } from './components/Socials';
import { NowPlaying } from './components/NowPlaying';
import Footer from './components/Footer';
import { PageMeta } from './components/PageMeta';

function App() {
  const { isDarkMode } = useTheme();

  return (
    <div className={`${isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
      <PageMeta
        title="SzaBee13 | Developer & Gamer Portfolio"
        description="SzaBee13's personal portfolio showcasing development projects, coding skills, and gaming interests."
        path="/"
      />
      <Navbar />
      <div>
        <HeroSection />
        <About />
        <Skills />
        <Socials />
        <NowPlaying />
        <Footer />
      </div>
    </div>
  );
}

export default App;
