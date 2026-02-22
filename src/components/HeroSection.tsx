import { useTheme } from '../hooks/useTheme';

export const HeroSection = () => {
  const { isDarkMode } = useTheme();

  return (
    <section
      id="home"
      className={`h-screen flex flex-col justify-center items-center ${
        isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'
      }`}
    >
      <h1 className="text-3xl md:text-5xl font-bold text-center">Hi i'm Szabolcs Győrffy aka SzaBee13</h1>
      <p className="mt-4 text-base md:text-lg text-center">Scroll down to explore more!</p>
    </section>
  );
};
