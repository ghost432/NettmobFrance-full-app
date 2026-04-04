import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Camera, X, RotateCw, Check } from 'lucide-react';

const CameraCapture = ({ onCapture, onClose }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [facingMode, setFacingMode] = useState('user'); // 'user' (front) ou 'environment' (back)

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, [facingMode]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setStream(mediaStream);
    } catch (error) {
      console.error('Erreur accès caméra:', error);
      alert('Impossible d\'accéder à la caméra. Veuillez vérifier les permissions.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (video && canvas) {
      const context = canvas.getContext('2d');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      const imageDataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setCapturedImage(imageDataUrl);
      stopCamera();
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    startCamera();
  };

  const confirmPhoto = () => {
    // Convertir data URL en File
    fetch(capturedImage)
      .then(res => res.blob())
      .then(blob => {
        const file = new File([blob], 'selfie-' + Date.now() + '.jpg', { type: 'image/jpeg' });
        onCapture(file);
        stopCamera();
        onClose();
      });
  };

  const switchCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                {capturedImage ? 'Aperçu de la photo' : 'Prendre un selfie avec votre document'}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  stopCamera();
                  onClose();
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Instructions */}
            {!capturedImage && (
              <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                <p className="text-sm text-blue-900 dark:text-blue-100">
                  📸 <strong>Instructions :</strong> Tenez votre document d'identité à côté de votre visage de manière visible.
                  Assurez-vous que votre visage et le document sont bien éclairés et nets.
                </p>
              </div>
            )}

            {/* Video/Image Display */}
            <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video">
              {!capturedImage ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              ) : (
                <img
                  src={capturedImage}
                  alt="Selfie capturé"
                  className="w-full h-full object-cover"
                />
              )}
              
              {/* Canvas caché pour la capture */}
              <canvas ref={canvasRef} className="hidden" />
            </div>

            {/* Controls */}
            <div className="flex justify-center gap-3">
              {!capturedImage ? (
                <>
                  <Button
                    variant="outline"
                    onClick={switchCamera}
                    className="gap-2"
                  >
                    <RotateCw className="h-4 w-4" />
                    Changer de caméra
                  </Button>
                  <Button
                    onClick={capturePhoto}
                    className="gap-2"
                    size="lg"
                  >
                    <Camera className="h-5 w-5" />
                    Prendre la photo
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    onClick={retakePhoto}
                    className="gap-2"
                  >
                    <RotateCw className="h-4 w-4" />
                    Reprendre
                  </Button>
                  <Button
                    onClick={confirmPhoto}
                    className="gap-2"
                    size="lg"
                  >
                    <Check className="h-5 w-5" />
                    Utiliser cette photo
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CameraCapture;
