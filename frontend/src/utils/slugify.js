/**
 * Convertit un texte en slug URL-friendly
 * @param {string} text - Le texte à convertir
 * @returns {string} Le slug généré
 */
export const slugify = (text) => {
  if (!text) return '';
  
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD') // Décompose les caractères accentués
    .replace(/[\u0300-\u036f]/g, '') // Supprime les accents
    .replace(/[^a-z0-9\s-]/g, '') // Supprime les caractères spéciaux
    .trim()
    .replace(/\s+/g, '-') // Remplace les espaces par des tirets
    .replace(/-+/g, '-'); // Remplace les tirets multiples par un seul
};

/**
 * Crée un slug unique en combinant le nom et l'ID
 * @param {string} name - Le nom de la mission
 * @param {number} id - L'ID de la mission
 * @returns {string} Le slug unique
 */
export const createMissionSlug = (name, id) => {
  const slug = slugify(name);
  return `${slug}-${id}`;
};

/**
 * Extrait l'ID d'un slug de mission
 * @param {string} slug - Le slug contenant l'ID
 * @returns {number|null} L'ID extrait ou null si invalide
 */
export const extractIdFromSlug = (slug) => {
  if (!slug) return null;
  const parts = slug.split('-');
  const id = parseInt(parts[parts.length - 1], 10);
  return isNaN(id) ? null : id;
};
