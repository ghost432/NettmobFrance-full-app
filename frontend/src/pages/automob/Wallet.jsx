import { useState, useEffect, useMemo } from 'react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { usePageTitle } from '@/hooks/usePageTitle';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { automobNavigation } from '@/constants/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Wallet as WalletIcon, Download, TrendingUp, TrendingDown,
  Calendar, Euro, ArrowUpCircle, ArrowDownCircle, Clock,
  CheckCircle, XCircle, AlertCircle
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { toast } from '@/components/ui/toast';

const Wallet = () => {
  useDocumentTitle('Portefeuille');
  usePageTitle('Mon Wallet');
  
  const { user, setUser } = useAuth();
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showWithdrawalDialog, setShowWithdrawalDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [withdrawalForm, setWithdrawalForm] = useState({
    amount: ''
  });

  useEffect(() => {
    fetchWalletData();
    fetchProfile();
  }, []);

  const fetchWalletData = async () => {
    try {
      const [walletRes, transactionsRes, withdrawalsRes] = await Promise.all([
        api.get('/wallet/my-wallet'),
        api.get('/wallet/my-transactions'),
        api.get('/wallet/my-withdrawals')
      ]);

      setWallet(walletRes.data);
      setTransactions(transactionsRes.data);
      setWithdrawals(withdrawalsRes.data);
    } catch (error) {
      console.error('Erreur chargement wallet:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const fetchProfile = async () => {
    try {
      const response = await api.get('/automob/profile');
      setProfile(response.data.profile);
      console.log('Profil chargé:', response.data.profile);
    } catch (error) {
      console.error('Erreur chargement profil:', error);
    }
  };

  const handleWithdrawalRequest = async () => {
    try {
      setSubmitting(true);

      const amount = parseFloat(withdrawalForm.amount);

      if (!amount || amount <= 0) {
        toast.error('Montant invalide');
        return;
      }

      if (amount > parseFloat(wallet.balance)) {
        toast.error('Solde insuffisant');
        return;
      }

      // Récupérer le nom complet
      const accountHolderName = profile?.first_name && profile?.last_name 
        ? `${profile.first_name} ${profile.last_name}`
        : '';

      if (!accountHolderName) {
        toast.error('Veuillez compléter votre nom et prénom dans votre profil');
        return;
      }

      if (!profile?.iban || !profile?.bic_swift) {
        toast.error('Veuillez compléter votre IBAN et BIC dans votre profil');
        return;
      }

      // Envoyer la demande avec les infos du profil
      await api.post('/wallet/request-withdrawal', {
        amount: withdrawalForm.amount,
        accountHolderName: accountHolderName,
        iban: profile.iban,
        bic: profile.bic_swift
      });

      toast.success('Demande de retrait envoyée avec succès');
      setShowWithdrawalDialog(false);
      setWithdrawalForm({
        amount: ''
      });

      // Recharger les données
      fetchWalletData();
    } catch (error) {
      console.error('Erreur demande retrait:', error);
      toast.error(error.response?.data?.error || 'Erreur lors de la demande');
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

  const getTransactionIcon = (type) => {
    if (type === 'credit') return <ArrowUpCircle className="h-5 w-5 text-green-600" />;
    if (type === 'debit') return <ArrowDownCircle className="h-5 w-5 text-red-600" />;
    return <AlertCircle className="h-5 w-5 text-yellow-600" />;
  };

  const displayName = useMemo(() => {
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name} ${profile.last_name}`;
    }
    return user?.email || 'Automob';
  }, [profile, user]);

  if (loading) {
    return (
      <DashboardLayout
        title="Mon Wallet"
        description="Gérez vos gains"
        menuItems={automobNavigation}
        getRoleLabel={() => 'Automob'}
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
      title="Mon Wallet"
      description="Gérez vos gains et demandez des retraits"
      menuItems={automobNavigation}
      getRoleLabel={() => 'Automob'}
      getDisplayName={() => displayName}
    >
      <div className="space-y-6">
        {/* Wallet Balance Card */}
        <Card className="bg-gradient-to-br from-blue-600 to-blue-800 text-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Solde disponible</p>
                <h2 className="text-4xl font-bold mt-2">
                  {parseFloat(wallet?.balance || 0).toFixed(2)}€
                </h2>
              </div>
              <WalletIcon className="h-16 w-16 opacity-50" />
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-white/20">
              <div>
                <p className="text-xs opacity-75">Total gagné</p>
                <p className="text-lg font-semibold">
                  {parseFloat(wallet?.total_earned || 0).toFixed(2)}€
                </p>
              </div>
              <div>
                <p className="text-xs opacity-75">Total retiré</p>
                <p className="text-lg font-semibold">
                  {parseFloat(wallet?.total_withdrawn || 0).toFixed(2)}€
                </p>
              </div>
            </div>

            <Button
              onClick={() => setShowWithdrawalDialog(true)}
              className="w-full mt-6 bg-white text-blue-600 hover:bg-gray-100"
              disabled={parseFloat(wallet?.balance || 0) <= 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Demander un retrait
            </Button>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-3 sm:p-4 sm:pb-2">
              <CardTitle className="text-sm font-medium">Retraits en attente</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
              <div className="text-2xl font-bold">
                {withdrawals.filter(w => w.status === 'pending').length}
              </div>
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
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-3 sm:p-4 sm:pb-2">
              <CardTitle className="text-sm font-medium">Transactions</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
              <div className="text-2xl font-bold">{transactions.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Banking Information Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Informations bancaires</CardTitle>
                <CardDescription>
                  Vos coordonnées bancaires pour les retraits
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchProfile}
              >
                Actualiser
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <span className="text-sm text-muted-foreground">Titulaire du compte:</span>
                  <span className="text-sm font-medium">
                    {profile?.first_name && profile?.last_name 
                      ? `${profile.first_name} ${profile.last_name}`
                      : <span className="text-red-500">Non renseigné</span>
                    }
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <span className="text-sm text-muted-foreground">IBAN:</span>
                  <span className="text-xs font-mono">
                    {profile?.iban || <span className="text-red-500">Non renseigné</span>}
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <span className="text-sm text-muted-foreground">BIC:</span>
                  <span className="text-sm font-mono">
                    {profile?.bic_swift || <span className="text-red-500">Non renseigné</span>}
                  </span>
                </div>
                {(!profile?.first_name || !profile?.last_name || !profile?.iban || !profile?.bic_swift) && (
                  <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <p className="text-xs text-yellow-800 dark:text-yellow-200">
                      ⚠️ Complétez vos informations bancaires dans votre profil pour pouvoir effectuer des retraits.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Withdrawal Requests */}
        <Card>
          <CardHeader>
            <CardTitle>Mes demandes de retrait</CardTitle>
            <CardDescription>
              Historique de vos demandes de retrait
            </CardDescription>
          </CardHeader>
          <CardContent>
            {withdrawals.length === 0 ? (
              <div className="text-center py-12">
                <Download className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium">Aucune demande de retrait</p>
                <p className="text-sm text-muted-foreground">
                  Vos demandes apparaîtront ici
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {withdrawals.map((withdrawal) => (
                  <Card key={withdrawal.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-3">
                            <h3 className="font-semibold text-lg">
                              {parseFloat(withdrawal.amount).toFixed(2)}€
                            </h3>
                            {getStatusBadge(withdrawal.status)}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span className="text-muted-foreground">Demandé le:</span>
                              <span>{new Date(withdrawal.requested_at).toLocaleDateString('fr-FR')}</span>
                            </div>

                            <div className="flex items-center gap-2">
                              <Euro className="h-4 w-4 text-muted-foreground" />
                              <span className="text-muted-foreground">Méthode:</span>
                              <span className="capitalize">{withdrawal.payment_method.replace('_', ' ')}</span>
                            </div>
                          </div>

                          {withdrawal.admin_notes && (
                            <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-900 rounded">
                              <p className="text-sm font-medium">Note admin:</p>
                              <p className="text-sm text-muted-foreground">{withdrawal.admin_notes}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Transactions History */}
        <Card>
          <CardHeader>
            <CardTitle>Historique des transactions</CardTitle>
            <CardDescription>
              Toutes vos transactions wallet
            </CardDescription>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <div className="text-center py-12">
                <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium">Aucune transaction</p>
              </div>
            ) : (
              <div className="space-y-3">
                {transactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      {getTransactionIcon(transaction.type)}
                      <div>
                        <p className="font-medium">{transaction.description}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(transaction.created_at).toLocaleString('fr-FR')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${
                        transaction.type === 'credit' ? 'text-green-600' : 
                        transaction.type === 'debit' ? 'text-red-600' : 
                        'text-yellow-600'
                      }`}>
                        {transaction.type === 'credit' ? '+' : transaction.type === 'debit' ? '-' : ''}
                        {parseFloat(transaction.amount).toFixed(2)}€
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Solde: {parseFloat(transaction.balance_after).toFixed(2)}€
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Withdrawal Request Dialog */}
      <Dialog open={showWithdrawalDialog} onOpenChange={setShowWithdrawalDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Demander un retrait</DialogTitle>
            <DialogDescription>
              Solde disponible: {parseFloat(wallet?.balance || 0).toFixed(2)}€
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="amount">Montant à retirer *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                max={wallet?.balance || 0}
                value={withdrawalForm.amount}
                onChange={(e) => setWithdrawalForm({ ...withdrawalForm, amount: e.target.value })}
                placeholder="0.00"
                className={
                  withdrawalForm.amount && parseFloat(withdrawalForm.amount) > parseFloat(wallet?.balance || 0)
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                    : ''
                }
              />
              {withdrawalForm.amount && parseFloat(withdrawalForm.amount) > parseFloat(wallet?.balance || 0) && (
                <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  Le montant dépasse votre solde disponible ({parseFloat(wallet?.balance || 0).toFixed(2)}€). Veuillez modifier.
                </p>
              )}
            </div>

            {/* Affichage des informations bancaires du profil */}
            <div className="space-y-2 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <p className="text-sm font-medium">Informations bancaires (depuis votre profil)</p>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Titulaire du compte:</span>
                  <span className="font-medium">
                    {profile?.first_name && profile?.last_name 
                      ? `${profile.first_name} ${profile.last_name}`
                      : <span className="text-red-500">Non renseigné</span>
                    }
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">IBAN:</span>
                  <span className="font-mono text-xs">
                    {profile?.iban || <span className="text-red-500">Non renseigné</span>}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">BIC:</span>
                  <span className="font-mono">
                    {profile?.bic_swift || <span className="text-red-500">Non renseigné</span>}
                  </span>
                </div>
              </div>
              {(!profile?.first_name || !profile?.last_name || !profile?.iban || !profile?.bic_swift) && (
                <p className="text-xs text-red-500 mt-2">
                  ⚠️ Veuillez compléter vos informations bancaires (nom, prénom, IBAN, BIC) dans votre profil avant de demander un retrait.
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowWithdrawalDialog(false)}
              disabled={submitting}
            >
              Annuler
            </Button>
            <Button
              onClick={handleWithdrawalRequest}
              disabled={
                submitting || 
                !withdrawalForm.amount || 
                parseFloat(withdrawalForm.amount) <= 0 ||
                parseFloat(withdrawalForm.amount) > parseFloat(wallet?.balance || 0)
              }
            >
              {submitting ? 'Envoi...' : 'Demander le retrait'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Wallet;
