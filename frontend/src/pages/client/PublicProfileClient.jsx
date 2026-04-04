import { useAuth } from '@/context/AuthContext';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { clientNavigation } from '@/constants/navigation';
import { AvatarWrapper as Avatar, getUserInitials } from '@/components/AvatarWrapper';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, MapPin, Phone, Mail, ClipboardList, Users, Clock, Star, CreditCard, Briefcase, FileText, Eye, EyeOff, Download } from 'lucide-react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import verifiedIcon from '@/images/2.png';
import unverifiedIcon from '@/images/1.png';
import api from '@/lib/api';

const DetailItem = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-3">
    <div className="mt-1 rounded-full bg-primary/10 p-2 text-primary">
      <Icon className="h-4 w-4" />
    </div>
    <div>
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-sm font-medium text-foreground">{value || 'Non renseigné'}</p>
    </div>
  </div>
);

const SensitiveInfo = ({ icon: Icon, label, value, isVisible, onToggle, maskFn }) => (
  <div className="flex items-start gap-3">
    <div className="mt-1 rounded-full bg-primary/10 p-2 text-primary">
      <Icon className="h-4 w-4" />
    </div>
    <div className="flex-1">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="flex items-center gap-2">
        <p className="text-sm font-medium text-foreground">
          {isVisible ? (value || 'Non renseigné') : maskFn(value)}
        </p>
        <button
          onClick={onToggle}
          className="p-1 hover:bg-muted rounded transition-colors"
          aria-label={isVisible ? 'Masquer' : 'Afficher'}
        >
          {isVisible ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
        </button>
      </div>
    </div>
  </div>
);

const Tag = ({ children }) => (
  <span className="inline-flex items-center rounded-full border border-border bg-muted/60 px-3 py-1 text-xs font-medium text-muted-foreground">
    {children}
  </span>
);

const PublicProfileClient = () => {
  useDocumentTitle('Profil Public');
  const { user } = useAuth();
  const { name } = useParams();
  const navigate = useNavigate();
  const [publicProfile, setPublicProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPhone, setShowPhone] = useState(false);
  const [showEmail, setShowEmail] = useState(false);

  // Si on a un nom d'entreprise dans l'URL, charger le profil public
  // Sinon utiliser le profil de l'utilisateur connecté
  const isPublicView = !!name;
  const profile = (isPublicView ? publicProfile?.profile : user?.profile) || {};
  const profileUser = isPublicView ? publicProfile?.user : user;

  // Helper pour construire l'URL complète de l'image
  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http')) return imagePath;
    return `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${imagePath}`;
  };

  // Parse work_areas si c'est une string JSON
  const workAreas = profile.work_areas
    ? (typeof profile.work_areas === 'string' ? JSON.parse(profile.work_areas) : profile.work_areas)
    : [];

  const maskValue = (value) => {
    if (!value) return 'Non renseigné';
    const str = String(value);
    if (str.length <= 4) return '****';
    return str.slice(0, 2) + '*'.repeat(str.length - 4) + str.slice(-2);
  };

  // Charger le profil public si nécessaire
  useEffect(() => {
    const loadPublicProfile = async () => {
      if (!isPublicView) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await api.get(`/users/public/client/${encodeURIComponent(name)}`);
        setPublicProfile(response.data);
      } catch (err) {
        console.error('Erreur chargement profil public:', err);
        setError(err.response?.status === 404 ? 'Profil non trouvé' : 'Erreur de chargement');
      } finally {
        setLoading(false);
      }
    };

    loadPublicProfile();
  }, [name, isPublicView]);

  const generatePDF = () => {
    const displayNameValue = profile.company_name || (isPublicView ? 'Entreprise' : user?.email?.split('@')[0] || 'Client');
    const originalTitle = document.title;
    const fileName = `nettmobfrance-client-${displayNameValue.replace(/\s+/g, '-').toLowerCase()}`;
    document.title = fileName;

    // Masquer les infos sensibles avant l'impression
    setShowPhone(false);
    setShowEmail(false);

    // Styles pour l'impression
    const style = document.createElement('style');
    style.textContent = `
      @media print {
        button, .no-print, nav, header { display: none !important; }
        body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
        .card { page-break-inside: avoid; }
        * { color-adjust: exact; -webkit-print-color-adjust: exact; }
      }
    `;
    document.head.appendChild(style);

    setTimeout(() => {
      window.print();

      // Restaurer le titre original
      setTimeout(() => {
        document.title = originalTitle;
        document.head.removeChild(style);
      }, 100);
    }, 100);
  };

  if (loading) {
    return (
      <DashboardLayout
        title="Profil public"
        description="Chargement..."
        menuItems={clientNavigation}
        getRoleLabel={() => 'Entreprise'}
        getDisplayName={() => 'Chargement...'}
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Chargement du profil...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout
        title="Profil public"
        description="Erreur"
        menuItems={clientNavigation}
        getRoleLabel={() => 'Entreprise'}
        getDisplayName={() => 'Erreur'}
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <p className="text-lg font-semibold text-destructive mb-2">{error}</p>
            <Button onClick={() => navigate('/client/dashboard')}>Retour au dashboard</Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const displayName = profile.company_name || (isPublicView ? 'Entreprise' : user?.email?.split('@')[0] || 'Client');
  const contactName = profile.first_name && profile.last_name
    ? `${profile.first_name} ${profile.last_name}`
    : null;

  const focusTags = [
    profile.city && `Basée à ${profile.city}`,
    profile.secteur_name && `Secteur: ${profile.secteur_name}`,
  ].filter(Boolean);

  return (
    <DashboardLayout
      title="Profil public"
      description="Présentez votre entreprise aux auto-mobs"
      menuItems={clientNavigation}
      getRoleLabel={() => profile.company_name || 'Entreprise'}
      getDisplayName={() => displayName}
      getAvatarSrc={() => getImageUrl(profile.profile_picture)}
    >
      <section className="max-w-5xl mx-auto space-y-6">
        <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-purple-500 via-purple-600 to-purple-800">
          <div className="absolute inset-0 bg-black/20" />
          <div className="relative flex flex-col gap-6 px-8 py-10 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-6">
              <Avatar src={getImageUrl(profile.profile_picture)} alt={displayName} initials={getUserInitials(profileUser)} size="xl" className="border-4 border-white/90 shadow-2xl" />
              <div className="text-white">
                <div className="flex items-center gap-2">
                  <p className="text-sm uppercase tracking-widest text-white/80">Entreprise</p>
                  <img
                    src={profile.id_verified ? verifiedIcon : unverifiedIcon}
                    alt={profile.id_verified ? 'Vérifié' : 'Non vérifié'}
                    className="h-4 w-4"
                    title={profile.id_verified ? 'Profil vérifié' : 'Profil non vérifié'}
                  />
                </div>
                <h1 className="text-3xl font-bold md:text-4xl">{displayName}</h1>
                <p className="mt-2 max-w-lg text-white/80">
                  {profile.bio || "Entreprise à la recherche de talents flexibles pour renforcer ses équipes sur des missions ponctuelles ou régulières."}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {focusTags.length > 0 ? focusTags.map((tag) => <Tag key={tag}>{tag}</Tag>) : <Tag>Profil à compléter</Tag>}
                </div>
              </div>
            </div>
            <Button
              variant="secondary"
              className="bg-white text-primary hover:bg-white/90"
              onClick={generatePDF}
            >
              <Download className="h-4 w-4 mr-2" />
              Télécharger la fiche entreprise
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-[2fr,1fr]">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-primary" />
                Présentation de l'entreprise
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <h2 className="text-sm font-semibold uppercase text-muted-foreground">À propos</h2>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {profile.company_description || profile.description || (
                    <>Nous accompagnons nos clients avec des missions variées et recherchons des profils motivés, disponibles et professionnels.</>
                  )}
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <DetailItem icon={Building2} label="Nom de l'entreprise" value={profile.company_name} />
                <DetailItem icon={CreditCard} label="SIRET" value={profile.siret} />
                <DetailItem icon={MapPin} label="Adresse" value={profile.address} />
                <DetailItem icon={MapPin} label="Ville" value={profile.city} />
                <DetailItem icon={Briefcase} label="Secteur d'activité" value={profile.secteur_name} />
              </div>

              {profile.competences && profile.competences.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-sm font-semibold uppercase text-muted-foreground mb-2">Profils recherchés</h3>
                  <div className="flex flex-wrap gap-2">
                    {profile.competences.map((comp) => (
                      <span key={comp.id} className="inline-flex items-center rounded-full bg-purple-100 dark:bg-purple-900/30 px-3 py-1 text-xs font-medium text-purple-700 dark:text-purple-300">
                        {comp.nom}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {workAreas && workAreas.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-sm font-semibold uppercase text-muted-foreground mb-2">Villes de missions</h3>
                  <div className="flex flex-wrap gap-2">
                    {workAreas.map((area, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                        <MapPin className="h-3 w-3" />
                        {area}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Statistiques
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <DetailItem icon={ClipboardList} label="Missions publiées" value="0" />
                <DetailItem icon={Users} label="Collaborateurs actifs" value="0" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Contact</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {contactName && <DetailItem icon={Building2} label="Contact principal" value={contactName} />}
                <SensitiveInfo
                  icon={Phone}
                  label="Téléphone"
                  value={profile.phone}
                  isVisible={showPhone}
                  onToggle={() => setShowPhone(!showPhone)}
                  maskFn={maskValue}
                />
                <SensitiveInfo
                  icon={Mail}
                  label="Email"
                  value={profileUser?.email}
                  isVisible={showEmail}
                  onToggle={() => setShowEmail(!showEmail)}
                  maskFn={maskValue}
                />
              </CardContent>
            </Card>
          </div>
        </div>

      </section>
    </DashboardLayout>
  );
};

export default PublicProfileClient;
