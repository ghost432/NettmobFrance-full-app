import express from 'express';
import fetch from 'node-fetch';

const router = express.Router();

// Route proxy pour Google Places Autocomplete API
// Nécessaire car l'API Google Places ne supporte pas les requêtes CORS directes depuis le navigateur
router.get('/google-places-proxy', async (req, res) => {
  try {
    const { input } = req.query;
    
    if (!input || input.length < 3) {
      return res.json({ predictions: [] });
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.error('❌ [Geocoding] GOOGLE_MAPS_API_KEY non configurée dans .env');
      return res.status(500).json({ 
        error: 'Configuration manquante',
        message: 'La clé API Google Maps n\'est pas configurée sur le serveur'
      });
    }

    console.log('🔍 [Geocoding] Recherche Google Places:', input);

    // Appel à l'API Google Places Autocomplete
    const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&components=country:fr&language=fr&key=${apiKey}`;
    
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'OK') {
      console.log('✅ [Geocoding] Suggestions trouvées:', data.predictions?.length || 0);
      res.json(data);
    } else if (data.status === 'ZERO_RESULTS') {
      console.log('⚠️ [Geocoding] Aucun résultat pour:', input);
      res.json({ predictions: [] });
    } else if (data.status === 'REQUEST_DENIED') {
      console.error('❌ [Geocoding] Clé API invalide ou API non activée:', data.error_message);
      return res.status(403).json({ 
        error: 'Accès refusé',
        message: data.error_message || 'Clé API Google Maps invalide ou API Places non activée'
      });
    } else {
      console.error('❌ [Geocoding] Erreur API Google:', data.status, data.error_message);
      return res.status(500).json({ 
        error: 'Erreur API',
        message: data.error_message || 'Erreur lors de la recherche d\'adresse'
      });
    }
  } catch (error) {
    console.error('❌ [Geocoding] Erreur serveur:', error);
    res.status(500).json({ 
      error: 'Erreur serveur',
      message: 'Une erreur est survenue lors de la recherche d\'adresse'
    });
  }
});

// Route pour obtenir les détails d'un lieu (si nécessaire plus tard)
router.get('/google-place-details', async (req, res) => {
  try {
    const { place_id } = req.query;
    
    if (!place_id) {
      return res.status(400).json({ error: 'place_id requis' });
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ 
        error: 'Configuration manquante',
        message: 'La clé API Google Maps n\'est pas configurée sur le serveur'
      });
    }

    console.log('📍 [Geocoding] Détails du lieu:', place_id);

    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place_id}&fields=formatted_address,geometry,address_components&language=fr&key=${apiKey}`;
    
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'OK') {
      console.log('✅ [Geocoding] Détails récupérés');
      res.json(data);
    } else {
      console.error('❌ [Geocoding] Erreur détails:', data.status, data.error_message);
      return res.status(500).json({ 
        error: 'Erreur API',
        message: data.error_message || 'Erreur lors de la récupération des détails'
      });
    }
  } catch (error) {
    console.error('❌ [Geocoding] Erreur serveur:', error);
    res.status(500).json({ 
      error: 'Erreur serveur',
      message: 'Une erreur est survenue lors de la récupération des détails'
    });
  }
});

export default router;
