// Test d'extraction de ville depuis une adresse

const testAddresses = [
  "24 Avenue Du Prado, 13006 Marseille, France",
  "10 Rue de la République, 75001 Paris, France",
  "5 Boulevard Victor Hugo, 69002 Lyon, France",
  "Rue du Commerce, Bordeaux, France",
  "123 Av. des Champs-Élysées, Paris, France"
];

function extractCity(address) {
  const addressParts = address.split(',').map(p => p.trim());
  let city = null;
  
  console.log('🔍 Extraction ville depuis adresse:', { address, addressParts });
  
  // Méthode 1: Chercher un pattern "CODE_POSTAL VILLE"
  for (const part of addressParts) {
    // Pattern: "13006 Marseille" ou "75001 Paris"
    const match = part.match(/^\d{5}\s+(.+)$/);
    if (match && match[1]) {
      city = match[1].trim();
      console.log('✅ Ville extraite via code postal:', city);
      break;
    }
  }
  
  // Méthode 2: Si pas trouvé, chercher un mot sans chiffre (sauf mots clés)
  if (!city) {
    const excludedWords = ['rue', 'avenue', 'boulevard', 'av', 'bd', 'france', 'entrée', 'etage', 'bâtiment'];
    
    for (const part of addressParts) {
      const lowerPart = part.toLowerCase();
      const hasNumber = /\d/.test(part);
      const isExcluded = excludedWords.some(word => lowerPart.includes(word));
      
      if (!hasNumber && !isExcluded && part.length > 2) {
        city = part.trim();
        console.log('✅ Ville extraite via mots clés:', city);
        break;
      }
    }
  }
  
  // Méthode 3: Prendre l'avant-dernière partie (avant "France")
  if (!city && addressParts.length >= 2) {
    const potentialCity = addressParts[addressParts.length - 2];
    // Nettoyer le code postal si présent
    const cleanedCity = potentialCity.replace(/^\d{5}\s*/, '').trim();
    if (cleanedCity && cleanedCity.length > 2) {
      city = cleanedCity;
      console.log('✅ Ville extraite via position (avant-dernière):', city);
    }
  }
  
  // Si toujours aucune ville, utiliser "France" par défaut
  if (!city) {
    city = 'France';
    console.warn('⚠️ Impossible d\'extraire la ville, utilisation de "France"');
  }
  
  return city;
}

console.log('\n🧪 ========== TEST EXTRACTION VILLE ==========\n');

testAddresses.forEach((address, index) => {
  console.log(`\n--- Test ${index + 1} ---`);
  const city = extractCity(address);
  console.log(`📍 Résultat final: "${city}"\n`);
});

console.log('\n✅ Tests terminés\n');
