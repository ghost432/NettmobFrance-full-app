import db from './config/database.js';

async function fixDisputesEvidence() {
  try {
    console.log('\n=== Vérification et correction des données evidence ===\n');
    
    // Récupérer tous les litiges
    const [disputes] = await db.query('SELECT id, evidence FROM disputes');
    
    console.log(`${disputes.length} litige(s) trouvé(s)\n`);
    
    let fixed = 0;
    
    for (const dispute of disputes) {
      let needsUpdate = false;
      let newEvidence = dispute.evidence;
      
      // Vérifier si evidence est null, vide ou invalide
      if (!dispute.evidence || dispute.evidence === '' || dispute.evidence === 'null') {
        newEvidence = '[]';
        needsUpdate = true;
      } else {
        // Tenter de parser
        try {
          const parsed = JSON.parse(dispute.evidence);
          // Si c'est un objet au lieu d'un array, le convertir
          if (typeof parsed === 'object' && !Array.isArray(parsed)) {
            newEvidence = '[]';
            needsUpdate = true;
          }
        } catch (e) {
          console.log(`⚠️  Litige #${dispute.id}: JSON invalide - "${dispute.evidence}"`);
          newEvidence = '[]';
          needsUpdate = true;
        }
      }
      
      if (needsUpdate) {
        await db.query(
          'UPDATE disputes SET evidence = ? WHERE id = ?',
          [newEvidence, dispute.id]
        );
        console.log(`✅ Litige #${dispute.id}: Evidence corrigé`);
        fixed++;
      }
    }
    
    console.log(`\n✅ Terminé: ${fixed} litige(s) corrigé(s)`);
    console.log(`✅ ${disputes.length - fixed} litige(s) OK`);
    
    // Vérification finale
    const [check] = await db.query('SELECT id, evidence FROM disputes WHERE evidence IS NULL OR evidence = "" OR evidence = "null"');
    
    if (check.length > 0) {
      console.log(`\n⚠️  Attention: ${check.length} litige(s) ont encore des valeurs problématiques`);
    } else {
      console.log('\n✅ Toutes les données evidence sont valides !');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

fixDisputesEvidence();
