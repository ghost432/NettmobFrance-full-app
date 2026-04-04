import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { adminNavigation } from '@/constants/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/toast';
import { MessageSquare, Send, Users, Smartphone, AlertCircle, TrendingUp } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

const SendSMS = () => {
  useDocumentTitle('Envoyer des SMS');
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [twilioConfig, setTwilioConfig] = useState(null);
  const [users, setUsers] = useState([]);
  const [formData, setFormData] = useState({
    message: '',
    link: '',
    targetMode: 'all',
    targetRole: 'automob',
    targetUserId: ''
  });

  useEffect(() => {
    fetchStats();
    checkTwilioConfig();
  }, []);

  useEffect(() => {
    if (formData.targetMode === 'user') {
      fetchUsers(formData.targetRole);
    }
  }, [formData.targetMode, formData.targetRole]);

  const fetchStats = async () => {
    try {
      const response = await api.get('/sms/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Erreur récupération stats:', error);
    }
  };

  const checkTwilioConfig = async () => {
    try {
      const response = await api.get('/sms/config-status');
      setTwilioConfig(response.data);
    } catch (error) {
      console.error('Erreur vérification config Twilio:', error);
    }
  };

  const fetchUsers = async (role) => {
    try {
      const response = await api.get(`/sms/users-by-role?role=${role}`);
      setUsers(response.data);
    } catch (error) {
      console.error('Erreur récupération utilisateurs:', error);
      setUsers([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.message) {
      toast.error('Veuillez remplir le message');
      return;
    }

    if (!twilioConfig?.configured) {
      toast.error('Twilio n\'est pas configuré correctement');
      return;
    }

    setLoading(true);
    try {
      let response;
      
      if (formData.targetMode === 'user') {
        if (!formData.targetUserId) {
          toast.error('Veuillez sélectionner un utilisateur');
          setLoading(false);
          return;
        }
        response = await api.post('/sms/send-to-user', {
          message: formData.message,
          link: formData.link,
          userId: formData.targetUserId
        });
        toast.success('SMS envoyé à l\'utilisateur sélectionné !');
      } else {
        const targetRole = formData.targetMode === 'all' ? 'all' : formData.targetRole;
        response = await api.post('/sms/send-to-all', {
          message: formData.message,
          link: formData.link,
          targetRole: targetRole
        });
      
        toast.success(
          `SMS envoyés avec succès ! ${response.data.success}/${response.data.total} destinataires atteints`
        );
        
        if (response.data.failed > 0) {
          toast.warning(`${response.data.failed} échecs d'envoi`);
        }
      }
      
      // Réinitialiser le formulaire
      setFormData({
        message: '',
        link: '',
        targetMode: 'all',
        targetRole: 'automob',
        targetUserId: ''
      });
      
      // Rafraîchir les stats
      fetchStats();
    } catch (error) {
      console.error('Erreur envoi SMS:', error);
      toast.error(error.response?.data?.error || 'Erreur lors de l\'envoi des SMS');
    } finally {
      setLoading(false);
    }
  };

  const sendTestSMS = async () => {
    if (!twilioConfig?.configured) {
      toast.error('Twilio n\'est pas configuré correctement');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/sms/send-test');
      toast.success(`SMS de test envoyé à ${response.data.phone} !`);
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

  // Calculer le nombre de caractères restants (SMS = 160 caractères)
  const charsRemaining = 160 - formData.message.length;
  const smsCount = Math.ceil(formData.message.length / 160);

  return (
    <DashboardLayout
      title="Envoyer des SMS"
      description="Envoyez des SMS à vos utilisateurs via Twilio"
      menuItems={adminNavigation}
      getRoleLabel={() => 'Administrateur'}
      getDisplayName={displayName}
      getAvatarSrc={avatarSrc}
    >
      <div className="space-y-6">
        {/* Alerte configuration Twilio */}
        {twilioConfig && !twilioConfig.configured && (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-yellow-900">Configuration Twilio Incomplète</h3>
                  <p className="text-sm text-yellow-700 mt-1">
                    Veuillez configurer Twilio dans le fichier .env pour envoyer des SMS.
                  </p>
                  <ul className="text-sm text-yellow-700 mt-2 space-y-1">
                    <li>• TWILIO_ACCOUNT_SID: {twilioConfig.hasAccountSid ? '✅' : '❌'}</li>
                    <li>• TWILIO_AUTH_TOKEN: {twilioConfig.hasAuthToken ? '✅' : '❌'}</li>
                    <li>• TWILIO_MESSAGING_SERVICE_SID: {twilioConfig.hasMessagingService ? '✅' : '❌'}</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

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
                <CardTitle className="text-sm font-medium">Avec Téléphone</CardTitle>
                <Smartphone className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
                <div className="text-2xl font-bold">{stats.usersWithPhone}</div>
                <p className="text-xs text-muted-foreground">Peuvent recevoir des SMS</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-3 sm:p-4 sm:pb-2">
                <CardTitle className="text-sm font-medium">Auto-entrepreneurs</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
                <div className="text-2xl font-bold">{stats.automobWithPhone}</div>
                <p className="text-xs text-muted-foreground">Automobs avec téléphone</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-3 sm:p-4 sm:pb-2">
                <CardTitle className="text-sm font-medium">Taux de Couverture</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
                <div className="text-2xl font-bold">{stats.coverageRate}</div>
                <p className="text-xs text-muted-foreground">Utilisateurs joignables</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Formulaire d'envoi */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Envoyer un SMS Groupé
            </CardTitle>
            <CardDescription>
              Ce SMS sera envoyé à tous les utilisateurs ayant renseigné un numéro de téléphone
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="message">
                  Message <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="message"
                  placeholder="Ex: Nouvelle fonctionnalité disponible sur NettmobFrance ! Consultez votre tableau de bord."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  maxLength={480}
                  rows={4}
                  required
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{formData.message.length}/480 caractères</span>
                  <span className={smsCount > 1 ? 'text-yellow-600' : ''}>
                    {smsCount} SMS {smsCount > 1 && '(message long)'}
                  </span>
                </div>
                {formData.message.length > 160 && (
                  <p className="text-xs text-yellow-600">
                    ⚠️ Votre message nécessite {smsCount} SMS par destinataire
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="link">
                  Lien (optionnel)
                </Label>
                <input
                  id="link"
                  type="text"
                  placeholder="Ex: https://pro.nettmobfrance.fr/missions/123"
                  value={formData.link}
                  onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
                <p className="text-xs text-muted-foreground">
                  Ajoutez un lien vers une mission, un document, etc. Il sera ajouté à la fin du SMS.
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
                    <SelectItem value="all">📢 Tous les utilisateurs ({stats?.usersWithPhone || 0})</SelectItem>
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
                      <SelectItem value="automob">Auto-entrepreneurs ({stats?.automobWithPhone || 0})</SelectItem>
                      <SelectItem value="client">Clients ({stats?.clientWithPhone || 0})</SelectItem>
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
                                  {u.phone ? ' 📱' : ' ⚠️ Sans tél'}
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

              <div className="flex gap-3">
                <Button 
                  type="submit" 
                  disabled={loading || !twilioConfig?.configured} 
                  className="flex-1"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Envoi en cours...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      {formData.targetMode === 'all' && `Envoyer à Tous (${stats?.usersWithPhone || 0})`}
                      {formData.targetMode === 'role' && formData.targetRole === 'automob' && `Envoyer aux Automobs (${stats?.automobWithPhone || 0})`}
                      {formData.targetMode === 'role' && formData.targetRole === 'client' && `Envoyer aux Clients (${stats?.clientWithPhone || 0})`}
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
                  onClick={sendTestSMS}
                  disabled={loading || !twilioConfig?.configured}
                >
                  <Smartphone className="w-4 h-4 mr-2" />
                  Test (moi uniquement)
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Exemples de SMS */}
        <Card>
          <CardHeader>
            <CardTitle>💡 Exemples de SMS</CardTitle>
            <CardDescription>Quelques idées de messages courts et efficaces</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                onClick={() => setFormData({ 
                  ...formData, 
                  message: 'Nouvelle mission disponible ! 25€/h à Paris. Consultez les détails :',
                  link: 'https://pro.nettmobfrance.fr/missions/123'
                })}>
                <p className="font-semibold text-sm">🎯 Nouvelle Mission (avec lien)</p>
                <p className="text-sm text-muted-foreground mt-1">
                  "Nouvelle mission disponible ! 25€/h à Paris. Consultez les détails :"
                  <br />
                  <span className="text-blue-600">🔗 https://pro.nettmobfrance.fr/missions/123</span>
                </p>
                <span className="text-xs text-gray-500">Cliquez pour utiliser ce modèle</span>
              </div>

              <div className="p-3 border rounded-lg">
                <p className="font-semibold text-sm">📢 Annonce</p>
                <p className="text-sm text-muted-foreground mt-1">
                  "Maintenance ce soir 22h-23h. Merci de votre compréhension."
                </p>
                <span className="text-xs text-gray-500">63 caractères • 1 SMS</span>
              </div>

              <div className="p-3 border rounded-lg">
                <p className="font-semibold text-sm">⚠️ Urgent</p>
                <p className="text-sm text-muted-foreground mt-1">
                  "URGENT: Complétez votre profil pour continuer à recevoir des missions."
                </p>
                <span className="text-xs text-gray-500">75 caractères • 1 SMS</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default SendSMS;
