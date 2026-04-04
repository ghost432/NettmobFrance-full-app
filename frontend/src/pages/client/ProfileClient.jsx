import { useEffect, useMemo, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { clientNavigation } from '@/constants/navigation';
import { AvatarWrapper as Avatar, getUserInitials } from '@/components/AvatarWrapper';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { InputWithIcon } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FieldGroup, Field, FieldLabel } from '@/components/ui/field';
import { profileAPI, authAPI } from '@/lib/api';
import { Camera, Mail, Phone, MapPin, Building2, Briefcase, User, CreditCard, Users, FileText, Plus, X } from 'lucide-react';
import { toast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { ProfileCompletionCard } from '@/components/ProfileCompletionCard';

const ProfileClient = () => {
  useDocumentTitle('Profil Client');
  const { user, updateUser } = useAuth();

  // Helper pour construire l'URL complète de l'image
  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http')) return imagePath;
    return `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${imagePath}`;
  };
  const [coverImage, setCoverImage] = useState(null);
  const [profileImage, setProfileImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formValues, setFormValues] = useState({
    company_name: '',
    first_name: '',
    last_name: '',
    manager_position: '',
    phone: '',
    address: '',
    city: '',
    siret: '',
    secteur_id: '',
    company_description: '',
    work_areas: [],
  });
  const [secteurs, setSecteurs] = useState([]);
  const [competences, setCompetences] = useState([]);
  const [selectedCompetences, setSelectedCompetences] = useState([]);
  const [workAreas, setWorkAreas] = useState([]);
  const [newWorkArea, setNewWorkArea] = useState('');
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  const sections = useMemo(
    () => [
      { id: 'personal-info', title: 'Informations personnelles' },
      { id: 'company-info', title: "Informations d'entreprise" },
    ],
    []
  );

  const [searchParams, setSearchParams] = useSearchParams();
  const [activeSection, setActiveSection] = useState(sections[0].id);
  const lastSavedRef = useRef('');
  const debounceRef = useRef(null);

  // Gérer la section depuis l'URL avec auto-sauvegarde
  useEffect(() => {
    // ⚠️ CRITIQUE : Ne PAS sauvegarder pendant le chargement initial !
    if (isLoadingProfile) {
      console.log('⏳ [URL Navigation] Profil en chargement, navigation bloquée');
      return;
    }

    const sectionParam = searchParams.get('section');
    if (!sectionParam) return;
    const validSection = sections.find(s => s.id === sectionParam);
    if (!validSection) return;
    if (validSection.id === activeSection) return;

    const autoSaveAndSwitch = async () => {
      try {
        setSaving(true);
        console.log('💾 [URL Navigation] Sauvegarde avant changement de section');
        const payload = {
          ...formValues,
          profils_recherches: JSON.stringify(selectedCompetences),
          work_areas: JSON.stringify(workAreas),
        };

        const { data } = await profileAPI.updateClientProfile(payload);
        if (data.profile) {
          const updatedUser = {
            ...user,
            profile: data.profile,
            profile_picture: data.profile?.profile_picture ?? user?.profile_picture ?? null,
            cover_picture: data.profile?.cover_picture ?? user?.cover_picture ?? null,
          };
          updateUser(updatedUser);

          // Sync local state
          setFormValues({
            company_name: data.profile.company_name || '',
            first_name: data.profile.first_name || '',
            last_name: data.profile.last_name || '',
            manager_position: data.profile.manager_position || '',
            phone: data.profile.phone || '',
            address: data.profile.address || '',
            siret: data.profile.siret || '',
            secteur_id: data.profile.secteur_id || '',
            company_description: data.profile.company_description || '',
            work_areas: data.profile.work_areas
              ? (typeof data.profile.work_areas === 'string' ? JSON.parse(data.profile.work_areas) : data.profile.work_areas)
              : [],
          });

          if (data.profile.competence_ids && Array.isArray(data.profile.competence_ids)) {
            setSelectedCompetences(data.profile.competence_ids);
          }

          const areas = data.profile.work_areas
            ? (typeof data.profile.work_areas === 'string' ? JSON.parse(data.profile.work_areas) : data.profile.work_areas)
            : [];
          setWorkAreas(Array.isArray(areas) ? areas : []);
        }
      } catch (e) {
        console.error('Erreur auto-sauvegarde (URL client):', e);
      } finally {
        setSaving(false);
        setActiveSection(validSection.id);
      }
    };

    autoSaveAndSwitch();
  }, [searchParams, sections, isLoadingProfile, activeSection]);

  // Auto-sauvegarde (debounced) lors des changements de formulaire
  useEffect(() => {
    // ⚠️ CRITIQUE : Ne PAS autosave si le profil est en cours de chargement
    // Sinon, on écrase les données de la BD avec des valeurs vides !
    if (isLoadingProfile) {
      console.log('⏳ [Auto-save] Profil en chargement, autosave bloqué');
      return;
    }

    const payload = {
      ...formValues,
      profils_recherches: JSON.stringify(selectedCompetences),
      work_areas: JSON.stringify(workAreas),
    };
    const serialized = JSON.stringify(payload);

    // Si c'est le premier rendu après chargement, initialiser la référence
    if (lastSavedRef.current === '') {
      console.log('📝 [Auto-save] Initialisation de la référence avec les données chargées');
      lastSavedRef.current = serialized;
      return;
    }

    if (serialized === lastSavedRef.current) return;

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(async () => {
      try {
        const { data } = await profileAPI.updateClientProfile(payload);
        lastSavedRef.current = serialized;
        if (data?.profile) {
          const updatedUser = {
            ...user,
            profile: data.profile,
            profile_picture: data.profile?.profile_picture ?? user?.profile_picture ?? null,
            cover_picture: data.profile?.cover_picture ?? user?.cover_picture ?? null,
          };
          updateUser(updatedUser);
        }
      } catch (e) {
        console.warn('Auto-save profil client échoué (ignoré):', e?.message || e);
      }
    }, 800);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [formValues, selectedCompetences, workAreas, isLoadingProfile]);

  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoadingProfile(true);
      await Promise.all([
        fetchSecteurs(),
        fetchCompetences(),
        fetchProfile()
      ]);
      setIsLoadingProfile(false);
    };
    loadInitialData();
  }, []);

  // Ne pas réinitialiser automatiquement depuis user.profile car cela peut écraser les données
  // La fonction fetchProfile() gère déjà le chargement initial et la synchronisation
  useEffect(() => {
    // Mettre à jour uniquement les images si elles changent
    if (user?.profile) {
      const newCoverUrl = getImageUrl(user?.profile?.cover_picture || user?.cover_picture);
      const newProfileUrl = getImageUrl(user?.profile?.profile_picture || user?.profile_picture);

      if (newCoverUrl !== coverImage) {
        setCoverImage(newCoverUrl);
      }
      if (newProfileUrl !== profileImage) {
        setProfileImage(newProfileUrl);
      }
    }
  }, [user?.profile?.cover_picture, user?.cover_picture, user?.profile?.profile_picture, user?.profile_picture]);

  const fetchSecteurs = async () => {
    try {
      const response = await profileAPI.getSecteurs();
      setSecteurs(response.data || []);
    } catch (err) {
      console.error('Erreur chargement secteurs:', err);
    }
  };

  const fetchCompetences = async () => {
    try {
      const response = await profileAPI.getCompetences();
      setCompetences(response.data || []);
    } catch (err) {
      console.error('Erreur chargement compétences:', err);
    }
  };

  const fetchProfile = async () => {
    try {
      const { data } = await authAPI.getProfile();
      if (data.profile) {
        // Mettre à jour le user dans AuthContext avec le profil complet
        const updatedUser = {
          ...user,
          profile: data.profile,
          profile_picture: data.profile?.profile_picture ?? user?.profile_picture ?? null,
          cover_picture: data.profile?.cover_picture ?? user?.cover_picture ?? null,
        };
        updateUser(updatedUser);

        // Mettre à jour les états locaux avec les données du profil
        setFormValues({
          company_name: data.profile.company_name || '',
          first_name: data.profile.first_name || '',
          last_name: data.profile.last_name || '',
          manager_position: data.profile.manager_position || '',
          phone: data.profile.phone || '',
          address: data.profile.address || '',
          city: data.profile.city || '',
          siret: data.profile.siret || '',
          secteur_id: data.profile.secteur_id || '',
          company_description: data.profile.company_description || '',
          work_areas: data.profile.work_areas
            ? (typeof data.profile.work_areas === 'string' ? JSON.parse(data.profile.work_areas) : data.profile.work_areas)
            : [],
        });

        // Charger les compétences sélectionnées (profils recherchés)
        if (data.profile.competence_ids && Array.isArray(data.profile.competence_ids)) {
          setSelectedCompetences(data.profile.competence_ids);
        }

        // Charger les zones de travail
        const areas = data.profile.work_areas
          ? (typeof data.profile.work_areas === 'string' ? JSON.parse(data.profile.work_areas) : data.profile.work_areas)
          : [];
        setWorkAreas(Array.isArray(areas) ? areas : []);

        // Mettre à jour les images
        setCoverImage(getImageUrl(data.profile?.cover_picture || user?.cover_picture));
        setProfileImage(getImageUrl(data.profile?.profile_picture || user?.profile_picture));
      }
    } catch (err) {
      console.error('Erreur chargement profil client complet:', err);
    }
  };

  const handleSectionSelect = async (sectionId) => {
    // Si on change de section, sauvegarder les données actuelles d'abord
    if (activeSection !== sectionId && !saving) {
      try {
        setSaving(true);
        const payload = {
          ...formValues,
          profils_recherches: JSON.stringify(selectedCompetences),
          work_areas: JSON.stringify(workAreas),
        };

        const { data } = await profileAPI.updateClientProfile(payload);
        if (data.profile) {
          const updatedUser = {
            ...user,
            profile: data.profile,
            profile_picture: data.profile?.profile_picture ?? user?.profile_picture ?? null,
            cover_picture: data.profile?.cover_picture ?? user?.cover_picture ?? null,
          };
          updateUser(updatedUser);

          // Sync local state with the updated profile from backend
          setFormValues({
            company_name: data.profile.company_name || '',
            first_name: data.profile.first_name || '',
            last_name: data.profile.last_name || '',
            manager_position: data.profile.manager_position || '',
            phone: data.profile.phone || '',
            address: data.profile.address || '',
            siret: data.profile.siret || '',
            secteur_id: data.profile.secteur_id || '',
            company_description: data.profile.company_description || '',
            work_areas: data.profile.work_areas
              ? (typeof data.profile.work_areas === 'string' ? JSON.parse(data.profile.work_areas) : data.profile.work_areas)
              : [],
          });

          if (data.profile.competence_ids && Array.isArray(data.profile.competence_ids)) {
            setSelectedCompetences(data.profile.competence_ids);
          }

          const areas = data.profile.work_areas
            ? (typeof data.profile.work_areas === 'string' ? JSON.parse(data.profile.work_areas) : data.profile.work_areas)
            : [];
          setWorkAreas(Array.isArray(areas) ? areas : []);
          setNewWorkArea('');
        }
      } catch (error) {
        console.error('Erreur auto-sauvegarde:', error);
      } finally {
        setSaving(false);
      }
    }

    setActiveSection(sectionId);
    setSearchParams({ section: sectionId });
  };

  const getUserName = () => {
    return user?.profile?.company_name || user?.email?.split('@')[0] || 'Entreprise';
  };

  const getManagerName = () => {
    if (user?.profile?.first_name && user?.profile?.last_name) {
      return `${user.profile.first_name} ${user.profile.last_name}`;
    }
    return 'Gérant';
  };

  const handleCoverUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Afficher immédiatement l'image en local
    const localUrl = URL.createObjectURL(file);
    setCoverImage(localUrl);

    const formData = new FormData();
    formData.append('cover', file);

    setUploading(true);
    try {
      const { data } = await profileAPI.uploadAssets(formData);
      if (data.profile) {
        const updatedUser = {
          ...user,
          profile: {
            ...user.profile,
            ...data.profile,
          },
          profile_picture: data.profile.profile_picture || user?.profile_picture || null,
          cover_picture: data.profile.cover_picture || user?.cover_picture || null,
        };
        updateUser(updatedUser);

        // Utiliser getImageUrl pour construire l'URL correcte avec cache busting
        const serverUrl = getImageUrl(data.profile.cover_picture);
        const urlWithTimestamp = serverUrl ? `${serverUrl}?t=${Date.now()}` : serverUrl;
        setCoverImage(urlWithTimestamp);
        toast.success('Photo de couverture mise à jour');
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erreur lors du téléversement');
      setCoverImage(getImageUrl(user?.profile?.cover_picture || user?.cover_picture));
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleProfileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Afficher immédiatement l'image en local
    const localUrl = URL.createObjectURL(file);
    setProfileImage(localUrl);

    const formData = new FormData();
    formData.append('profile', file);

    setUploading(true);
    try {
      const { data } = await profileAPI.uploadAssets(formData);
      if (data.profile) {
        const updatedUser = {
          ...user,
          profile: {
            ...user.profile,
            ...data.profile,
          },
          profile_picture: data.profile.profile_picture || user?.profile_picture || null,
          cover_picture: data.profile.cover_picture || user?.cover_picture || null,
        };
        updateUser(updatedUser);

        // Utiliser getImageUrl pour construire l'URL correcte avec cache busting
        const serverUrl = getImageUrl(data.profile.profile_picture);
        const urlWithTimestamp = serverUrl ? `${serverUrl}?t=${Date.now()}` : serverUrl;
        setProfileImage(urlWithTimestamp);
        toast.success('Photo de profil mise à jour');
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erreur lors du téléversement');
      setProfileImage(getImageUrl(user?.profile?.profile_picture || user?.profile_picture));
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleAddWorkArea = () => {
    if (newWorkArea.trim()) {
      const updatedAreas = [...workAreas, newWorkArea.trim()];
      setWorkAreas(updatedAreas);
      setFormValues(prev => ({ ...prev, work_areas: updatedAreas }));
      setNewWorkArea('');
    }
  };

  const handleRemoveWorkArea = (index) => {
    const updatedAreas = workAreas.filter((_, i) => i !== index);
    setWorkAreas(updatedAreas);
    setFormValues(prev => ({ ...prev, work_areas: updatedAreas }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...formValues,
        profils_recherches: JSON.stringify(selectedCompetences),
        work_areas: JSON.stringify(workAreas),
      };

      const { data } = await profileAPI.updateClientProfile(payload);
      const updatedUser = {
        ...user,
        profile: data.profile,
        profile_picture: data.profile?.profile_picture ?? user?.profile_picture ?? null,
        cover_picture: data.profile?.cover_picture ?? user?.cover_picture ?? null,
      };
      updateUser(updatedUser);

      // Sync local state with the updated profile from backend
      if (data.profile) {
        setFormValues({
          company_name: data.profile.company_name || '',
          first_name: data.profile.first_name || '',
          last_name: data.profile.last_name || '',
          manager_position: data.profile.manager_position || '',
          phone: data.profile.phone || '',
          address: data.profile.address || '',
          city: data.profile.city || '',
          siret: data.profile.siret || '',
          secteur_id: data.profile.secteur_id || '',
          company_description: data.profile.company_description || '',
          work_areas: data.profile.work_areas
            ? (typeof data.profile.work_areas === 'string' ? JSON.parse(data.profile.work_areas) : data.profile.work_areas)
            : [],
        });

        if (data.profile.competence_ids && Array.isArray(data.profile.competence_ids)) {
          setSelectedCompetences(data.profile.competence_ids);
        }

        const areas = data.profile.work_areas
          ? (typeof data.profile.work_areas === 'string' ? JSON.parse(data.profile.work_areas) : data.profile.work_areas)
          : [];
        setWorkAreas(Array.isArray(areas) ? areas : []);
        setNewWorkArea('');
      }

      toast.success('Profil mis à jour');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erreur lors de la mise à jour');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field) => (e) => {
    setFormValues((prev) => ({ ...prev, [field]: e.target.value }));
  };

  return (
    <DashboardLayout
      title="Mon profil"
      description="Gérez les informations de votre entreprise"
      menuItems={clientNavigation}
      getRoleLabel={() => user?.profile?.company_name || 'Entreprise'}
      getDisplayName={() => getUserName()}
      getAvatarSrc={() => profileImage}
    >
      {isLoadingProfile ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-3">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
            <p className="text-sm text-muted-foreground">Chargement de votre profil...</p>
          </div>
        </div>
      ) : (
        <section className="mx-auto w-full max-w-6xl space-y-6 pb-6">
          <div className="relative">
            <div className="h-48 bg-gradient-to-r from-purple-500 to-purple-700 rounded-t-lg overflow-hidden">
              {coverImage && (
                <img src={coverImage} alt="Couverture" className="w-full h-full object-cover" />
              )}
              <label className="absolute bottom-4 right-4 cursor-pointer">
                <input type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
                <div className="bg-card/90 hover:bg-card p-2 rounded-lg flex items-center gap-2 text-sm">
                  <Camera className="h-4 w-4" />
                  <span>Modifier la couverture</span>
                </div>
              </label>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[260px,1fr]">
            <aside className="lg:sticky lg:top-24 lg:self-start lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto">
              <Card className="border border-border/80 bg-card/80 backdrop-blur">
                <CardHeader className="text-center">
                  <CardTitle className="text-base">Mon profil</CardTitle>
                  <CardDescription>{user?.profile?.company_name || 'Entreprise'}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-col items-center gap-3">
                    <div className="relative">
                      <Avatar
                        src={profileImage}
                        alt={getUserName()}
                        initials={getUserInitials(user)}
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
                    <div className="text-center">
                      <p className="text-lg font-semibold text-foreground">{getUserName()}</p>
                      <p className="text-sm text-muted-foreground">{user?.email}</p>
                    </div>
                  </div>

                  <div className="w-full space-y-1 border-t border-border pt-4">
                    <p className="text-xs font-medium uppercase text-muted-foreground">Sections</p>
                    {sections.map((section) => (
                      <button
                        key={section.id}
                        type="button"
                        onClick={() => handleSectionSelect(section.id)}
                        className={cn(
                          'w-full rounded-md px-3 py-2 text-left text-sm transition-colors',
                          activeSection === section.id
                            ? 'bg-primary text-primary-foreground shadow'
                            : 'hover:bg-accent'
                        )}
                      >
                        {section.title}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Carte de progression du profil */}
              <ProfileCompletionCard user={user} role="client" />
            </aside>

            <form onSubmit={handleSubmit} className="space-y-6">
              {activeSection === 'personal-info' && (
                <Card>
                  <CardHeader>
                    <CardTitle>Informations personnelles</CardTitle>
                    <CardDescription>Vos coordonnées principales issues de l'inscription.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <FieldGroup className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      <Field>
                        <FieldLabel htmlFor="first_name">Prénom du gérant</FieldLabel>
                        <InputWithIcon
                          id="first_name"
                          icon={User}
                          value={formValues.first_name}
                          onChange={handleInputChange('first_name')}
                          placeholder="Jean"
                        />
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="last_name">Nom du gérant</FieldLabel>
                        <InputWithIcon
                          id="last_name"
                          icon={User}
                          value={formValues.last_name}
                          onChange={handleInputChange('last_name')}
                          placeholder="Dupont"
                        />
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="manager_position">Poste du gérant</FieldLabel>
                        <InputWithIcon
                          id="manager_position"
                          icon={Briefcase}
                          value={formValues.manager_position}
                          onChange={handleInputChange('manager_position')}
                          placeholder="Directeur Général"
                        />
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="phone">Téléphone</FieldLabel>
                        <InputWithIcon
                          id="phone"
                          icon={Phone}
                          value={formValues.phone}
                          onChange={handleInputChange('phone')}
                          placeholder="+33 6 12 34 56 78"
                        />
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="email">Email</FieldLabel>
                        <InputWithIcon
                          id="email"
                          icon={Mail}
                          value={user?.email || ''}
                          readOnly
                          disabled
                        />
                      </Field>
                      <Field className="md:col-span-2">
                        <FieldLabel htmlFor="address">Adresse complète</FieldLabel>
                        <InputWithIcon
                          id="address"
                          icon={MapPin}
                          value={formValues.address}
                          onChange={handleInputChange('address')}
                          placeholder="12 rue de la Paix, 75002 Paris"
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
              )}

              {activeSection === 'company-info' && (
                <Card>
                  <CardHeader>
                    <CardTitle>Informations professionnelles</CardTitle>
                    <CardDescription>Décrivez votre entreprise et vos besoins en profils.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <FieldGroup className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      <Field className="md:col-span-2">
                        <FieldLabel htmlFor="company_name">Nom de l'entreprise</FieldLabel>
                        <InputWithIcon
                          id="company_name"
                          icon={Building2}
                          value={formValues.company_name}
                          onChange={handleInputChange('company_name')}
                          placeholder="Ma Société SARL"
                          required
                        />
                      </Field>
                      <Field className="md:col-span-2">
                        <FieldLabel htmlFor="siret">SIRET (14 chiffres)</FieldLabel>
                        <InputWithIcon
                          id="siret"
                          icon={CreditCard}
                          value={formValues.siret}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '');
                            setFormValues(prev => ({ ...prev, siret: value }));
                          }}
                          maxLength={14}
                          placeholder="12345678901234"
                        />
                      </Field>
                      <Field className="md:col-span-2">
                        <FieldLabel htmlFor="secteur_id" className="flex items-center gap-2">
                          <Briefcase className="h-4 w-4 text-muted-foreground" />
                          Secteur d'activité
                        </FieldLabel>
                        <select
                          id="secteur_id"
                          value={formValues.secteur_id}
                          onChange={handleInputChange('secteur_id')}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <option value="">Sélectionnez un secteur...</option>
                          {secteurs.map((secteur) => (
                            <option key={secteur.id} value={secteur.id}>{secteur.nom}</option>
                          ))}
                        </select>
                      </Field>
                      <Field className="md:col-span-2">
                        <FieldLabel htmlFor="company_description" className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          À propos de l'entreprise
                        </FieldLabel>
                        <textarea
                          id="company_description"
                          value={formValues.company_description}
                          onChange={handleInputChange('company_description')}
                          placeholder="Présentez votre entreprise, vos valeurs, votre activité..."
                          rows={4}
                          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                        />
                      </Field>
                      <Field className="md:col-span-2">
                        <FieldLabel htmlFor="work_areas">Villes pour vos missions</FieldLabel>
                        <div className="space-y-2">
                          <div className="flex gap-2">
                            <InputWithIcon
                              icon={MapPin}
                              type="text"
                              value={newWorkArea}
                              onChange={(e) => setNewWorkArea(e.target.value)}
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleAddWorkArea();
                                }
                              }}
                              placeholder="Ex: Paris, Lyon, Marseille..."
                            />
                            <Button
                              type="button"
                              onClick={handleAddWorkArea}
                              variant="outline"
                              size="icon"
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                          {workAreas.length > 0 && (
                            <div className="flex flex-wrap gap-2 p-3 border border-input rounded-md bg-background">
                              {workAreas.map((area, index) => (
                                <span
                                  key={index}
                                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-primary text-primary-foreground"
                                >
                                  <MapPin className="h-3 w-3" />
                                  {area}
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveWorkArea(index)}
                                    className="ml-1 hover:bg-primary-foreground/20 rounded-full p-0.5"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </Field>
                      <Field className="md:col-span-2">
                        <FieldLabel>Profils recherchés (compétences)</FieldLabel>
                        <div
                          className="flex flex-wrap gap-2 p-3 border border-input rounded-md bg-background max-h-[400px] overflow-y-auto"
                          style={{ scrollBehavior: 'auto' }}
                        >
                          {competences
                            .filter(comp => formValues.secteur_id ? comp.secteur_id === parseInt(formValues.secteur_id) : true)
                            .map((comp) => (
                              <label
                                key={comp.id}
                                className={cn(
                                  "inline-flex items-center px-3 py-1.5 rounded-full text-sm cursor-pointer transition-all select-none",
                                  selectedCompetences.includes(comp.id)
                                    ? "bg-primary text-primary-foreground shadow-sm"
                                    : "bg-muted hover:bg-muted/80 hover:shadow-sm"
                                )}
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  const isSelected = selectedCompetences.includes(comp.id);
                                  if (isSelected) {
                                    setSelectedCompetences(selectedCompetences.filter(id => id !== comp.id));
                                  } else {
                                    setSelectedCompetences([...selectedCompetences, comp.id]);
                                  }
                                }}
                              >
                                <input
                                  type="checkbox"
                                  checked={selectedCompetences.includes(comp.id)}
                                  onChange={() => { }}
                                  className="sr-only"
                                  tabIndex={-1}
                                />
                                {comp.nom}
                              </label>
                            ))}
                          {competences.filter(comp => formValues.secteur_id ? comp.secteur_id === parseInt(formValues.secteur_id) : true).length === 0 && (
                            <p className="text-sm text-muted-foreground py-4 w-full text-center">
                              {formValues.secteur_id ? 'Aucune compétence disponible pour ce secteur' : 'Sélectionnez un secteur pour voir les compétences'}
                            </p>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {selectedCompetences.length > 0
                            ? `${selectedCompetences.length} compétence(s) sélectionnée(s)`
                            : 'Sélectionnez un secteur pour filtrer les compétences disponibles'
                          }
                        </p>
                      </Field>
                    </FieldGroup>
                  </CardContent>
                  <CardFooter className="flex justify-end">
                    <Button type="submit" disabled={saving || uploading}>
                      {saving || uploading ? 'Enregistrement...' : 'Enregistrer'}
                    </Button>
                  </CardFooter>
                </Card>
              )}

            </form>
          </div>
        </section>
      )}
    </DashboardLayout>
  );
};

export default ProfileClient;
