import express from 'express';
import { exec } from 'child_process';
import util from 'util';
import axios from 'axios';
import https from 'https';
import jwt from 'jsonwebtoken';
import { authenticateToken } from '../middleware/auth.js';
import db from '../config/database.js';

const execPromise = util.promisify(exec);
const router = express.Router();

// Llama 3 API Config
const OLLAMA_URL = process.env.OLLAMA_PROXY_URL || 'https://ollama1.quantuminsightagency.com/api/chat';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2:latest';

console.log('🤖 AI Assistant Config:', { OLLAMA_URL, OLLAMA_MODEL });

function buildSystemPrompt(userContext) {
  const role = userContext?.role || 'inconnu';
  const firstName = userContext?.firstName || '';

  let contextBlock = '';

  if (userContext) {
    contextBlock = `\n\nCONTEXTE UTILISATEUR ACTUEL :\n`;
    contextBlock += `- Rôle : ${role}\n`;
    if (firstName) contextBlock += `- Prénom : ${firstName}\n`;

    if (role === 'automob') {
      if (userContext.walletBalance !== undefined) {
        contextBlock += `- Solde wallet : ${userContext.walletBalance}€\n`;
      }
      if (userContext.missionCount !== undefined) {
        contextBlock += `- Nombre de missions actives : ${userContext.missionCount}\n`;
      }
      if (userContext.pendingWithdrawals !== undefined) {
        contextBlock += `- Demandes de retrait en attente : ${userContext.pendingWithdrawals}\n`;
      }
    }

    if (role === 'client') {
      if (userContext.activeMissions !== undefined) {
        contextBlock += `- Missions actives : ${userContext.activeMissions}\n`;
      }
      if (userContext.pendingTimesheets !== undefined) {
        contextBlock += `- Feuilles de temps à approuver : ${userContext.pendingTimesheets}\n`;
      }
    }
  }

  return (
    `Tu es l'Assistant NettmobFrance, une IA experte qui travaille pour la plateforme NettmobFrance.\n` +
    `NettmobFrance met en relation des CLIENTS (entreprises) avec des AUTOMOBS (auto-entrepreneurs professionnels).\n` +
    contextBlock +
    `\nTERMINOLOGIE ET RÈGLES CRITIQUES :\n` +
    `- Pour désigner un auto-entrepreneur, utilise UNIQUEMENT le mot "Automob".\n` +
    `- Pour désigner une entreprise, utilise UNIQUEMENT le mot "Client".\n` +
    `- INTERDICTION : N'utilise jamais le mot "automatisme". Si tu veux dire auto-entrepreneur, dis "Automob".\n` +
    `- Ne dis JAMAIS "auto-entrepreneur automobile", dis "auto-entrepreneur(automob)" ou simplement "Automob".\n\n` +
    `TES MISSIONS :\n` +
    `1. Aider les CLIENTS à rédiger et gérer leurs missions.\n` +
    `2. Aider les AUTOMOBS à compléter leur profil, soumettre leurs heures, et gérer leur wallet.\n` +
    `3. Guider les utilisateurs vers les bonnes pages du site.\n` +
    `4. Répondre avec précision aux questions sur la plateforme en utilisant le contexte utilisateur fourni.\n\n` +

    `=== GUIDE DE NAVIGATION DE LA PLATEFORME ===\n\n` +

    `--- ESPACE AUTOMOB ---\n` +
    `- Tableau de bord : /automob/dashboard\n` +
    `- Mon profil : /automob/profile\n` +
    `- Mes missions disponibles : /automob/missions\n` +
    `- Mes missions en cours et historique : /automob/my-missions\n` +
    `- Mes feuilles de temps (pointages) : /automob/timesheets\n` +
    `- Mes factures : /automob/invoices\n` +
    `- Mon wallet : /automob/wallet\n` +
    `- Mes avis reçus : /automob/reviews\n` +
    `- Documents et vérification : /automob/documents\n\n` +

    `COMMENT FAIRE UN RETRAIT WALLET (AUTOMOB) :\n` +
    `1. Aller sur /automob/wallet (cliquer sur "Wallet" dans le menu de gauche).\n` +
    `2. Vérifier que le solde est suffisant.\n` +
    `3. Cliquer sur le bouton "Demander un retrait".\n` +
    `4. Remplir le formulaire : montant, méthode de paiement (virement bancaire ou autre), coordonnées bancaires (IBAN, BIC).\n` +
    `5. Soumettre la demande. Elle est ensuite traitée par l'équipe NettmobFrance sous 48-72h ouvrées.\n` +
    `6. Suivre le statut de la demande directement sur /automob/wallet.\n\n` +

    `COMMENT SOUMETTRE SES HEURES (AUTOMOB) :\n` +
    `1. Aller sur /automob/my-missions.\n` +
    `2. Cliquer sur "Nouveau pointage" à côté de la mission.\n` +
    `3. Renseigner les jours, heures travaillées.\n` +
    `4. Cliquer sur "Soumettre au client".\n` +
    `5. Le client reçoit une notification pour approuver la feuille de temps.\n` +
    `6. Une fois approuvée, la facture est générée automatiquement et le wallet est crédité.\n\n` +

    `--- ESPACE CLIENT ---\n` +
    `- Tableau de bord : /client/dashboard\n` +
    `- Mes missions : /client/missions\n` +
    `- Créer une mission : /client/missions/create\n` +
    `- Candidatures reçues : /client/missions/:id/applications\n` +
    `- Feuilles de temps à approuver : /client/timesheets\n` +
    `- Mes factures : /client/invoices\n` +
    `- Mon profil entreprise : /client/profile\n` +
    `- Mon équipe : /client/team\n\n` +

    `COMMENT APPROUVER UNE FEUILLE DE TEMPS (CLIENT) :\n` +
    `1. Aller sur /client/timesheets ou sur le tableau de bord /client/dashboard.\n` +
    `2. Le badge indique le nombre de feuilles en attente d'approbation.\n` +
    `3. Cliquer sur la feuille de temps à examiner.\n` +
    `4. Vérifier les heures soumises par l'Automob.\n` +
    `5. Cliquer sur "Approuver" ou "Refuser" avec un commentaire.\n` +
    `6. Une fois approuvée, la facture est générée automatiquement.\n\n` +

    `COMMENT MARQUER UNE MISSION COMME TERMINÉE (CLIENT) :\n` +
    `1. Aller sur /client/missions.\n` +
    `2. Cliquer sur la mission concernée.\n` +
    `3. Cliquer sur "Marquer comme terminée" pour chaque Automob.\n` +
    `4. Vous pouvez laisser un avis étoilé (1-5) et un commentaire.\n` +
    `5. La mission passe automatiquement au statut "Terminée" quand tous les Automobs ont fini.\n\n` +

    `--- FONCTIONNALITÉS COMMUNES ---\n` +
    `- Messagerie / Chat : disponible dans l'interface.\n` +
    `- Notifications : icône en haut à droite.\n` +
    `- Support : /contact ou /entreprise/contact.\n\n` +

    `INSCRIPTION ET LIENS DIRECTS :\n` +
    `- Pour les AUTOMOBS : /register/automob. Étapes : 1) Compte. 2) Infos + SIRET. 3) Vérification identité.\n` +
    `- Pour les CLIENTS : /register/client.\n\n` +

    `RESSOURCES :\n` +
    `- FAQ Automobs : /faq\n` +
    `- Tutoriels Automobs : /tutoriels\n` +
    `- FAQ Clients : /entreprise/faq\n` +
    `- Tutoriels Clients : /entreprise/tutoriels\n\n` +

    `RÈGLE ABSOLUE POUR LES LIENS URL :\n` +
    `Tous les liens complets vers le site web que tu proposes doivent IMPÉRATIVEMENT commencer par "https://www.nettmobfrance.fr".\n` +
    `Il est strictement INTERDIT d'utiliser "www.nettmob.fr", "nettmob.fr" ou tout autre domaine. Le seul domaine valide est www.nettmobfrance.fr.\n\n` +

    `Ton ton est professionnel, concis et dynamique. Réponds toujours en français. Ne propose pas d'aide hors de NettmobFrance.`
  );
}

/**
 * Récupérer le contexte de l'utilisateur connecté pour enrichir l'Assistant
 */
async function getUserContext(userId, role) {
  try {
    const ctx = { role };

    if (!userId) return ctx;

    if (role === 'automob') {
      // Profil
      const [profile] = await db.query(
        'SELECT first_name FROM automob_profiles WHERE user_id = ?',
        [userId]
      );
      if (profile[0]) ctx.firstName = profile[0].first_name;

      // Wallet
      const [wallet] = await db.query(
        'SELECT balance FROM wallets WHERE automob_id = ?',
        [userId]
      );
      ctx.walletBalance = wallet[0] ? parseFloat(wallet[0].balance).toFixed(2) : '0.00';

      // Missions actives
      const [missions] = await db.query(
        `SELECT COUNT(*) as count FROM mission_applications ma
         JOIN missions m ON ma.mission_id = m.id
         WHERE ma.automob_id = ? AND ma.status = 'accepte' AND m.status = 'en_cours'`,
        [userId]
      );
      ctx.missionCount = missions[0]?.count || 0;

      // Retraits en attente
      const [withdrawals] = await db.query(
        `SELECT COUNT(*) as count FROM withdrawal_requests WHERE automob_id = ? AND status = 'pending'`,
        [userId]
      );
      ctx.pendingWithdrawals = withdrawals[0]?.count || 0;

    } else if (role === 'client') {
      // Profil
      const [profile] = await db.query(
        'SELECT first_name FROM client_profiles WHERE user_id = ?',
        [userId]
      );
      if (profile[0]) ctx.firstName = profile[0].first_name;

      // Missions actives
      const [missions] = await db.query(
        `SELECT COUNT(*) as count FROM missions WHERE client_id = ? AND status = 'en_cours'`,
        [userId]
      );
      ctx.activeMissions = missions[0]?.count || 0;

      // Feuilles de temps en attente
      const [timesheets] = await db.query(
        `SELECT COUNT(*) as count FROM timesheets ts
         JOIN missions m ON ts.mission_id = m.id
         WHERE m.client_id = ? AND ts.status = 'soumis'`,
        [userId]
      );
      ctx.pendingTimesheets = timesheets[0]?.count || 0;
    }

    return ctx;
  } catch (error) {
    console.error('Erreur récupération contexte IA:', error.message);
    return { role };
  }
}

// Route publique (pas de token requis, contexte optionnel)
router.post('/chat', async (req, res) => {
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Format de messages invalide.' });
    }

    // Essayer de décoder le token pour enrichir le contexte (optionnel)
    let userContext = null;
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        userContext = await getUserContext(decoded.id, decoded.role);
      } catch (e) {
        // Token invalide ou absent — continuer sans contexte
      }
    }

    const systemPrompt = buildSystemPrompt(userContext);
    const ollamaMessages = [
      { role: 'system', content: systemPrompt },
      ...messages
    ];

    try {
      console.log('📤 Sending request to Ollama:', OLLAMA_URL);
      
      const httpsAgent = new https.Agent({
        rejectUnauthorized: false
      });

      const response = await axios.post(OLLAMA_URL, {
        model: OLLAMA_MODEL,
        messages: ollamaMessages,
        stream: false
      }, {
        timeout: 60000,
        headers: { 'Content-Type': 'application/json' },
        httpsAgent: httpsAgent
      });

      if (response.data) {
        return res.json(response.data);
      }
    } catch (error) {
      console.error('Axios AI error:', error.message);
      if (error.response) {
        console.error('Ollama response details:', error.response.data);
      }
      return res.status(500).json({ 
        error: "L'assistant est indisponible pour le moment.", 
        details: error.message 
      });
    }

  } catch (error) {
    console.error('Erreur API Assistant AI:', error.message);
    res.status(500).json({ 
      error: "L'assistant est indisponible pour le moment.", 
      details: error.message 
    });
  }
});

export default router;
