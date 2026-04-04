import { useEffect, useMemo, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { automobNavigation } from '@/constants/navigation';
import { AvatarWrapper as Avatar, getUserInitials } from '@/components/AvatarWrapper';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input, InputWithIcon } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FieldGroup, Field, FieldLabel } from '@/components/ui/field';
import { profileAPI, documentsAPI, authAPI } from '@/lib/api';
import { Camera, Mail, Phone, MapPin, Briefcase, Award, DollarSign, Calendar, Plus, Trash2, User, Users, CreditCard, FileText, Building, Clock, Upload, File, X } from 'lucide-react';
import { toast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { ProfileCompletionCard } from '@/components/ProfileCompletionCard';

const ProfileAutomob = () => {
  useDocumentTitle('Profil');
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
    first_name: '',
    last_name: '',
    gender: '',
    phone: '',
    iban: '',
    bic_swift: '',
    address: '',
    city: '',
    siret: '',
    current_position: '',
    experience: '',
    years_of_experience: '',
    secteur_id: '',
    about_me: '',
    work_areas: [],
  });
  const [availabilityForm, setAvailabilityForm] = useState({
    start_date: '',
    end_date: '',
  });
  const [secteurs, setSecteurs] = useState([]);
  const [competences, setCompetences] = useState([]);
  const [selectedCompetences, setSelectedCompetences] = useState([]);
  const [availabilities, setAvailabilities] = useState([]);
  const [experiences, setExperiences] = useState([]);
  const [newWorkArea, setNewWorkArea] = useState('');
  const [newExperience, setNewExperience] = useState({
    job_title: '',
    company_name: '',
    start_date: '',
    end_date: '',
    is_current: false,
    description: '',
  });
  const [documents, setDocuments] = useState([]);
  const [showDocumentForm, setShowDocumentForm] = useState(false);
  const [newDocument, setNewDocument] = useState({
    name: '',
    type: 'document',
    has_expiry: false,
    file: null
  });
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  const experienceLevels = ['Je débute', 'J\'ai déjà réalisé quelques missions', 'J\'ai déjà plusieurs clients réguliers'];
  const yearsOfExperience = [
    { value: 'junior', label: 'Junior (0-2 ans)' },
    { value: 'intermediaire', label: 'Intermédiaire (3-5 ans)' },
    { value: 'senior', label: 'Senior (6-10 ans)' },
    { value: 'expert', label: 'Expert (10+ ans)' }
  ];

  const sections = useMemo(
    () => [
      { id: 'personal-info', title: 'Informations personnelles' },
      { id: 'professional-info', title: 'Informations professionnelles' },
      { id: 'experience', title: 'Expérience professionnelle' },
      { id: 'availability', title: 'Disponibilité' },
      { id: 'documents', title: 'Documents et habilitations' },
    ],
    []
  );

  const [searchParams, setSearchParams] = useSearchParams();
  const [activeSection, setActiveSection] = useState(sections[0].id);
  const lastSavedRef = useRef('');
  const debounceRef = useRef(null);

  // Gérer la section depuis l'URL
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
          competences: JSON.stringify(selectedCompetences),
          work_areas: JSON.stringify(formValues.work_areas),
          availabilities: JSON.stringify(availabilities),
          experiences: JSON.stringify(experiences),
        };

        const { data } = await profileAPI.updateAutomobProfile(payload);
        if (data.profile) {
          const updatedUser = {
            ...user,
            profile: data.profile,
            profile_picture: data.profile?.profile_picture ?? user?.profile_picture ?? null,
            cover_picture: data.profile?.cover_picture ?? user?.cover_picture ?? null,
          };
          updateUser(updatedUser);

          setFormValues({
            first_name: data.profile.first_name || '',
            last_name: data.profile.last_name || '',
            gender: data.profile.gender || '',
            phone: data.profile.phone || '',
            iban: data.profile.iban || '',
            bic_swift: data.profile.bic_swift || '',
            address: data.profile.address || '',
            city: data.profile.city || '',
            siret: data.profile.siret || '',
            current_position: data.profile.current_position || '',
            experience: data.profile.experience || '',
            years_of_experience: data.profile.years_of_experience || '',
            secteur_id: data.profile.secteur_id || '',
            about_me: data.profile.about_me || '',
            work_areas: data.profile.work_areas
              ? (typeof data.profile.work_areas === 'string' ? JSON.parse(data.profile.work_areas) : data.profile.work_areas)
              : [],
          });

          if (data.profile.competence_ids && Array.isArray(data.profile.competence_ids)) {
            setSelectedCompetences(data.profile.competence_ids);
          }
          if (data.profile.availabilities) {
            setAvailabilities(data.profile.availabilities);
          }
          if (data.profile.experiences) {
            setExperiences(data.profile.experiences);
          }
        }
      } catch (e) {
        console.error('Erreur auto-sauvegarde (URL):', e);
      } finally {
        setSaving(false);
        setActiveSection(validSection.id);
      }
    };

    autoSaveAndSwitch();
  }, [searchParams, sections, isLoadingProfile, activeSection]);

  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoadingProfile(true);
      await Promise.all([
        fetchSecteurs(),
        fetchCompetences(),
        fetchDocuments(),
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

  // Debounced auto-save when form data changes
  useEffect(() => {
    // ⚠️ CRITIQUE : Ne PAS autosave si le profil est en cours de chargement
    // Sinon, on écrase les données de la BD avec des valeurs vides !
    if (isLoadingProfile) {
      console.log('⏳ [Auto-save] Profil en chargement, autosave bloqué');
      return;
    }

    // Build payload and serialize to detect real changes
    const payload = {
      ...formValues,
      competences: JSON.stringify(selectedCompetences),
      work_areas: JSON.stringify(formValues.work_areas || []),
      availabilities: JSON.stringify(availabilities || []),
      experiences: JSON.stringify(experiences || []),
    };
    const serialized = JSON.stringify(payload);

    // Si c'est le premier rendu après chargement, initialiser la référence
    if (lastSavedRef.current === '') {
      console.log('📝 [Auto-save] Initialisation de la référence avec les données chargées');
      lastSavedRef.current = serialized;
      return;
    }

    if (serialized === lastSavedRef.current) {
      return; // Nothing new to save
    }

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(async () => {
      try {
        console.log('💾 [Auto-save] Sauvegarde en cours...');
        console.log('💾 [Auto-save] Compétences à sauvegarder:', selectedCompetences);
        console.log('💾 [Auto-save] Payload complet:', payload);
        const { data } = await profileAPI.updateAutomobProfile(payload);
        lastSavedRef.current = serialized;
        console.log('✅ [Auto-save] Sauvegarde réussie');
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
        console.warn('Auto-save profil automob échoué (ignoré):', e?.message || e);
      }
    }, 800);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [formValues, selectedCompetences, availabilities, experiences, isLoadingProfile]);

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
      console.log('🔍 [ProfileAutomob] Profil chargé:', data.profile);
      console.log('🔍 [ProfileAutomob] Compétences récupérées:', data.profile?.competence_ids);
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
          first_name: data.profile.first_name || '',
          last_name: data.profile.last_name || '',
          gender: data.profile.gender || '',
          phone: data.profile.phone || '',
          iban: data.profile.iban || '',
          bic_swift: data.profile.bic_swift || '',
          address: data.profile.address || '',
          city: data.profile.city || '',
          siret: data.profile.siret || '',
          current_position: data.profile.current_position || '',
          experience: data.profile.experience || '',
          years_of_experience: data.profile.years_of_experience || '',
          secteur_id: data.profile.secteur_id || '',
          about_me: data.profile.about_me || '',
          work_areas: data.profile.work_areas
            ? (typeof data.profile.work_areas === 'string' ? JSON.parse(data.profile.work_areas) : data.profile.work_areas)
            : [],
        });

        // Charger les compétences sélectionnées
        if (data.profile.competence_ids && Array.isArray(data.profile.competence_ids)) {
          console.log('✅ [ProfileAutomob] Chargement des compétences:', data.profile.competence_ids);
          setSelectedCompetences(data.profile.competence_ids);
        } else {
          console.warn('⚠️ [ProfileAutomob] Aucune compétence trouvée dans le profil');
        }

        // Charger les disponibilités
        if (data.profile.availabilities) {
          setAvailabilities(data.profile.availabilities);
        }

        // Charger les expériences professionnelles
        if (data.profile.experiences) {
          setExperiences(data.profile.experiences);
        }

        // Mettre à jour les images
        setCoverImage(getImageUrl(data.profile?.cover_picture || user?.cover_picture));
        setProfileImage(getImageUrl(data.profile?.profile_picture || user?.profile_picture));
      }
    } catch (err) {
      console.error('Erreur chargement profil complet:', err);
    }
  };

  const handleSectionSelect = async (sectionId) => {
    // Si on change de section, sauvegarder les données actuelles d'abord
    if (activeSection !== sectionId && !saving) {
      try {
        setSaving(true);
        const payload = {
          ...formValues,
          competences: JSON.stringify(selectedCompetences),
          work_areas: JSON.stringify(formValues.work_areas),
          availabilities: JSON.stringify(availabilities),
          experiences: JSON.stringify(experiences),
        };

        const { data } = await profileAPI.updateAutomobProfile(payload);
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
            first_name: data.profile.first_name || '',
            last_name: data.profile.last_name || '',
            gender: data.profile.gender || '',
            phone: data.profile.phone || '',
            iban: data.profile.iban || '',
            bic_swift: data.profile.bic_swift || '',
            address: data.profile.address || '',
            city: data.profile.city || '',
            siret: data.profile.siret || '',
            current_position: data.profile.current_position || '',
            experience: data.profile.experience || '',
            years_of_experience: data.profile.years_of_experience || '',
            secteur_id: data.profile.secteur_id || '',
            about_me: data.profile.about_me || '',
            work_areas: data.profile.work_areas
              ? (typeof data.profile.work_areas === 'string' ? JSON.parse(data.profile.work_areas) : data.profile.work_areas)
              : [],
          });

          if (data.profile.competence_ids && Array.isArray(data.profile.competence_ids)) {
            setSelectedCompetences(data.profile.competence_ids);
          }

          if (data.profile.availabilities) {
            setAvailabilities(data.profile.availabilities);
          }

          if (data.profile.experiences) {
            setExperiences(data.profile.experiences);
          }
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
    if (user?.profile?.first_name && user?.profile?.last_name) {
      return `${user.profile.first_name} ${user.profile.last_name}`;
    }
    return user?.email?.split('@')[0] || 'Auto-entrepreneur';
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

  // Fonctions de gestion des documents
  const fetchDocuments = async () => {
    try {
      const response = await documentsAPI.getAll();
      setDocuments(response.data.documents || []);
    } catch (error) {
      console.error('Erreur lors du chargement des documents:', error);
      // Si la table n'existe pas encore, ne pas afficher d'erreur
      if (error.response?.status === 500) {
        console.warn('La table automob_documents n\'existe pas encore. Veuillez exécuter la migration SQL.');
      }
    }
  };

  const handleDocumentUpload = async (e) => {
    e.preventDefault();

    if (!newDocument.name || !newDocument.file) {
      toast.error('Veuillez remplir tous les champs et sélectionner un fichier');
      return;
    }

    setUploadingDocument(true);
    try {
      const formData = new FormData();
      formData.append('file', newDocument.file);
      formData.append('name', newDocument.name);
      formData.append('type', newDocument.type);
      formData.append('has_expiry', newDocument.has_expiry);

      const response = await documentsAPI.upload(formData);
      setDocuments([...documents, response.data.document]);
      setNewDocument({ name: '', type: 'document', has_expiry: false, file: null });
      setShowDocumentForm(false);
      toast.success('Document ajouté avec succès');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erreur lors de l\'ajout du document');
    } finally {
      setUploadingDocument(false);
    }
  };

  const handleDeleteDocument = async (documentId) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) return;

    try {
      await documentsAPI.delete(documentId);
      setDocuments(documents.filter(doc => doc.id !== documentId));
      toast.success('Document supprimé avec succès');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erreur lors de la suppression');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...formValues,
        work_areas: JSON.stringify(formValues.work_areas),
        competences: JSON.stringify(selectedCompetences),
        availabilities: JSON.stringify(availabilities),
        experiences: JSON.stringify(experiences),
      };

      const { data } = await profileAPI.updateAutomobProfile(payload);
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
          first_name: data.profile.first_name || '',
          last_name: data.profile.last_name || '',
          gender: data.profile.gender || '',
          phone: data.profile.phone || '',
          iban: data.profile.iban || '',
          bic_swift: data.profile.bic_swift || '',
          address: data.profile.address || '',
          city: data.profile.city || '',
          siret: data.profile.siret || '',
          current_position: data.profile.current_position || '',
          experience: data.profile.experience || '',
          years_of_experience: data.profile.years_of_experience || '',
          secteur_id: data.profile.secteur_id || '',
          about_me: data.profile.about_me || '',
          work_areas: data.profile.work_areas
            ? (typeof data.profile.work_areas === 'string' ? JSON.parse(data.profile.work_areas) : data.profile.work_areas)
            : [],
          availability_start_date: '',
          availability_end_date: '',
        });

        if (data.profile.competence_ids && Array.isArray(data.profile.competence_ids)) {
          setSelectedCompetences(data.profile.competence_ids);
        }

        if (data.profile.availabilities) {
          setAvailabilities(data.profile.availabilities);
        }

        if (data.profile.experiences) {
          setExperiences(data.profile.experiences);
        }

        // Reset form inputs for adding new items
        setNewWorkArea('');
        setNewExperience({
          job_title: '',
          company_name: '',
          start_date: '',
          end_date: '',
          is_current: false,
          description: '',
        });
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

  // Gestion des zones de travail
  const addWorkArea = () => {
    if (newWorkArea.trim()) {
      setFormValues((prev) => ({
        ...prev,
        work_areas: [...prev.work_areas, newWorkArea.trim()]
      }));
      setNewWorkArea('');
    }
  };

  const removeWorkArea = (index) => {
    setFormValues((prev) => ({
      ...prev,
      work_areas: prev.work_areas.filter((_, i) => i !== index)
    }));
  };

  // Gestion des disponibilités
  const addAvailability = () => {
    if (availabilityForm.start_date && availabilityForm.end_date) {
      setAvailabilities([...availabilities, {
        start_date: availabilityForm.start_date,
        end_date: availabilityForm.end_date
      }]);
      setAvailabilityForm({
        start_date: '',
        end_date: ''
      });
    }
  };

  const removeAvailability = (index) => {
    setAvailabilities(availabilities.filter((_, i) => i !== index));
  };

  // Gestion des expériences professionnelles
  const addExperience = () => {
    if (newExperience.job_title && newExperience.company_name && newExperience.start_date) {
      setExperiences([...experiences, { ...newExperience }]);
      setNewExperience({
        job_title: '',
        company_name: '',
        start_date: '',
        end_date: '',
        is_current: false,
        description: '',
      });
    }
  };

  const removeExperience = (index) => {
    setExperiences(experiences.filter((_, i) => i !== index));
  };

  const handleExperienceChange = (field) => (e) => {
    const value = field === 'is_current' ? e.target.checked : e.target.value;
    setNewExperience((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <DashboardLayout
      title="Mon profil"
      description="Gérez vos informations personnelles"
      menuItems={automobNavigation}
      getRoleLabel={() => 'Auto-entrepreneur'}
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
            <div className="h-48 bg-gradient-to-r from-blue-500 to-blue-700 rounded-t-lg overflow-hidden">
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
                  <CardDescription>Auto-entrepreneur</CardDescription>
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
              <ProfileCompletionCard user={user} role="automob" />
            </aside>

            <form onSubmit={handleSubmit} className="space-y-6">
              {activeSection === 'personal-info' && (
                <Card>
                  <CardHeader>
                    <CardTitle>Informations personnelles</CardTitle>
                    <CardDescription>Ces données proviennent de votre inscription. Mettez-les à jour au besoin.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <FieldGroup className="grid grid-cols-1 gap-4 md:grid-cols-2 space-y-0">
                      <Field>
                        <FieldLabel htmlFor="first_name">Prénom</FieldLabel>
                        <InputWithIcon
                          id="first_name"
                          icon={User}
                          value={formValues.first_name}
                          onChange={handleInputChange('first_name')}
                          placeholder="Jean"
                        />
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="last_name">Nom</FieldLabel>
                        <InputWithIcon
                          id="last_name"
                          icon={User}
                          value={formValues.last_name}
                          onChange={handleInputChange('last_name')}
                          placeholder="Dupont"
                        />
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="gender">Genre</FieldLabel>
                        <select
                          id="gender"
                          value={formValues.gender}
                          onChange={handleInputChange('gender')}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <option value="">Sélectionnez...</option>
                          <option value="homme">Homme</option>
                          <option value="femme">Femme</option>
                        </select>
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
                        <FieldLabel htmlFor="iban">IBAN</FieldLabel>
                        <InputWithIcon
                          id="iban"
                          icon={CreditCard}
                          value={formValues.iban}
                          onChange={handleInputChange('iban')}
                          placeholder="FR76 1234 5678 9012 3456 7890 123"
                          maxLength={34}
                        />
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="bic_swift">BIC/SWIFT</FieldLabel>
                        <InputWithIcon
                          id="bic_swift"
                          icon={CreditCard}
                          value={formValues.bic_swift}
                          onChange={handleInputChange('bic_swift')}
                          placeholder="BNPAFRPPXXX"
                          maxLength={11}
                        />
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="siret">SIRET (14 chiffres)</FieldLabel>
                        <InputWithIcon
                          id="siret"
                          icon={Building}
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
                        <FieldLabel htmlFor="current_position">Votre poste actuel</FieldLabel>
                        <InputWithIcon
                          id="current_position"
                          icon={Briefcase}
                          value={formValues.current_position}
                          onChange={handleInputChange('current_position')}
                          placeholder="Auto-entrepreneur en nettoyage"
                        />
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="address">Adresse</FieldLabel>
                        <InputWithIcon
                          id="address"
                          icon={MapPin}
                          value={formValues.address}
                          onChange={handleInputChange('address')}
                          placeholder="12 rue de la Paix"
                        />
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="city">Ville</FieldLabel>
                        <InputWithIcon
                          id="city"
                          icon={MapPin}
                          value={formValues.city}
                          onChange={handleInputChange('city')}
                          placeholder="Paris"
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

              {activeSection === 'professional-info' && (
                <Card>
                  <CardHeader>
                    <CardTitle>Informations professionnelles</CardTitle>
                    <CardDescription>Complétez vos informations d'activité pour de meilleures correspondances de missions.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <FieldGroup className="grid grid-cols-1 gap-6 md:grid-cols-2 space-y-0">
                      <Field className="md:col-span-2">
                        <FieldLabel htmlFor="experience">Votre expérience d'auto-entrepreneur</FieldLabel>
                        <select
                          id="experience"
                          value={formValues.experience}
                          onChange={handleInputChange('experience')}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <option value="">Sélectionnez votre expérience...</option>
                          {experienceLevels.map((exp) => (
                            <option key={exp} value={exp}>{exp}</option>
                          ))}
                        </select>
                      </Field>
                      <Field className="md:col-span-2">
                        <FieldLabel htmlFor="years_of_experience">Années d'expertise dans votre domaine</FieldLabel>
                        <select
                          id="years_of_experience"
                          value={formValues.years_of_experience}
                          onChange={handleInputChange('years_of_experience')}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <option value="">Sélectionnez votre niveau...</option>
                          {yearsOfExperience.map((level) => (
                            <option key={level.value} value={level.value}>{level.label}</option>
                          ))}
                        </select>
                      </Field>
                      <Field className="md:col-span-2">
                        <FieldLabel htmlFor="secteur_id">Secteur d'activité</FieldLabel>
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
                        <FieldLabel>Compétences</FieldLabel>
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
                      <Field className="md:col-span-2">
                        <FieldLabel htmlFor="about_me">À propos de moi</FieldLabel>
                        <textarea
                          id="about_me"
                          value={formValues.about_me}
                          onChange={handleInputChange('about_me')}
                          rows={4}
                          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                          placeholder="Présentez-vous en quelques mots..."
                        />
                      </Field>
                      <Field className="md:col-span-2">
                        <FieldLabel htmlFor="work_areas">Zones de travail</FieldLabel>
                        <div className="space-y-2">
                          <div className="flex gap-2">
                            <InputWithIcon
                              id="work_areas"
                              icon={MapPin}
                              value={newWorkArea}
                              onChange={(e) => setNewWorkArea(e.target.value)}
                              placeholder="Entrez une ville..."
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  addWorkArea();
                                }
                              }}
                            />
                            <Button type="button" onClick={addWorkArea} size="sm" className="shrink-0">
                              <Plus className="h-4 w-4 mr-1" />
                              Ajouter
                            </Button>
                          </div>
                          {formValues.work_areas.length > 0 && (
                            <div className="flex flex-wrap gap-2 p-3 border border-input rounded-md bg-background min-h-[60px]">
                              {formValues.work_areas.map((area, index) => (
                                <div
                                  key={index}
                                  className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary text-primary-foreground text-sm"
                                >
                                  <MapPin className="h-3 w-3" />
                                  {area}
                                  <button
                                    type="button"
                                    onClick={() => removeWorkArea(index)}
                                    className="hover:bg-primary-foreground/20 rounded-full p-0.5"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                          <p className="text-xs text-muted-foreground">
                            Ajoutez les villes où vous êtes disponible pour travailler
                          </p>
                        </div>
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

              {activeSection === 'experience' && (
                <Card>
                  <CardHeader>
                    <CardTitle>Expérience professionnelle</CardTitle>
                    <CardDescription>Ajoutez vos expériences professionnelles passées et actuelles.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Formulaire d'ajout */}
                    <FieldGroup className="grid grid-cols-1 gap-4 space-y-0">
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <Field>
                          <FieldLabel htmlFor="job_title">Poste occupé *</FieldLabel>
                          <InputWithIcon
                            id="job_title"
                            icon={Briefcase}
                            value={newExperience.job_title}
                            onChange={handleExperienceChange('job_title')}
                            placeholder="Agent de nettoyage"
                          />
                        </Field>
                        <Field>
                          <FieldLabel htmlFor="company_name">Entreprise / Client *</FieldLabel>
                          <InputWithIcon
                            id="company_name"
                            icon={Building}
                            value={newExperience.company_name}
                            onChange={handleExperienceChange('company_name')}
                            placeholder="Nom de l'entreprise"
                          />
                        </Field>
                      </div>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <Field>
                          <FieldLabel htmlFor="start_date">Date de début *</FieldLabel>
                          <Input
                            id="start_date"
                            type="date"
                            value={newExperience.start_date}
                            onChange={handleExperienceChange('start_date')}
                          />
                        </Field>
                        <Field>
                          <FieldLabel htmlFor="end_date">Date de fin</FieldLabel>
                          <Input
                            id="end_date"
                            type="date"
                            value={newExperience.end_date}
                            onChange={handleExperienceChange('end_date')}
                            disabled={newExperience.is_current}
                            min={newExperience.start_date}
                          />
                        </Field>
                      </div>
                      <Field>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={newExperience.is_current}
                            onChange={handleExperienceChange('is_current')}
                            className="rounded border-input"
                          />
                          <span className="text-sm">Poste actuel</span>
                        </label>
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="description">Description des tâches / travaux effectués</FieldLabel>
                        <textarea
                          id="description"
                          value={newExperience.description}
                          onChange={handleExperienceChange('description')}
                          rows={3}
                          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                          placeholder="Décrivez vos responsabilités et réalisations..."
                        />
                      </Field>
                      <div className="flex justify-end">
                        <Button
                          type="button"
                          onClick={addExperience}
                          disabled={!newExperience.job_title || !newExperience.company_name || !newExperience.start_date}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Ajouter l'expérience
                        </Button>
                      </div>
                    </FieldGroup>

                    {/* Liste des expériences enregistrées */}
                    {experiences.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <h4 className="text-sm font-medium">Expériences professionnelles enregistrées</h4>
                        </div>
                        <div className="grid gap-3">
                          {experiences.map((exp, index) => (
                            <div
                              key={index}
                              className="flex flex-col p-4 border border-border rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                            >
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <Briefcase className="h-4 w-4 text-primary" />
                                    <h5 className="font-semibold text-foreground">{exp.job_title}</h5>
                                    {exp.is_current && (
                                      <span className="px-2 py-0.5 text-xs bg-primary text-primary-foreground rounded-full">
                                        Actuel
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                                    <Building className="h-3 w-3" />
                                    {exp.company_name}
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    <Clock className="h-3 w-3 inline mr-1" />
                                    {new Date(exp.start_date).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                                    {' → '}
                                    {exp.end_date
                                      ? new Date(exp.end_date).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
                                      : 'Aujourd\'hui'
                                    }
                                  </p>
                                  {exp.description && (
                                    <p className="text-sm text-foreground mt-2 whitespace-pre-wrap">
                                      {exp.description}
                                    </p>
                                  )}
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeExperience(index)}
                                  className="text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {experiences.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p className="text-sm">Aucune expérience professionnelle enregistrée</p>
                        <p className="text-xs mt-1">Ajoutez vos expériences ci-dessus</p>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="flex justify-end">
                    <Button type="submit" disabled={saving || uploading}>
                      {saving || uploading ? 'Enregistrement...' : 'Enregistrer'}
                    </Button>
                  </CardFooter>
                </Card>
              )}

              {activeSection === 'availability' && (
                <Card>
                  <CardHeader>
                    <CardTitle>Disponibilité</CardTitle>
                    <CardDescription>Ajoutez vos périodes de disponibilité pour les missions.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Formulaire d'ajout */}
                    <FieldGroup className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-[1fr,1fr,auto] items-end space-y-0">
                      <Field>
                        <FieldLabel htmlFor="availability_start_date">Disponible du</FieldLabel>
                        <Input
                          id="availability_start_date"
                          type="date"
                          value={availabilityForm.start_date}
                          onChange={(e) => setAvailabilityForm(prev => ({ ...prev, start_date: e.target.value }))}
                        />
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="availability_end_date">Jusqu'au</FieldLabel>
                        <Input
                          id="availability_end_date"
                          type="date"
                          value={availabilityForm.end_date}
                          onChange={(e) => setAvailabilityForm(prev => ({ ...prev, end_date: e.target.value }))}
                          min={availabilityForm.start_date}
                        />
                      </Field>
                      <Field className="md:col-span-2 xl:col-span-1">
                        <Button
                          type="button"
                          onClick={addAvailability}
                          disabled={!availabilityForm.start_date || !availabilityForm.end_date}
                          className="w-full"
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Ajouter
                        </Button>
                      </Field>
                    </FieldGroup>

                    {/* Liste des disponibilités enregistrées */}
                    {availabilities.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <h4 className="text-sm font-medium">Périodes de disponibilité enregistrées</h4>
                        </div>
                        <div className="grid gap-2">
                          {availabilities.map((availability, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-4 border border-border rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                            >
                              <div className="flex items-center gap-4">
                                <Calendar className="h-5 w-5 text-primary" />
                                <div>
                                  <p className="text-sm font-medium">
                                    Du {new Date(availability.start_date).toLocaleDateString('fr-FR')} au{' '}
                                    {new Date(availability.end_date).toLocaleDateString('fr-FR')}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {Math.ceil(
                                      (new Date(availability.end_date) - new Date(availability.start_date)) /
                                      (1000 * 60 * 60 * 24)
                                    )}{' '}
                                    jours
                                  </p>
                                </div>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeAvailability(index)}
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {availabilities.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p className="text-sm">Aucune période de disponibilité enregistrée</p>
                        <p className="text-xs mt-1">Ajoutez vos périodes de disponibilité ci-dessus</p>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="flex justify-end">
                    <Button type="submit" disabled={saving || uploading}>
                      {saving || uploading ? 'Enregistrement...' : 'Enregistrer'}
                    </Button>
                  </CardFooter>
                </Card>
              )}

              {activeSection === 'documents' && (
                <Card>
                  <CardHeader>
                    <CardTitle>Documents et habilitations</CardTitle>
                    <CardDescription>Gérez vos documents professionnels et habilitations (permis, CACES, certifications, etc.).</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Bouton pour afficher le formulaire */}
                    {!showDocumentForm && (
                      <Button
                        type="button"
                        onClick={() => setShowDocumentForm(true)}
                        className="w-full md:w-auto"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Ajouter un document
                      </Button>
                    )}

                    {/* Formulaire d'ajout de document */}
                    {showDocumentForm && (
                      <div className="border border-border rounded-lg p-4 space-y-4 bg-muted/30">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">Nouveau document</h4>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setShowDocumentForm(false);
                              setNewDocument({ name: '', type: 'document', has_expiry: false, file: null });
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="space-y-4">
                          {/* Question: Est-ce une habilitation ? */}
                          <div>
                            <label className="text-sm font-medium block mb-2">
                              Est-ce une habilitation ?
                            </label>
                            <div className="flex gap-4">
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="radio"
                                  name="has_expiry"
                                  checked={!newDocument.has_expiry}
                                  onChange={() => setNewDocument({ ...newDocument, has_expiry: false, type: 'document' })}
                                  className="w-4 h-4"
                                />
                                <span className="text-sm">Non</span>
                              </label>
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="radio"
                                  name="has_expiry"
                                  checked={newDocument.has_expiry}
                                  onChange={() => setNewDocument({ ...newDocument, has_expiry: true, type: 'habilitation' })}
                                  className="w-4 h-4"
                                />
                                <span className="text-sm">Oui</span>
                              </label>
                            </div>
                          </div>

                          {/* Champs supplémentaires si habilitation */}
                          {newDocument.has_expiry && (
                            <div>
                              <label className="text-sm font-medium block mb-2">
                                Type
                              </label>
                              <select
                                value={newDocument.type}
                                onChange={(e) => setNewDocument({ ...newDocument, type: e.target.value })}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                              >
                                <option value="document">Document</option>
                                <option value="habilitation">Habilitation</option>
                              </select>
                            </div>
                          )}

                          {/* Nom du document */}
                          <div>
                            <label htmlFor="doc_name" className="text-sm font-medium block mb-2">
                              Nom du document *
                            </label>
                            <Input
                              id="doc_name"
                              value={newDocument.name}
                              onChange={(e) => setNewDocument({ ...newDocument, name: e.target.value })}
                              placeholder="Ex: Permis de conduire, CACES, etc."
                              required
                            />
                          </div>

                          {/* Upload fichier */}
                          <div>
                            <label htmlFor="doc_file" className="text-sm font-medium block mb-2">
                              Fichier (PDF, Image) *
                            </label>
                            <div className="flex items-center gap-2">
                              <label className="flex-1 cursor-pointer">
                                <div className="flex items-center justify-center gap-2 border-2 border-dashed border-border rounded-lg p-4 hover:border-primary transition-colors">
                                  <Upload className="h-5 w-5 text-muted-foreground" />
                                  <span className="text-sm text-muted-foreground">
                                    {newDocument.file ? newDocument.file.name : 'Cliquez pour sélectionner un fichier'}
                                  </span>
                                </div>
                                <input
                                  id="doc_file"
                                  type="file"
                                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                  onChange={(e) => setNewDocument({ ...newDocument, file: e.target.files[0] })}
                                  className="hidden"
                                  required
                                />
                              </label>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              Formats acceptés: PDF, JPG, PNG, DOC, DOCX (max 10MB)
                            </p>
                          </div>

                          {/* Boutons */}
                          <div className="flex gap-2 justify-end">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                setShowDocumentForm(false);
                                setNewDocument({ name: '', type: 'document', has_expiry: false, file: null });
                              }}
                              disabled={uploadingDocument}
                            >
                              Annuler
                            </Button>
                            <Button
                              type="button"
                              onClick={(e) => handleDocumentUpload(e)}
                              disabled={uploadingDocument}
                            >
                              {uploadingDocument ? 'Upload en cours...' : 'Ajouter'}
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Liste des documents */}
                    {documents.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <File className="h-4 w-4 text-muted-foreground" />
                          <h4 className="text-sm font-medium">Mes documents ({documents.length})</h4>
                        </div>
                        <div className="grid gap-2">
                          {documents.map((doc) => (
                            <div
                              key={doc.id}
                              className="flex items-center justify-between p-4 border border-border rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                            >
                              <div className="flex items-center gap-4">
                                <div className="p-2 rounded-lg bg-primary/10">
                                  <FileText className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                  <p className="text-sm font-medium">{doc.name}</p>
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <span className={cn(
                                      "px-2 py-0.5 rounded-full",
                                      doc.type === 'habilitation' ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300" : "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                                    )}>
                                      {doc.type === 'habilitation' ? 'Habilitation' : 'Document'}
                                    </span>
                                    <span>•</span>
                                    <span>{new Date(doc.uploaded_at).toLocaleDateString('fr-FR')}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <a
                                  href={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${doc.file_path}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary hover:underline text-sm"
                                >
                                  Voir
                                </a>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteDocument(doc.id)}
                                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* État vide */}
                    {documents.length === 0 && !showDocumentForm && (
                      <div className="text-center py-8 text-muted-foreground">
                        <File className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p className="text-sm">Aucun document ajouté</p>
                        <p className="text-xs mt-1">Cliquez sur "Ajouter un document" pour commencer</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </form>
          </div>
        </section>
      )}
    </DashboardLayout>
  );
};

export default ProfileAutomob;
