import express from 'express';
import { sendBulkSMS } from '../services/twilioService.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

// Endpoint de test pour vérifier l'envoi SMS
router.post('/test-sms', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { phoneNumbers, message } = req.body;
    
    if (!phoneNumbers || !Array.isArray(phoneNumbers) || phoneNumbers.length === 0) {
      return res.status(400).json({ 
        error: 'Numéros de téléphone requis (array)',
        example: { phoneNumbers: ["+33612345678", "0698765432"], message: "Test message" }
      });
    }
    
    if (!message || message.trim() === '') {
      return res.status(400).json({ 
        error: 'Message requis',
        example: { phoneNumbers: ["+33612345678"], message: "Test SMS NettmobFrance" }
      });
    }
    
    console.log(`🧪 [Test SMS] Envoi vers ${phoneNumbers.length} numéros:`);
    phoneNumbers.forEach(phone => {
      console.log(`   - ${phone}`);
    });
    
    const result = await sendBulkSMS(phoneNumbers, message);
    
    console.log(`✅ [Test SMS] Résultat: ${result.success}/${result.total} envoyés`);
    
    res.json({
      success: true,
      message: 'Test SMS terminé',
      result: {
        total: result.total,
        success: result.success,
        failed: result.failed,
        errors: result.errors
      }
    });
    
  } catch (error) {
    console.error('❌ [Test SMS] Erreur:', error);
    res.status(500).json({ 
      error: 'Erreur lors du test SMS',
      details: error.message 
    });
  }
});

// Endpoint pour vérifier la configuration Twilio
router.get('/twilio-config', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { checkTwilioConfig } = await import('../services/twilioService.js');
    const config = checkTwilioConfig();
    
    res.json({
      success: true,
      configuration: config,
      environment: {
        TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID ? '✅ Configuré' : '❌ Manquant',
        TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN ? '✅ Configuré' : '❌ Manquant', 
        TWILIO_MESSAGING_SERVICE_SID: process.env.TWILIO_MESSAGING_SERVICE_SID ? '✅ Configuré' : '❌ Manquant',
        TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER ? '✅ Configuré' : '❌ Manquant'
      }
    });
    
  } catch (error) {
    console.error('❌ [Config Twilio] Erreur:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la vérification de la configuration',
      details: error.message 
    });
  }
});

export default router;
