import { useState, useEffect } from 'react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useAuth } from '@/context/AuthContext';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { adminNavigation } from '@/constants/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2, ArrowLeft } from 'lucide-react';
import { toast } from '@/components/ui/toast';
import api from '@/lib/api';
import { useNavigate } from 'react-router-dom';

const SecteursCompetences = () => {
  useDocumentTitle('Secteurs & Compétences');
  const { user } = useAuth();
  const navigate = useNavigate();
  const [secteurs, setSecteurs] = useState([]);
  const [competences, setCompetences] = useState([]);
  const [showSecteurModal, setShowSecteurModal] = useState(false);
  const [showCompetenceModal, setShowCompetenceModal] = useState(false);
  const [editingSecteur, setEditingSecteur] = useState(null);
  const [editingCompetence, setEditingCompetence] = useState(null);
  const [secteurForm, setSecteurForm] = useState({ nom: '', description: '', active: true });
  const [competenceForm, setCompetenceForm] = useState({ secteur_id: '', nom: '', description: '', active: true });

  useEffect(() => {
    fetchSecteurs();
    fetchAllCompetences();
  }, []);

  const fetchSecteurs = async () => {
    try {
      const response = await api.get('/secteurs');
      setSecteurs(response.data);
    } catch (err) {
      toast.error('Erreur lors du chargement des secteurs');
    }
  };

  const fetchAllCompetences = async () => {
    try {
      const response = await api.get('/competences');
      setCompetences(response.data);
    } catch (err) {
      toast.error('Erreur lors du chargement des compétences');
    }
  };

  const handleCreateSecteur = async (e) => {
    e.preventDefault();
    try {
      await api.post('/secteurs', secteurForm);
      toast.success('Secteur créé avec succès');
      fetchSecteurs();
      setShowSecteurModal(false);
      setSecteurForm({ nom: '', description: '', active: true });
    } catch (err) {
      toast.error('Erreur lors de la création du secteur');
    }
  };

  const handleUpdateSecteur = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/secteurs/${editingSecteur.id}`, secteurForm);
      toast.success('Secteur mis à jour');
      fetchSecteurs();
      setShowSecteurModal(false);
      setEditingSecteur(null);
      setSecteurForm({ nom: '', description: '', active: true });
    } catch (err) {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const handleDeleteSecteur = async (id) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce secteur ?')) return;
    try {
      await api.delete(`/secteurs/${id}`);
      toast.success('Secteur supprimé');
      fetchSecteurs();
      fetchAllCompetences();
    } catch (err) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleCreateCompetence = async (e) => {
    e.preventDefault();
    try {
      await api.post('/competences', competenceForm);
      toast.success('Compétence créée avec succès');
      fetchAllCompetences();
      setShowCompetenceModal(false);
      setCompetenceForm({ secteur_id: '', nom: '', description: '', active: true });
    } catch (err) {
      toast.error('Erreur lors de la création de la compétence');
    }
  };

  const handleUpdateCompetence = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/competences/${editingCompetence.id}`, competenceForm);
      toast.success('Compétence mise à jour');
      fetchAllCompetences();
      setShowCompetenceModal(false);
      setEditingCompetence(null);
      setCompetenceForm({ secteur_id: '', nom: '', description: '', active: true });
    } catch (err) {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const handleDeleteCompetence = async (id) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette compétence ?')) return;
    try {
      await api.delete(`/competences/${id}`);
      toast.success('Compétence supprimée');
      fetchAllCompetences();
    } catch (err) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const openEditSecteur = (secteur) => {
    setEditingSecteur(secteur);
    setSecteurForm({ nom: secteur.nom, description: secteur.description || '', active: secteur.active });
    setShowSecteurModal(true);
  };

  const openEditCompetence = (competence) => {
    setEditingCompetence(competence);
    setCompetenceForm({ secteur_id: competence.secteur_id, nom: competence.nom, description: competence.description || '', active: competence.active });
    setShowCompetenceModal(true);
  };

  const getCompetencesBySecteur = (secteurId) => {
    return competences.filter(c => c.secteur_id === secteurId);
  };

  return (
    <DashboardLayout
      title="Secteurs & compétences"
      description="Administrez les secteurs d'activité et les compétences associées"
      menuItems={adminNavigation}
      getRoleLabel={() => 'Administrateur'}
      getDisplayName={() => user?.email?.split('@')[0] || 'Admin'}
    >
      <section className="space-y-6">
        <div className="flex items-center justify-between gap-3">
          <Button variant="outline" size="sm" onClick={() => navigate('/admin/dashboard')}>
            <ArrowLeft className="h-4 w-4" />
            Tableau de bord
          </Button>
          <span className="text-sm text-muted-foreground">
            {secteurs.length} secteurs · {competences.length} compétences
          </span>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Secteurs */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Secteurs d'activité</CardTitle>
                <CardDescription>Gérer les secteurs disponibles</CardDescription>
              </div>
              <Button onClick={() => { setEditingSecteur(null); setSecteurForm({ nom: '', description: '', active: true }); setShowSecteurModal(true); }}>
                <Plus className="h-4 w-4 mr-2" />
                Nouveau
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {secteurs.map((secteur) => (
                  <div key={secteur.id} className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-accent">
                    <div className="flex-1">
                      <p className="font-medium">{secteur.nom}</p>
                      {secteur.description && <p className="text-xs text-muted-foreground">{secteur.description}</p>}
                      <p className="text-xs text-muted-foreground mt-1">{getCompetencesBySecteur(secteur.id).length} compétences</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => openEditSecteur(secteur)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteSecteur(secteur.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
                {secteurs.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">Aucun secteur</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Compétences */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Compétences</CardTitle>
                <CardDescription>Gérer les compétences par secteur</CardDescription>
              </div>
              <Button onClick={() => { setEditingCompetence(null); setCompetenceForm({ secteur_id: '', nom: '', description: '', active: true }); setShowCompetenceModal(true); }}>
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {secteurs.map((secteur) => {
                  const secteurCompetences = getCompetencesBySecteur(secteur.id);
                  if (secteurCompetences.length === 0) return null;
                  return (
                    <div key={secteur.id}>
                      <h3 className="font-semibold text-sm mb-2">{secteur.nom}</h3>
                      <div className="space-y-1">
                        {secteurCompetences.map((comp) => (
                          <div key={comp.id} className="flex items-center justify-between p-2 border border-border rounded hover:bg-accent">
                            <p className="text-sm flex-1">{comp.nom}</p>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="sm" onClick={() => openEditCompetence(comp)}>
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleDeleteCompetence(comp.id)}>
                                <Trash2 className="h-3 w-3 text-destructive" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
                {competences.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">Aucune compétence</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Modal Secteur */}
      {showSecteurModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-card p-6">
            <h2 className="text-xl font-bold mb-4">{editingSecteur ? 'Modifier' : 'Nouveau'} Secteur</h2>
            <form onSubmit={editingSecteur ? handleUpdateSecteur : handleCreateSecteur} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Nom du secteur</label>
                <input value={secteurForm.nom} onChange={(e) => setSecteurForm({ ...secteurForm, nom: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Description (optionnel)</label>
                <textarea value={secteurForm.description} onChange={(e) => setSecteurForm({ ...secteurForm, description: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2" rows={3} />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" checked={secteurForm.active} onChange={(e) => setSecteurForm({ ...secteurForm, active: e.target.checked })} />
                <label className="text-sm">Actif</label>
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => { setShowSecteurModal(false); setEditingSecteur(null); }} className="flex-1">Annuler</Button>
                <Button type="submit" className="flex-1">{editingSecteur ? 'Modifier' : 'Créer'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Compétence */}
      {showCompetenceModal && (
        <div className="fixed inset-0 z-50 flex items-center.justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-card p-6">
            <h2 className="text-xl font-bold mb-4">{editingCompetence ? 'Modifier' : 'Nouvelle'} Compétence</h2>
            <form onSubmit={editingCompetence ? handleUpdateCompetence : handleCreateCompetence} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Secteur</label>
                <select value={competenceForm.secteur_id} onChange={(e) => setCompetenceForm({ ...competenceForm, secteur_id: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2" required>
                  <option value="">Sélectionnez un secteur</option>
                  {secteurs.map((s) => (<option key={s.id} value={s.id}>{s.nom}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Nom de la compétence</label>
                <input value={competenceForm.nom} onChange={(e) => setCompetenceForm({ ...competenceForm, nom: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Description (optionnel)</label>
                <textarea value={competenceForm.description} onChange={(e) => setCompetenceForm({ ...competenceForm, description: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2" rows={2} />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" checked={competenceForm.active} onChange={(e) => setCompetenceForm({ ...competenceForm, active: e.target.checked })} />
                <label className="text-sm">Actif</label>
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => { setShowCompetenceModal(false); setEditingCompetence(null); }} className="flex-1">Annuler</Button>
                <Button type="submit" className="flex-1">{editingCompetence ? 'Modifier' : 'Créer'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default SecteursCompetences;
