
import { useTheme } from '../hooks/useTheme';

export default function Footer() {
  const { isDarkMode } = useTheme();

  return (
    <footer className={`py-8 text-center border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
      <p>&copy; 2024-2026 SzaBee13. All rights reserved.</p>
    </footer>
  );
}