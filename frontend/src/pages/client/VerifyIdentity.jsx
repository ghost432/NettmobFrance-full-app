import { useState, useRef, useEffect } from 'react';
import { Camera, Upload, CheckCircle, XCircle, Clock, FileText } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/toast';
import { useAuth } from '@/context/AuthContext';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { clientNavigation } from '@/constants/navigation';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';

const VerifyIdentity = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [captureMode, setCaptureMode] = useState(false);
  const [stream, setStream] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [formData, setFormData] = useState({
    documentType: 'carte_identite',
    documentNumber: '',
    file: null
  });

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const formRef = useRef(null);

  useEffect(() => {
    fetchStatus();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const fetchStatus = async () => {
    try {
      const response = await api.get('/verification/status');
      setStatus(response.data);
    } catch (error) {
      console.error('Erreur récupération statut:', error);
    } finally {
      setLoading(false);
    }
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setCaptureMode(true);
    } catch (error) {
      toast.error('Erreur d\'accès à la caméra');
      console.error('Camera error:', error);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setCaptureMode(false);
  };

  const capturePhoto = () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    
    if (canvas && video) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0);
      
      canvas.toBlob((blob) => {
        const file = new File([blob], 'id-document.jpg', { type: 'image/jpeg' });
        setFormData(prev => ({ ...prev, file }));
        setCapturedImage(URL.createObjectURL(blob));
        stopCamera();
        toast.success('Photo capturée avec succès');
      }, 'image/jpeg', 0.95);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Le fichier est trop volumineux (max 5MB)');
        return;
      }
      setFormData(prev => ({ ...prev, file }));
      setCapturedImage(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.file) {
      toast.error('Veuillez fournir un document d\'identité');
      return;
    }

    if (!formData.documentNumber) {
      toast.error('Veuillez saisir le numéro du document');
      return;
    }

    setSubmitting(true);

    try {
      const submitData = new FormData();
      submitData.append('idDocument', formData.file);
      submitData.append('documentType', formData.documentType);
      submitData.append('documentNumber', formData.documentNumber);

      await api.post('/verification/submit', submitData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      toast.success('Demande de vérification soumise avec succès !');
      setFormData({ documentType: 'carte_identite', documentNumber: '', file: null });
      setCapturedImage(null);
      fetchStatus();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erreur lors de la soumission');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const getStatusBadge = () => {
    if (!status || status.status === 'not_submitted') {
      return <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">Non soumis</span>;
    }
    
    switch (status.status) {
      case 'pending':
        return <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm flex items-center gap-1"><Clock className="w-4 h-4" /> En attente</span>;
      case 'approved':
        return <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm flex items-center gap-1"><CheckCircle className="w-4 h-4" /> Approuvé</span>;
      case 'rejected':
        return <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm flex items-center gap-1"><XCircle className="w-4 h-4" /> Refusé</span>;
      default:
        return null;
    }
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http')) return imagePath;
    return `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${imagePath}`;
  };

  const roleLabel = () => user?.profile?.company_name || 'Entreprise';
  const displayName = () => user?.profile?.company_name || user?.email?.split('@')[0] || 'Client';
  const avatarSrc = () => getImageUrl(user?.profile?.profile_picture || user?.profile_picture);

  return (
    <DashboardLayout
      title="Vérification d'identité"
      description="Soumettez votre pièce d'identité pour vérification"
      menuItems={clientNavigation}
      getRoleLabel={roleLabel}
      getDisplayName={displayName}
      getAvatarSrc={avatarSrc}
    >
      <section className="space-y-6">
      {/* Carte d'état du profil - Masquée quand le formulaire est affiché */}
      {!showForm && (!status || status.status === 'not_submitted') && (
        <Card className="mb-6 border-l-4 border-l-orange-500 bg-orange-50/50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-orange-100 rounded-full">
                <XCircle className="w-8 h-8 text-orange-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-orange-900 mb-2">
                  Profil non vérifié
                </h2>
                <p className="text-orange-800 mb-4">
                  Votre identité n'a pas encore été vérifiée. Pour accéder à toutes les fonctionnalités de la plateforme, veuillez soumettre vos documents d'identité ci-dessous.
                </p>
                <div className="flex items-center gap-2 text-sm text-orange-700">
                  <FileText className="w-4 h-4" />
                  <span>Documents acceptés : Carte d'identité, Passeport, Permis de conduire</span>
                </div>
                <Button 
                  className="mt-4" 
                  onClick={() => {
                    setShowForm(true);
                    setTimeout(() => {
                      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }, 100);
                  }}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Vérifier mon identité
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {!showForm && status && status.status === 'pending' && (
        <Card className="mb-6 border-l-4 border-l-yellow-500 bg-yellow-50/50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-yellow-100 rounded-full">
                <Clock className="w-8 h-8 text-yellow-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-yellow-900 mb-2">
                  Profil en cours de vérification
                </h2>
                <p className="text-yellow-800 mb-4">
                  Votre demande de vérification a été soumise avec succès le {new Date(status.submitted_at).toLocaleDateString('fr-FR')}. Notre équipe examine actuellement vos documents. Vous recevrez un email dès que la vérification sera terminée.
                </p>
                <div className="flex items-center gap-2 text-sm text-yellow-700">
                  <Clock className="w-4 h-4" />
                  <span>Temps de traitement habituel : 24-48 heures</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {!showForm && status && status.status === 'approved' && (
        <Card className="mb-6 border-l-4 border-l-green-500 bg-green-50/50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-green-900 mb-2">
                  Profil vérifié ✓
                </h2>
                <p className="text-green-800 mb-4">
                  Félicitations ! Votre identité a été vérifiée avec succès le {new Date(status.reviewed_at).toLocaleDateString('fr-FR')}. Vous avez maintenant accès à toutes les fonctionnalités de la plateforme.
                </p>
                <div className="flex items-center gap-2 text-sm text-green-700">
                  <CheckCircle className="w-4 h-4" />
                  <span>Document vérifié : {
                    status.document_type === 'carte_identite' ? 'Carte d\'identité' :
                    status.document_type === 'passeport' ? 'Passeport' :
                    status.document_type === 'permis_conduire' ? 'Permis de conduire' :
                    status.document_type
                  }</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {!showForm && status && status.status === 'rejected' && (
        <Card className="mb-6 border-l-4 border-l-red-500 bg-red-50/50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-red-100 rounded-full">
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-red-900 mb-2">
                  Vérification refusée
                </h2>
                <p className="text-red-800 mb-3">
                  Votre demande de vérification a été refusée. Veuillez vérifier les informations ci-dessous et soumettre un nouveau document.
                </p>
                <div className="bg-red-100 border border-red-200 rounded-lg p-3 mb-4">
                  <p className="text-sm font-semibold text-red-900 mb-1">Raison du refus :</p>
                  <p className="text-sm text-red-800">
                    {status.rejection_reason || 'Document non conforme aux exigences.'}
                  </p>
                </div>
                <Button 
                  className="mt-2" 
                  onClick={() => {
                    setShowForm(true);
                    setTimeout(() => {
                      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }, 100);
                  }}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Soumettre un nouveau document
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Afficher le formulaire seulement si non soumis ou rejeté ET si showForm est true */}
      {showForm && (!status || status.status === 'not_submitted' || status.status === 'rejected') && (
        <Card ref={formRef}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <FileText className="w-6 h-6" />
                  Formulaire de vérification
                </CardTitle>
                <CardDescription>
                  Remplissez les informations et téléchargez votre document d'identité
                </CardDescription>
              </div>
              {getStatusBadge()}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="documentType">Type de document</Label>
                <Select
                  value={formData.documentType}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, documentType: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="carte_identite">Carte d'identité</SelectItem>
                    <SelectItem value="passeport">Passeport</SelectItem>
                    <SelectItem value="permis_conduire">Permis de conduire</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="documentNumber">Numéro du document *</Label>
                <Input
                  id="documentNumber"
                  value={formData.documentNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, documentNumber: e.target.value }))}
                  placeholder="Ex: 123456789"
                  required
                />
              </div>

              <div className="space-y-4">
                <Label>Document d'identité *</Label>
                
                {!captureMode && !capturedImage && (
                  <div className="flex gap-4">
                    <Button
                      type="button"
                      onClick={startCamera}
                      variant="outline"
                      className="flex-1"
                    >
                      <Camera className="w-4 h-4 mr-2" />
                      Prendre une photo
                    </Button>
                    
                    <label className="flex-1">
                      <Button type="button" variant="outline" className="w-full" onClick={() => document.getElementById('fileInput').click()}>
                        <Upload className="w-4 h-4 mr-2" />
                        Télécharger un fichier
                      </Button>
                      <input
                        id="fileInput"
                        type="file"
                        accept="image/jpeg,image/jpg,image/png"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}

                {captureMode && (
                  <div className="space-y-4">
                    <div className="relative bg-black rounded-lg overflow-hidden">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        className="w-full h-96 object-cover"
                      />
                    </div>
                    <div className="flex gap-4">
                      <Button type="button" onClick={capturePhoto} className="flex-1">
                        <Camera className="w-4 h-4 mr-2" />
                        Capturer
                      </Button>
                      <Button type="button" onClick={stopCamera} variant="outline" className="flex-1">
                        Annuler
                      </Button>
                    </div>
                  </div>
                )}

                {capturedImage && (
                  <div className="space-y-4">
                    <img src={capturedImage} alt="Document" className="w-full rounded-lg border" />
                    <Button
                      type="button"
                      onClick={() => {
                        setCapturedImage(null);
                        setFormData(prev => ({ ...prev, file: null }));
                      }}
                      variant="outline"
                      className="w-full"
                    >
                      Changer l'image
                    </Button>
                  </div>
                )}

                <canvas ref={canvasRef} className="hidden" />
              </div>

              <Button type="submit" disabled={submitting || !formData.file} className="w-full">
                {submitting ? 'Envoi en cours...' : 'Soumettre pour vérification'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
      </section>
    </DashboardLayout>
  );
};

export default VerifyIdentity;
