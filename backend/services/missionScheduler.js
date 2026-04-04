import cron from 'node-cron';
import db from '../config/database.js';
import { sendMissionReminderEmail, sendTimesheetReminderEmail } from './emailService.js';
import { createNotification } from '../utils/notificationHelper.js';

/**
 * Envoie des rappels 8h avant le début d'une mission
 * S'exécute tous les jours à 9h00
 */
const sendMissionReminders = cron.schedule('0 9 * * *', async () => {
  console.log('🔔 [Scheduler] Vérification des missions à venir...');
  
  try {
    // Récupérer les missions qui commencent dans 8h (±1h de marge)
    const [missions] = await db.query(`
      SELECT 
        m.id,
        m.mission_name,
        m.title,
        m.start_date,
        m.end_date,
        m.address,
        m.city,
        m.hourly_rate,
        ma.automob_id,
        ap.first_name,
        ap.last_name,
        u.email,
        cp.company_name as client_name
      FROM missions m
      JOIN mission_applications ma ON m.id = ma.mission_id
      JOIN automob_profiles ap ON ma.automob_id = ap.user_id
      JOIN users u ON ap.user_id = u.id
      LEFT JOIN client_profiles cp ON m.client_id = cp.user_id
      WHERE ma.status = 'accepted'
        AND m.status = 'in_progress'
        AND m.start_date BETWEEN DATE_ADD(NOW(), INTERVAL 7 HOUR) AND DATE_ADD(NOW(), INTERVAL 9 HOUR)
        AND NOT EXISTS (
          SELECT 1 FROM mission_reminders mr 
          WHERE mr.mission_id = m.id 
            AND mr.automob_id = ma.automob_id 
            AND mr.reminder_type = 'mission_start'
            AND mr.sent_at > DATE_SUB(NOW(), INTERVAL 1 DAY)
        )
    `);

    console.log(`📋 [Scheduler] ${missions.length} mission(s) à rappeler`);

    for (const mission of missions) {
      const automobName = `${mission.first_name} ${mission.last_name}`;
      
      try {
        // Envoyer l'email
        await sendMissionReminderEmail(mission.email, automobName, mission);
        
        // Créer une notification in-app
        await createNotification(
          mission.automob_id,
          '⏰ Rappel : Mission dans 8h !',
          `Votre mission "${mission.mission_name || mission.title}" commence dans environ 8 heures. N'oubliez pas de vous présenter de la part de NettmobFrance.`,
          'info',
          'mission',
          `/automob/missions/${mission.id}`
        );
        
        // Enregistrer le rappel envoyé
        await db.query(
          'INSERT INTO mission_reminders (mission_id, automob_id, reminder_type, sent_at) VALUES (?, ?, ?, NOW())',
          [mission.id, mission.automob_id, 'mission_start']
        );
        
        console.log(`✅ [Scheduler] Rappel envoyé à ${mission.email} pour mission #${mission.id}`);
      } catch (error) {
        console.error(`❌ [Scheduler] Erreur rappel mission #${mission.id}:`, error);
      }
    }
  } catch (error) {
    console.error('❌ [Scheduler] Erreur lors de l\'envoi des rappels mission:', error);
  }
});

/**
 * Envoie des rappels quotidiens pour pointer les heures
 * S'exécute tous les jours à 18h00
 */
const sendTimesheetReminders = cron.schedule('0 18 * * *', async () => {
  console.log('⏱️ [Scheduler] Vérification des missions en cours pour rappel pointage...');
  
  try {
    // Récupérer les missions en cours (entre start_date et end_date)
    const [missions] = await db.query(`
      SELECT 
        m.id,
        m.mission_name,
        m.title,
        m.start_date,
        m.end_date,
        ma.automob_id,
        ap.first_name,
        ap.last_name,
        u.email,
        cp.company_name as client_name
      FROM missions m
      JOIN mission_applications ma ON m.id = ma.mission_id
      JOIN automob_profiles ap ON ma.automob_id = ap.user_id
      JOIN users u ON ap.user_id = u.id
      LEFT JOIN client_profiles cp ON m.client_id = cp.user_id
      WHERE ma.status = 'accepted'
        AND m.status = 'in_progress'
        AND NOW() BETWEEN m.start_date AND m.end_date
        AND NOT EXISTS (
          SELECT 1 FROM mission_reminders mr 
          WHERE mr.mission_id = m.id 
            AND mr.automob_id = ma.automob_id 
            AND mr.reminder_type = 'timesheet'
            AND DATE(mr.sent_at) = CURDATE()
        )
    `);

    console.log(`📋 [Scheduler] ${missions.length} automob(s) à rappeler pour le pointage`);

    for (const mission of missions) {
      const automobName = `${mission.first_name} ${mission.last_name}`;
      
      try {
        // Envoyer l'email
        await sendTimesheetReminderEmail(mission.email, automobName, mission);
        
        // Créer une notification in-app
        await createNotification(
          mission.automob_id,
          '⏱️ Rappel : Pointez vos heures',
          `N'oubliez pas de pointer vos heures de travail pour la mission "${mission.mission_name || mission.title}". Cela facilite votre facturation.`,
          'info',
          'timesheet',
          `/automob/missions/${mission.id}/timesheets`
        );
        
        // Enregistrer le rappel envoyé
        await db.query(
          'INSERT INTO mission_reminders (mission_id, automob_id, reminder_type, sent_at) VALUES (?, ?, ?, NOW())',
          [mission.id, mission.automob_id, 'timesheet']
        );
        
        console.log(`✅ [Scheduler] Rappel pointage envoyé à ${mission.email} pour mission #${mission.id}`);
      } catch (error) {
        console.error(`❌ [Scheduler] Erreur rappel pointage mission #${mission.id}:`, error);
      }
    }
  } catch (error) {
    console.error('❌ [Scheduler] Erreur lors de l\'envoi des rappels pointage:', error);
  }
});

/**
 * Démarre tous les schedulers
 */
export const startSchedulers = () => {
  console.log('🚀 [Scheduler] Démarrage des tâches planifiées...');
  
  sendMissionReminders.start();
  console.log('✅ [Scheduler] Rappels missions (9h00) - Activé');
  
  sendTimesheetReminders.start();
  console.log('✅ [Scheduler] Rappels pointage (18h00) - Activé');
};

/**
 * Arrête tous les schedulers
 */
export const stopSchedulers = () => {
  console.log('🛑 [Scheduler] Arrêt des tâches planifiées...');
  
  sendMissionReminders.stop();
  sendTimesheetReminders.stop();
  
  console.log('✅ [Scheduler] Tous les schedulers sont arrêtés');
};

export default { startSchedulers, stopSchedulers };
