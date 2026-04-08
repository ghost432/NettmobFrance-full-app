import cron from 'node-cron';
import db from '../config/database.js';
import { createNotification } from '../utils/notificationHelper.js';

/**
 * Récupère les IDs de tous les admins pour envoyer des alertes
 */
async function getAdminIds() {
  const [admins] = await db.query("SELECT id FROM users WHERE role = 'admin'");
  return admins.map(a => a.id);
}

async function notifyAdmins(adminIds, title, message, actionUrl = '/admin/dashboard') {
  for (const adminId of adminIds) {
    await createNotification(adminId, title, message, 'warning', 'system', actionUrl).catch(() => {});
  }
}

/**
 * Vérifie les tickets support sans réponse depuis plus de 48h
 */
async function checkStaleTickets() {
  try {
    const [rows] = await db.query(`
      SELECT COUNT(*) as count
      FROM support_tickets
      WHERE status = 'open'
        AND created_at < DATE_SUB(NOW(), INTERVAL 48 HOUR)
    `);
    const count = rows[0].count;
    if (count > 0) {
      const adminIds = await getAdminIds();
      await notifyAdmins(
        adminIds,
        `⚠️ ${count} ticket(s) support en attente depuis +48h`,
        `${count} ticket(s) n'ont pas reçu de réponse depuis plus de 48 heures. Veuillez les traiter rapidement.`,
        '/admin/support'
      );
      console.log(`🔔 [KPI] Alerte: ${count} tickets support en attente depuis +48h`);
    }
  } catch (error) {
    console.error('❌ [KPI] Erreur vérification tickets:', error);
  }
}

/**
 * Vérifie les retraits en attente depuis plus de 3 jours
 */
async function checkPendingWithdrawals() {
  try {
    const [rows] = await db.query(`
      SELECT COUNT(*) as count, SUM(amount) as total
      FROM wallet_withdrawals
      WHERE status = 'pending'
        AND requested_at < DATE_SUB(NOW(), INTERVAL 3 DAY)
    `);
    const { count, total } = rows[0];
    if (count > 0) {
      const adminIds = await getAdminIds();
      await notifyAdmins(
        adminIds,
        `💰 ${count} retrait(s) en attente depuis +3 jours`,
        `${count} demande(s) de retrait (${parseFloat(total || 0).toFixed(2)}€ au total) sont en attente depuis plus de 3 jours.`,
        '/admin/wallet'
      );
      console.log(`🔔 [KPI] Alerte: ${count} retraits en attente depuis +3 jours`);
    }
  } catch (error) {
    console.error('❌ [KPI] Erreur vérification retraits:', error);
  }
}

/**
 * Vérifie le taux de refus de candidatures sur les dernières 24h
 * Alerte si > 10 refus en 24h
 */
async function checkHighRejectionRate() {
  try {
    const [rows] = await db.query(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'refuse' THEN 1 ELSE 0 END) as refused
      FROM mission_applications
      WHERE updated_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)
    `);
    const { total, refused } = rows[0];
    if (refused >= 10) {
      const rate = total > 0 ? Math.round((refused / total) * 100) : 0;
      const adminIds = await getAdminIds();
      await notifyAdmins(
        adminIds,
        `📉 Taux de refus élevé: ${refused} candidatures refusées en 24h`,
        `${refused} candidatures ont été refusées en 24h (${rate}% de taux de refus sur ${total} candidatures traitées).`,
        '/admin/missions'
      );
      console.log(`🔔 [KPI] Alerte: ${refused} refus en 24h (${rate}%)`);
    }
  } catch (error) {
    console.error('❌ [KPI] Erreur vérification refus candidatures:', error);
  }
}

/**
 * Vérifie les missions en statut "ouvert" depuis plus de 7 jours sans candidature
 */
async function checkAbandonedMissions() {
  try {
    const [rows] = await db.query(`
      SELECT COUNT(*) as count
      FROM missions m
      WHERE m.status = 'ouvert'
        AND m.created_at < DATE_SUB(NOW(), INTERVAL 7 DAY)
        AND NOT EXISTS (
          SELECT 1 FROM mission_applications ma WHERE ma.mission_id = m.id
        )
    `);
    const count = rows[0].count;
    if (count > 0) {
      const adminIds = await getAdminIds();
      await notifyAdmins(
        adminIds,
        `🕐 ${count} mission(s) sans candidature depuis +7 jours`,
        `${count} mission(s) publiée(s) depuis plus d'une semaine n'ont reçu aucune candidature. Considérez contacter les clients.`,
        '/admin/missions'
      );
      console.log(`🔔 [KPI] Alerte: ${count} missions abandonnées sans candidature`);
    }
  } catch (error) {
    console.error('❌ [KPI] Erreur vérification missions abandonnées:', error);
  }
}

/**
 * Lance toutes les vérifications KPI - s'exécute tous les jours à 8h00
 */
const kpiAlertJob = cron.schedule('0 8 * * *', async () => {
  console.log('📊 [KPI] Vérification des indicateurs clés...');
  await Promise.allSettled([
    checkStaleTickets(),
    checkPendingWithdrawals(),
    checkHighRejectionRate(),
    checkAbandonedMissions(),
  ]);
  console.log('✅ [KPI] Vérification terminée');
}, { scheduled: false });

export function startKPIAlerts() {
  kpiAlertJob.start();
  console.log('📊 [KPI] Service d\'alertes KPI démarré (vérification quotidienne à 8h00)');
}
