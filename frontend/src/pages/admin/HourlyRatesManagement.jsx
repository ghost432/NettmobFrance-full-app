import { useState, useEffect } from 'react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useAuth } from '@/context/AuthContext';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { adminNavigation } from '@/constants/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Save, 
  X,
  Euro,
  Sun,
  Moon
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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

const HourlyRatesManagement = () => {
  useDocumentTitle('Tarifs Horaires');
  const { user: currentUser } = useAuth();
  const [rates, setRates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editRate, setEditRate] = useState('');
  const [editLabel, setEditLabel] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editWorkTime, setEditWorkTime] = useState('both');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [newRate, setNewRate] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newWorkTime, setNewWorkTime] = useState('both');

  useEffect(() => {
    fetchRates();
  }, []);

  const fetchRates = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/mission-settings/hourly-rates');
      setRates(response.data.rates || []);
    } catch (err) {
      console.error('❌ Erreur chargement tarifs:', err);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!newRate || !newLabel.trim()) {
      toast.error('Veuillez remplir le tarif et le libellé');
      return;
    }

    try {
      await api.post('/admin/mission-settings/hourly-rates', {
        rate: parseFloat(newRate),
        label: newLabel.trim(),
        description: newDescription.trim(),
        work_time: newWorkTime
      });
      toast.success('Tarif ajouté avec succès');
      setShowAddDialog(false);
      setNewRate('');
      setNewLabel('');
      setNewDescription('');
      setNewWorkTime('both');
      fetchRates();
    } catch (err) {
      console.error('❌ Erreur ajout:', err);
      toast.error(err.response?.data?.error || 'Erreur lors de l\'ajout');
    }
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setEditRate(item.rate);
    setEditLabel(item.label);
    setEditDescription(item.description || '');
    setEditWorkTime(item.work_time || 'both');
  };

  const handleSaveEdit = async (id) => {
    if (!editRate || !editLabel.trim()) {
      toast.error('Veuillez remplir le tarif et le libellé');
      return;
    }

    try {
      await api.put(`/admin/mission-settings/hourly-rates/${id}`, {
        rate: parseFloat(editRate),
        label: editLabel.trim(),
        description: editDescription.trim(),
        work_time: editWorkTime
      });
      toast.success('Tarif modifié avec succès');
      setEditingId(null);
      fetchRates();
    } catch (err) {
      console.error('❌ Erreur modification:', err);
      toast.error('Erreur lors de la modification');
    }
  };

  const handleDelete = async () => {
    if (!selectedItem) return;

    try {
      await api.delete(`/admin/mission-settings/hourly-rates/${selectedItem.id}`);
      toast.success('Tarif supprimé avec succès');
      setShowDeleteDialog(false);
      setSelectedItem(null);
      fetchRates();
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
      title="Gestion des Tarifs Horaires"
      description="Gérer les tarifs horaires suggérés pour les missions"
      menuItems={adminNavigation}
      getRoleLabel={() => 'Administrateur'}
      getDisplayName={() => currentUser?.email?.split('@')[0] || 'Admin'}
    >
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Euro className="h-5 w-5" />
                Tarifs horaires
              </CardTitle>
              <CardDescription className="mt-2">
                Ces tarifs sont proposés aux clients lors de la création d'une mission
              </CardDescription>
            </div>
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
          ) : rates.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Aucun tarif configuré. Cliquez sur "Ajouter" pour commencer.
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {rates.map(item => (
                <Card key={item.id} className="border-2">
                  <CardContent className="pt-6">
                    {editingId === item.id ? (
                      <div className="space-y-3">
                        <div>
                          <Label className="text-xs">Tarif (€/h) *</Label>
                          <Input
                            type="number"
                            step="0.5"
                            value={editRate}
                            onChange={(e) => setEditRate(e.target.value)}
                            placeholder="25.00"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Libellé *</Label>
                          <Input
                            value={editLabel}
                            onChange={(e) => setEditLabel(e.target.value)}
                            placeholder="Standard, Premium..."
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Type de mission</Label>
                          <Select value={editWorkTime} onValueChange={setEditWorkTime}>
                            <SelectTrigger className="h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="jour">
                                <span className="flex items-center gap-2">
                                  <Sun className="h-4 w-4" /> Jour
                                </span>
                              </SelectItem>
                              <SelectItem value="nuit">
                                <span className="flex items-center gap-2">
                                  <Moon className="h-4 w-4" /> Nuit
                                </span>
                              </SelectItem>
                              <SelectItem value="both">Jour et Nuit</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs">Description</Label>
                          <textarea
                            value={editDescription}
                            onChange={(e) => setEditDescription(e.target.value)}
                            placeholder="Description optionnelle..."
                            className="w-full min-h-[60px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleSaveEdit(item.id)}
                            className="flex-1"
                          >
                            <Save className="h-4 w-4 mr-1" />
                            Sauvegarder
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingId(null)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="text-center">
                          <div className="text-3xl font-bold text-primary">
                            {parseFloat(item.rate).toFixed(2)}€
                          </div>
                          <div className="text-sm text-muted-foreground">par heure</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium">{item.label}</div>
                          <div className="flex items-center justify-center gap-1 mt-1 text-xs text-muted-foreground">
                            {item.work_time === 'jour' && <><Sun className="h-3 w-3" /> Jour</>}
                            {item.work_time === 'nuit' && <><Moon className="h-3 w-3" /> Nuit</>}
                            {item.work_time === 'both' && <>Jour et Nuit</>}
                          </div>
                          {item.description && (
                            <div className="text-xs text-muted-foreground mt-1">
                              {item.description}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2 pt-2 border-t">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(item)}
                            className="flex-1"
                          >
                            <Edit2 className="h-4 w-4 mr-1" />
                            Modifier
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => openDeleteDialog(item)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog Ajout */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter un tarif horaire</DialogTitle>
            <DialogDescription>
              Définissez un nouveau tarif horaire suggéré pour les missions
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="rate">Tarif (€/heure) *</Label>
              <Input
                id="rate"
                type="number"
                step="0.5"
                value={newRate}
                onChange={(e) => setNewRate(e.target.value)}
                placeholder="Ex: 25.00"
              />
            </div>
            <div>
              <Label htmlFor="label">Libellé *</Label>
              <Input
                id="label"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="Ex: Standard, Premium, Expert"
              />
            </div>
            <div>
              <Label htmlFor="work_time">Type de mission *</Label>
              <Select value={newWorkTime} onValueChange={setNewWorkTime}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="jour">
                    <span className="flex items-center gap-2">
                      <Sun className="h-4 w-4" /> Jour
                    </span>
                  </SelectItem>
                  <SelectItem value="nuit">
                    <span className="flex items-center gap-2">
                      <Moon className="h-4 w-4" /> Nuit
                    </span>
                  </SelectItem>
                  <SelectItem value="both">Jour et Nuit</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="description">Description (optionnel)</Label>
              <textarea
                id="description"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Description de ce niveau de tarif..."
                className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
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
              Êtes-vous sûr de vouloir supprimer le tarif{' '}
              <strong>{selectedItem?.label}</strong> ({selectedItem?.rate}€/h) ?
              <br /><br />
              Cette action est irréversible.
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

export default HourlyRatesManagement;
