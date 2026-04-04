import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useAuth } from '@/context/AuthContext';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { clientNavigation } from '@/constants/navigation';
import { Button } from '@/components/ui/button';
import { Input, InputWithIcon } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Lock, Bell, Mail, Eye, EyeOff, History, Timer, CreditCard, User, MapPin, Phone, Building2 } from 'lucide-react';
import { toast } from '@/components/ui/toast';
import api from '@/lib/api';
import { usersAPI } from '@/lib/api';
import { cn } from '@/lib/utils';
import { subscribeToPush, unsubscribeFromPush, sendTestNotification } from '@/services/pushNotification';

const SettingsClient = () => {
  useDocumentTitle('Paramètres');
  const { user, updateUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeSection, setActiveSection] = useState('security');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [webPushEnabled, setWebPushEnabled] = useState(user?.profile?.web_push_enabled || false);
  const [emailNotifications, setEmailNotifications] = useState(user?.profile?.email_notifications !== false);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyData, setHistoryData] = useState({ user: null, sessions: [] });
  const [historyPage, setHistoryPage] = useState(1);
  const HISTORY_PAGE_SIZE = 15;
  const [billingInfo, setBillingInfo] = useState({
    company_name: '',
    first_name: '',
    last_name: '',
    address: '',
    email: '',
    phone: ''
  });
  const [savingBilling, setSavingBilling] = useState(false);

  const sections = useMemo(() => ([
    {
      id: 'security',
      label: 'Sécurité',
      description: 'Mettez à jour votre mot de passe pour protéger votre entreprise.',
      icon: Lock,
    },
    {
      id: 'billing',
      label: 'Informations de facturation',
      description: 'Gérez les informations de facturation de votre entreprise.',
      icon: CreditCard,
    },
    {
      id: 'notifications',
      label: 'Notifications',
      description: 'Recevez les alertes clés concernant vos missions et vos Auto-mob.',
      icon: Bell,
    },
    {
      id: 'history',
      label: 'Historique des connexions',
      description: 'Visualisez vos dernières connexions et le temps passé sur la plateforme.',
      icon: History,
    },
  ]), []);

  // Gérer la section depuis l'URL
  useEffect(() => {
    const sectionParam = searchParams.get('section');
    if (sectionParam) {
      const validSection = sections.find(s => s.id === sectionParam);
      if (validSection) {
        setActiveSection(validSection.id);
      }
    }
  }, [searchParams, sections]);

  // Synchroniser les préférences de notifications avec le user
  useEffect(() => {
    if (user?.profile) {
      setWebPushEnabled(user.profile.web_push_enabled || false);
      setEmailNotifications(user.profile.email_notifications !== false);
      setBillingInfo({
        company_name: user.profile.company_name || '',
        first_name: user.profile.first_name || '',
        last_name: user.profile.last_name || '',
        address: user.profile.address || '',
        email: user.email || '',
        phone: user.profile.phone || ''
      });
    }
  }, [user]);

  const formatDuration = (seconds = 0) => {
    if (!seconds) return '0 minute';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    const parts = [];
    if (hours) parts.push(`${hours} h`);
    if (minutes) parts.push(`${minutes} min`);
    if (!hours && !minutes) parts.push(`${secs} s`);
    return parts.join(' ');
  };

  useEffect(() => {
    const fetchHistory = async () => {
      setHistoryLoading(true);
      try {
        const { data } = await usersAPI.getHistory();
        setHistoryData({ user: data.user, sessions: data.sessions });
      } catch (error) {
        toast.error('Impossible de charger l\'historique des connexions');
      } finally {
        setHistoryLoading(false);
      }
    };

    fetchHistory();
  }, []);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }

    setLoading(true);
    try {
      await api.put('/users/change-password', {
        oldPassword: passwordForm.oldPassword,
        newPassword: passwordForm.newPassword,
      });
      toast.success('Mot de passe modifié avec succès');
      setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erreur lors de la modification');
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationToggle = async (type, value) => {
    console.log('[Toggle]', type, 'nouvelle valeur:', value);

    // Mettre à jour immédiatement l'UI
    if (type === 'webPushEnabled') setWebPushEnabled(value);
    if (type === 'emailNotifications') setEmailNotifications(value);

    try {
      // Si c'est Web Push, gérer la souscription
      if (type === 'webPushEnabled' && value) {
        console.log('[Toggle] Tentative d\'abonnement push...');
        await subscribeToPush();
        toast.success('Notifications push activées ! Vous recevrez les notifications même quand l\'app est fermée.');

        // Envoyer une notification de test (optionnel, ne bloque pas)
        setTimeout(async () => {
          try {
            console.log('[Toggle] Envoi notification test...');
            await sendTestNotification();
            console.log('[Toggle] Notification test envoyée avec succès');
          } catch (e) {
            // Ignorer l'erreur silencieusement (la notification test n'est pas critique)
            console.log('[Toggle] Notification test ignorée (non critique)');
          }
        }, 2000);
      } else if (type === 'webPushEnabled' && !value) {
        console.log('[Toggle] Désabonnement push...');
        await unsubscribeFromPush();
        toast.success('Notifications push désactivées');
      }

      // Mettre à jour la préférence en BD
      console.log('[Toggle] Sauvegarde en BD...');
      await api.put('/users/notifications', {
        [type]: value
      });

      // Mettre à jour le contexte Auth avec le bon nom de champ
      const fieldName = type === 'webPushEnabled' ? 'web_push_enabled' : 'email_notifications';
      const updatedUser = {
        ...user,
        profile: {
          ...user.profile,
          [fieldName]: value
        }
      };
      updateUser(updatedUser);

      console.log('[Toggle] Succès !');

      if (type === 'emailNotifications') {
        toast.success('Préférences mises à jour');
      }
    } catch (error) {
      console.error('[Toggle] ERREUR:', error);
      toast.error(error.message || 'Erreur lors de la mise à jour');
      // Réinitialiser le toggle en cas d'erreur
      if (type === 'webPushEnabled') setWebPushEnabled(!value);
      if (type === 'emailNotifications') setEmailNotifications(!value);
    }
  };

  const SecurityCard = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lock className="h-5 w-5" />
          Changer le mot de passe
        </CardTitle>
        <CardDescription>Modifiez votre mot de passe pour sécuriser votre compte</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Mot de passe actuel</label>
            <div className="relative">
              <input
                type={showOldPassword ? 'text' : 'password'}
                value={passwordForm.oldPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })}
                className="w-full px-3 py-2 pr-10 bg-background border border-input rounded-lg"
                required
              />
              <button
                type="button"
                onClick={() => setShowOldPassword(!showOldPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                {showOldPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Nouveau mot de passe</label>
            <div className="relative">
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                className="w-full px-3 py-2 pr-10 bg-background border border-input rounded-lg"
                required
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Confirmer le mot de passe</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                className="w-full px-3 py-2 pr-10 bg-background border border-input rounded-lg"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <Button type="submit" disabled={loading}>
            {loading ? 'Modification...' : 'Modifier le mot de passe'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );

  const NotificationsCard = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notifications
        </CardTitle>
        <CardDescription>Gérez vos préférences de notification</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-4 border border-border rounded-lg">
          <div className="flex items-center gap-3">
            <Bell className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-medium">Notifications Web Push</p>
              <p className="text-sm text-muted-foreground">Recevoir des notifications dans le navigateur</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={webPushEnabled}
              onChange={(e) => handleNotificationToggle('webPushEnabled', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
          </label>
        </div>

        <div className="flex items-center justify-between p-4 border border-border rounded-lg">
          <div className="flex items-center gap-3">
            <Mail className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-medium">Notifications par Email</p>
              <p className="text-sm text-muted-foreground">Recevoir des notifications par email</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={emailNotifications}
              onChange={(e) => handleNotificationToggle('emailNotifications', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
          </label>
        </div>
      </CardContent>
    </Card>
  );

  const BillingCard = () => {
    const handleBillingSubmit = async (e) => {
      e.preventDefault();
      setSavingBilling(true);
      try {
        const { data } = await api.put('/users/profile/client', billingInfo);
        const updatedUser = {
          ...user,
          profile: data.profile,
        };
        updateUser(updatedUser);
        toast.success('Informations de facturation mises à jour');
      } catch (error) {
        toast.error(error.response?.data?.error || 'Erreur lors de la mise à jour');
      } finally {
        setSavingBilling(false);
      }
    };

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Informations de facturation
          </CardTitle>
          <CardDescription>Ces informations seront utilisées pour la facturation de votre entreprise</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleBillingSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Nom de l'entreprise</label>
              <InputWithIcon
                icon={Building2}
                type="text"
                value={billingInfo.company_name}
                onChange={(e) => setBillingInfo({ ...billingInfo, company_name: e.target.value })}
                placeholder="Ma Société SARL"
                required
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium mb-2">Prénom du gérant</label>
                <InputWithIcon
                  icon={User}
                  type="text"
                  value={billingInfo.first_name}
                  onChange={(e) => setBillingInfo({ ...billingInfo, first_name: e.target.value })}
                  placeholder="Jean"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Nom du gérant</label>
                <InputWithIcon
                  icon={User}
                  type="text"
                  value={billingInfo.last_name}
                  onChange={(e) => setBillingInfo({ ...billingInfo, last_name: e.target.value })}
                  placeholder="Dupont"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Adresse complète de l'entreprise</label>
              <InputWithIcon
                icon={MapPin}
                type="text"
                value={billingInfo.address}
                onChange={(e) => setBillingInfo({ ...billingInfo, address: e.target.value })}
                placeholder="12 rue de la Paix, 75002 Paris"
                required
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <InputWithIcon
                  icon={Mail}
                  type="email"
                  value={billingInfo.email}
                  onChange={(e) => setBillingInfo({ ...billingInfo, email: e.target.value })}
                  placeholder="email@exemple.fr"
                  required
                  disabled
                />
                <p className="text-xs text-muted-foreground mt-1">L'email ne peut pas être modifié ici</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Téléphone</label>
                <InputWithIcon
                  icon={Phone}
                  type="tel"
                  value={billingInfo.phone}
                  onChange={(e) => setBillingInfo({ ...billingInfo, phone: e.target.value })}
                  placeholder="+33 6 12 34 56 78"
                  required
                />
              </div>
            </div>

            <Button type="submit" disabled={savingBilling}>
              {savingBilling ? 'Enregistrement...' : 'Enregistrer les informations'}
            </Button>
          </form>
        </CardContent>
      </Card>
    );
  };

  const HistoryCard = () => {
    const totalPages = Math.ceil(historyData.sessions.length / HISTORY_PAGE_SIZE);
    const pagedSessions = historyData.sessions.slice(
      (historyPage - 1) * HISTORY_PAGE_SIZE,
      historyPage * HISTORY_PAGE_SIZE
    );
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Historique des connexions
          </CardTitle>
          <CardDescription>Suivez vos dernières connexions et le temps passé sur la plateforme</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {historyLoading ? (
            <p className="text-sm text-muted-foreground">Chargement de l'historique...</p>
          ) : !historyData.sessions.length ? (
            <p className="text-sm text-muted-foreground">Aucune connexion enregistrée pour le moment.</p>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-lg border border-border p-4">
                  <p className="text-xs uppercase text-muted-foreground">Dernière connexion</p>
                  <p className="mt-1 text-sm font-medium">
                    {historyData.user?.last_login ? new Date(historyData.user.last_login).toLocaleString('fr-FR') : '—'}
                  </p>
                </div>
                <div className="rounded-lg border border-border p-4">
                  <p className="text-xs uppercase text-muted-foreground">Temps total cumulé</p>
                  <p className="mt-1 text-sm font-medium flex items-center gap-2">
                    <Timer className="h-4 w-4 text-primary" />
                    {formatDuration(historyData.user?.total_session_duration)}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {pagedSessions.map((session) => {
                  const isActive = !session.logout_at;
                  return (
                    <div
                      key={session.id}
                      className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 rounded-lg border border-border p-4"
                    >
                      <div>
                        <p className="text-sm font-medium">{new Date(session.login_at).toLocaleString('fr-FR')}</p>
                        <p className="text-xs text-muted-foreground">
                          {session.logout_at ? `Déconnexion : ${new Date(session.logout_at).toLocaleString('fr-FR')}` : 'Session en cours'}
                        </p>
                      </div>
                      <span className={cn('text-sm font-medium', isActive ? 'text-primary' : 'text-muted-foreground')}>
                        {isActive ? 'En cours' : formatDuration(session.duration_seconds)}
                      </span>
                    </div>
                  );
                })}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setHistoryPage((p) => Math.max(1, p - 1))}
                    disabled={historyPage === 1}
                  >
                    ← Précédent
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {historyPage} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setHistoryPage((p) => Math.min(totalPages, p + 1))}
                    disabled={historyPage === totalPages}
                  >
                    Suivant →
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'security':
        return <SecurityCard />;
      case 'billing':
        return <BillingCard />;
      case 'notifications':
        return <NotificationsCard />;
      case 'history':
        return <HistoryCard />;
      default:
        return null;
    }
  };

  return (
    <DashboardLayout
      title="Paramètres"
      description="Gérez la sécurité et les notifications"
      menuItems={clientNavigation}
      getRoleLabel={() => user?.profile?.company_name || 'Entreprise'}
    >
      <section className="max-w-6xl mx-auto">
        <div className="grid gap-6 lg:grid-cols-[260px,1fr]">
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="text-base">Mon espace</CardTitle>
              <CardDescription>Paramétrez votre compte entreprise</CardDescription>
            </CardHeader>
            <CardContent className="space-y-1">
              {sections.map((section) => {
                const Icon = section.icon;
                const isActive = activeSection === section.id;
                return (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => {
                      setActiveSection(section.id);
                      setSearchParams({ section: section.id });
                    }}
                    className={cn(
                      'w-full flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors',
                      isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="text-left flex-1">{section.label}</span>
                  </button>
                );
              })}
            </CardContent>
          </Card>

          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-foreground">{sections.find((s) => s.id === activeSection)?.label}</h2>
              <p className="text-sm text-muted-foreground">
                {sections.find((s) => s.id === activeSection)?.description}
              </p>
            </div>

            {renderActiveSection()}
          </div>
        </div>
      </section>
    </DashboardLayout>
  );
};

export default SettingsClient;
