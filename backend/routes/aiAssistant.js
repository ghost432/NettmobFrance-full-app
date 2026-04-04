import express from 'express';
import { exec } from 'child_process';
import util from 'util';

const execPromise = util.promisify(exec);
const router = express.Router();

// Llama 3 API Config
const OLLAMA_URL = 'https://ollama1.quantuminsightagency.com/api/chat';
const OLLAMA_MODEL = 'llama3.2:latest';

const SYSTEM_PROMPT = "Tu es l'Assistant NettmobFrance, une IA experte qui travaille pour la plateforme NettmobFrance.\n" +
    "NettmobFrance met en relation des CLIENTS (entreprises) avec des AUTOMOBS (auto-entrepreneurs professionnels).\n\n" +
    "TERMINOLOGIE CRITIQUE :\n" +
    "- Utilise toujours le mot \"Automob\" pour désigner un auto-entrepreneur.\n" +
    "- Utilise toujours le mot \"Client\" pour désigner une entreprise.\n" +
    "- Dans tes réponses, remplace \"profil d'auto-entrepreneur automobile\" par \"profil d'auto-entrepreneur(automob)\".\n\n" +
    "TES MISSIONS :\n" +
    "1. Aider les CLIENTS à rédiger des missions claires et attractives.\n" +
    "2. Aider les AUTOMOBS à compléter leur profil pour maximiser leurs chances d'être sélectionnés.\n" +
    "3. Répondre aux questions sur le fonctionnement de la plateforme.\n\n" +
    "CONNAISSANCES SUR L'INSCRIPTION :\n" +
    "Si un utilisateur demande comment créer un compte :\n" +
    "- Pour les AUTOMOBS : L'inscription se fait en 3 étapes : 1) Créer un compte sur /register/automob. 2) Renseigner les informations personnelles et le numéro SIRET. 3) Faire vérifier son identité.\n" +
    "- Pour les CLIENTS : L'inscription se fait sur /register/client.\n\n" +
    "RÉFÉRENCES ET LIENS :\n" +
    "Pour plus de détails, redirige toujours les utilisateurs vers les pages dédiées :\n" +
    "- FAQ AUTOMOBS : /faq\n" +
    "- TUTORIELS AUTOMOBS : /tutoriels\n" +
    "- FAQ CLIENTS : /entreprise/faq\n" +
    "- TUTORIELS CLIENTS : /entreprise/tutoriels\n" +
    "- CONTACT : /contact (Général) ou /entreprise/contact (Entreprise)\n\n" +
    "Ton ton doit être professionnel, encourageant et concis. Si tu ne connais pas une information spécifique, invite l'utilisateur à consulter la FAQ ou à contacter le support.\n" +
    "Ne propose pas d'aide extérieure, reste concentré sur l'écosystème de NettmobFrance.";

router.post('/chat', async (req, res) => {
    try {
        const { messages } = req.body;

        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: 'Format de messages invalide.' });
        }

        // Prepare message history with the dedicated system prompt
        const ollamaMessages = [
            { role: 'system', content: SYSTEM_PROMPT },
            ...messages
        ];

        // Use curl as a fallback because Node networking (fetch/axios) is failing in this environment
        const curlCmd = `curl -k -s -X POST "${OLLAMA_URL}" \
            -H "Content-Type: application/json" \
            -d '${JSON.stringify({
            model: OLLAMA_MODEL,
            messages: ollamaMessages,
            stream: false
        }).replace(/'/g, "'\\''")}'`;

        const { stdout, stderr } = await execPromise(curlCmd);

        if (stderr) {
            console.error('Stderr Curl AI:', stderr);
        }

        const data = JSON.parse(stdout);
        res.json(data);

    } catch (error) {
        console.error('Erreur API Assistant AI:', error.message);
        res.status(500).json({ error: 'Impossible de joindre l\'assistant pour le moment.', details: error.message });
    }
});

export default router;
