import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { ThemeToggle } from '../components/ThemeToggle';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

const Dashboard = () => {
  useDocumentTitle('Dashboard');
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.role === 'admin') {
      navigate('/admin/dashboard');
    } else if (user?.role === 'automob') {
      navigate('/automob/dashboard');
    } else if (user?.role === 'client') {
      navigate('/client/dashboard');
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-background">
      <nav className="bg-card shadow-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary">NettmobFrance</h1>
          <div className="flex items-center gap-4">
            <Link to="/missions" className="text-foreground hover:text-primary transition-colors">Missions</Link>
            <Link to="/chat" className="text-foreground hover:text-primary transition-colors">Chat</Link>
            <ThemeToggle />
            <span className="text-sm text-muted-foreground">{user?.email} ({user?.role})</span>
            <button onClick={logout} className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors">
              Déconnexion
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold mb-8 text-foreground">Tableau de bord</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link to="/missions" className="bg-card p-6 rounded-lg shadow border border-border hover:shadow-lg transition">
            <div className="text-4xl mb-4">📋</div>
            <h3 className="text-xl font-semibold mb-2 text-foreground">Missions</h3>
            <p className="text-muted-foreground">Gérer vos missions</p>
          </Link>

          <Link to="/chat" className="bg-card p-6 rounded-lg shadow border border-border hover:shadow-lg transition">
            <div className="text-4xl mb-4">💬</div>
            <h3 className="text-xl font-semibold mb-2 text-foreground">Chat</h3>
            <p className="text-muted-foreground">Messagerie en temps réel</p>
          </Link>

          <div className="bg-card p-6 rounded-lg shadow border border-border">
            <div className="text-4xl mb-4">📍</div>
            <h3 className="text-xl font-semibold mb-2 text-foreground">Géolocalisation</h3>
            <p className="text-muted-foreground">Missions à proximité</p>
          </div>
        </div>

        <div className="mt-8 bg-card p-6 rounded-lg shadow border border-border">
          <h3 className="text-xl font-semibold mb-4 text-foreground">Informations du profil</h3>
          <div className="space-y-2 text-foreground">
            <p><strong>Email:</strong> {user?.email}</p>
            <p><strong>Rôle:</strong> {user?.role}</p>
            <p><strong>Vérifié:</strong> {user?.verified ? 'Oui ✅' : 'En attente ⏳'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
