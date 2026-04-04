import { Logo } from './Logo';

export const LoadingScreen = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="relative flex items-center justify-center">
        <Logo className="h-12 w-auto animate-pulse" />
      </div>
    </div>
  );
};

export const PageLoader = () => {
  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <div className="relative flex items-center justify-center">
        <Logo className="h-10 w-auto animate-pulse opacity-70" />
      </div>
    </div>
  );
};
