import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { missionAPI } from '../lib/api';
import { Link } from 'react-router-dom';
import Map, { Marker, Popup } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { ThemeToggle } from '../components/ThemeToggle';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { toast } from '../components/ui/toast';

const Missions = () => {
  useDocumentTitle('Missions');
  const { user, logout } = useAuth();
  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('list');
  const [selectedMission, setSelectedMission] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '', description: '', city: '', address: '', budget: '', startDate: '', endDate: ''
  });

  useEffect(() => {
    fetchMissions();
  }, []);

  const fetchMissions = async () => {
    try {
      const { data } = await missionAPI.getAll();
      setMissions(data);
    } catch (error) {
      console.error('Erreur chargement missions:', error);
      toast.error('Impossible de charger les missions');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMission = async (e) => {
    e.preventDefault();
    try {
      await missionAPI.create(formData);
      toast.success('Mission créée avec succès !');
      setShowCreateForm(false);
      fetchMissions();
    } catch (error) {
      console.error('Erreur création mission:', error);
      toast.error(error.response?.data?.error || 'Erreur lors de la création');
    }
  };

  const handleApply = async (missionId) => {
    try {
      await missionAPI.apply(missionId, { message: 'Je suis intéressé' });
      toast.success('Candidature envoyée !');
      fetchMissions();
    } catch (error) {
      console.error('Erreur candidature:', error);
      toast.error(error.response?.data?.error || 'Erreur lors de la candidature');
    }
  };

  if (loading) return <div className="flex items-center justify-center h-screen bg-background">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
  </div>;

  return (
    <div className="min-h-screen bg-background">
      <nav className="bg-card shadow-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link to="/dashboard" className="text-2xl font-bold text-primary">NettmobFrance</Link>
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="text-foreground hover:text-primary transition-colors">Dashboard</Link>
            <Link to="/chat" className="text-foreground hover:text-primary transition-colors">Chat</Link>
            <ThemeToggle />
            <button onClick={logout} className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors">Déconnexion</button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-foreground">Missions</h2>
          <div className="flex gap-2">
            <button onClick={() => setViewMode('list')}
              className={`px-4 py-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-foreground hover:bg-accent'}`}>
              Liste
            </button>
            <button onClick={() => setViewMode('map')}
              className={`px-4 py-2 rounded-lg transition-colors ${viewMode === 'map' ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-foreground hover:bg-accent'}`}>
              Carte
            </button>
            {user?.role === 'client' && (
              <button onClick={() => setShowCreateForm(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                + Créer
              </button>
            )}
          </div>
        </div>

        {viewMode === 'list' && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {missions.length === 0 ? (
              <div className="bg-card p-8 rounded-lg border border-border text-center text-muted-foreground">
                Aucune mission disponible
              </div>
            ) : (
              missions.map(mission => (
                <div key={mission.id} className="bg-card p-4 sm:p-6 rounded-lg shadow border border-border hover:shadow-lg transition">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-lg sm:text-xl font-semibold mb-2 text-foreground truncate">{mission.title}</h3>
                      <p className="text-sm sm:text-base text-muted-foreground mb-4 line-clamp-2">{mission.description}</p>
                      <div className="flex flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                        <span>📍 {mission.city}</span>
                        <span>💰 {mission.budget}€</span>
                        <span className="capitalize px-2 py-1 rounded bg-primary/10 text-primary">
                          {mission.status}
                        </span>
                      </div>
                    </div>
                    {user?.role === 'automob' && mission.status === 'ouvert' && (
                      <button onClick={() => handleApply(mission.id)}
                        className="ml-2 sm:ml-4 px-3 sm:px-4 py-2 text-sm sm:text-base bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
                        Postuler
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {viewMode === 'map' && (
          <div className="bg-white rounded-lg shadow overflow-hidden" style={{ height: '600px' }}>
            <Map
              mapboxAccessToken={import.meta.env.VITE_MAPBOX_TOKEN}
              initialViewState={{ longitude: 2.3522, latitude: 48.8566, zoom: 10 }}
              mapStyle="mapbox://styles/mapbox/streets-v12"
            >
              {missions.filter(m => m.latitude && m.longitude).map(mission => (
                <Marker
                  key={mission.id}
                  longitude={mission.longitude}
                  latitude={mission.latitude}
                  anchor="bottom"
                  onClick={(e) => {
                    e.originalEvent.stopPropagation();
                    setSelectedMission(mission);
                  }}
                >
                  <div className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm cursor-pointer hover:bg-blue-700">
                    📍 {mission.budget}€
                  </div>
                </Marker>
              ))}

              {selectedMission && (
                <Popup
                  longitude={selectedMission.longitude}
                  latitude={selectedMission.latitude}
                  anchor="top"
                  onClose={() => setSelectedMission(null)}
                >
                  <div className="p-2">
                    <h3 className="font-semibold mb-1">{selectedMission.title}</h3>
                    <p className="text-sm text-gray-600 mb-2">{selectedMission.city}</p>
                    <p className="text-sm font-semibold">{selectedMission.budget}€</p>
                  </div>
                </Popup>
              )}
            </Map>
          </div>
        )}

        {showCreateForm && user?.role === 'client' && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-card rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-border">
              <h3 className="text-2xl font-bold mb-4 text-foreground">Créer une mission</h3>
              <form onSubmit={handleCreateMission} className="space-y-4">
                <input placeholder="Titre" value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground" required />
                <textarea placeholder="Description" value={formData.description} rows={4}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground" required />
                <input placeholder="Ville" value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground" required />
                <input placeholder="Adresse complète" value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground" />
                <input type="number" placeholder="Budget (€)" value={formData.budget}
                  onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground" required />
                <div className="grid grid-cols-2 gap-4">
                  <input type="date" placeholder="Date début" value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="px-3 py-2 bg-background border border-input rounded-lg text-foreground" />
                  <input type="date" placeholder="Date fin" value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="px-3 py-2 bg-background border border-input rounded-lg text-foreground" />
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setShowCreateForm(false)}
                    className="flex-1 py-2 border border-border rounded-lg hover:bg-accent transition-colors text-foreground">Annuler</button>
                  <button type="submit"
                    className="flex-1 bg-primary text-primary-foreground py-2 rounded-lg hover:bg-primary/90 transition-colors">
                    Créer
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Missions;
