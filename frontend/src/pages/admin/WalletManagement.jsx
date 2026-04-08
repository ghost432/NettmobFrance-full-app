import { useState, useEffect } from 'react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { usePageTitle } from '@/hooks/usePageTitle';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { adminNavigation } from '@/constants/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Wallet, Users, CheckCircle, XCircle, Clock,
  Calendar, Euro, TrendingUp, Edit, AlertCircle,
  Plus, Minus, RotateCcw
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { toast } from '@/components/ui/toast';
import { Pagination } from '@/components/ui/pagination';
import { usePagination } from '@/hooks/usePagination';

const WalletManagement = () => {
  useDocumentTitle('Gestion des Portefeuilles');
  usePageTitle('Gestion Wallets');
  
  const { user } = useAuth();
  const [withdrawals, setWithdrawals] = useState([]);
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('wallets');
  const [selectedWithdrawal, setSelectedWithdrawal] = useState(null);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showAdjustDialog, setShowAdjustDialog] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showSubtractDialog, setShowSubtractDialog] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [adjustmentReason, setAdjustmentReason] = useState('');
  const [newBalance, setNewBalance] = useState('');
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [actionType, setActionType] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [withdrawalsRes, walletsRes] = await Promise.all([
        api.get('/wallet/admin/withdrawals'),
        api.get('/wallet/admin/all-wallets')
      ]);

      setWithdrawals(withdrawalsRes.data);
      setWallets(walletsRes.data);
    } catch (error) {
      console.error('Erreur chargement données:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    try {
      setSubmitting(true);

      await api.post(`/wallet/admin/approve-withdrawal/${selectedWithdrawal.id}`, {
        adminNotes
      });

      toast.success('Retrait approuvé');
      setShowApproveDialog(false);
      setAdminNotes('');
      setSelectedWithdrawal(null);
      fetchData();
    } catch (error) {
      console.error('Erreur approbation:', error);
      toast.error(error.response?.data?.error || 'Erreur lors de l\'approbation');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    try {
      if (!adminNotes.trim()) {
        toast.error('Raison du refus requise');
        return;
      }

      setSubmitting(true);

      await api.post(`/wallet/admin/reject-withdrawal/${selectedWithdrawal.id}`, {
        adminNotes
      });

      toast.success('Retrait refusé');
      setShowRejectDialog(false);
      setAdminNotes('');
      setSelectedWithdrawal(null);
      fetchData();
    } catch (error) {
      console.error('Erreur refus:', error);
      toast.error(error.response?.data?.error || 'Erreur lors du refus');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAdjustBalance = async () => {
    try {
      if (!newBalance || parseFloat(newBalance) < 0) {
        toast.error('Montant invalide');
        return;
      }

      if (!adjustmentReason.trim()) {
        toast.error('Raison requise');
        return;
      }

      setSubmitting(true);

      await api.post('/wallet/admin/adjust-balance', {
        automobId: selectedWallet.automob_id,
        newBalance: parseFloat(newBalance),
        reason: adjustmentReason
      });

      toast.success('Solde ajusté');
      setShowAdjustDialog(false);
      setNewBalance('');
      setAdjustmentReason('');
      setSelectedWallet(null);
      fetchData();
    } catch (error) {
      console.error('Erreur ajustement:', error);
      toast.error(error.response?.data?.error || 'Erreur lors de l\'ajustement');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddAmount = async () => {
    try {
      if (!amount || parseFloat(amount) <= 0) {
        toast.error('Montant invalide');
        return;
      }

      if (!adjustmentReason.trim()) {
        toast.error('Raison requise');
        return;
      }

      setSubmitting(true);

      await api.post('/wallet/admin/add-funds', {
        automobId: selectedWallet.automob_id,
        amount: parseFloat(amount),
        reason: adjustmentReason
      });

      toast.success(`${parseFloat(amount).toFixed(2)}€ ajoutés au wallet`);
      setShowAddDialog(false);
      setAmount('');
      setAdjustmentReason('');
      setSelectedWallet(null);
      fetchData();
    } catch (error) {
      console.error('Erreur ajout:', error);
      toast.error(error.response?.data?.error || 'Erreur lors de l\'ajout');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubtractAmount = async () => {
    try {
      if (!amount || parseFloat(amount) <= 0) {
        toast.error('Montant invalide');
        return;
      }

      if (!adjustmentReason.trim()) {
        toast.error('Raison requise');
        return;
      }

      setSubmitting(true);

      await api.post('/wallet/admin/subtract-funds', {
        automobId: selectedWallet.automob_id,
        amount: parseFloat(amount),
        reason: adjustmentReason
      });

      toast.success(`${parseFloat(amount).toFixed(2)}€ soustraits du wallet`);
      setShowSubtractDialog(false);
      setAmount('');
      setAdjustmentReason('');
      setSelectedWallet(null);
      fetchData();
    } catch (error) {
      console.error('Erreur soustraction:', error);
      toast.error(error.response?.data?.error || 'Erreur lors de la soustraction');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetWallet = async () => {
    try {
      if (!adjustmentReason.trim()) {
        toast.error('Raison requise');
        return;
      }

      setSubmitting(true);

      await api.post('/wallet/admin/reset-wallet', {
        automobId: selectedWallet.automob_id,
        reason: adjustmentReason
      });

      toast.success('Wallet remis à zéro');
      setShowResetDialog(false);
      setAdjustmentReason('');
      setSelectedWallet(null);
      fetchData();
    } catch (error) {
      console.error('Erreur remise à zéro:', error);
      toast.error(error.response?.data?.error || 'Erreur lors de la remise à zéro');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { label: 'En attente', icon: Clock, className: 'bg-yellow-600' },
      approved: { label: 'Approuvé', icon: CheckCircle, className: 'bg-green-600' },
      rejected: { label: 'Refusé', icon: XCircle, className: 'bg-red-600' },
      completed: { label: 'Complété', icon: CheckCircle, className: 'bg-blue-600' }
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge className={config.className}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const filteredWithdrawals = withdrawals.filter(w => {
    if (activeTab === 'all') return true;
    return w.status === activeTab;
  });

  const { currentItems: paginatedWithdrawals, currentPage: pageW, totalPages: totalPagesW, totalItems: totalW, setCurrentPage: setPageW } = usePagination(filteredWithdrawals, 10);
  const { currentItems: paginatedWallets, currentPage: pageWal, totalPages: totalPagesWal, totalItems: totalWal, setCurrentPage: setPageWal } = usePagination(wallets, 10);

  const displayName = user?.email || 'Admin';

  const totalPending = withdrawals
    .filter(w => w.status === 'pending')
    .reduce((sum, w) => sum + parseFloat(w.amount), 0);

  const totalApproved = withdrawals
    .filter(w => w.status === 'approved')
    .reduce((sum, w) => sum + parseFloat(w.amount), 0);

  const totalWalletBalance = wallets.reduce((sum, w) => sum + parseFloat(w.balance), 0);

  if (loading) {
    return (
      <DashboardLayout
        title="Gestion Wallets"
        description="Gérez les wallets et retraits"
        menuItems={adminNavigation}
        getRoleLabel={() => 'Admin'}
        getDisplayName={() => displayName}
      >
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Gestion Wallets"
      description="Gérez les wallets des automobs et les demandes de retrait"
      menuItems={adminNavigation}
      getRoleLabel={() => 'Admin'}
      getDisplayName={() => displayName}
    >
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-3 sm:p-4 sm:pb-2">
              <CardTitle className="text-sm font-medium">Retraits en attente</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
              <div className="text-2xl font-bold">
                {withdrawals.filter(w => w.status === 'pending').length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {totalPending.toFixed(2)}€
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-3 sm:p-4 sm:pb-2">
              <CardTitle className="text-sm font-medium">Retraits approuvés</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
              <div className="text-2xl font-bold">
                {withdrawals.filter(w => w.status === 'approved').length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {totalApproved.toFixed(2)}€
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-3 sm:p-4 sm:pb-2">
              <CardTitle className="text-sm font-medium">Total Wallets</CardTitle>
              <Wallet className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
              <div className="text-2xl font-bold">{wallets.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {totalWalletBalance.toFixed(2)}€
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-3 sm:p-4 sm:pb-2">
              <CardTitle className="text-sm font-medium">Retraits refusés</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
              <div className="text-2xl font-bold">
                {withdrawals.filter(w => w.status === 'rejected').length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="wallets">Gestion Wallets</TabsTrigger>
            <TabsTrigger value="pending">Retraits en attente</TabsTrigger>
            <TabsTrigger value="approved">Retraits approuvés</TabsTrigger>
            <TabsTrigger value="rejected">Retraits refusés</TabsTrigger>
            <TabsTrigger value="all">Tous les retraits</TabsTrigger>
          </TabsList>

          {/* Withdrawal Requests Tabs */}
          {activeTab !== 'wallets' && (
            <TabsContent value={activeTab} className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Demandes de retrait</CardTitle>
                  <CardDescription>
                    Gérez les demandes de retrait des automobs
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {filteredWithdrawals.length === 0 ? (
                    <div className="text-center py-12">
                      <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-lg font-medium">Aucune demande</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {paginatedWithdrawals.map((withdrawal) => (
                        <Card key={withdrawal.id} className="hover:shadow-md transition-shadow">
                          <CardContent className="pt-6">
                            <div className="flex flex-col gap-4">
                              <div className="flex items-start justify-between">
                                <div className="space-y-2 flex-1">
                                  <div className="flex items-center gap-3">
                                    <h3 className="font-semibold text-lg">
                                      {withdrawal.first_name} {withdrawal.last_name}
                                    </h3>
                                    {getStatusBadge(withdrawal.status)}
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                                    <div className="flex items-center gap-2">
                                      <Euro className="h-4 w-4 text-muted-foreground" />
                                      <span className="text-muted-foreground">Montant:</span>
                                      <span className="font-bold text-lg">
                                        {parseFloat(withdrawal.amount).toFixed(2)}€
                                      </span>
                                    </div>

                                    <div className="flex items-center gap-2">
                                      <Wallet className="h-4 w-4 text-muted-foreground" />
                                      <span className="text-muted-foreground">Solde actuel:</span>
                                      <span className="font-medium">
                                        {parseFloat(withdrawal.current_balance).toFixed(2)}€
                                      </span>
                                    </div>

                                    <div className="flex items-center gap-2">
                                      <Calendar className="h-4 w-4 text-muted-foreground" />
                                      <span className="text-muted-foreground">Demandé le:</span>
                                      <span>{new Date(withdrawal.requested_at).toLocaleDateString('fr-FR')}</span>
                                    </div>
                                  </div>

                                  <div className="text-sm">
                                    <p className="text-muted-foreground">Email: {withdrawal.automob_email}</p>
                                    <p className="text-muted-foreground">Téléphone: {withdrawal.phone}</p>
                                    <p className="text-muted-foreground">
                                      Méthode: {withdrawal.payment_method.replace('_', ' ')}
                                    </p>
                                  </div>

                                  {withdrawal.bank_details && (
                                    <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-900 rounded">
                                      <p className="text-sm font-medium">Coordonnées bancaires:</p>
                                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                        {withdrawal.bank_details}
                                      </p>
                                    </div>
                                  )}

                                  {withdrawal.notes && (
                                    <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-950 rounded">
                                      <p className="text-sm font-medium">Notes automob:</p>
                                      <p className="text-sm text-muted-foreground">{withdrawal.notes}</p>
                                    </div>
                                  )}

                                  {withdrawal.admin_notes && (
                                    <div className="mt-2 p-3 bg-yellow-50 dark:bg-yellow-950 rounded">
                                      <p className="text-sm font-medium">Notes admin:</p>
                                      <p className="text-sm text-muted-foreground">{withdrawal.admin_notes}</p>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {withdrawal.status === 'pending' && (
                                <div className="flex gap-2 pt-4 border-t">
                                  <Button
                                    onClick={() => {
                                      setSelectedWithdrawal(withdrawal);
                                      setShowApproveDialog(true);
                                    }}
                                    className="bg-green-600 hover:bg-green-700"
                                  >
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Approuver
                                  </Button>
                                  <Button
                                    onClick={() => {
                                      setSelectedWithdrawal(withdrawal);
                                      setShowRejectDialog(true);
                                    }}
                                    variant="destructive"
                                  >
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Refuser
                                  </Button>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                      <Pagination currentPage={pageW} totalPages={totalPagesW} onPageChange={setPageW} itemsPerPage={10} totalItems={totalW} />
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Wallets Tab */}
          <TabsContent value="wallets" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Gestion des Wallets Automobs</CardTitle>
                <CardDescription>
                  Ajoutez, soustrayez ou remettez à zéro les wallets des automobs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {paginatedWallets.map((wallet) => (
                    <Card key={wallet.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="pt-6">
                        <div className="flex flex-col gap-4">
                          <div className="flex items-start justify-between">
                            <div className="space-y-2 flex-1">
                              <div className="flex items-center gap-3">
                                <h3 className="font-semibold text-lg">
                                  {wallet.first_name} {wallet.last_name}
                                </h3>
                                <Badge variant="outline">
                                  ID: {wallet.automob_id}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">{wallet.automob_email}</p>

                              <div className="grid grid-cols-3 gap-4 mt-4">
                                <div>
                                  <p className="text-xs text-muted-foreground">Solde actuel</p>
                                  <p className="text-2xl font-bold text-blue-600">
                                    {parseFloat(wallet.balance).toFixed(2)}€
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground">Total gagné</p>
                                  <p className="text-lg font-semibold text-green-600">
                                    {parseFloat(wallet.total_earned).toFixed(2)}€
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground">Total retiré</p>
                                  <p className="text-lg font-semibold text-red-600">
                                    {parseFloat(wallet.total_withdrawn).toFixed(2)}€
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2 pt-4 border-t">
                            <Button
                              onClick={() => {
                                setSelectedWallet(wallet);
                                setAmount('');
                                setAdjustmentReason('');
                                setShowAddDialog(true);
                              }}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Ajouter
                            </Button>
                            <Button
                              onClick={() => {
                                setSelectedWallet(wallet);
                                setAmount('');
                                setAdjustmentReason('');
                                setShowSubtractDialog(true);
                              }}
                              className="bg-orange-600 hover:bg-orange-700"
                            >
                              <Minus className="h-4 w-4 mr-2" />
                              Soustraire
                            </Button>
                            <Button
                              onClick={() => {
                                setSelectedWallet(wallet);
                                setAdjustmentReason('');
                                setShowResetDialog(true);
                              }}
                              variant="destructive"
                            >
                              <RotateCcw className="h-4 w-4 mr-2" />
                              Mettre à zéro
                            </Button>
                            <Button
                              onClick={() => {
                                setSelectedWallet(wallet);
                                setNewBalance(wallet.balance);
                                setAdjustmentReason('');
                                setShowAdjustDialog(true);
                              }}
                              variant="outline"
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Définir montant exact
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  <Pagination currentPage={pageWal} totalPages={totalPagesWal} onPageChange={setPageWal} itemsPerPage={10} totalItems={totalWal} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Approve Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approuver le retrait</DialogTitle>
            <DialogDescription>
              Montant: {selectedWithdrawal && parseFloat(selectedWithdrawal.amount).toFixed(2)}€
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-4 bg-yellow-50 dark:bg-yellow-950 rounded">
              <p className="text-sm">
                ⚠️ Le montant sera débité du wallet de l'automob.
              </p>
            </div>

            <div>
              <Label htmlFor="approveNotes">Notes (optionnel)</Label>
              <Textarea
                id="approveNotes"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Informations complémentaires..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowApproveDialog(false);
                setAdminNotes('');
              }}
              disabled={submitting}
            >
              Annuler
            </Button>
            <Button
              onClick={handleApprove}
              disabled={submitting}
              className="bg-green-600 hover:bg-green-700"
            >
              {submitting ? 'Approbation...' : 'Approuver'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Refuser le retrait</DialogTitle>
            <DialogDescription>
              Montant: {selectedWithdrawal && parseFloat(selectedWithdrawal.amount).toFixed(2)}€
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="rejectNotes">Raison du refus *</Label>
              <Textarea
                id="rejectNotes"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Expliquez pourquoi ce retrait est refusé..."
                rows={4}
                required
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRejectDialog(false);
                setAdminNotes('');
              }}
              disabled={submitting}
            >
              Annuler
            </Button>
            <Button
              onClick={handleReject}
              disabled={submitting}
              variant="destructive"
            >
              {submitting ? 'Refus...' : 'Refuser'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Amount Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter des fonds au wallet</DialogTitle>
            <DialogDescription>
              {selectedWallet && `${selectedWallet.first_name} ${selectedWallet.last_name}`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded">
              <p className="text-sm">
                Solde actuel: <span className="font-bold">
                  {selectedWallet && parseFloat(selectedWallet.balance).toFixed(2)}€
                </span>
              </p>
            </div>

            <div>
              <Label htmlFor="addAmount">Montant à ajouter *</Label>
              <Input
                id="addAmount"
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
              />
              {amount && selectedWallet && (
                <p className="text-sm text-muted-foreground mt-1">
                  Nouveau solde: {(parseFloat(selectedWallet.balance) + parseFloat(amount || 0)).toFixed(2)}€
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="addReason">Raison de l'ajout *</Label>
              <Textarea
                id="addReason"
                value={adjustmentReason}
                onChange={(e) => setAdjustmentReason(e.target.value)}
                placeholder="Ex: Bonus performance, correction erreur..."
                rows={3}
                required
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAddDialog(false);
                setAmount('');
                setAdjustmentReason('');
              }}
              disabled={submitting}
            >
              Annuler
            </Button>
            <Button
              onClick={handleAddAmount}
              disabled={submitting}
              className="bg-green-600 hover:bg-green-700"
            >
              {submitting ? 'Ajout...' : 'Ajouter les fonds'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Subtract Amount Dialog */}
      <Dialog open={showSubtractDialog} onOpenChange={setShowSubtractDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Soustraire des fonds du wallet</DialogTitle>
            <DialogDescription>
              {selectedWallet && `${selectedWallet.first_name} ${selectedWallet.last_name}`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded">
              <p className="text-sm">
                Solde actuel: <span className="font-bold">
                  {selectedWallet && parseFloat(selectedWallet.balance).toFixed(2)}€
                </span>
              </p>
            </div>

            <div>
              <Label htmlFor="subtractAmount">Montant à soustraire *</Label>
              <Input
                id="subtractAmount"
                type="number"
                step="0.01"
                min="0.01"
                max={selectedWallet?.balance}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
              />
              {amount && selectedWallet && (
                <p className="text-sm text-muted-foreground mt-1">
                  Nouveau solde: {Math.max(0, parseFloat(selectedWallet.balance) - parseFloat(amount || 0)).toFixed(2)}€
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="subtractReason">Raison de la soustraction *</Label>
              <Textarea
                id="subtractReason"
                value={adjustmentReason}
                onChange={(e) => setAdjustmentReason(e.target.value)}
                placeholder="Ex: Pénalité, correction erreur..."
                rows={3}
                required
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowSubtractDialog(false);
                setAmount('');
                setAdjustmentReason('');
              }}
              disabled={submitting}
            >
              Annuler
            </Button>
            <Button
              onClick={handleSubtractAmount}
              disabled={submitting}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {submitting ? 'Soustraction...' : 'Soustraire les fonds'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Wallet Dialog */}
      <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remettre le wallet à zéro</DialogTitle>
            <DialogDescription>
              {selectedWallet && `${selectedWallet.first_name} ${selectedWallet.last_name}`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-4 bg-red-50 dark:bg-red-950 rounded">
              <p className="text-sm font-medium text-red-600 dark:text-red-400">
                ⚠️ Cette action va remettre le solde à 0.00€
              </p>
              <p className="text-sm mt-2">
                Solde actuel: <span className="font-bold">
                  {selectedWallet && parseFloat(selectedWallet.balance).toFixed(2)}€
                </span>
              </p>
            </div>

            <div>
              <Label htmlFor="resetReason">Raison de la remise à zéro *</Label>
              <Textarea
                id="resetReason"
                value={adjustmentReason}
                onChange={(e) => setAdjustmentReason(e.target.value)}
                placeholder="Ex: Clôture de compte, migration de données..."
                rows={3}
                required
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowResetDialog(false);
                setAdjustmentReason('');
              }}
              disabled={submitting}
            >
              Annuler
            </Button>
            <Button
              onClick={handleResetWallet}
              disabled={submitting}
              variant="destructive"
            >
              {submitting ? 'Remise à zéro...' : 'Remettre à zéro'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Adjust Balance Dialog */}
      <Dialog open={showAdjustDialog} onOpenChange={setShowAdjustDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Définir un montant exact</DialogTitle>
            <DialogDescription>
              {selectedWallet && `${selectedWallet.first_name} ${selectedWallet.last_name}`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded">
              <p className="text-sm">
                Solde actuel: <span className="font-bold">
                  {selectedWallet && parseFloat(selectedWallet.balance).toFixed(2)}€
                </span>
              </p>
            </div>

            <div>
              <Label htmlFor="newBalance">Nouveau solde exact *</Label>
              <Input
                id="newBalance"
                type="number"
                step="0.01"
                min="0"
                value={newBalance}
                onChange={(e) => setNewBalance(e.target.value)}
                placeholder="0.00"
              />
            </div>

            <div>
              <Label htmlFor="adjustmentReason">Raison de l'ajustement *</Label>
              <Textarea
                id="adjustmentReason"
                value={adjustmentReason}
                onChange={(e) => setAdjustmentReason(e.target.value)}
                placeholder="Ex: Correction manuelle, ajustement comptable..."
                rows={3}
                required
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAdjustDialog(false);
                setNewBalance('');
                setAdjustmentReason('');
              }}
              disabled={submitting}
            >
              Annuler
            </Button>
            <Button
              onClick={handleAdjustBalance}
              disabled={submitting}
            >
              {submitting ? 'Ajustement...' : 'Définir le solde'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default WalletManagement;
