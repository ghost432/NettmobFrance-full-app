import { Moon, Sun } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '../context/ThemeContext';

export const ThemeToggle = ({ buttonClassName = '', iconClassName = '' }) => {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        'relative inline-flex items-center justify-center rounded-md p-2 text-foreground hover:bg-accent hover:text-accent-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        buttonClassName
      )}
      aria-label="Toggle theme"
    >
      <Sun className={cn('h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0', iconClassName)} />
      <Moon className={cn('absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100', iconClassName)} />
      <span className="sr-only">Toggle theme</span>
    </button>
  );
};
