import { useState, useEffect, useRef } from 'react';
import { MapPin } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const AddressAutocomplete = ({ 
  value, 
  onChange, 
  label = "Adresse complète", 
  placeholder = "Ex: 12 rue de la Paix, 75002 Paris",
  required = false,
  className = ""
}) => {
  const [suggestions, setSuggestions] = useState([]);
  const [isValid, setIsValid] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [apiError, setApiError] = useState(false);
  const debounceRef = useRef(null);

  const searchAddress = async (query) => {
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }

    const token = import.meta.env.VITE_MAPBOX_TOKEN;
    if (!token) {
      console.warn('⚠️ [AddressAutocomplete] VITE_MAPBOX_TOKEN manquante - Mode saisie manuelle');
      setApiError(true);
      return;
    }

    try {
      console.log('🔍 [AddressAutocomplete] Recherche Mapbox:', query);
      
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?country=FR&limit=5&access_token=${token}`;
      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          console.warn('⚠️ [AddressAutocomplete] Token Mapbox invalide - Mode saisie manuelle activé');
          console.log('💡 Vérifiez votre token sur: https://account.mapbox.com/access-tokens/');
          setApiError(true);
          return;
        }
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      setSuggestions(data.features || []);
      console.log('✅ [AddressAutocomplete] Suggestions Mapbox:', data.features?.length || 0);
      setApiError(false);
    } catch (error) {
      console.error('❌ [AddressAutocomplete] Erreur Mapbox:', error);
      setApiError(true);
      setSuggestions([]);
    }
  };

  const validateAddressFrance = (address) => {
    if (!address || address.length < 10) return false;
    // Vérifier qu'il y a un code postal français (5 chiffres)
    const hasPostalCode = /\d{5}/.test(address);
    // Vérifier qu'il y a au moins un chiffre (numéro de rue)
    const hasNumber = /\d+/.test(address);
    return hasPostalCode && hasNumber;
  };

  useEffect(() => {
    setIsValid(validateAddressFrance(value));
  }, [value]);

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    onChange(newValue);

    // Debounce search
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      searchAddress(newValue);
    }, 300);
  };

  const handleSelectSuggestion = (suggestion) => {
    onChange(suggestion.place_name);
    setSuggestions([]);
    setIsFocused(false);
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <Label>
          {label} {required && <span className="text-destructive">*</span>}
        </Label>
      )}
      
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
        
        <Input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={handleInputChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            // Delay to allow click on suggestions
            setTimeout(() => setIsFocused(false), 200);
          }}
          className="pl-10"
          required={required}
        />

        {/* Suggestions dropdown */}
        {isFocused && suggestions.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-card border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleSelectSuggestion(suggestion)}
                className="w-full text-left px-4 py-3 hover:bg-accent transition-colors text-sm border-b last:border-b-0"
              >
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <span>{suggestion.place_name}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* API Error warning */}
      {apiError && (
        <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
          <span className="inline-block w-1 h-1 rounded-full bg-amber-600"></span>
          Autocomplétion désactivée - Saisissez l'adresse manuellement
        </p>
      )}

      {/* Validation messages */}
      {value && !isValid && !apiError && (
        <p className="text-xs text-destructive flex items-center gap-1">
          <span className="inline-block w-1 h-1 rounded-full bg-destructive"></span>
          L'adresse doit inclure un numéro de rue et un code postal français (5 chiffres)
        </p>
      )}
      
      {value && isValid && (
        <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
          <span className="inline-block w-1 h-1 rounded-full bg-green-600"></span>
          Format d'adresse valide
        </p>
      )}
    </div>
  );
};

export default AddressAutocomplete;
