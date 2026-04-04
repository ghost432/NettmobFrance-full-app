import db from '../config/database.js';
import { sendApprovalEmail } from '../services/verificationEmailService.js';
import { createNotification } from '../utils/notificationHelper.js';

const columnExists = async (table, column) => {
  const [rows] = await db.query(
    'SELECT COUNT(*) AS cnt FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?',
    [table, column]
  );
  return rows[0]?.cnt > 0;
};

async function syncVerificationStatus() {
  const changed = [];
  try {
    console.log('🔄 Démarrage de la synchronisation des statuts de vérification...');

    // 1) Automobs: profil vérifié mais users.id_verified = 0
    const [automobMismatches] = await db.query(`
      SELECT u.id, u.email, 'automob' AS user_type,
             ap.first_name, ap.last_name
      FROM users u
      JOIN automob_profiles ap ON u.id = ap.user_id
      WHERE u.role = 'automob'
        AND COALESCE(ap.id_verified, 0) = 1
        AND COALESCE(u.id_verified, 0) = 0
    `);

    // 2) Clients: representative_id_verified (ou id_verified legacy) = 1 mais users.id_verified = 0
    const hasRep = await columnExists('client_profiles', 'representative_id_verified');
    const clientCol = hasRep ? 'representative_id_verified' : 'id_verified';
    const [clientMismatches] = await db.query(
      `SELECT u.id, u.email, 'client' AS user_type
       FROM users u
       JOIN client_profiles cp ON u.id = cp.user_id
       WHERE u.role = 'client'
         AND COALESCE(cp.${clientCol}, 0) = 1
         AND COALESCE(u.id_verified, 0) = 0`
    );

    // 3) Vérifications approuvées: forcer profils et users.id_verified = 1
    const [approvedVerifs] = await db.query(`
      SELECT v.user_id AS id, v.user_type, u.email,
             COALESCE(v.first_name, v.manager_first_name) AS first_name,
             COALESCE(v.last_name, v.manager_last_name) AS last_name,
             COALESCE(u.id_verified, 0) AS user_id_verified
      FROM identity_verifications_new v
      JOIN users u ON u.id = v.user_id
      WHERE v.status = 'approved'
    `);

    const toVerifyMap = new Map(); // id -> { id, email, user_type, first_name, last_name }

    // Collect mismatches
    for (const row of automobMismatches) toVerifyMap.set(row.id, row);
    for (const row of clientMismatches) toVerifyMap.set(row.id, row);

    // Ensure profiles from approved verifs and mark for user update if needed
    for (const row of approvedVerifs) {
      const { id, user_type, user_id_verified } = row;
      if (user_type === 'automob') {
        await db.query('UPDATE automob_profiles SET id_verified = 1 WHERE user_id = ?', [id]);
      } else {
        await db.query(`UPDATE client_profiles SET ${clientCol} = 1 WHERE user_id = ?`, [id]);
      }
      if (!user_id_verified) {
        toVerifyMap.set(id, row);
      }
    }

    // Nothing to update
    if (toVerifyMap.size === 0) {
      console.log('✅ Aucun statut à synchroniser. Tout est déjà à jour.');
      return { updated: 0 };
    }

    // Apply updates and notify
    for (const row of toVerifyMap.values()) {
      const { id, email, user_type, first_name, last_name } = row;
      // Set users.id_verified = 1 only if currently 0
      const [urows] = await db.query('SELECT id_verified FROM users WHERE id = ?', [id]);
      const current = urows?.[0]?.id_verified ? 1 : 0;
      if (current === 0) {
        await db.query('UPDATE users SET id_verified = 1, updated_at = NOW() WHERE id = ?', [id]);
        changed.push(id);

        const name = [first_name, last_name].filter(Boolean).join(' ').trim() || email;
        // Send approval email
        try {
          await sendApprovalEmail(email, name, user_type);
        } catch (e) {
          console.warn(`⚠️ Échec envoi email approbation à ${email}:`, e?.message);
        }
        // Create notification (real-time + web push)
        try {
          await createNotification(
            id,
            '✅ Identité vérifiée',
            'Votre identité a été approuvée. Vous avez maintenant accès à toutes les fonctionnalités.',
            'success',
            'verification',
            user_type === 'automob' ? '/automob/profile' : '/client/profile',
            null // io non disponible dans ce script
          );
        } catch (e) {
          console.warn(`⚠️ Échec création notification pour user ${id}:`, e?.message);
        }
      }
    }

    // Mettre à jour le statut 'approved' sur la dernière demande lorsque users.id_verified = 1
    try {
      await db.query(`
        UPDATE identity_verifications_new v
        JOIN (
          SELECT user_id, MAX(submitted_at) AS last_sub
          FROM identity_verifications_new
          GROUP BY user_id
        ) t ON t.user_id = v.user_id AND v.submitted_at = t.last_sub
        JOIN users u ON u.id = v.user_id
        SET v.status = 'approved', v.reviewed_at = NOW(), v.rejection_reason = NULL
        WHERE u.id_verified = 1 AND v.status <> 'approved'
      `);
      console.log('✅ Statuts des dernières demandes mis à jour vers "approved" pour les utilisateurs vérifiés');
    } catch (e) {
      console.warn('⚠️ Impossible de mettre à jour les statuts des demandes:', e?.message || e);
    }

    console.log(`✅ Synchronisation terminée. Utilisateurs mis à jour: ${changed.length}`);
    if (changed.length) {
      console.log('IDs:', changed.join(', '));
    }
    return { updated: changed.length };
  } catch (error) {
    console.error('❌ Erreur lors de la synchronisation:', error);
    throw error;
  } finally {
    try { await db.end(); } catch (_) {}
  }
}

syncVerificationStatus()
  .then((res) => {
    process.exit(0);
  })
  .catch(() => process.exit(1));
