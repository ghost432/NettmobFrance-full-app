import { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export const ProfileCompletionCard = ({ user, role }) => {
  const profileCompletion = useMemo(() => {
    if (!user?.profile) return { percentage: 0, missingFields: [], completedFields: [] };

    const profile = user.profile;
    const allFields = [];
    const completedFields = [];
    const missingFields = [];

    // Helper pour vérifier si un champ est rempli
    const isFieldComplete = (value, isArray) => {
      if (value === null || value === undefined) return false;

      if (isArray) {
        // Gérer les strings JSON ou les tableaux directs
        let arrayValue = value;
        if (typeof value === 'string' && value.trim()) {
          try {
            arrayValue = JSON.parse(value);
          } catch (e) {
            return false;
          }
        }
        return Array.isArray(arrayValue) && arrayValue.length > 0;
      }

      if (typeof value === 'string') return value.trim().length > 0;
      if (typeof value === 'number') return true;

      return !!value;
    };

    // Fonction pour traiter les champs
    const processFields = (fields) => {
      fields.forEach(field => {
        allFields.push(field.label);

        // Certains champs comme les photos peuvent être sur le user ou le profile
        let value = profile[field.key];

        // Fallback sur l'objet user si non trouvé sur profile (pour les photos par exemple)
        if (!isFieldComplete(value, field.isArray)) {
          value = user[field.key] || (user.profile ? user.profile[field.key] : null);
        }

        if (isFieldComplete(value, field.isArray)) {
          completedFields.push(field.label);
        } else {
          missingFields.push(field.label);
        }
      });
    };

    if (role === 'automob') {
      // Tous les champs importants pour automob (toutes sections)
      const fields = [
        // Section Informations personnelles
        { key: 'first_name', label: 'Prénom' },
        { key: 'last_name', label: 'Nom' },
        { key: 'gender', label: 'Genre' },
        { key: 'phone', label: 'Téléphone' },
        { key: 'iban', label: 'IBAN' },
        { key: 'bic_swift', label: 'BIC/SWIFT' },
        { key: 'address', label: 'Adresse' },
        { key: 'siret', label: 'SIRET' },
        { key: 'current_position', label: 'Poste actuel' },

        // Section Informations professionnelles
        { key: 'experience', label: 'Niveau d\'expérience' },
        { key: 'years_of_experience', label: 'Années d\'expérience' },
        { key: 'secteur_id', label: 'Secteur d\'activité' },
        { key: 'competence_ids', label: 'Compétences', isArray: true },
        { key: 'about_me', label: 'Description' },
        { key: 'work_areas', label: 'Zones de travail', isArray: true },

        // Photos
        { key: 'profile_picture', label: 'Photo de profil' },
        { key: 'cover_picture', label: 'Photo de couverture' },
      ];

      processFields(fields);

      // Section Disponibilité - Vérifier si au moins une disponibilité existe
      allFields.push('Disponibilités');
      const hasAvailabilities = profile.availabilities && Array.isArray(profile.availabilities) && profile.availabilities.length > 0;
      if (hasAvailabilities) {
        completedFields.push('Disponibilités');
      } else {
        missingFields.push('Disponibilités');
      }
    } else if (role === 'client') {
      // Tous les champs importants pour client (toutes sections)
      const fields = [
        // Section Informations personnelles
        { key: 'company_name', label: 'Nom de l\'entreprise' },
        { key: 'first_name', label: 'Prénom du gérant' },
        { key: 'last_name', label: 'Nom du gérant' },
        { key: 'manager_position', label: 'Poste du gérant' },
        { key: 'phone', label: 'Téléphone' },
        { key: 'address', label: 'Adresse complète' },

        // Section Informations entreprise
        { key: 'siret', label: 'SIRET' },
        { key: 'secteur_id', label: 'Secteur d\'activité' },
        { key: 'competence_ids', label: 'Profils recherchés', isArray: true },
        { key: 'company_description', label: 'Description de l\'entreprise' },
        { key: 'work_areas', label: 'Villes pour vos missions', isArray: true },

        // Photos
        { key: 'profile_picture', label: 'Photo de profil' },
        { key: 'cover_picture', label: 'Photo de couverture' },
      ];

      processFields(fields);
    }

    const percentage = allFields.length > 0
      ? Math.round((completedFields.length / allFields.length) * 100)
      : 0;

    return { percentage, missingFields, completedFields };
  }, [user, role]);

  if (!user?.profile) return null;

  const isComplete = profileCompletion.percentage === 100;

  // Gestion de l'état réduit (dismissed) quand le profil est complet
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    if (user?.id) {
      const dismissedState = localStorage.getItem(`profile_card_dismissed_${user.id}`);
      if (dismissedState === 'true') {
        setIsDismissed(true);
      }
    }
  }, [user?.id]);

  const handleDismiss = () => {
    setIsDismissed(true);
    if (user?.id) {
      localStorage.setItem(`profile_card_dismissed_${user.id}`, 'true');
    }
  };

  // Si le profil est complet et la carte est réduite
  if (isComplete && isDismissed) {
    return (
      <div className="flex items-center gap-2 bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 px-4 py-3 rounded-lg border border-green-200 dark:border-green-800 shadow-sm">
        <CheckCircle2 className="h-5 w-5" />
        <span className="text-sm font-medium">Profil complet</span>
      </div>
    );
  }

  return (
    <Card className={cn(
      "border-2 relative",
      isComplete ? "border-green-500 bg-green-50 dark:bg-green-950/20" : "border-orange-500 bg-orange-50 dark:bg-orange-950/20"
    )}>
      {isComplete && (
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 text-green-700 hover:text-green-900 dark:text-green-400 dark:hover:text-green-200 transition-colors"
          title="Fermer"
        >
          <X className="h-5 w-5" />
        </button>
      )}
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            {isComplete ? (
              <>
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                Profil complet !
              </>
            ) : (
              <>
                <AlertCircle className="h-5 w-5 text-orange-600" />
                Profil à {profileCompletion.percentage}%
              </>
            )}
          </CardTitle>
        </div>
        <CardDescription>
          {isComplete
            ? "Excellent ! Votre profil est entièrement rempli."
            : (
              <span>
                Complétez votre profil pour maximiser vos opportunités.{' '}
                <Link to={`/${role}/profile`} className="font-semibold text-blue-600 dark:text-blue-400 hover:underline inline-block mt-1">
                  Compléter mon profil →
                </Link>
              </span>
            )
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isComplete ? (
          /* Message simple quand profil complet */
          <div className="text-center py-2">
            <p className="text-sm text-green-700 dark:text-green-400">
              ✅ Votre profil est complet et visible par {role === 'automob' ? 'les entreprises' : 'les auto-entrepreneurs'}
            </p>
          </div>
        ) : (
          /* Affichage détaillé quand profil incomplet */
          <div className="space-y-4">
            {/* Barre de progression */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium">Progression</span>
                <span className="font-bold">{profileCompletion.percentage}%</span>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full transition-all duration-500 bg-orange-500"
                  style={{ width: `${profileCompletion.percentage}%` }}
                />
              </div>
            </div>

            {/* Liste des champs manquants */}
            {profileCompletion.missingFields.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  Champs manquants ({profileCompletion.missingFields.length}) :
                </p>
                <ul className="space-y-1 max-h-48 overflow-y-auto">
                  {profileCompletion.missingFields.map((field, index) => (
                    <li key={index} className="text-xs sm:text-sm flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-orange-500 flex-shrink-0" />
                      <span className="break-words">{field}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
