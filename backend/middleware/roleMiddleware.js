const pool = require('../config/db');

/**
 * Middleware pour vérifier les permissions utilisateur
 * @param  {...string} requiredPermissions - Permissions requises
 */
const checkPermission = (...requiredPermissions) => {
  return async (req, res, next) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Non authentifié' });
      }

      // Récupérer le rôle et permissions de l'utilisateur
      const [users] = await pool.query(
        `SELECT u.id, u.role_id, GROUP_CONCAT(p.code) as permissions 
         FROM users u
         LEFT JOIN role_permissions rp ON u.role_id = rp.role_id
         LEFT JOIN permissions p ON rp.permission_id = p.id
         WHERE u.id = ?
         GROUP BY u.id`,
        [userId]
      );

      if (!users.length) {
        return res.status(403).json({ error: 'Utilisateur non trouvé' });
      }

      const user = users[0];
      const userPermissions = user.permissions ? user.permissions.split(',') : [];

      // Vérifier que l'utilisateur a au moins une permission requise
      const hasPermission = requiredPermissions.some(perm => 
        userPermissions.includes(perm)
      );

      if (!hasPermission) {
        return res.status(403).json({ 
          error: 'Accès refusé - permissions insuffisantes',
          required: requiredPermissions,
          user_permissions: userPermissions
        });
      }

      // Ajouter les permissions à la requête pour usage ultérieur
      req.user.permissions = userPermissions;
      next();
    } catch (error) {
      console.error('Erreur vérification permissions:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  };
};

/**
 * Middleware pour vérifier le rôle
 * @param  {...string} allowedRoles - Rôles autorisés (ex: 'ADMIN', 'AGENT')
 */
const checkRole = (...allowedRoles) => {
  return async (req, res, next) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Non authentifié' });
      }

      const [users] = await pool.query(
        `SELECT u.role_id, r.code as role_code
         FROM users u
         LEFT JOIN roles r ON u.role_id = r.id
         WHERE u.id = ?`,
        [userId]
      );

      if (!users.length) {
        return res.status(403).json({ error: 'Utilisateur non trouvé' });
      }

      const userRole = users[0].role_code;

      if (!allowedRoles.includes(userRole)) {
        return res.status(403).json({ 
          error: `Accès refusé - ce rôle n'est pas autorisé`,
          required_roles: allowedRoles,
          user_role: userRole
        });
      }

      req.user.role_code = userRole;
      next();
    } catch (error) {
      console.error('Erreur vérification rôle:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  };
};

/**
 * Middleware pour l'audit - enregistrer les actions
 */
const auditLog = (action, entityType = null) => {
  return async (req, res, next) => {
    const originalSend = res.send;
    
    res.send = function (data) {
      // Enregistrer l'action après que la réponse soit envoyée
      const statusCode = res.statusCode;
      const success = statusCode < 400;

      const logData = {
        user_id: req.user?.id,
        action,
        entity_type: entityType,
        entity_id: req.params.id || req.body.id || null,
        ip_address: req.ip || req.connection.remoteAddress,
        user_agent: req.get('user-agent'),
        description: `${action} - ${entityType || 'N/A'}`,
        status: success ? 'SUCCESS' : 'FAILURE',
        error_message: !success ? data : null,
      };

      if (req.user?.id) {
        pool.query(
          `INSERT INTO activity_logs 
           (user_id, action, entity_type, entity_id, ip_address, user_agent, description, status, error_message)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            logData.user_id,
            logData.action,
            logData.entity_type,
            logData.entity_id,
            logData.ip_address,
            logData.user_agent?.substring(0, 255),
            logData.description,
            logData.status,
            logData.error_message?.substring(0, 500) || null,
          ]
        ).catch(err => console.error('Erreur audit log:', err));
      }

      // Envoyer la réponse originale
      res.send = originalSend;
      return originalSend.call(this, data);
    };

    next();
  };
};

module.exports = {
  checkPermission,
  checkRole,
  auditLog,
};
