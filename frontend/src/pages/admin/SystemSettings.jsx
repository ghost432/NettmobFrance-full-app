import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { adminNavigation } from '@/constants/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import api from '@/lib/api';
import { useEffect, useState } from 'react';
import { toast } from '@/components/ui/toast';

export const SystemSettings = () => {
  useDocumentTitle('Paramètres Système - Admin');
  
  const [settings, setSettings] = useState({
    maintenance_mode: false,
    signup_enabled: true,
    default_hourly_rate: 15,
    app_name: 'NettMobFrance',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSystemSettings();
  }, []);

  const fetchSystemSettings = async () => {
    try {
      const response = await api.get('/admin/system-settings');
      setSettings(response.data.settings);
    } catch (error) {
      console.error('Error fetching system settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/admin/system-settings', settings);
      toast.success('Paramètres sauvegardés avec succès');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout
      title="Paramètres Système"
      menuItems={adminNavigation}
      getRoleLabel={() => 'Administrateur'}
    >
      <Card>
        <CardHeader>
          <CardTitle>Configuration de l'application</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div>Chargement...</div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Mode maintenance</Label>
                  <p className="text-sm text-muted-foreground">
                    Bloquer l'accès aux utilisateurs non-admins
                  </p>
                </div>
                <Switch 
                  checked={settings.maintenance_mode} 
                  onCheckedChange={(checked) => setSettings({...settings, maintenance_mode: checked})}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Inscriptions ouvertes</Label>
                  <p className="text-sm text-muted-foreground">
                    Autoriser les nouvelles inscriptions
                  </p>
                </div>
                <Switch 
                  checked={settings.signup_enabled} 
                  onCheckedChange={(checked) => setSettings({...settings, signup_enabled: checked})}
                />
              </div>

              <div>
                <Label>Nom de l'application</Label>
                <Input 
                  value={settings.app_name}
                  onChange={(e) => setSettings({...settings, app_name: e.target.value})}
                />
              </div>

              <div>
                <Label>Tarif horaire par défaut (€)</Label>
                <Input 
                  type="number"
                  value={settings.default_hourly_rate}
                  onChange={(e) => setSettings({...settings, default_hourly_rate: parseFloat(e.target.value)})}
                />
              </div>

              <div className="flex justify-end pt-4">
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? 'Sauvegarde en cours...' : 'Sauvegarder les paramètres'}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default SystemSettings;
