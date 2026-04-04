import { useState, useEffect } from 'react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/toast';
import { useAuth } from '@/context/AuthContext';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { clientNavigation } from '@/constants/navigation';
import AddressAutocomplete from '@/components/AddressAutocomplete';
import CameraCapture from '@/components/CameraCapture';
import {
  User, Phone, Mail, MapPin, FileText, Upload, Camera,
  CheckCircle, Building2, Briefcase, ChevronRight, ChevronLeft,
  Clock, AlertCircle, XCircle
} from 'lucide-react';
import api from '@/lib/api';

const STEPS = [
  { id: 'informations', label: 'Informations du gérant', icon: User },
  { id: 'documents', label: 'Documents d\'identité', icon: FileText },
  { id: 'selfie', label: 'Selfie avec document', icon: Camera },
  { id: 'documents-entreprise', label: 'Documents entreprise', icon: Building2 },
  { id: 'presentation', label: 'Présentation', icon: Briefcase },
  { id: 'validation', label: 'Validation', icon: CheckCircle }
];

const VerifyIdentityClient = () => {
  useDocumentTitle('Vérification d\'Identité');
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentStep = searchParams.get('etape'); // Ne pas mettre de valeur par défaut
  const [showCamera, setShowCamera] = useState(false);

  const [formData, setFormData] = useState({
    // Informations du gérant
    manager_first_name: '',
    manager_last_name: '',
    manager_email: '',
    manager_phone: '',
    manager_address: '',
    manager_position: '',

    // Documents d'identité
    document_type: 'carte_identite',
    document_recto: null,
    document_verso: null,

    // Selfie
    selfie_with_document: null,

    // Documents entreprise
    kbis: null,
    justificatif_domicile: null,

    // Présentation
    presentation: ''
  });

  const [loading, setLoading] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const currentStepIndex = STEPS.findIndex(s => s.id === currentStep);

  useEffect(() => {
    // Charger les données existantes et le statut de vérification
    const fetchVerificationStatus = async () => {
      try {
        const response = await api.get('/verification-new/status');
        setVerificationStatus(response.data);
      } catch (error) {
        console.error('Erreur chargement statut:', error);
      } finally {
        setLoadingStatus(false);
      }
    };

    fetchVerificationStatus();

    if (user?.profile) {
      setFormData(prev => ({
        ...prev,
        manager_first_name: user.profile.first_name ?? '',
        manager_last_name: user.profile.last_name ?? '',
        manager_email: user.email ?? '',
        manager_phone: user.profile.phone ?? '',
        manager_address: user.profile.address ?? '',
        manager_position: user.profile.manager_position ?? ''
      }));
    }
  }, [user]);

  const goToStep = (stepId) => {
    setSearchParams({ etape: stepId });
  };

  const handleNext = () => {
    if (currentStepIndex < STEPS.length - 1) {
      goToStep(STEPS[currentStepIndex + 1].id);
    }
  };

  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      goToStep(STEPS[currentStepIndex - 1].id);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (field, file) => {
    if (file && file.size > 10 * 1024 * 1024) {
      toast.error('Le fichier ne doit pas dépasser 10 Mo');
      return;
    }
    if (file && !['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'].includes(file.type)) {
      toast.error('Format non supporté. Utilisez JPG, PNG ou PDF');
      return;
    }
    handleChange(field, file);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const data = new FormData();

      // Ajouter tous les champs texte
      Object.keys(formData).forEach(key => {
        if (formData[key] && !(formData[key] instanceof File)) {
          data.append(key, formData[key]);
        }
      });

      // Ajouter les fichiers
      const fileFields = [
        'document_recto', 'document_verso', 'selfie_with_document',
        'kbis', 'justificatif_domicile'
      ];

      fileFields.forEach(field => {
        if (formData[field] instanceof File) {
          data.append(field, formData[field]);
        }
      });

      await api.post('/verification-new/client/submit', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      toast.success('Demande de vérification envoyée avec succès ! Nos équipes l\'examineront sous 24-48h.');

      // Rafraîchir le statut et rediriger vers la page de vérification
      const statusResponse = await api.get('/verification-new/status');
      setVerificationStatus(statusResponse.data);

      // Rediriger vers la page sans étape pour afficher le statut
      navigate('/client/verify-identity');
    } catch (error) {
      console.error('Erreur soumission:', error);
      console.error('Détails erreur:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      const errorMessage = error.response?.data?.error
        || error.response?.data?.message
        || error.message
        || 'Erreur lors de la soumission';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'informations':
        return (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="manager_first_name">
                  Prénom du gérant *
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="manager_first_name"
                    value={formData.manager_first_name}
                    onChange={(e) => handleChange('manager_first_name', e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="manager_last_name">
                  Nom du gérant *
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="manager_last_name"
                    value={formData.manager_last_name}
                    onChange={(e) => handleChange('manager_last_name', e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="manager_position">
                Rang ou poste dans la société *
              </Label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="manager_position"
                  value={formData.manager_position}
                  onChange={(e) => handleChange('manager_position', e.target.value)}
                  placeholder="Ex: Gérant, Directeur général, PDG..."
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="manager_email">
                Adresse email *
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="manager_email"
                  type="email"
                  value={formData.manager_email}
                  onChange={(e) => handleChange('manager_email', e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="manager_phone">
                Numéro de téléphone *
              </Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="manager_phone"
                  type="tel"
                  value={formData.manager_phone}
                  onChange={(e) => handleChange('manager_phone', e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <AddressAutocomplete
              value={formData.manager_address}
              onChange={(value) => handleChange('manager_address', value)}
              label="Adresse de domicile"
              placeholder="Ex: 12 rue de la Paix, 75002 Paris"
              required
            />
          </div>
        );

      case 'documents':
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="document_type">Type de document d'identité</Label>
              <Select
                value={formData.document_type}
                onValueChange={(value) => handleChange('document_type', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="carte_identite">Carte d'identité</SelectItem>
                  <SelectItem value="passeport">Passeport</SelectItem>
                  <SelectItem value="permis_conduire">Permis de conduire</SelectItem>
                  <SelectItem value="titre_sejour">Titre de séjour</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="document_recto">
                Document Recto * (Image ou PDF)
              </Label>
              <div className="relative border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <div className="flex flex-col items-center justify-center gap-2">
                  <Upload className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                  <Input
                    id="document_recto"
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => handleFileChange('document_recto', e.target.files[0])}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Cliquez pour sélectionner un fichier
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    PNG, JPG ou PDF (max. 10MB)
                  </p>
                </div>
              </div>
              {formData.document_recto && (
                <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-950 rounded-lg">
                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <p className="text-sm text-green-700 dark:text-green-300">{formData.document_recto.name}</p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="document_verso">
                Document Verso * (Image ou PDF)
              </Label>
              <div className="relative border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <div className="flex flex-col items-center justify-center gap-2">
                  <Upload className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                  <Input
                    id="document_verso"
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => handleFileChange('document_verso', e.target.files[0])}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Cliquez pour sélectionner un fichier
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    PNG, JPG ou PDF (max. 10MB)
                  </p>
                </div>
              </div>
              {formData.document_verso && (
                <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-950 rounded-lg">
                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <p className="text-sm text-green-700 dark:text-green-300">{formData.document_verso.name}</p>
                </div>
              )}
            </div>
          </div>
        );

      case 'selfie':
        return (
          <div className="space-y-6">
            <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                <Camera className="inline h-4 w-4 mr-2" />
                Le gérant doit prendre un selfie en tenant son document d'identité à côté de son visage, ou uploader une photo existante.
              </p>
            </div>

            <div className="space-y-4">
              <Label>
                <Camera className="inline h-4 w-4 mr-2" />
                Selfie du gérant avec document en main * (Image)
              </Label>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCamera(true)}
                  className="flex-1"
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Prendre une photo
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById('selfie_with_document').click()}
                  className="flex-1"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Uploader une photo
                </Button>
              </div>

              <Input
                id="selfie_with_document"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFileChange('selfie_with_document', e.target.files[0])}
              />

              {formData.selfie_with_document && (
                <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Photo capturée: {formData.selfie_with_document.name}
                  </p>
                </div>
              )}
            </div>
          </div>
        );

      case 'documents-entreprise':
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="kbis">
                Extrait KBIS * (PDF ou Image)
              </Label>
              <div className="relative border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <div className="flex flex-col items-center justify-center gap-2">
                  <Building2 className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                  <Input
                    id="kbis"
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => handleFileChange('kbis', e.target.files[0])}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Cliquez pour sélectionner un fichier
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    PNG, JPG ou PDF (max. 10MB)
                  </p>
                </div>
              </div>
              {formData.kbis && (
                <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-950 rounded-lg">
                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <p className="text-sm text-green-700 dark:text-green-300">{formData.kbis.name}</p>
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                L'extrait KBIS doit dater de moins de 3 mois
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="justificatif_domicile">
                Justificatif de domicile * (PDF ou Image)
              </Label>
              <div className="relative border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <div className="flex flex-col items-center justify-center gap-2">
                  <FileText className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                  <Input
                    id="justificatif_domicile"
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => handleFileChange('justificatif_domicile', e.target.files[0])}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Cliquez pour sélectionner un fichier
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    PNG, JPG ou PDF (max. 10MB)
                  </p>
                </div>
              </div>
              {formData.justificatif_domicile && (
                <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-950 rounded-lg">
                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <p className="text-sm text-green-700 dark:text-green-300">{formData.justificatif_domicile.name}</p>
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Facture d'électricité, eau, gaz, téléphone fixe ou quittance de loyer de moins de 3 mois
              </p>
            </div>
          </div>
        );

      case 'presentation':
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="presentation">
                <Briefcase className="inline h-4 w-4 mr-2" />
                Présentation de votre entreprise *
              </Label>
              <Textarea
                id="presentation"
                value={formData.presentation}
                onChange={(e) => handleChange('presentation', e.target.value)}
                rows={8}
                placeholder="Présentez votre entreprise : secteur d'activité, nombre d'employés, historique, objectifs..."
                required
              />
              <p className="text-sm text-muted-foreground">
                {formData.presentation.length} caractères
              </p>
            </div>
          </div>
        );

      case 'validation':
        return (
          <div className="space-y-6">
            <div className="bg-green-50 dark:bg-green-950 p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Récapitulatif de votre demande
              </h3>

              <div className="space-y-4 text-sm">
                <div>
                  <strong>Gérant :</strong>
                  <p>{formData.manager_first_name} {formData.manager_last_name}</p>
                  <p>{formData.manager_position}</p>
                  <p>{formData.manager_email}</p>
                  <p>{formData.manager_phone}</p>
                </div>

                <div>
                  <strong>Documents soumis :</strong>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    {formData.document_recto && <li>Document d'identité (recto)</li>}
                    {formData.document_verso && <li>Document d'identité (verso)</li>}
                    {formData.selfie_with_document && <li>Selfie avec document</li>}
                    {formData.kbis && <li>Extrait KBIS</li>}
                    {formData.justificatif_domicile && <li>Justificatif de domicile</li>}
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                En soumettant cette demande, vous certifiez que toutes les informations fournies sont exactes et que les documents sont authentiques.
              </p>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full"
              size="lg"
            >
              {loading ? 'Envoi en cours...' : 'Soumettre ma demande de vérification'}
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  const displayName = () => {
    return user?.profile?.company_name || user?.email?.split('@')[0] || 'Entreprise';
  };

  const avatarSrc = () => {
    if (!user?.profile?.profile_picture) return null;
    if (user.profile.profile_picture.startsWith('http')) return user.profile.profile_picture;
    return `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${user.profile.profile_picture}`;
  };

  // Si une étape est sélectionnée, afficher le formulaire directement
  if (currentStep) {
    return (
      <DashboardLayout menuItems={clientNavigation}>
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Stepper */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                {STEPS.map((step, index) => {
                  const Icon = step.icon;
                  const isActive = step.id === currentStep;
                  const isCompleted = index < currentStepIndex;

                  return (
                    <div key={step.id} className="flex items-center">
                      <div className="flex flex-col items-center">
                        <button
                          onClick={() => goToStep(step.id)}
                          className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors ${isActive
                              ? 'border-primary bg-primary text-primary-foreground'
                              : isCompleted
                                ? 'border-green-500 bg-green-500 text-white'
                                : 'border-muted-foreground text-muted-foreground'
                            }`}
                        >
                          {isCompleted ? <CheckCircle className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                        </button>
                        <span className={`mt-2 text-xs text-center hidden md:block ${isActive ? 'font-semibold' : ''}`}>
                          {step.label}
                        </span>
                      </div>
                      {index < STEPS.length - 1 && (
                        <div className={`h-0.5 w-12 mx-2 ${isCompleted ? 'bg-green-500' : 'bg-muted'}`} />
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Content */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {STEPS[currentStepIndex].icon && (() => {
                  const Icon = STEPS[currentStepIndex].icon;
                  return <Icon className="h-6 w-6" />;
                })()}
                {STEPS[currentStepIndex].label}
              </CardTitle>
              <CardDescription>
                Étape {currentStepIndex + 1} sur {STEPS.length}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderStepContent()}
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStepIndex === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Précédent
            </Button>

            {currentStepIndex < STEPS.length - 1 && (
              <Button onClick={handleNext}>
                Suivant
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </div>

        {/* Camera Capture Modal */}
        {showCamera && (
          <CameraCapture
            onCapture={(file) => handleFileChange('selfie_with_document', file)}
            onClose={() => setShowCamera(false)}
          />
        )}
      </DashboardLayout>
    );
  }

  // Affichage selon le statut (seulement si pas d'étape sélectionnée)
  if (loadingStatus) {
    return (
      <DashboardLayout menuItems={clientNavigation}>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Clock className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Chargement...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Helper robuste pour vérifier si le profil est vérifié
  const isProfileIdVerified = () => {
    if (!user) return false;
    if (user.role === 'client') {
      const v = (user?.profile?.representative_id_verified ?? user?.profile?.id_verified ?? user?.id_verified);
      return v === 1 || v === true || v === '1';
    }
    const v = user?.profile?.id_verified ?? user?.id_verified;
    return v === 1 || v === true || v === '1';
  };

  // Profil déjà vérifié
  if (isProfileIdVerified() || verificationStatus?.status === 'approved') {
    return (
      <DashboardLayout menuItems={clientNavigation}>
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <CardTitle className="text-green-600">Profil Vérifié</CardTitle>
                <CardDescription>Votre identité a été vérifiée avec succès</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <p className="text-sm text-green-800">
                ✅ Votre profil est vérifié. Vous pouvez maintenant publier des missions.
              </p>
            </div>
            <Button onClick={() => navigate('/client/missions/new')} className="w-full">
              Publier une mission
            </Button>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  // Vérification en attente
  if (verificationStatus?.status === 'pending') {
    return (
      <DashboardLayout menuItems={clientNavigation}>
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-yellow-100 rounded-full">
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
              <div>
                <CardTitle className="text-yellow-600">Vérification en Cours</CardTitle>
                <CardDescription>Votre demande est en cours de traitement</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <p className="text-sm text-yellow-800 mb-2">
                ⏳ Votre demande de vérification a été soumise le {new Date(verificationStatus.submitted_at).toLocaleDateString('fr-FR')}.
              </p>
              <p className="text-sm text-yellow-800">
                Notre équipe examine vos documents. Vous recevrez une notification dès que la vérification sera terminée.
              </p>
            </div>
            <Button variant="outline" onClick={() => navigate('/client/dashboard')} className="w-full">
              Retour au tableau de bord
            </Button>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  // Vérification rejetée
  if (verificationStatus?.status === 'rejected') {
    return (
      <DashboardLayout menuItems={clientNavigation}>
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-100 rounded-full">
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
              <div>
                <CardTitle className="text-red-600">Vérification Refusée</CardTitle>
                <CardDescription>Votre demande a été refusée</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-red-50 rounded-lg border border-red-200">
              <p className="text-sm text-red-800 font-semibold mb-2">Raison du refus:</p>
              <p className="text-sm text-red-800">
                {verificationStatus.rejection_reason || 'Documents non conformes ou incomplets'}
              </p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800">
                💡 Vous pouvez soumettre une nouvelle demande en cliquant sur le bouton ci-dessous.
              </p>
            </div>
            <Button onClick={() => setVerificationStatus(null)} className="w-full">
              Soumettre une nouvelle demande
            </Button>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  // Profil non vérifié - Afficher le bouton pour commencer (par défaut)
  return (
    <DashboardLayout menuItems={clientNavigation}>
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
              <AlertCircle className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <CardTitle>Profil Non Vérifié</CardTitle>
              <CardDescription>Vérifiez votre identité pour accéder à toutes les fonctionnalités</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-800 dark:text-blue-300 mb-3">
              🔒 Pour publier des missions, vous devez d'abord vérifier votre identité.
            </p>
            <p className="text-sm text-blue-800 dark:text-blue-300">
              La vérification comprend:
            </p>
            <ul className="text-sm text-blue-800 dark:text-blue-300 mt-2 space-y-1 ml-4">
              <li>• Informations du gérant</li>
              <li>• Documents d'identité du gérant</li>
              <li>• Selfie avec document</li>
              <li>• Documents de l'entreprise (KBIS, etc.)</li>
              <li>• Présentation de l'entreprise</li>
            </ul>
          </div>
          <Button onClick={() => goToStep('informations')} className="w-full" size="lg">
            Commencer la vérification
          </Button>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default VerifyIdentityClient;
