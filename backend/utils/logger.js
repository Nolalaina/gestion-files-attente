const db = require("../config/db");

/**
 * Log an activity to the database
 * @param {number|null} userId 
 * @param {string} action 
 * @param {string} entityType 
 * @param {number|null} entityId 
 * @param {object} req - Express request object for IP and User Agent
 * @param {string} status - 'SUCCESS' or 'FAILURE'
 * @param {string|null} description 
 */
const logActivity = async ({
  userId = null,
  action,
  entityType = null,
  entityId = null,
  req = null,
  status = 'SUCCESS',
  description = null,
  errorMessage = null
}) => {
  try {
    const ipAddress = req ? req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress : null;
    const userAgent = req ? req.headers['user-agent'] : null;

    const [result] = await db.query(
      `INSERT INTO activity_logs (user_id, action, entity_type, entity_id, ip_address, user_agent, description, status, error_message) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, action, entityType, entityId, ipAddress, userAgent, description, status, errorMessage]
    );
    return result.insertId;
  } catch (error) {
    console.error("Failed to log activity:", error);
  }
};

module.exports = { logActivity };
