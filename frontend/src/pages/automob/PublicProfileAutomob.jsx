import { useAuth } from '@/context/AuthContext';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { automobNavigation } from '@/constants/navigation';
import { AvatarWrapper as Avatar, getUserInitials } from '@/components/AvatarWrapper';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Phone, Mail, Clock, Award, Star, Briefcase, Building, Calendar, User, FileText, File, ClipboardList, CheckCircle, Eye, EyeOff, Download } from 'lucide-react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useParams, useNavigate } from 'react-router-dom';
import verifiedIcon from '@/images/2.png';
import unverifiedIcon from '@/images/1.png';
import api from '@/lib/api';
import { useEffect, useState } from 'react';

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

const PublicProfileAutomob = () => {
  useDocumentTitle('Profil Public');
  const { user } = useAuth();
  const { name } = useParams();
  const navigate = useNavigate();
  const [publicProfile, setPublicProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPhone, setShowPhone] = useState(false);
  const [showEmail, setShowEmail] = useState(false);

  // Si on a un nom dans l'URL, charger le profil public
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

  const maskValue = (value) => {
    if (!value) return 'Non renseigné';
    const str = String(value);
    if (str.length <= 4) return '****';
    return str.slice(0, 2) + '*'.repeat(str.length - 4) + str.slice(-2);
  };

  const generatePDF = () => {
    const originalTitle = document.title;
    const fileName = `nettmobfrance-automob-${fullName.replace(/\s+/g, '-').toLowerCase()}`;
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

  // Charger le profil public si nécessaire
  useEffect(() => {
    const loadPublicProfile = async () => {
      if (!isPublicView) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await api.get(`/users/public/automob/${encodeURIComponent(name)}`);
        setPublicProfile(response.data);
      } catch (err) {
        console.error('Erreur chargement profil public automob:', err);
        setError(err.response?.status === 404 ? 'Profil non trouvé' : 'Erreur de chargement');
      } finally {
        setLoading(false);
      }
    };

    loadPublicProfile();
  }, [name, isPublicView]);

  if (loading) {
    return (
      <DashboardLayout
        title="Profil public"
        description="Chargement..."
        menuItems={automobNavigation}
        getRoleLabel={() => 'Auto-entrepreneur'}
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
        menuItems={automobNavigation}
        getRoleLabel={() => 'Auto-entrepreneur'}
        getDisplayName={() => 'Erreur'}
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <p className="text-lg font-semibold text-destructive mb-2">{error}</p>
            <Button onClick={() => navigate('/automob/dashboard')}>Retour au dashboard</Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const fullName = profile.first_name && profile.last_name
    ? `${profile.first_name} ${profile.last_name}`
    : profileUser?.email?.split('@')[0] || 'Auto-entrepreneur';

  const expertiseTags = [
    profile.vehicle_type && `Véhicule: ${profile.vehicle_type}`,
    profile.experience && `Expérience: ${profile.experience}`,
    profile.city && `Basé à ${profile.city}`,
  ].filter(Boolean);

  return (
    <DashboardLayout
      title="Profil public"
      description="Partagez votre expertise avec les entreprises"
      menuItems={automobNavigation}
      getRoleLabel={() => 'Auto-entrepreneur'}
      getDisplayName={() => fullName}
      getAvatarSrc={() => getImageUrl(profile.profile_picture)}
    >
      <section className="max-w-5xl mx-auto space-y-6">
        <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-blue-500 via-blue-600 to-blue-800">
          <div className="absolute inset-0 bg-black/30" />
          <div className="relative flex flex-col gap-6 px-8 py-10 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-6">
              <Avatar src={getImageUrl(profile.profile_picture)} alt={fullName} initials={getUserInitials(profileUser)} size="xl" className="border-4 border-white/90 shadow-2xl" />
              <div className="text-white">
                <div className="flex items-center gap-2">
                  <p className="text-sm uppercase tracking-widest text-white/80">Auto-entrepreneur</p>
                  <img
                    src={profileUser?.id_verified ? verifiedIcon : unverifiedIcon}
                    alt={profileUser?.id_verified ? 'Vérifié' : 'Non vérifié'}
                    className="h-4 w-4"
                    title={profileUser?.id_verified ? 'Profil vérifié' : 'Profil non vérifié'}
                  />
                </div>
                <h1 className="text-3xl font-bold md:text-4xl">{fullName}</h1>
                <p className="mt-2 max-w-lg text-white/80">
                  {profile.experience || "Professionnel disponible pour vos missions dans toute la région."}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {expertiseTags.length > 0 ? expertiseTags.map((tag) => <Tag key={tag}>{tag}</Tag>) : <Tag>Profil à compléter</Tag>}
                </div>
              </div>
            </div>
            <Button
              variant="secondary"
              className="bg-white text-primary hover:bg-white/90"
              onClick={generatePDF}
            >
              <Download className="h-4 w-4 mr-2" />
              Télécharger le profil
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-[2fr,1fr]">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-primary" />
                Présentation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h2 className="text-sm font-semibold uppercase text-muted-foreground">À propos</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {profile.about_me || (
                    <>Auto-entrepreneur motivé et flexible, je me déplace facilement pour répondre à vos besoins. N'hésitez pas à me contacter pour discuter de vos projets.</>
                  )}
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <DetailItem icon={User} label="Genre" value={profile.gender || 'Non renseigné'} />
                <DetailItem icon={Building} label="SIRET" value={profile.siret} />
                <DetailItem icon={MapPin} label="Adresse" value={profile.address} />
                <DetailItem icon={MapPin} label="Ville" value={profile.city} />
                <DetailItem icon={Briefcase} label="Poste actuel" value={profile.current_position} />
                <DetailItem icon={Award} label="Expérience" value={profile.experience} />
                <DetailItem icon={Award} label="Années d'expertise" value={profile.years_of_experience} />
              </div>

              {profile.about_me && (
                <div className="mt-4">
                  <h3 className="text-sm font-semibold uppercase text-muted-foreground mb-2">À propos de moi</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{profile.about_me}</p>
                </div>
              )}

              {profile.work_areas && profile.work_areas.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-sm font-semibold uppercase text-muted-foreground mb-2">Zones de travail</h3>
                  <div className="flex flex-wrap gap-2">
                    {(typeof profile.work_areas === 'string' ? JSON.parse(profile.work_areas) : profile.work_areas).map((area, index) => (
                      <span key={index} className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                        <MapPin className="h-3 w-3 mr-1" />
                        {area}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {profile.competences && profile.competences.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-sm font-semibold uppercase text-muted-foreground mb-2">Compétences</h3>
                  <div className="flex flex-wrap gap-2">
                    {profile.competences.map((comp) => (
                      <span key={comp.id} className="inline-flex items-center rounded-full bg-green-100 dark:bg-green-900/30 px-3 py-1 text-xs font-medium text-green-700 dark:text-green-300">
                        {comp.nom}
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
                  <ClipboardList className="h-5 w-5 text-primary" />
                  Statistiques
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <DetailItem icon={CheckCircle} label="Missions réalisées" value="0" />
                <DetailItem icon={Star} label="Note moyenne" value="—" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Contact</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
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

                {profile.availabilities && profile.availabilities.length > 0 && (
                  <div className="mt-4">
                    <h3 className="text-sm font-semibold uppercase text-muted-foreground mb-2">Disponibilités</h3>
                    <div className="space-y-2">
                      {profile.availabilities.map((avail, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-primary" />
                          <span>
                            {new Date(avail.start_date).toLocaleDateString('fr-FR')} - {new Date(avail.end_date).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Expériences professionnelles */}
        {profile.experiences && profile.experiences.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-primary" />
                Expériences professionnelles
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {profile.experiences.map((exp, index) => (
                <div key={index} className="border-l-2 border-primary/30 pl-4 py-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-foreground">{exp.job_title}</h3>
                    {(exp.is_current === 1 || exp.is_current === true) && (
                      <span className="inline-flex items-center rounded-full bg-green-100 dark:bg-green-900/30 px-2 py-0.5 text-xs font-medium text-green-700 dark:text-green-300">
                        Actuel
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{exp.company_name}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(exp.start_date).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })} - {exp.is_current === 1 || exp.is_current === true ? "Aujourd'hui" : new Date(exp.end_date).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                  </p>
                  {exp.description && (
                    <p className="text-sm text-muted-foreground mt-2 whitespace-pre-wrap">{exp.description}</p>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Documents et habilitations */}
        {profile.documents && profile.documents.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Documents et habilitations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2">
                {profile.documents.map((doc, index) => (
                  <a
                    key={index}
                    href={getImageUrl(doc.file_path)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 border border-border rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                  >
                    <div className="p-2 rounded-lg bg-primary/10">
                      <File className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{doc.name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                        <span className={doc.type === 'habilitation' ? 'text-green-600 dark:text-green-400' : 'text-blue-600 dark:text-blue-400'}>
                          {doc.type === 'habilitation' ? 'Habilitation' : 'Document'}
                        </span>
                        <span>•</span>
                        <span>{new Date(doc.uploaded_at).toLocaleDateString('fr-FR')}</span>
                      </div>
                    </div>
                    <Eye className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  </a>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </section>
    </DashboardLayout>
  );
};

export default PublicProfileAutomob;
