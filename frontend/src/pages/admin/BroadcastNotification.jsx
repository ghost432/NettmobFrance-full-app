import { useState } from 'react';
import { Send, MessageSquare, Users, CheckCircle, Zap } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { adminNavigation } from '@/constants/navigation';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { toast } from '@/components/ui/toast';
import api from '@/lib/api';

const BroadcastNotification = () => {
  useDocumentTitle('Envoyer une notification');
  
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'info',
    category: 'system',
    action_url: '',
    target_type: 'all', // all, role, user
    target_value: '',
    send_email: false
  });
  const [sending, setSending] = useState(false);
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [testingPush, setTestingPush] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title || !formData.message) {
      toast.error('Le titre et le message sont requis');
      return;
    }

    setSending(true);

    try {
      const response = await api.post('/notifications/send-targeted', {
        title: formData.title,
        message: formData.message,
        type: formData.type,
        category: formData.category,
        action_url: formData.action_url || null,
        target_type: formData.target_type,
        target_value: formData.target_value || null,
        send_email: formData.send_email
      });

      const { count, pushCount = 0 } = response.data;
      let successMessage = `Notification envoyée à ${count} utilisateur(s)`;
      if (formData.send_email) {
        successMessage += ` (Email envoyé)`;
      }
      if (pushCount > 0) {
        successMessage += ` (${pushCount} push)`;
      }
      toast.success(successMessage);
      
      // Réinitialiser le formulaire
      setFormData({
        title: '',
        message: '',
        type: 'info',
        category: 'system',
        action_url: '',
        target_type: 'all',
        target_value: '',
        send_email: false
      });
      setUsers([]);
    } catch (error) {
      console.error('Erreur envoi notification:', error);
      toast.error(error.response?.data?.error || 'Erreur lors de l\'envoi');
    } finally {
      setSending(false);
    }
  };

  const predefinedMessages = [
    {
      title: '👋 Bonjour à tous !',
      message: 'Bonjour à tous les utilisateurs de NettmobFrance ! Nous espérons que vous passez une excellente journée.',
      type: 'info',
      category: 'system'
    },
    {
      title: '🎉 Nouvelle fonctionnalité',
      message: 'Une nouvelle fonctionnalité est maintenant disponible sur la plateforme. Découvrez-la dès maintenant !',
      type: 'success',
      category: 'system'
    },
    {
      title: '🔧 Maintenance programmée',
      message: 'Une maintenance de la plateforme est prévue ce weekend. Le service sera temporairement indisponible.',
      type: 'warning',
      category: 'system'
    },
    {
      title: '💰 Programme de parrainage',
      message: 'Nouveau : parrainez vos amis et gagnez des récompenses ! En savoir plus dans votre profil.',
      type: 'info',
      category: 'account'
    }
  ];

  const loadPredefined = (preset) => {
    setFormData({
      ...formData,
      title: preset.title,
      message: preset.message,
      type: preset.type,
      category: preset.category
    });
  };

  const handleTestWebPush = async () => {
    setTestingPush(true);
    try {
      const response = await api.post('/notifications/test-web-push');
      const { totalUsers, successCount, failCount, noSubscriptionCount } = response.data;
      
      toast.success(
        `Test Web Push terminé:\n✅ ${successCount} envoyés\n❌ ${failCount} échecs\n⚠️ ${noSubscriptionCount} sans souscription\n📧 Total: ${totalUsers} utilisateurs`,
        { duration: 8000 }
      );
      
      console.log('📊 Résultats détaillés:', response.data);
    } catch (error) {
      console.error('Erreur test Web Push:', error);
      toast.error(error.response?.data?.error || 'Erreur lors du test Web Push');
    } finally {
      setTestingPush(false);
    }
  };

  return (
    <DashboardLayout
      title="Envoyer une notification"
      description="Envoyez une notification à tous les utilisateurs ou à un groupe ciblé"
      menuItems={adminNavigation}
    >
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Formulaire */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Composer la notification</CardTitle>
            <CardDescription>
              Cette notification sera envoyée à tous les utilisateurs (admin, automob, client)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Titre *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ex: Bonjour à tous !"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Message *</Label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Votre message..."
                  rows={5}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  {formData.message.length} caractères
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData({ ...formData, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="info">ℹ️ Info</SelectItem>
                      <SelectItem value="success">✅ Succès</SelectItem>
                      <SelectItem value="warning">⚠️ Avertissement</SelectItem>
                      <SelectItem value="error">❌ Erreur</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Catégorie</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="system">Système</SelectItem>
                      <SelectItem value="mission">Mission</SelectItem>
                      <SelectItem value="message">Message</SelectItem>
                      <SelectItem value="payment">Paiement</SelectItem>
                      <SelectItem value="verification">Vérification</SelectItem>
                      <SelectItem value="account">Compte</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="action_url">Lien d'action (optionnel)</Label>
                <Input
                  id="action_url"
                  value={formData.action_url}
                  onChange={(e) => setFormData({ ...formData, action_url: e.target.value })}
                  placeholder="Ex: /missions"
                />
                <p className="text-xs text-muted-foreground">
                  URL vers laquelle rediriger les utilisateurs
                </p>
              </div>

              {/* Ciblage */}
              <div className="space-y-4 border-t pt-4">
                <h3 className="font-semibold">Ciblage</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="target_type">Envoyer à</Label>
                  <Select
                    value={formData.target_type}
                    onValueChange={(value) => setFormData({ ...formData, target_type: value, target_value: '' })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">👥 Tous les utilisateurs</SelectItem>
                      <SelectItem value="role">👤 Un type de compte</SelectItem>
                      <SelectItem value="user">🎯 Un utilisateur spécifique</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.target_type === 'role' && (
                  <div className="space-y-2">
                    <Label htmlFor="role">Type de compte</Label>
                    <Select
                      value={formData.target_value}
                      onValueChange={(value) => setFormData({ ...formData, target_value: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choisir un type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="automob">Automob</SelectItem>
                        <SelectItem value="client">Client</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {formData.target_type === 'user' && (
                  <div className="space-y-2">
                    <Label htmlFor="user_id">ID Utilisateur</Label>
                    <Input
                      id="user_id"
                      type="number"
                      value={formData.target_value}
                      onChange={(e) => setFormData({ ...formData, target_value: e.target.value })}
                      placeholder="Ex: 1"
                    />
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="send_email"
                    checked={formData.send_email}
                    onChange={(e) => setFormData({ ...formData, send_email: e.target.checked })}
                    className="rounded"
                  />
                  <Label htmlFor="send_email" className="cursor-pointer">
                    📧 Envoyer aussi par email
                  </Label>
                </div>
              </div>

              <Button
                type="submit"
                disabled={sending}
                className="w-full"
                size="lg"
              >
                {sending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    {formData.target_type === 'all' ? 'Envoyer à tous les utilisateurs' :
                     formData.target_type === 'role' ? `Envoyer aux ${formData.target_value}s` :
                     'Envoyer à l\'utilisateur'}
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Messages prédéfinis */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Messages prédéfinis</CardTitle>
              <CardDescription>Cliquez pour charger</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {predefinedMessages.map((preset, index) => (
                <button
                  key={index}
                  onClick={() => loadPredefined(preset)}
                  className="w-full text-left p-3 rounded-lg border hover:bg-accent transition-colors"
                >
                  <div className="font-medium text-sm">{preset.title}</div>
                  <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {preset.message}
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="w-4 h-4" />
                Informations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Notification instantanée</p>
                  <p className="text-muted-foreground text-xs">
                    Les utilisateurs connectés recevront un toast immédiatement
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Badge de notification</p>
                  <p className="text-muted-foreground text-xs">
                    Le compteur de l'icône cloche sera mis à jour
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Persistance</p>
                  <p className="text-muted-foreground text-xs">
                    Les utilisateurs non connectés verront la notification à leur prochaine connexion
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-800">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Zap className="w-4 h-4 text-blue-600" />
                Test Web Push
              </CardTitle>
              <CardDescription>
                Testez les notifications Web Push
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={handleTestWebPush}
                disabled={testingPush}
                variant="outline"
                className="w-full"
              >
                {testingPush ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                    Test en cours...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Tester Web Push
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                Envoie une notification de test à tous les utilisateurs ayant activé les Web Push
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default BroadcastNotification;
