import jwt from 'jsonwebtoken';

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    console.warn(`⚠️ [Auth] Pas de token pour ${req.method} ${req.path}`);
    return res.status(401).json({ error: 'Token d\'authentification requis' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      console.error(`❌ [Auth] Erreur JWT pour ${req.method} ${req.path}:`);
      console.error(`   - Message: ${err.message}`);
      console.error(`   - Token (début): ${token.substring(0, 15)}...`);
      console.error(`   - Secret présent: ${!!process.env.JWT_SECRET}`);
      return res.status(403).json({ error: 'Token invalide ou expiré' });
    }
    req.user = user;
    next();
  });
};

export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Accès refusé. Permissions insuffisantes.'
      });
    }
    next();
  };
};

export const adminRequired = (req, res, next) => {
  // D'abord authentifier le token
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token d\'authentification requis' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token invalide ou expiré' });
    }

    // Ensuite vérifier le rôle admin
    if (user.role !== 'admin') {
      return res.status(403).json({
        error: 'Accès réservé aux administrateurs'
      });
    }

    req.user = user;
    next();
  });
};
