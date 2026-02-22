import { useTheme } from '../hooks/useTheme';

export const About = () => {
  const { isDarkMode } = useTheme();

  return (
    <section
      id="about"
      className={`py-12 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}
    >
      <div className="max-w-4xl mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-bold mb-4 text-center">About Me</h2>
        <p className="text-sm md:text-base mb-3">
          Hello! I'm SzaBee13, a passionate developer and gamer. I love creating projects that challenge me and allow me to learn new things.
        </p>
        <p className="text-sm md:text-base mb-3">
          Feel free to explore my work and connect with me on social media!
        </p>
        <p className="text-sm md:text-base mb-3">
          I go 2 times a week to coding classes from age 8 years old.
        </p>
        <p className="text-sm md:text-base">
          Teachers:{' '}
          <a href="https://xeretis.me" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-400 font-semibold">
            Xeretis
          </a>
          , p3am,{' '}
          <a href="https://www.logiscool.com/en-hu/" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-400 font-semibold">
            Logiscool
          </a>
        </p>
      </div>
    </section>
  );
};
