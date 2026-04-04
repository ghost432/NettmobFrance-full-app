import bcrypt from 'bcryptjs';
import db from './config/database.js';

const testLogin = async () => {
  try {
    const email = process.argv[2];
    const password = process.argv[3];
    
    if (!email || !password) {
      console.log('Usage: node test-login.js <email> <password>');
      process.exit(1);
    }
    
    console.log('🔍 Test de connexion pour:', email);
    console.log('');
    
    // Rechercher l'utilisateur
    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    
    if (users.length === 0) {
      console.log('❌ Utilisateur non trouvé');
      process.exit(1);
    }
    
    const user = users[0];
    console.log('✅ Utilisateur trouvé:');
    console.log('  - ID:', user.id);
    console.log('  - Email:', user.email);
    console.log('  - Role:', user.role);
    console.log('  - Vérifié:', user.verified ? 'Oui' : 'Non');
    console.log('  - Dernière connexion:', user.last_login || 'Jamais');
    console.log('');
    
    // Vérifier le mot de passe
    console.log('🔐 Vérification du mot de passe...');
    console.log('  - Hash stocké:', user.password.substring(0, 20) + '...');
    console.log('  - Mot de passe fourni:', password);
    
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (isPasswordValid) {
      console.log('✅ Mot de passe correct !');
    } else {
      console.log('❌ Mot de passe incorrect !');
      console.log('');
      console.log('💡 Suggestions:');
      console.log('  1. Vérifiez que vous utilisez le bon mot de passe');
      console.log('  2. Vérifiez les majuscules/minuscules');
      console.log('  3. Vérifiez qu\'il n\'y a pas d\'espaces avant/après');
    }
    
    console.log('');
    
    // Vérifier si OTP serait nécessaire
    if (!user.last_login) {
      console.log('⚠️  OTP requis: Première connexion');
    } else {
      const lastLoginDate = new Date(user.last_login);
      const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
      
      if (lastLoginDate < twoDaysAgo) {
        console.log('⚠️  OTP requis: Dernière connexion > 2 jours');
      } else {
        console.log('✅ OTP non requis: Connexion récente');
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
};

testLogin();
