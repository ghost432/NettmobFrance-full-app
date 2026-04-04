import db from './config/database.js';

const checkUsers = async () => {
  try {
    console.log('📊 Liste des utilisateurs dans la base de données:\n');
    
    const [users] = await db.query(`
      SELECT id, email, role, verified, last_login, 
             SUBSTRING(password, 1, 20) as password_hash
      FROM users 
      ORDER BY id ASC
    `);
    
    if (users.length === 0) {
      console.log('❌ Aucun utilisateur trouvé');
    } else {
      users.forEach(user => {
        console.log(`👤 ID: ${user.id}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Vérifié: ${user.verified ? '✅' : '❌'}`);
        console.log(`   Dernière connexion: ${user.last_login || 'Jamais'}`);
        console.log(`   Hash password: ${user.password_hash}...`);
        console.log('');
      });
      
      console.log(`Total: ${users.length} utilisateur(s)`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
};

checkUsers();
