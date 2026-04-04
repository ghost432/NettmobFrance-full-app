import db from '../config/database.js';
import { sendEmail } from '../services/emailService.js';
import dotenv from 'dotenv';

dotenv.config();

const resendEmails = async () => {
    try {
        console.log('🚀 Démarrage de la régénération des emails de devis...');

        const [rows] = await db.query('SELECT * FROM devis_entreprise ORDER BY created_at DESC');

        console.log(`📊 Trouvé ${rows.length} demandes de devis.`);

        for (const devis of rows) {
            const { name, email, company, secteur, volume } = devis;

            console.log(`✉️ Préparation de l'email pour : ${name} (${company}) - ${email}`);

            const clientHtml = `
                <div style="font-family: 'Inter', 'Segoe UI', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                    <div style="background: linear-gradient(135deg, #a31a4d 0%, #83143d 100%); padding: 40px 20px; text-align: center;">
                        <div style="font-size: 28px; font-weight: 900; color: #ffffff; letter-spacing: 2px; text-transform: uppercase;">
                            NettmobFrance
                        </div>
                        <div style="color: #fecdd3; font-size: 14px; font-weight: 700; margin-top: 5px; text-transform: uppercase; letter-spacing: 1px;">Interim Digital & Logistique</div>
                    </div>
                    <div style="padding: 40px 30px;">
                        <h2 style="color: #1e293b; margin-top: 0; font-size: 22px; font-weight: 800;">Bonjour ${name},</h2>
                        <p style="font-size: 16px; color: #475569; line-height: 1.6;">Nous revenons vers vous concernant votre demande de devis pour <strong>${company}</strong>. Nous tenions à vous confirmer que votre dossier est en cours de traitement par nos experts.</p>
                        
                        <div style="background-color: #f8fafc; border-radius: 16px; padding: 30px; margin: 30px 0; border: 1px solid #e2e8f0;">
                            <h3 style="margin-top: 0; color: #a31a4d; font-size: 16px; font-weight: 800; text-transform: uppercase; border-bottom: 2px solid #a31a4d; padding-bottom: 8px; display: inline-block; margin-bottom: 20px;">Résumé de votre besoin</h3>
                            <table style="width: 100%; border-collapse: collapse;">
                                <tr>
                                    <td style="padding: 10px 0; color: #64748b; font-weight: 600; width: 45%;">Secteur d'activité :</td>
                                    <td style="padding: 10px 0; color: #1e293b; font-weight: 700;">${secteur}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 10px 0; color: #64748b; font-weight: 600;">Volume mensuel estimé :</td>
                                    <td style="padding: 10px 0; color: #1e293b; font-weight: 700;">${volume}</td>
                                </tr>
                            </table>
                        </div>

                        <div style="background-color: #ecfdf5; border-radius: 12px; padding: 25px; border-left: 5px solid #10b981; margin-bottom: 30px;">
                            <div style="display: flex; align-items: flex-start;">
                                <div style="margin-right: 15px; font-size: 24px;">🚀</div>
                                <div>
                                    <h4 style="margin: 0 0 5px 0; color: #065f46; font-size: 16px; font-weight: 800;">Note importante</h4>
                                    <p style="margin: 0; color: #064e3b; font-size: 15px; line-height: 1.5;">
                                        Ceci est un email de suivi automatique pour vous présenter notre nouvelle charte premium. Un conseiller expert reste à votre disposition.
                                    </p>
                                </div>
                            </div>
                        </div>
                        
                        <p style="margin-top: 40px; font-size: 16px; color: #475569; margin-bottom: 5px;">À très bientôt,</p>
                        <p style="color: #1e293b; font-weight: 900; font-size: 16px; margin: 0;">L'équipe commerciale NettmobFrance</p>
                    </div>
                    <div style="background-color: #f1f5f9; padding: 40px 30px; text-align: center; border-top: 1px solid #e2e8f0;">
                        <div style="margin-bottom: 25px;">
                            <a href="https://nettmobfrance.fr" style="display: inline-block; padding: 10px 20px; background-color: #ffffff; border: 1px solid #cbd5e1; border-radius: 8px; color: #475569; text-decoration: none; font-size: 14px; font-weight: 700; margin: 0 5px;">Visiter notre site</a>
                            <a href="https://nettmobfrance.fr/contact" style="display: inline-block; padding: 10px 20px; background-color: #ffffff; border: 1px solid #cbd5e1; border-radius: 8px; color: #475569; text-decoration: none; font-size: 14px; font-weight: 700; margin: 0 5px;">Nous contacter</a>
                        </div>
                        <p style="font-size: 11px; color: #94a3b8; margin: 0; font-weight: 500;">© ${new Date().getFullYear()} NettmobFrance. Tous droits réservés.</p>
                    </div>
                </div>
            `;

            // Utiliser l'email fourni par l'utilisateur ou l'email du formulaire
            let recipientEmail = email;
            if (email === 'test@test.com' || email.includes('test')) {
                recipientEmail = 'ulrichthierry47@gmail.com';
            }

            try {
                await sendEmail(
                    recipientEmail,
                    'Suivi de votre demande de devis - NettmobFrance',
                    clientHtml
                );
                console.log(`✅ Email renvoyé avec succès à ${recipientEmail}`);
            } catch (error) {
                console.error(`❌ Erreur envoi email à ${recipientEmail}:`, error.message);
            }

            // Petit délai pour éviter de saturer le serveur SMTP
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        console.log('✨ Régénération terminée !');
        process.exit(0);
    } catch (error) {
        console.error('💥 Erreur fatale dans le script de régénération:', error);
        process.exit(1);
    }
};

resendEmails();
