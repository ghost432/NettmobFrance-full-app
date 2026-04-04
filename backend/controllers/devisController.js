import db from '../config/database.js';
import { sendEmail } from '../services/emailService.js';
import { createNotification } from '../utils/notificationHelper.js';

const createDevis = async (req, res) => {
    try {
        const { name, email, phone, company, secteur, volume, message } = req.body;

        if (!name || !email || !phone || !company || !secteur || !volume || !message) {
            return res.status(400).json({ error: 'Tous les champs sont requis.' });
        }

        const query = `
            INSERT INTO devis_entreprise 
            (name, email, phone, company, secteur, volume, message, status) 
            VALUES (?, ?, ?, ?, ?, ?, ?, 'nouveau')
        `;

        const [result] = await db.execute(query, [name, email, phone, company, secteur, volume, message]);

        // Envoi d'email à l'admin
        try {
            const adminHtml = `
                <div style="font-family: 'Inter', 'Segoe UI', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                    <div style="background-color: #a31a4d; padding: 30px 20px; text-align: center;">
                        <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px;">Nouvelle Demande de Devis</h1>
                    </div>
                    <div style="padding: 40px 30px;">
                        <p style="font-size: 16px; color: #475569; line-height: 1.5; margin-bottom: 25px;">Une nouvelle opportunité B2B vient d'arriver sur la plateforme.</p>
                        
                        <div style="background-color: #f8fafc; border-radius: 12px; padding: 25px; margin-bottom: 25px; border: 1px solid #e2e8f0;">
                            <h3 style="margin-top: 0; color: #a31a4d; font-size: 16px; font-weight: 800; text-transform: uppercase; border-bottom: 2px solid #a31a4d; padding-bottom: 8px; display: inline-block; margin-bottom: 15px;">Informations Entreprise</h3>
                            <table style="width: 100%; border-collapse: collapse;">
                                <tr>
                                    <td style="padding: 8px 0; color: #64748b; font-weight: 600; width: 40%;">🏢 Entreprise :</td>
                                    <td style="padding: 8px 0; color: #1e293b; font-weight: 700;">${company}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0; color: #64748b; font-weight: 600;">👤 Contact :</td>
                                    <td style="padding: 8px 0; color: #1e293b;">${name}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0; color: #64748b; font-weight: 600;">📧 Email :</td>
                                    <td style="padding: 8px 0;"><a href="mailto:${email}" style="color: #a31a4d; text-decoration: none; font-weight: 600;">${email}</a></td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0; color: #64748b; font-weight: 600;">📞 Téléphone :</td>
                                    <td style="padding: 8px 0; color: #1e293b;">${phone}</td>
                                </tr>
                            </table>
                        </div>
                        
                        <div style="background-color: #fff1f2; border-radius: 12px; padding: 25px; margin-bottom: 25px; border: 1px solid #fecdd3;">
                            <h3 style="margin-top: 0; color: #9f1239; font-size: 16px; font-weight: 800; text-transform: uppercase; margin-bottom: 15px;">Détails du projet</h3>
                            <p style="margin: 8px 0; color: #475569;"><strong>🏗️ Secteur :</strong> <span style="color: #1e293b;">${secteur}</span></p>
                            <p style="margin: 8px 0; color: #475569;"><strong>📊 Volume estimé :</strong> <span style="color: #1e293b;">${volume}</span></p>
                        </div>
                        
                        <div style="margin-bottom: 30px;">
                            <h3 style="color: #1e293b; font-size: 16px; font-weight: 800; margin-bottom: 12px;">Message du client :</h3>
                            <div style="padding: 20px; background-color: #f1f5f9; border-radius: 12px; color: #334155; line-height: 1.6; font-style: italic; border-left: 4px solid #cbd5e1;">
                                ${message.replace(/\n/g, '<br>')}
                            </div>
                        </div>
                        
                        <div style="text-align: center; margin-top: 40px;">
                            <a href="${process.env.ADMIN_URL || '#'}/admin/devis" style="background-color: #a31a4d; color: #ffffff; padding: 16px 32px; text-decoration: none; border-radius: 12px; font-weight: 800; font-size: 16px; display: inline-block; box-shadow: 0 10px 15px -3px rgba(163, 26, 77, 0.3);">ACCÉDER AU DASHBOARD</a>
                        </div>
                    </div>
                    <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
                        <p style="margin: 0; font-size: 12px; color: #94a3b8; font-weight: 500;">Notifications Système NettmobFrance</p>
                    </div>
                </div>
            `;

            await sendEmail(
                process.env.ADMIN_EMAIL || 'contact@nettmobfrance.fr',
                `🚀 Nouveau Devis : ${company} (${secteur})`,
                adminHtml
            );
        } catch (adminEmailError) {
            console.error('⚠️ Erreur envoi email admin pour devis:', adminEmailError.message);
        }

        // Email de confirmation au client
        try {
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
                        <p style="font-size: 16px; color: #475569; line-height: 1.6;">Nous avons bien reçu votre demande de devis pour <strong>${company}</strong>. Merci de votre confiance.</p>
                        
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
                                    <h4 style="margin: 0 0 5px 0; color: #065f46; font-size: 16px; font-weight: 800;">Quelle est la suite ?</h4>
                                    <p style="margin: 0; color: #064e3b; font-size: 15px; line-height: 1.5;">
                                        Notre équipe commerciale analyse votre demande. Un conseiller expert vous contactera par téléphone ou email d'ici <strong>24 heures ouvrées</strong> pour vous proposer une solution adaptée.
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

            await sendEmail(
                recipientEmail,
                'Confirmation de votre demande de devis - NettmobFrance',
                clientHtml
            );
        } catch (clientEmailError) {
            console.error('⚠️ Erreur envoi email confirmation client pour devis:', clientEmailError.message);
        }

        // Notifier les administrateurs via in-app et push
        try {
            const [admins] = await db.query('SELECT id FROM users WHERE role = "admin"');
            const io = req.app ? req.app.get('io') : null;

            for (const admin of admins) {
                await createNotification(
                    admin.id,
                    '📄 Nouvelle demande de devis',
                    `Demande de devis B2B de ${name} (${company}) pour le secteur ${secteur}.`,
                    'info',            // type
                    'system',          // category
                    '/admin/messages', // actionUrl
                    io                 // io
                );
            }
            console.log(`✅ Notifications envoyées à ${admins.length} administrateurs pour le devis.`);
        } catch (notifError) {
            console.error('⚠️ Erreur lors de la notification des admins pour le devis:', notifError);
        }

        res.status(201).json({ message: 'Devis envoyé avec succès', id: result.insertId });
    } catch (error) {
        console.error('Erreur createDevis:', error);
        res.status(500).json({ error: 'Erreur lors de l\'enregistrement de la demande de devis' });
    }
};

const getAllDevis = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM devis_entreprise ORDER BY created_at DESC');
        res.status(200).json(rows);
    } catch (error) {
        console.error('Erreur getAllDevis:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération des devis' });
    }
};

const getDevisById = async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT * FROM devis_entreprise WHERE id = ?', [req.params.id]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Devis non trouvé' });
        }
        res.status(200).json(rows[0]);
    } catch (error) {
        console.error('Erreur getDevisById:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

const updateDevisStatus = async (req, res) => {
    try {
        const { status } = req.body;
        if (!['nouveau', 'lu', 'repondu'].includes(status)) {
            return res.status(400).json({ error: 'Statut invalide' });
        }

        const [result] = await db.execute('UPDATE devis_entreprise SET status = ? WHERE id = ?', [status, req.params.id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Devis non trouvé' });
        }

        res.status(200).json({ message: 'Statut mis à jour avec succès' });
    } catch (error) {
        console.error('Erreur updateDevisStatus:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

const deleteDevis = async (req, res) => {
    try {
        const [result] = await db.execute('DELETE FROM devis_entreprise WHERE id = ?', [req.params.id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Devis non trouvé' });
        }

        res.status(200).json({ message: 'Devis supprimé avec succès' });
    } catch (error) {
        console.error('Erreur deleteDevis:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

export default {
    createDevis,
    getAllDevis,
    getDevisById,
    updateDevisStatus,
    deleteDevis
};
