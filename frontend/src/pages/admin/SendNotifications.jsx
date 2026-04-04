import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { adminNavigation } from '@/constants/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/toast';
import { Bell, Send, Users, CheckCircle, XCircle, TrendingUp } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

const SendNotifications = () => {
  useDocumentTitle('Envoyer des Notifications');
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    body: '',
    link: '/dashboard',
    targetMode: 'all', // 'all', 'role', 'user'
    targetRole: 'automob',
    targetUserId: ''
  });

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    if (formData.targetMode === 'user') {
      fetchUsers(formData.targetRole);
    }
  }, [formData.targetMode, formData.targetRole]);

  const fetchStats = async () => {
    try {
      const response = await api.get('/fcm/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Erreur récupération stats:', error);
    }
  };

  const fetchUsers = async (role) => {
    try {
      const response = await api.get(`/fcm/users-by-role?role=${role}`);
      setUsers(response.data);
    } catch (error) {
      console.error('Erreur récupération utilisateurs:', error);
      setUsers([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title || !formData.body) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setLoading(true);
    try {
      let response;
      
      if (formData.targetMode === 'user') {
        // Envoi à un utilisateur spécifique
        if (!formData.targetUserId) {
          toast.error('Veuillez sélectionner un utilisateur');
          setLoading(false);
          return;
        }
        response = await api.post('/fcm/send-to-user', {
          title: formData.title,
          body: formData.body,
          link: formData.link,
          userId: formData.targetUserId
        });
        toast.success('Notification envoyée à l\'utilisateur sélectionné !');
      } else {
        // Envoi groupé (tous ou par rôle)
        const targetRole = formData.targetMode === 'all' ? 'all' : formData.targetRole;
        response = await api.post('/fcm/send-to-all', {
          title: formData.title,
          body: formData.body,
          link: formData.link,
          targetRole: targetRole
        });
      
        toast.success(
          `Notification envoyée avec succès ! ${response.data.success}/${response.data.total} utilisateurs atteints`
        );
      }
      
      // Réinitialiser le formulaire
      setFormData({
        title: '',
        body: '',
        link: '/dashboard',
        targetMode: 'all',
        targetRole: 'automob',
        targetUserId: ''
      });
      
      // Rafraîchir les stats
      fetchStats();
    } catch (error) {
      console.error('Erreur envoi notification:', error);
      toast.error(error.response?.data?.error || 'Erreur lors de l\'envoi de la notification');
    } finally {
      setLoading(false);
    }
  };

  const sendTestNotification = async () => {
    setLoading(true);
    try {
      await api.post('/fcm/send-test-push');
      toast.success('Notification de test envoyée !');
    } catch (error) {
      console.error('Erreur envoi test:', error);
      toast.error(error.response?.data?.error || 'Erreur lors de l\'envoi du test');
    } finally {
      setLoading(false);
    }
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http')) return imagePath;
    return `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${imagePath}`;
  };

  const displayName = () => {
    return user?.email?.split('@')[0] || 'Admin';
  };

  const avatarSrc = () => getImageUrl(user?.profile?.profile_picture || user?.profile_picture);

  return (
    <DashboardLayout
      title="Envoyer des Notifications"
      description="Envoyez des notifications push à tous les utilisateurs"
      menuItems={adminNavigation}
      getRoleLabel={() => 'Administrateur'}
      getDisplayName={displayName}
      getAvatarSrc={avatarSrc}
    >
      <div className="space-y-6">
        {/* Statistiques */}
        {stats && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-3 sm:p-4 sm:pb-2">
                <CardTitle className="text-sm font-medium">Total Utilisateurs</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
                <div className="text-2xl font-bold">{stats.totalUsers}</div>
                <p className="text-xs text-muted-foreground">Inscrits sur la plateforme</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-3 sm:p-4 sm:pb-2">
                <CardTitle className="text-sm font-medium">Abonnés Push</CardTitle>
                <Bell className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
                <div className="text-2xl font-bold">{stats.subscribedUsers}</div>
                <p className="text-xs text-muted-foreground">Notifications activées</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-3 sm:p-4 sm:pb-2">
                <CardTitle className="text-sm font-medium">Auto-entrepreneurs</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
                <div className="text-2xl font-bold">{stats.automobSubscribed}</div>
                <p className="text-xs text-muted-foreground">Automob abonnés</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-3 sm:p-4 sm:pb-2">
                <CardTitle className="text-sm font-medium">Taux d'Abonnement</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
                <div className="text-2xl font-bold">{stats.subscriptionRate}</div>
                <p className="text-xs text-muted-foreground">Utilisateurs abonnés</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Formulaire d'envoi */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="w-5 h-5" />
              Envoyer une Notification Groupée
            </CardTitle>
            <CardDescription>
              Cette notification sera envoyée à tous les utilisateurs ayant activé les notifications push
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">
                  Titre <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="title"
                  placeholder="Ex: Nouvelle fonctionnalité disponible !"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  maxLength={50}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  {formData.title.length}/50 caractères
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="body">
                  Message <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="body"
                  placeholder="Ex: Découvrez notre nouveau système de notifications en temps réel !"
                  value={formData.body}
                  onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                  maxLength={200}
                  rows={4}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  {formData.body.length}/200 caractères
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="targetMode">
                  Type d'envoi <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.targetMode}
                  onValueChange={(value) => setFormData({ 
                    ...formData, 
                    targetMode: value,
                    targetUserId: '' 
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez le type d'envoi" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">📢 Tous les utilisateurs ({stats?.subscribedUsers || 0})</SelectItem>
                    <SelectItem value="role">👥 Par rôle</SelectItem>
                    <SelectItem value="user">👤 Utilisateur spécifique</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Choisissez le type d'envoi
                </p>
              </div>

              {formData.targetMode === 'role' && (
                <div className="space-y-2">
                  <Label htmlFor="targetRole">
                    Rôle <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.targetRole}
                    onValueChange={(value) => setFormData({ ...formData, targetRole: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez un rôle" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="automob">Auto-entrepreneurs ({stats?.automobSubscribed || 0})</SelectItem>
                      <SelectItem value="client">Clients ({stats?.clientSubscribed || 0})</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Sélectionnez le rôle cible
                  </p>
                </div>
              )}

              {formData.targetMode === 'user' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="userRole">
                      Rôle de l'utilisateur <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={formData.targetRole}
                      onValueChange={(value) => setFormData({ 
                        ...formData, 
                        targetRole: value,
                        targetUserId: '' 
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez un rôle" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="automob">Auto-entrepreneurs</SelectItem>
                        <SelectItem value="client">Clients</SelectItem>
                        <SelectItem value="admin">Administrateurs</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Filtrer par rôle
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="targetUserId">
                      Utilisateur <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={formData.targetUserId}
                      onValueChange={(value) => setFormData({ ...formData, targetUserId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez un utilisateur" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        {users.length === 0 ? (
                          <div className="p-2 text-sm text-muted-foreground">
                            Aucun utilisateur trouvé
                          </div>
                        ) : (
                          users.map((u) => (
                            <SelectItem key={u.id} value={u.id.toString()}>
                              <div className="flex flex-col">
                                <span className="font-medium">{u.full_name}</span>
                                <span className="text-xs text-muted-foreground">
                                  {u.company_name && `${u.company_name} • `}
                                  {u.email}
                                  {u.has_fcm_token ? ' ✅' : ' ⚠️ Sans FCM'}
                                </span>
                              </div>
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      {users.length} utilisateur(s) disponible(s)
                    </p>
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="link">Lien de Redirection</Label>
                <Input
                  id="link"
                  placeholder="/dashboard"
                  value={formData.link}
                  onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Page vers laquelle rediriger l'utilisateur au clic
                </p>
              </div>

              <div className="flex gap-3">
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Envoi en cours...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      {formData.targetMode === 'all' && `Envoyer à Tous (${stats?.subscribedUsers || 0})`}
                      {formData.targetMode === 'role' && formData.targetRole === 'automob' && `Envoyer aux Automobs (${stats?.automobSubscribed || 0})`}
                      {formData.targetMode === 'role' && formData.targetRole === 'client' && `Envoyer aux Clients (${stats?.clientSubscribed || 0})`}
                      {formData.targetMode === 'user' && (
                        formData.targetUserId 
                          ? `Envoyer à l'utilisateur sélectionné`
                          : 'Sélectionnez un utilisateur'
                      )}
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={sendTestNotification}
                  disabled={loading}
                >
                  <Bell className="w-4 h-4 mr-2" />
                  Test (moi uniquement)
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Exemples de notifications */}
        <Card>
          <CardHeader>
            <CardTitle>💡 Exemples de Notifications</CardTitle>
            <CardDescription>Quelques idées de notifications à envoyer</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-3 border rounded-lg">
                <p className="font-semibold">🎉 Nouvelle Fonctionnalité</p>
                <p className="text-sm text-muted-foreground">
                  "Découvrez notre nouveau système de chat en temps réel !"
                </p>
              </div>

              <div className="p-3 border rounded-lg">
                <p className="font-semibold">📢 Annonce Importante</p>
                <p className="text-sm text-muted-foreground">
                  "Maintenance programmée ce soir de 22h à 23h. Merci de votre compréhension."
                </p>
              </div>

              <div className="p-3 border rounded-lg">
                <p className="font-semibold">🎁 Promotion</p>
                <p className="text-sm text-muted-foreground">
                  "Profitez de -20% sur toutes les missions cette semaine !"
                </p>
              </div>

              <div className="p-3 border rounded-lg">
                <p className="font-semibold">⚠️ Alerte</p>
                <p className="text-sm text-muted-foreground">
                  "Votre profil nécessite une mise à jour pour continuer à recevoir des missions."
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default SendNotifications;
