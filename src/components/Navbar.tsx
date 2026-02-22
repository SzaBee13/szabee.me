import { useState } from 'react';
import { useTheme } from '../hooks/useTheme';

export const Navbar = () => {
  const { isDarkMode, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const getDarkModeSVG = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
    </svg>
  );

  const getLightModeSVG = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <circle cx="12" cy="12" r="5"></circle>
      <line x1="12" y1="1" x2="12" y2="3"></line>
      <line x1="12" y1="21" x2="12" y2="23"></line>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
      <line x1="1" y1="12" x2="3" y2="12"></line>
      <line x1="21" y1="12" x2="23" y2="12"></line>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
    </svg>
  );

  return (
    <nav className={`flex justify-between items-center p-4 fixed w-full top-0 z-10 ${
      isDarkMode ? 'bg-gray-800 text-white' : 'bg-gray-800 text-white'
    }`}>
      {/* Left: Picture */}
      <div className="flex items-center">
        <img src="/szabee13.jpg" alt="Logo" className="h-10 w-10 rounded-full" />
      </div>

      {/* Center: Page Selector */}
      <ul className="hidden md:flex md:space-x-6">
        <li><a href="#home" className="hover:bg-gray-700 hover:text-white px-3 py-2 rounded">Home</a></li>
        <li><a href="#about" className="hover:bg-gray-700 hover:text-white px-3 py-2 rounded">About</a></li>
        <li><a href="#skills" className="hover:bg-gray-700 hover:text-white px-3 py-2 rounded">Skills</a></li>
        <li><a href="#projects" className="hover:bg-gray-700 hover:text-white px-3 py-2 rounded">Projects</a></li>
        <li><a href="#class" className="hover:bg-gray-700 hover:text-white px-3 py-2 rounded">Class Projects</a></li>
        <li><a href="#socials" className="hover:bg-gray-700 hover:text-white px-3 py-2 rounded">Socials</a></li>
        <li><a href="#now-playing-widget" className="hover:bg-gray-700 hover:text-white px-3 py-2 rounded">Now Playing</a></li>
      </ul>

      {/* Right: Theme Selector and Hamburger Menu */}
      <div className="flex items-center space-x-4">
        <button
          onClick={toggleTheme}
          className={`p-2 rounded ${isDarkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-300'}`}
        >
          {isDarkMode ? getDarkModeSVG() : getLightModeSVG()}
        </button>

        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className={`md:hidden p-2 rounded ${isDarkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-300'}`}
        >
          ☰
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <ul className="md:hidden absolute top-16 left-0 w-full bg-gray-800 p-4 flex flex-col space-y-2">
          <li><a href="#home" className="hover:bg-gray-700 hover:text-white px-3 py-2 rounded block">Home</a></li>
          <li><a href="#about" className="hover:bg-gray-700 hover:text-white px-3 py-2 rounded block">About</a></li>
          <li><a href="#skills" className="hover:bg-gray-700 hover:text-white px-3 py-2 rounded block">Skills</a></li>
          <li><a href="#projects" className="hover:bg-gray-700 hover:text-white px-3 py-2 rounded block">Projects</a></li>
          <li><a href="#class" className="hover:bg-gray-700 hover:text-white px-3 py-2 rounded block">Class Projects</a></li>
          <li><a href="#socials" className="hover:bg-gray-700 hover:text-white px-3 py-2 rounded block">Socials</a></li>
          <li><a href="#now-playing-widget" className="hover:bg-gray-700 hover:text-white px-3 py-2 rounded block">Now Playing</a></li>
        </ul>
      )}
    </nav>
  );
};
