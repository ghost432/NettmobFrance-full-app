import { useState, useEffect } from 'react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useAuth } from '@/context/AuthContext';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { adminNavigation } from '@/constants/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Save, 
  X,
  Clock
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from '@/components/ui/toast';
import api from '@/lib/api';

const BillingFrequencyManagement = () => {
  useDocumentTitle('Fréquence de Facturation');
  const { user: currentUser } = useAuth();
  const [frequencies, setFrequencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [editLabel, setEditLabel] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [newValue, setNewValue] = useState('');
  const [newLabel, setNewLabel] = useState('');

  useEffect(() => {
    fetchFrequencies();
  }, []);

  const fetchFrequencies = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/mission-settings/billing-frequencies');
      setFrequencies(response.data.frequencies || []);
    } catch (err) {
      console.error('❌ Erreur chargement fréquences:', err);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!newValue.trim() || !newLabel.trim()) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    try {
      await api.post('/admin/mission-settings/billing-frequencies', {
        value: newValue.trim().toLowerCase().replace(/\s+/g, '_'),
        label: newLabel.trim()
      });
      toast.success('Fréquence ajoutée avec succès');
      setShowAddDialog(false);
      setNewValue('');
      setNewLabel('');
      fetchFrequencies();
    } catch (err) {
      console.error('❌ Erreur ajout:', err);
      toast.error(err.response?.data?.error || 'Erreur lors de l\'ajout');
    }
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setEditValue(item.value);
    setEditLabel(item.label);
  };

  const handleSaveEdit = async (id) => {
    if (!editValue.trim() || !editLabel.trim()) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    try {
      await api.put(`/admin/mission-settings/billing-frequencies/${id}`, {
        value: editValue.trim(),
        label: editLabel.trim()
      });
      toast.success('Fréquence modifiée avec succès');
      setEditingId(null);
      fetchFrequencies();
    } catch (err) {
      console.error('❌ Erreur modification:', err);
      toast.error('Erreur lors de la modification');
    }
  };

  const handleDelete = async () => {
    if (!selectedItem) return;

    try {
      await api.delete(`/admin/mission-settings/billing-frequencies/${selectedItem.id}`);
      toast.success('Fréquence supprimée avec succès');
      setShowDeleteDialog(false);
      setSelectedItem(null);
      fetchFrequencies();
    } catch (err) {
      console.error('❌ Erreur suppression:', err);
      toast.error(err.response?.data?.error || 'Erreur lors de la suppression');
    }
  };

  const openDeleteDialog = (item) => {
    setSelectedItem(item);
    setShowDeleteDialog(true);
  };

  return (
    <DashboardLayout
      title="Gestion des Fréquences de Facturation"
      description="Gérer les options de fréquence de facturation pour les missions"
      menuItems={adminNavigation}
      getRoleLabel={() => 'Administrateur'}
      getDisplayName={() => currentUser?.email?.split('@')[0] || 'Admin'}
    >
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Fréquences de facturation
            </CardTitle>
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : frequencies.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Aucune fréquence configurée. Cliquez sur "Ajouter" pour commencer.
            </div>
          ) : (
            <div className="space-y-3">
              {frequencies.map(item => (
                <div key={item.id} className="flex items-center gap-4 p-4 border rounded-lg">
                  {editingId === item.id ? (
                    <>
                      <div className="flex-1 grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-xs">Valeur (code)</Label>
                          <Input
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            placeholder="jour, semaine..."
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Libellé</Label>
                          <Input
                            value={editLabel}
                            onChange={(e) => setEditLabel(e.target.value)}
                            placeholder="Par jour, Par semaine..."
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleSaveEdit(item.id)}
                        >
                          <Save className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingId(null)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex-1">
                        <div className="font-medium">{item.label}</div>
                        <div className="text-sm text-muted-foreground">
                          Code: <code className="bg-muted px-1 py-0.5 rounded">{item.value}</code>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(item)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => openDeleteDialog(item)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog Ajout */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter une fréquence</DialogTitle>
            <DialogDescription>
              Définissez une nouvelle fréquence de facturation
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="value">Valeur (code) *</Label>
              <Input
                id="value"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                placeholder="Ex: jour, semaine, mois"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Utilisé dans le code (minuscules, sans espaces)
              </p>
            </div>
            <div>
              <Label htmlFor="label">Libellé *</Label>
              <Input
                id="label"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="Ex: Par jour, Par semaine, Par mois"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Affiché dans les formulaires
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleAdd}>
              Ajouter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Suppression */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer la fréquence{' '}
              <strong>{selectedItem?.label}</strong> ?
              <br /><br />
              Cette action est irréversible et pourrait affecter les missions existantes.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default BillingFrequencyManagement;
