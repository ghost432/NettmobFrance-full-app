import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { automobNavigation } from '@/constants/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/toast';
import { User, FileText, Camera, Briefcase, Award, CheckCircle, ArrowLeft, ArrowRight, AlertCircle, Clock, XCircle, Building2, Upload, ChevronLeft, ChevronRight, Mail, MapPin, Phone, HardHat } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import CameraCapture from '@/components/CameraCapture';
import AddressAutocomplete from '@/components/AddressAutocomplete';

const STEPS = [
  { id: 'informations', label: 'Informations personnelles', icon: User },
  { id: 'documents', label: 'Documents d\'identité', icon: FileText },
  { id: 'selfie', label: 'Selfie avec document', icon: Camera },
  { id: 'documents-pro', label: 'Documents professionnels', icon: Building2 },
  { id: 'habilitations', label: 'Habilitations & CACES', icon: Award },
  { id: 'presentation', label: 'Présentation', icon: User },
  { id: 'validation', label: 'Validation', icon: CheckCircle }
];

const VerifyIdentityAutomob = () => {
  useDocumentTitle('Vérification d\'Identité');
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentStep = searchParams.get('etape'); // Ne pas mettre de valeur par défaut
  const [showCamera, setShowCamera] = useState(false);
  
  const [formData, setFormData] = useState({
    // Informations personnelles
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address: '',
    
    // Documents d'identité
    document_type: 'carte_identite',
    document_recto: null,
    document_verso: null,
    
    // Selfie
    selfie_with_document: null,
    
    // Documents professionnels
    assurance_rc: null,
    justificatif_domicile: null,
    avis_insee: null,
    attestation_urssaf: null,
    
    // Habilitations
    has_habilitations: 'non',
    nombre_habilitations: 0,
    habilitations_files: [],
    
    // CACES
    has_caces: 'non',
    nombre_caces: 0,
    caces_files: [],
    
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
        first_name: user.profile.first_name ?? '',
        last_name: user.profile.last_name ?? '',
        email: user.email ?? '',
        phone: user.profile.phone ?? '',
        address: user.profile.address ?? ''
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

  const handleMultipleFiles = (field, files) => {
    const validFiles = Array.from(files).filter(file => {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} dépasse 10 Mo`);
        return false;
      }
      if (!['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'].includes(file.type)) {
        toast.error(`${file.name} : format non supporté`);
        return false;
      }
      return true;
    });
    handleChange(field, validFiles);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const data = new FormData();
      
      // Ajouter tous les champs texte
      Object.keys(formData).forEach(key => {
        if (formData[key] && !Array.isArray(formData[key]) && !(formData[key] instanceof File)) {
          data.append(key, formData[key]);
        }
      });
      
      // Ajouter les fichiers
      const fileFields = [
        'document_recto', 'document_verso', 'selfie_with_document',
        'assurance_rc', 'justificatif_domicile', 'avis_insee', 'attestation_urssaf'
      ];
      
      fileFields.forEach(field => {
        if (formData[field] instanceof File) {
          data.append(field, formData[field]);
        }
      });
      
      // Ajouter habilitations
      if (formData.habilitations_files && formData.habilitations_files.length > 0) {
        formData.habilitations_files.forEach((file, index) => {
          data.append(`habilitation_${index}`, file);
        });
      }
      
      // Ajouter CACES
      if (formData.caces_files && formData.caces_files.length > 0) {
        formData.caces_files.forEach((file, index) => {
          data.append(`caces_${index}`, file);
        });
      }
      
      await api.post('/verification-new/automob/submit', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      toast.success('Demande de vérification envoyée avec succès ! Nos équipes l\'examineront sous 24-48h.');
      
      // Rafraîchir le statut et rediriger vers la page de vérification
      const statusResponse = await api.get('/verification-new/status');
      setVerificationStatus(statusResponse.data);
      
      // Rediriger vers la page sans étape pour afficher le statut
      navigate('/automob/verify-identity');
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
                <Label htmlFor="first_name">Prénom *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="first_name"
                    value={formData.first_name}
                    onChange={(e) => handleChange('first_name', e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Nom *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="last_name"
                    value={formData.last_name}
                    onChange={(e) => handleChange('last_name', e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Numéro de téléphone *</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            
            <AddressAutocomplete
              value={formData.address}
              onChange={(value) => handleChange('address', value)}
              label="Adresse de résidence"
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
                Prenez un selfie en tenant votre document d'identité à côté de votre visage, ou uploadez une photo existante.
              </p>
            </div>
            
            <div className="space-y-4">
              <Label>
                <Camera className="inline h-4 w-4 mr-2" />
                Selfie avec document en main * (Image)
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
        
      case 'documents-pro':
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="assurance_rc">
                <FileText className="inline h-4 w-4 mr-2" />
                Assurance Responsabilité Civile Professionnelle * (PDF ou Image)
              </Label>
              <div className="relative border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <div className="flex flex-col items-center justify-center gap-2">
                  <Upload className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                  <Input
                    id="assurance_rc"
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => handleFileChange('assurance_rc', e.target.files[0])}
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
              {formData.assurance_rc && (
                <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-950 rounded-lg">
                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <p className="text-sm text-green-700 dark:text-green-300">{formData.assurance_rc.name}</p>
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="justificatif_domicile">
                <FileText className="inline h-4 w-4 mr-2" />
                Justificatif de domicile * (PDF ou Image)
              </Label>
              <div className="relative border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <div className="flex flex-col items-center justify-center gap-2">
                  <Upload className="h-8 w-8 text-gray-400 dark:text-gray-500" />
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
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="avis_insee">
                <FileText className="inline h-4 w-4 mr-2" />
                Avis de situation INSEE * (PDF ou Image)
              </Label>
              <div className="relative border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <div className="flex flex-col items-center justify-center gap-2">
                  <Upload className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                  <Input
                    id="avis_insee"
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => handleFileChange('avis_insee', e.target.files[0])}
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
              {formData.avis_insee && (
                <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-950 rounded-lg">
                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <p className="text-sm text-green-700 dark:text-green-300">{formData.avis_insee.name}</p>
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="attestation_urssaf">
                <FileText className="inline h-4 w-4 mr-2" />
                Attestation URSSAF * (PDF ou Image)
              </Label>
              <div className="relative border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <div className="flex flex-col items-center justify-center gap-2">
                  <Upload className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                  <Input
                    id="attestation_urssaf"
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => handleFileChange('attestation_urssaf', e.target.files[0])}
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
              {formData.attestation_urssaf && (
                <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-950 rounded-lg">
                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <p className="text-sm text-green-700 dark:text-green-300">{formData.attestation_urssaf.name}</p>
                </div>
              )}
            </div>
          </div>
        );
        
      case 'habilitations':
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <Label>
                <Award className="inline h-4 w-4 mr-2" />
                Avez-vous des Habilitations ?
              </Label>
              <div className="flex gap-4">
                <Button
                  type="button"
                  variant={formData.has_habilitations === 'non' ? 'default' : 'outline'}
                  onClick={() => {
                    handleChange('has_habilitations', 'non');
                    handleChange('nombre_habilitations', 0);
                    handleChange('habilitations_files', []);
                  }}
                >
                  Non
                </Button>
                <Button
                  type="button"
                  variant={formData.has_habilitations === 'oui' ? 'default' : 'outline'}
                  onClick={() => handleChange('has_habilitations', 'oui')}
                >
                  Oui
                </Button>
              </div>
            </div>
            
            {formData.has_habilitations === 'oui' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="nombre_habilitations">Nombre d'Habilitations</Label>
                  <Input
                    id="nombre_habilitations"
                    type="number"
                    min="1"
                    value={formData.nombre_habilitations}
                    onChange={(e) => handleChange('nombre_habilitations', parseInt(e.target.value) || 0)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="habilitations_files">
                    <Upload className="inline h-4 w-4 mr-2" />
                    Documents Habilitations (plusieurs fichiers possibles)
                  </Label>
                  <Input
                    id="habilitations_files"
                    type="file"
                    accept="image/*,application/pdf"
                    multiple
                    onChange={(e) => handleMultipleFiles('habilitations_files', e.target.files)}
                  />
                  {formData.habilitations_files.length > 0 && (
                    <p className="text-sm text-green-600">
                      ✓ {formData.habilitations_files.length} fichier(s) sélectionné(s)
                    </p>
                  )}
                </div>
              </>
            )}
            
            <div className="border-t pt-6 space-y-4">
              <Label>
                <HardHat className="inline h-4 w-4 mr-2" />
                Avez-vous un CACES ?
              </Label>
              <div className="flex gap-4">
                <Button
                  type="button"
                  variant={formData.has_caces === 'non' ? 'default' : 'outline'}
                  onClick={() => {
                    handleChange('has_caces', 'non');
                    handleChange('nombre_caces', 0);
                    handleChange('caces_files', []);
                  }}
                >
                  Non
                </Button>
                <Button
                  type="button"
                  variant={formData.has_caces === 'oui' ? 'default' : 'outline'}
                  onClick={() => handleChange('has_caces', 'oui')}
                >
                  Oui
                </Button>
              </div>
            </div>
            
            {formData.has_caces === 'oui' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="nombre_caces">Nombre de Permis CACES</Label>
                  <Input
                    id="nombre_caces"
                    type="number"
                    min="1"
                    value={formData.nombre_caces}
                    onChange={(e) => handleChange('nombre_caces', parseInt(e.target.value) || 0)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="caces_files">
                    <Upload className="inline h-4 w-4 mr-2" />
                    Permis CACES (plusieurs fichiers possibles)
                  </Label>
                  <Input
                    id="caces_files"
                    type="file"
                    accept="image/*,application/pdf"
                    multiple
                    onChange={(e) => handleMultipleFiles('caces_files', e.target.files)}
                  />
                  {formData.caces_files.length > 0 && (
                    <p className="text-sm text-green-600">
                      ✓ {formData.caces_files.length} fichier(s) sélectionné(s)
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
        );
        
      case 'presentation':
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="presentation">
                <User className="inline h-4 w-4 mr-2" />
                Votre présentation *
              </Label>
              <Textarea
                id="presentation"
                value={formData.presentation}
                onChange={(e) => handleChange('presentation', e.target.value)}
                rows={8}
                placeholder="Présentez-vous en quelques lignes : votre parcours, vos compétences, vos motivations..."
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
                  <strong>Informations personnelles :</strong>
                  <p>{formData.first_name} {formData.last_name}</p>
                  <p>{formData.email}</p>
                  <p>{formData.phone}</p>
                </div>
                
                <div>
                  <strong>Documents soumis :</strong>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    {formData.document_recto && <li>Document d'identité (recto)</li>}
                    {formData.document_verso && <li>Document d'identité (verso)</li>}
                    {formData.selfie_with_document && <li>Selfie avec document</li>}
                    {formData.assurance_rc && <li>Assurance RC Pro</li>}
                    {formData.justificatif_domicile && <li>Justificatif de domicile</li>}
                    {formData.avis_insee && <li>Avis INSEE</li>}
                    {formData.attestation_urssaf && <li>Attestation URSSAF</li>}
                    {formData.has_habilitations === 'oui' && <li>{formData.nombre_habilitations} Habilitation(s)</li>}
                    {formData.has_caces === 'oui' && <li>{formData.nombre_caces} Permis CACES</li>}
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
    if (user?.profile?.first_name || user?.profile?.last_name) {
      return `${user?.profile?.first_name || ''} ${user?.profile?.last_name || ''}`.trim();
    }
    return user?.email?.split('@')[0] || 'Auto-entrepreneur';
  };

  const avatarSrc = () => {
    if (!user?.profile?.profile_picture) return null;
    if (user.profile.profile_picture.startsWith('http')) return user.profile.profile_picture;
    return `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${user.profile.profile_picture}`;
  };

  // Si une étape est sélectionnée, afficher le formulaire directement
  if (currentStep) {
    return (
      <DashboardLayout menuItems={automobNavigation}>
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
                          className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors ${
                            isActive
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
      <DashboardLayout menuItems={automobNavigation}>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Clock className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Chargement...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Profil déjà vérifié
  if (user?.profile?.id_verified === 1 || verificationStatus?.status === 'approved') {
    return (
      <DashboardLayout menuItems={automobNavigation}>
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
                <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <CardTitle className="text-green-600 dark:text-green-400">Profil Vérifié</CardTitle>
                <CardDescription>Votre identité a été vérifiée avec succès</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
              <p className="text-sm text-green-800 dark:text-green-300">
                ✅ Votre profil est vérifié. Vous pouvez maintenant postuler à toutes les missions disponibles.
              </p>
            </div>
            <Button onClick={() => navigate('/automob/dashboard')} className="w-full">
              Retour au tableau de bord
            </Button>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  // Vérification en attente
  if (verificationStatus?.status === 'pending') {
    return (
      <DashboardLayout menuItems={automobNavigation}>
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-full">
                <Clock className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <CardTitle className="text-yellow-600 dark:text-yellow-400">Vérification en Cours</CardTitle>
                <CardDescription>Votre demande est en cours de traitement</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-yellow-50 dark:bg-yellow-950 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <p className="text-sm text-yellow-800 dark:text-yellow-300 mb-2">
                ⏳ Votre demande de vérification a été soumise le {new Date(verificationStatus.submitted_at).toLocaleDateString('fr-FR')}.
              </p>
              <p className="text-sm text-yellow-800 dark:text-yellow-300">
                Notre équipe examine vos documents. Vous recevrez une notification dès que la vérification sera terminée.
              </p>
            </div>
            <Button variant="outline" onClick={() => navigate('/automob/dashboard')} className="w-full">
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
      <DashboardLayout menuItems={automobNavigation}>
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-100 dark:bg-red-900 rounded-full">
                <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <CardTitle className="text-red-600 dark:text-red-400">Vérification Refusée</CardTitle>
                <CardDescription>Votre demande a été refusée</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-red-50 dark:bg-red-950 rounded-lg border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-800 dark:text-red-300 mb-2">
                ❌ Votre demande de vérification a été refusée.
              </p>
              {verificationStatus.rejection_reason && (
                <div className="mt-3 p-3 bg-red-100 dark:bg-red-900 rounded border border-red-300 dark:border-red-700">
                  <p className="text-sm font-semibold text-red-900 dark:text-red-200">Raison du rejet :</p>
                  <p className="text-sm text-red-800 dark:text-red-300 mt-1">{verificationStatus.rejection_reason}</p>
                </div>
              )}
              <p className="text-sm text-red-800 dark:text-red-300 mt-3">
                Vous pouvez soumettre une nouvelle demande avec des documents valides.
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
    <DashboardLayout menuItems={automobNavigation}>
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
              🔒 Pour postuler aux missions, vous devez d'abord vérifier votre identité.
            </p>
            <p className="text-sm text-blue-800 dark:text-blue-300">
              La vérification comprend:
            </p>
            <ul className="text-sm text-blue-800 dark:text-blue-300 mt-2 space-y-1 ml-4">
              <li>• Informations personnelles</li>
              <li>• Documents d'identité</li>
              <li>• Selfie avec document</li>
              <li>• Documents professionnels</li>
              <li>• Habilitations et CACES (optionnel)</li>
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

export default VerifyIdentityAutomob;
