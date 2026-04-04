import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { automobNavigation } from '@/constants/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Calendar, Clock, Plus, Trash2, Save, Send, ArrowLeft, AlertCircle, XCircle
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import api from '@/lib/api';
import { toast } from '@/components/ui/toast';

const CreateTimesheet = () => {
  useDocumentTitle('Feuille de Temps');
  const { missionId, timesheetId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [mission, setMission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [timesheet, setTimesheet] = useState(null);
  const [entries, setEntries] = useState([]);
  const [showEntryDialog, setShowEntryDialog] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [showOvertimeDialog, setShowOvertimeDialog] = useState(false);
  const [overtimeReason, setOvertimeReason] = useState('');
  
  const [entryForm, setEntryForm] = useState({
    work_date: '',
    start_time: '',
    end_time: '',
    break_duration: 0,
    is_overtime: false
  });

  useEffect(() => {
    if (timesheetId) {
      fetchTimesheetDetails();
    } else if (missionId) {
      fetchMissionDetails();
    }
  }, [missionId, timesheetId]);

  const fetchTimesheetDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/timesheets/${timesheetId}`);
      const timesheetData = response.data;
      
      setTimesheet(timesheetData);
      setEntries(timesheetData.entries || []);
      
      // Charger aussi les détails de la mission
      const missionResponse = await api.get(`/missions/${timesheetData.mission_id}`);
      setMission(missionResponse.data);
    } catch (error) {
      console.error('Erreur chargement timesheet:', error);
      toast.error('Erreur lors du chargement de la feuille de temps');
      navigate('/automob/my-missions');
    } finally {
      setLoading(false);
    }
  };

  const fetchMissionDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/missions/${missionId}`);
      setMission(response.data);
      
      // Déterminer le type de période basé sur billing_frequency
      const periodType = response.data.billing_frequency || 'jour';
      
      // Créer automatiquement une feuille de temps
      await createTimesheet(periodType);
    } catch (error) {
      console.error('Erreur chargement mission:', error);
      toast.error('Erreur lors du chargement de la mission');
      navigate('/automob/my-missions');
    } finally {
      setLoading(false);
    }
  };

  const createTimesheet = async (periodType) => {
    try {
      const today = new Date();
      let periodStart, periodEnd;

      if (periodType === 'jour') {
        periodStart = periodEnd = today.toISOString().split('T')[0];
      } else if (periodType === 'semaine') {
        // Début de la semaine (lundi)
        const dayOfWeek = today.getDay();
        const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
        periodStart = new Date(today.setDate(diff)).toISOString().split('T')[0];
        periodEnd = new Date(today.setDate(today.getDate() + 6)).toISOString().split('T')[0];
      } else if (periodType === 'mois') {
        periodStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
        periodEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];
      }

      const response = await api.post('/timesheets/create', {
        mission_id: missionId,
        period_type: periodType,
        period_start: periodStart,
        period_end: periodEnd
      });

      if (response.data.existing) {
        // Un brouillon existe déjà, rediriger vers celui-ci
        toast.info('Reprise du brouillon existant');
        navigate(`/automob/timesheet/${response.data.timesheetId}`);
        return;
      }

      setTimesheet({
        id: response.data.timesheetId,
        period_type: periodType,
        period_start: periodStart,
        period_end: periodEnd,
        total_hours: 0,
        status: 'brouillon'
      });
    } catch (error) {
      console.error('Erreur création feuille de temps:', error);
      if (error.response?.status === 400) {
        toast.error('Une feuille de temps existe déjà pour cette période');
        navigate('/automob/my-missions');
      } else {
        toast.error('Erreur lors de la création de la feuille de temps');
      }
    }
  };

  const handleAddEntry = () => {
    setEditingEntry(null);
    setEntryForm({
      work_date: timesheet?.period_start || '',
      start_time: mission?.start_time || '09:00',
      end_time: mission?.end_time || '17:00',
      break_duration: 0
    });
    setShowEntryDialog(true);
  };

  const handleEditEntry = (entry) => {
    setEditingEntry(entry);
    setEntryForm({
      work_date: entry.work_date,
      start_time: entry.start_time,
      end_time: entry.end_time,
      break_duration: entry.break_duration,
    });
    setShowEntryDialog(true);
  };

  const calculateHours = () => {
    const start = new Date(`2000-01-01 ${entryForm.start_time}`);
    const end = new Date(`2000-01-01 ${entryForm.end_time}`);
    let hours = (end - start) / (1000 * 60 * 60);
    // Convertir les minutes de pause en heures
    const breakHours = (parseFloat(entryForm.break_duration) || 0) / 60;
    hours -= breakHours;
    
    return Math.max(0, hours).toFixed(2);
  };

  const handleSaveEntry = async () => {
    try {
      setSaving(true);
      
      // Calculer les heures de cette entrée
      const newEntryHours = parseFloat(calculateHours());
      
      // Calculer le total actuel (sans l'entrée en cours d'édition)
      let currentTotal = parseFloat(timesheet?.total_hours) || 0;
      if (editingEntry) {
        currentTotal -= parseFloat(editingEntry.hours_worked) || 0;
      }
      
      // Calculer le nouveau total
      const newTotal = currentTotal + newEntryHours;
      const maxHours = parseFloat(mission?.max_hours) || 0;
      
      // Vérifier si on dépasse les heures max et si ce n'est pas déjà marqué comme overtime
      if (newTotal > maxHours && !entryForm.is_overtime) {
        setSaving(false);
        setShowOvertimeDialog(true);
        return;
      }
      
      // Ajouter notes vide pour compatibilité backend
      const dataToSend = { ...entryForm, notes: '' };
      
      if (editingEntry) {
        await api.put(`/timesheets/entries/${editingEntry.id}`, dataToSend);
        toast.success('Entrée mise à jour');
      } else {
        await api.post(`/timesheets/${timesheet.id}/entries`, dataToSend);
        toast.success('Entrée ajoutée');
      }
      
      // Recharger les entrées
      await refreshTimesheetDetails();
      setShowEntryDialog(false);
      setEntryForm(prev => ({ ...prev, is_overtime: false }));
    } catch (error) {
      console.error('Erreur sauvegarde entrée:', error);
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEntry = async (entryId) => {
    if (!confirm('Supprimer cette entrée ?')) return;
    
    try {
      await api.delete(`/timesheets/entries/${entryId}`);
      toast.success('Entrée supprimée');
      await refreshTimesheetDetails();
    } catch (error) {
      console.error('Erreur suppression:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const refreshTimesheetDetails = async () => {
    try {
      const response = await api.get(`/timesheets/${timesheet.id}`);
      setTimesheet(response.data);
      setEntries(response.data.entries || []);
    } catch (error) {
      console.error('Erreur chargement détails:', error);
    }
  };

  const handleSubmit = async () => {
    try {
      setSaving(true);
      await api.post(`/timesheets/${timesheet.id}/submit`);
      toast.success('Feuille de temps soumise pour approbation');
      navigate('/automob/my-missions');
    } catch (error) {
      console.error('Erreur soumission:', error);
      toast.error(error.response?.data?.error || 'Erreur lors de la soumission');
    } finally {
      setSaving(false);
      setShowSubmitDialog(false);
    }
  };


  const displayName = () => {
    if (user?.profile?.first_name && user?.profile?.last_name) {
      return `${user.profile.first_name} ${user.profile.last_name}`;
    }
    return user?.email?.split('@')[0] || 'Auto-mob';
  };

  const getPeriodLabel = () => {
    if (!timesheet) return '';
    
    const start = new Date(timesheet.period_start).toLocaleDateString('fr-FR');
    const end = new Date(timesheet.period_end).toLocaleDateString('fr-FR');
    
    if (timesheet.period_type === 'jour') {
      return `Journée du ${start}`;
    } else if (timesheet.period_type === 'semaine') {
      return `Semaine du ${start} au ${end}`;
    } else {
      return `Mois du ${start} au ${end}`;
    }
  };

  if (loading) {
    return (
      <DashboardLayout
        title="Chargement..."
        description="Veuillez patienter"
        menuItems={automobNavigation}
        getRoleLabel={() => 'Auto-mob'}
        getDisplayName={displayName}
      >
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Nouveau Pointage"
      description={mission?.mission_name || mission?.title}
      menuItems={automobNavigation}
      getRoleLabel={() => 'Auto-mob'}
      getDisplayName={displayName}
    >
      <div className="space-y-6">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate('/automob/my-missions')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour à mes missions
        </Button>

        {/* Rejection Notice */}
        {timesheet?.rejection_reason && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-900">Feuille de temps refusée</p>
                  <p className="text-sm text-red-800 mt-1">{timesheet.rejection_reason}</p>
                  <p className="text-xs text-red-700 mt-2">Veuillez corriger les erreurs et soumettre à nouveau.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Mission Info */}
        <Card>
          <CardHeader>
            <CardTitle>{mission?.mission_name || mission?.title}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {getPeriodLabel()} • Facturation: {timesheet?.period_type}
            </p>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-1">
                <p className="text-sm">
                  <span className="font-medium">Tarif horaire:</span> {mission?.hourly_rate}€/h
                </p>
                <p className="text-sm">
                  <span className="font-medium">Total heures:</span> {timesheet?.total_hours || 0}h
                </p>
                {timesheet?.overtime_hours > 0 && (
                  <p className="text-sm text-orange-600">
                    <span className="font-medium">Heures supplémentaires:</span> {timesheet.overtime_hours}h
                  </p>
                )}
                <p className="text-sm font-bold text-green-600">
                  Montant estimé: {((timesheet?.total_hours || 0) * (mission?.hourly_rate || 0)).toFixed(2)}€
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  onClick={handleAddEntry}
                  disabled={!timesheet}
                  className="w-full sm:w-auto"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Ajouter une entrée</span>
                  <span className="sm:hidden">Ajouter</span>
                </Button>
                <Button
                  onClick={() => setShowSubmitDialog(true)}
                  disabled={!timesheet || entries.length === 0}
                  className="bg-automob hover:bg-automob-dark text-white w-full sm:w-auto"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Soumettre
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Entries Table */}
        <Card>
          <CardHeader>
            <CardTitle>Heures travaillées</CardTitle>
          </CardHeader>
          <CardContent>
            {entries.length === 0 ? (
              <div className="text-center py-12">
                <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium">Aucune entrée</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Ajoutez vos heures de travail pour cette période
                </p>
                <Button onClick={handleAddEntry}>
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter une entrée
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Début</TableHead>
                    <TableHead>Fin</TableHead>
                    <TableHead>Pause (min)</TableHead>
                    <TableHead>Heures</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>
                        {new Date(entry.work_date).toLocaleDateString('fr-FR')}
                      </TableCell>
                      <TableCell>{entry.start_time}</TableCell>
                      <TableCell>{entry.end_time}</TableCell>
                      <TableCell>{entry.break_duration || 0} min</TableCell>
                      <TableCell className="font-medium">
                        {entry.hours_worked}h
                        {entry.is_overtime && (
                          <span className="ml-2 text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded">
                            Supp.
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-col sm:flex-row justify-end gap-1 sm:gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditEntry(entry)}
                            className="w-full sm:w-auto text-xs sm:text-sm"
                          >
                            Modifier
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteEntry(entry.id)}
                            className="w-full sm:w-auto text-xs sm:text-sm"
                          >
                            Supprimer
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add/Edit Entry Dialog */}
        <Dialog open={showEntryDialog} onOpenChange={setShowEntryDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingEntry ? 'Modifier l\'entrée' : 'Ajouter une entrée'}
              </DialogTitle>
              <DialogDescription>
                Renseignez vos heures de travail
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label>Date</Label>
                <Input
                  type="date"
                  value={entryForm.work_date}
                  onChange={(e) => setEntryForm({...entryForm, work_date: e.target.value})}
                  min={timesheet?.period_start}
                  max={timesheet?.period_end}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Heure de début</Label>
                  <Input
                    type="time"
                    value={entryForm.start_time}
                    onChange={(e) => setEntryForm({...entryForm, start_time: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Heure de fin</Label>
                  <Input
                    type="time"
                    value={entryForm.end_time}
                    onChange={(e) => setEntryForm({...entryForm, end_time: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <Label>Pause (minutes)</Label>
                <Input
                  type="number"
                  step="5"
                  min="0"
                  max="480"
                  value={entryForm.break_duration}
                  onChange={(e) => setEntryForm({...entryForm, break_duration: e.target.value})}
                  placeholder="Ex: 30, 60..."
                />
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm font-medium">
                  Heures travaillées: {calculateHours()}h
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEntryDialog(false)}>
                Annuler
              </Button>
              <Button onClick={handleSaveEntry} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Enregistrement...' : 'Enregistrer'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Overtime Confirmation Dialog */}
        <Dialog open={showOvertimeDialog} onOpenChange={setShowOvertimeDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Heures supplémentaires détectées</DialogTitle>
              <DialogDescription>
                Vous dépassez les heures maximales prévues pour cette mission
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="p-4 bg-orange-50 dark:bg-orange-950 rounded-lg">
                <div className="flex gap-2">
                  <AlertCircle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-orange-900 dark:text-orange-100">
                      Attention
                    </p>
                    <p className="text-sm text-orange-700 dark:text-orange-300">
                      Cette entrée dépasse les heures maximales prévues ({mission?.max_hours}h).
                      Ces heures seront marquées comme supplémentaires et nécessiteront l'approbation du client.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="overtime_reason">Raison des heures supplémentaires *</Label>
                <Textarea
                  id="overtime_reason"
                  value={overtimeReason}
                  onChange={(e) => setOvertimeReason(e.target.value)}
                  placeholder="Ex: Travail supplémentaire demandé par le client, tâches imprévues..."
                  rows={3}
                  required
                />
              </div>
            </div>

            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowOvertimeDialog(false);
                  setOvertimeReason('');
                }}
              >
                Annuler
              </Button>
              <Button 
                onClick={() => {
                  if (!overtimeReason.trim()) {
                    toast.error('Veuillez indiquer la raison des heures supplémentaires');
                    return;
                  }
                  setEntryForm(prev => ({ ...prev, is_overtime: true }));
                  setShowOvertimeDialog(false);
                  handleSaveEntry();
                }}
                className="bg-orange-600 hover:bg-orange-700"
              >
                Confirmer les heures supplémentaires
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Submit Confirmation Dialog */}
        <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Soumettre la feuille de temps</DialogTitle>
              <DialogDescription>
                Confirmez l'envoi de votre feuille de temps au client
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <div className="flex gap-2">
                  <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                      Attention
                    </p>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      Une fois soumise, vous ne pourrez plus modifier cette feuille de temps.
                      Le client devra l'approuver avant paiement.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm">
                  <span className="font-medium">Période:</span> {getPeriodLabel()}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Total heures:</span> {timesheet?.total_hours}h
                </p>
                <p className="text-sm">
                  <span className="font-medium">Nombre d'entrées:</span> {entries.length}
                </p>
                <p className="text-sm font-bold text-green-600">
                  Montant à facturer: {((timesheet?.total_hours || 0) * (mission?.hourly_rate || 0)).toFixed(2)}€
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowSubmitDialog(false)}>
                Annuler
              </Button>
              <Button onClick={handleSubmit} disabled={saving} className="bg-automob hover:bg-automob-dark text-white">
                <Send className="h-4 w-4 mr-2" />
                {saving ? 'Envoi...' : 'Confirmer l\'envoi'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default CreateTimesheet;
