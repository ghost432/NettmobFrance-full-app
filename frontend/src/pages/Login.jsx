import { LoginForm } from '../components/login-form';
import { ThemeToggle } from '../components/ThemeToggle';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

const Login = () => {
  useDocumentTitle('Connexion');
  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center p-6 md:p-10 relative">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-sm md:max-w-6xl">
        <LoginForm />
      </div>
    </div>
  );
};

export default Login;
