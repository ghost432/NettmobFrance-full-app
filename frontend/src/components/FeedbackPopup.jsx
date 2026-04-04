import { useState, useEffect, useRef } from 'react';
import { X, Star, MessageCircle, Send, Lightbulb } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { toast } from './ui/toast';
import api from '@/lib/api';

export const FeedbackPopup = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [suggestions, setSuggestions] = useState('');
  const [category, setCategory] = useState('general');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const contentRef = useRef(null);

  const categories = [
    { value: 'general', label: '🎯 Général', desc: 'Impression générale' },
    { value: 'performance', label: '⚡ Performance', desc: 'Vitesse, lenteurs' },
    { value: 'interface', label: '🎨 Interface', desc: 'Design, ergonomie' },
    { value: 'fonctionnalites', label: '🛠️ Fonctionnalités', desc: 'Nouvelles options' },
    { value: 'bugs', label: '🐛 Problèmes', desc: 'Erreurs rencontrées' }
  ];

  // Vérifier si le popup doit être affiché
  useEffect(() => {
    const checkShouldShow = async () => {
      try {
        const response = await api.get('/feedback/should-show-popup');
        setIsVisible(response.data.shouldShow);
      } catch (error) {
        console.error('Erreur vérification popup feedback:', error);
        // Ne pas afficher en cas d'erreur pour éviter de spammer l'utilisateur
        setIsVisible(false);
      }
    };

    checkShouldShow();
  }, []);

  // S'assurer qu'on est bien en haut du formulaire à l'ouverture
  useEffect(() => {
    if (isExpanded) {
      setTimeout(() => {
        if (contentRef.current) {
          contentRef.current.scrollTo({ top: 0, behavior: 'auto' });
        }
      }, 0);
    }
  }, [isExpanded]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (rating === 0) {
      toast.error('Veuillez donner une note');
      return;
    }

    if (!feedback.trim()) {
      toast.error('Veuillez laisser un commentaire');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await api.post('/feedback/submit', {
        rating,
        feedback: feedback.trim(),
        suggestions: suggestions.trim() || null,
        category
      });

      toast.success('Merci pour votre avis ! 🙏', {
        description: response.data.message || 'Vos commentaires nous aident à améliorer NettMobFrance'
      });

      // Cacher le popup définitivement
      setIsVisible(false);
    } catch (error) {
      console.error('Erreur soumission feedback:', error);
      const errorMessage = error.response?.data?.error || 'Erreur lors de l\'envoi de votre avis';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setIsVisible(false);
  };

  const handleMinimize = () => {
    setIsExpanded(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed top-24 right-4 md:top-28 md:right-8 z-50 max-w-[95vw] md:max-w-[560px]">
      {!isExpanded ? (
        // Version minimisée - Bouton flottant avec message visible
        <div className="relative group flex flex-col items-end">
          {/* Message toujours visible en dessous de l'icône */}
          <div className="absolute top-full right-0 mt-3 p-3 md:px-4 md:py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs md:text-sm font-medium rounded-lg shadow-lg animate-bounce w-56 md:w-max z-50">
            <div className="flex items-start md:items-center gap-2">
              <MessageCircle className="h-4 w-4 shrink-0 mt-0.5 md:mt-0" />
              <span className="leading-snug">Donne ton avis sur cette nouvelle version de nettmobfrance 😊</span>
            </div>
            {/* Flèche pointant vers le bouton */}
            <div className="absolute bottom-full right-4 -mb-1">
              <div className="border-8 border-transparent border-b-purple-600"></div>
            </div>
          </div>
          
          <Button
            onClick={() => setIsExpanded(true)}
            className="h-12 w-12 md:h-14 md:w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 animate-pulse bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 flex items-center justify-center p-0"
            title="Donne ton avis sur cette nouvelle version de nettmobfrance 😊"
          >
            <MessageCircle className="h-5 w-5 md:h-6 md:w-6 text-white shrink-0" />
          </Button>
        </div>
      ) : (
        // Version étendue - Formulaire complet
        <Card className="w-[520px] max-w-[92vw] max-h-[80vh] flex flex-col shadow-xl border-2 border-blue-200 dark:border-blue-800 animate-in slide-in-from-top-4 duration-300">
          <CardHeader className="pb-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/50 dark:to-purple-950/50 rounded-t-lg shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-blue-600" />
                  Votre avis compte !
                </CardTitle>
                <CardDescription className="mt-1">
                  Partagez votre expérience avec la nouvelle version
                </CardDescription>
              </div>
              <div className="flex gap-1">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleMinimize}
                  className="h-8 w-8 p-0 hover:bg-white/50"
                >
                  <span className="text-lg leading-none">−</span>
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleClose}
                  className="h-8 w-8 p-0 hover:bg-white/50"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent ref={contentRef} className="p-4 space-y-4 overflow-y-auto max-h-[70vh]">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Évaluation par étoiles */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Note générale *
                </label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="p-1 hover:scale-110 transition-transform"
                    >
                      <Star
                        className={`h-7 w-7 ${
                          star <= (hoverRating || rating)
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                {rating > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {rating === 1 && '😞 Très déçu'}
                    {rating === 2 && '😐 Déçu'}
                    {rating === 3 && '🙂 Correct'}
                    {rating === 4 && '😊 Satisfait'}
                    {rating === 5 && '🤩 Excellent !'}
                  </p>
                )}
              </div>

              {/* Catégorie */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Sujet principal
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {categories.map((cat) => (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => setCategory(cat.value)}
                      className={`p-2 text-left rounded-lg border transition-colors ${
                        category === cat.value
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{cat.label}</span>
                        {category === cat.value && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{cat.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Commentaire */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Votre commentaire *
                </label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Partagez votre expérience, ce qui vous plaît ou ce qui pourrait être amélioré..."
                  className="w-full h-28 p-3 border rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  maxLength={2000}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {feedback.length}/2000 caractères
                </p>
              </div>

              {/* Suggestions */}
              <div>
                <label className="text-sm font-medium mb-2 block flex items-center gap-1">
                  <Lightbulb className="h-4 w-4 text-yellow-500" />
                  Suggestions d'amélioration
                </label>
                <textarea
                  value={suggestions}
                  onChange={(e) => setSuggestions(e.target.value)}
                  placeholder="Avez-vous des idées pour améliorer NettMobFrance ?"
                  className="w-full h-24 p-3 border rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  maxLength={2000}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {suggestions.length}/2000 caractères (optionnel)
                </p>
              </div>

              {/* Boutons */}
              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  className="flex-1"
                >
                  Plus tard
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || rating === 0 || !feedback.trim()}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Envoi...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Send className="h-4 w-4" />
                      Envoyer
                    </div>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
