import { useEffect, useMemo, useState } from 'react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useAuth } from '@/context/AuthContext';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { adminNavigation } from '@/constants/navigation';
import { AvatarWrapper as Avatar } from '@/components/AvatarWrapper';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FieldGroup, Field, FieldLabel } from '@/components/ui/field';
import { profileAPI } from '@/lib/api';
import { Camera, Mail, Shield } from 'lucide-react';
import { toast } from '@/components/ui/toast';

const ProfileAdmin = () => {
  useDocumentTitle('Profil Admin');
  const { user, updateUser } = useAuth();
  const [coverImage, setCoverImage] = useState(null);
  const [profileImage, setProfileImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [formValues, setFormValues] = useState({
    email: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setFormValues({
        email: user.email || '',
      });
      setCoverImage(user.cover_picture || null);
      setProfileImage(user.profile_picture || null);
    }
  }, [user]);

  const getUserName = () => {
    return user?.email?.split('@')[0] || 'Admin';
  };

  const handleCoverUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('cover', file);

    setUploading(true);
    try {
      const { data } = await profileAPI.uploadAssets(formData);
      if (data.user) {
        const updatedUser = { ...user, ...data.user };
        updateUser(updatedUser);
        setCoverImage(data.user.cover_picture || null);
        toast.success('Photo de couverture mise à jour');
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erreur lors du téléversement');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleProfileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('profile', file);

    setUploading(true);
    try {
      const { data } = await profileAPI.uploadAssets(formData);
      if (data.user) {
        const updatedUser = { ...user, ...data.user };
        updateUser(updatedUser);
        setProfileImage(data.user.profile_picture || null);
        toast.success('Photo de profil mise à jour');
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erreur lors du téléversement');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await profileAPI.updateEmail({ email: formValues.email });
      updateUser({ ...user, ...data.user });
      toast.success('Profil mis à jour');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erreur lors de la mise à jour');
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout
      title="Mon profil"
      description="Gérez les informations de votre compte administrateur"
      menuItems={adminNavigation}
      getRoleLabel={() => 'Administrateur'}
    >
      <section className="w-full space-y-6">
        <div className="relative">
          <div className="h-48 bg-gradient-to-r from-primary to-primary/60 rounded-t-lg overflow-hidden">
            {(coverImage || user?.cover_picture) && (
              <img src={coverImage || user?.cover_picture} alt="Couverture" className="w-full h-full object-cover" />
            )}
            <label className="absolute bottom-4 right-4 cursor-pointer">
              <input type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
              <div className="bg-card/90 hover:bg-card p-2 rounded-lg flex items-center gap-2 text-sm">
                <Camera className="h-4 w-4" />
                <span>Modifier la couverture</span>
              </div>
            </label>
          </div>

          <Card className="relative -mt-16 border-t-0 rounded-t-none">
            <CardContent className="pt-20 pb-6">
              <div className="absolute top-6 left-6">
                <div className="relative">
                  <Avatar
                    src={profileImage || user?.profile?.profile_picture || user?.profile_picture}
                    alt={getUserName()}
                    size="xl"
                    className="border-4 border-card"
                  />
                  <label className="absolute bottom-0 right-0 cursor-pointer">
                    <input type="file" accept="image/*" className="hidden" onChange={handleProfileUpload} />
                    <div className="bg-primary hover:bg-primary/90 text-primary-foreground p-2 rounded-full">
                      <Camera className="h-4 w-4" />
                    </div>
                  </label>
                </div>
              </div>

              <div className="ml-32 space-y-1">
                <h2 className="text-2xl font-bold text-foreground">{getUserName()}</h2>
                <p className="text-muted-foreground flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Administrateur
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card as="form" onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Informations du compte</CardTitle>
          </CardHeader>
          <CardContent>
            <FieldGroup className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Field>
                <FieldLabel htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  Email
                </FieldLabel>
                <Input
                  id="email"
                  type="email"
                  value={formValues.email}
                  onChange={(e) => setFormValues((prev) => ({ ...prev, email: e.target.value }))}
                  required
                />
              </Field>

              <Field>
                <FieldLabel className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  Rôle
                </FieldLabel>
                <Input value="Administrateur" disabled readOnly />
              </Field>

              <Field>
                <FieldLabel>Statut</FieldLabel>
                <Input value={user?.verified ? '✅ Vérifié' : '⏳ En attente'} disabled readOnly />
              </Field>

              <Field>
                <FieldLabel>Membre depuis</FieldLabel>
                <Input
                  value={user?.created_at ? new Date(user.created_at).toLocaleDateString('fr-FR') : '-'}
                  disabled
                  readOnly
                />
              </Field>
            </FieldGroup>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button type="submit" disabled={saving || uploading}>
              {saving || uploading ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </CardFooter>
        </Card>
      </section>
    </DashboardLayout>
  );
};

export default ProfileAdmin;
