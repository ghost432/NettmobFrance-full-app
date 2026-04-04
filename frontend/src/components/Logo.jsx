import { useTheme } from '../context/ThemeContext';
import logo1 from '@/images/logo-1.png';
import logo2 from '@/images/logo-2.png';
import { Building2 } from 'lucide-react';

export const Logo = ({ className = '', compact = false }) => {
  const { theme } = useTheme();
  
  if (compact) {
    return (
      <div className={`flex items-center justify-center rounded-lg bg-primary p-2 ${className}`}>
        <Building2 className="h-6 w-6 text-primary-foreground" />
      </div>
    );
  }
  
  return (
    <img 
      src={theme === 'dark' ? logo2 : logo1} 
      alt="NettmobFrance Logo" 
      className={className}
    />
  );
};
