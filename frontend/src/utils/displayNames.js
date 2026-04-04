/**
 * Utilitaires pour l'affichage des noms d'utilisateurs
 * Garantit qu'un nom est toujours affiché avec des fallbacks appropriés
 */

/**
 * Retourne le nom d'affichage d'un automob
 * @param {Object} automob - L'objet automob
 * @returns {string} Le nom à afficher (Prénom Nom, email, ou "Automob")
 */
export const getAutomobDisplayName = (automob) => {
  if (!automob) return 'Automob';
  
  // Essayer prénom + nom (plusieurs formats possibles)
  const firstName = automob.automob_first_name || automob.first_name;
  const lastName = automob.automob_last_name || automob.last_name;
  
  if (firstName && lastName) {
    return `${firstName} ${lastName}`;
  }
  
  // Fallback sur l'email
  const email = automob.automob_email || automob.email;
  if (email) {
    return email;
  }
  
  // Dernier fallback
  return 'Automob';
};

/**
 * Retourne le nom d'affichage d'un client
 * @param {Object} client - L'objet client
 * @returns {string} Le nom à afficher (Entreprise, Prénom Nom, email, ou "Client")
 */
export const getClientDisplayName = (client) => {
  if (!client) return 'Client';
  
  // Priorité au nom d'entreprise
  if (client.company_name) {
    return client.company_name;
  }
  
  // Ensuite prénom + nom
  const firstName = client.first_name;
  const lastName = client.last_name;
  
  if (firstName && lastName) {
    return `${firstName} ${lastName}`;
  }
  
  // Fallback sur l'email
  if (client.email) {
    return client.email;
  }
  
  // Dernier fallback
  return 'Client';
};

/**
 * Retourne les initiales d'un automob pour l'avatar
 * @param {Object} automob - L'objet automob
 * @returns {string} Les initiales (ex: "JD")
 */
export const getAutomobInitials = (automob) => {
  if (!automob) return 'A';
  
  const firstName = automob.automob_first_name || automob.first_name || '';
  const lastName = automob.automob_last_name || automob.last_name || '';
  
  if (firstName && lastName) {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  }
  
  const email = automob.automob_email || automob.email || '';
  if (email) {
    return email.charAt(0).toUpperCase();
  }
  
  return 'A';
};

/**
 * Retourne les initiales d'un client pour l'avatar
 * @param {Object} client - L'objet client
 * @returns {string} Les initiales (ex: "EA" pour Entreprise ABC)
 */
export const getClientInitials = (client) => {
  if (!client) return 'C';
  
  if (client.company_name) {
    const words = client.company_name.split(' ');
    if (words.length >= 2) {
      return `${words[0].charAt(0)}${words[1].charAt(0)}`.toUpperCase();
    }
    return client.company_name.substring(0, 2).toUpperCase();
  }
  
  const firstName = client.first_name || '';
  const lastName = client.last_name || '';
  
  if (firstName && lastName) {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  }
  
  if (client.email) {
    return client.email.charAt(0).toUpperCase();
  }
  
  return 'C';
};

/**
 * Retourne un nom d'affichage court (prénom ou début de l'email)
 * @param {Object} automob - L'objet automob
 * @returns {string} Le prénom ou début de l'email
 */
export const getAutomobShortName = (automob) => {
  if (!automob) return 'Automob';
  
  const firstName = automob.automob_first_name || automob.first_name;
  if (firstName) {
    return firstName;
  }
  
  const email = automob.automob_email || automob.email;
  if (email) {
    return email.split('@')[0];
  }
  
  return 'Automob';
};

/**
 * Retourne un nom d'affichage court pour un client
 * @param {Object} client - L'objet client
 * @returns {string} Le nom court ou début de l'email
 */
export const getClientShortName = (client) => {
  if (!client) return 'Client';
  
  if (client.company_name) {
    return client.company_name;
  }
  
  const firstName = client.first_name;
  if (firstName) {
    return firstName;
  }
  
  if (client.email) {
    return client.email.split('@')[0];
  }
  
  return 'Client';
};
