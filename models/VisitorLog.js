const db = require('../config/database');

class VisitorLog {
  // Log a visitor
  static async log(visitorData) {
    const { ip, user_agent, url, referrer, session_id } = visitorData;

    try {
      const [result] = await db.execute(
        'INSERT INTO visitors_log (ip, user_agent, url, referrer, session_id) VALUES (?, ?, ?, ?, ?)',
        [ip, user_agent, url, referrer, session_id]
      );

      return result.insertId;
    } catch (error) {
      // Don't throw error for logging failures
      console.error('Error logging visitor:', error);
      return null;
    }
  }

  // Get visitor stats
  static async getStats(options = {}) {
    const { days = 30 } = options;

    try {
      // Total visitors
      const [total] = await db.execute('SELECT COUNT(*) as total FROM visitors_log');

      // Unique visitors (by IP)
      const [unique] = await db.execute('SELECT COUNT(DISTINCT ip) as total FROM visitors_log');

      // Visitors in last N days
      const [recent] = await db.execute(
        'SELECT COUNT(*) as total FROM visitors_log WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)',
        [days]
      );

      // Unique visitors in last N days
      const [recentUnique] = await db.execute(
        'SELECT COUNT(DISTINCT ip) as total FROM visitors_log WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)',
        [days]
      );

      // Top pages
      const [topPages] = await db.execute(
        'SELECT url, COUNT(*) as visits FROM visitors_log GROUP BY url ORDER BY visits DESC LIMIT 10'
      );

      // Top referrers
      const [topReferrers] = await db.execute(
        'SELECT referrer, COUNT(*) as visits FROM visitors_log WHERE referrer IS NOT NULL AND referrer != "" GROUP BY referrer ORDER BY visits DESC LIMIT 10'
      );

      // Daily visits for the last N days
      const [dailyVisits] = await db.execute(
        `SELECT DATE(created_at) as date, COUNT(*) as visits
         FROM visitors_log
         WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
         GROUP BY DATE(created_at)
         ORDER BY date DESC`,
        [days]
      );

      return {
        total: total[0].total,
        unique: unique[0].total,
        recent: recent[0].total,
        recentUnique: recentUnique[0].total,
        topPages: topPages,
        topReferrers: topReferrers,
        dailyVisits: dailyVisits
      };
    } catch (error) {
      throw error;
    }
  }

  // Get visitor logs with pagination
  static async findAll(options = {}) {
    const { page = 1, limit = 50, ip, url, startDate, endDate } = options;

    try {
      const offset = (page - 1) * limit;
      let whereClause = 'WHERE 1=1';
      let params = [];

      if (ip) {
        whereClause += ' AND ip LIKE ?';
        params.push(`%${ip}%`);
      }

      if (url) {
        whereClause += ' AND url LIKE ?';
        params.push(`%${url}%`);
      }

      if (startDate) {
        whereClause += ' AND created_at >= ?';
        params.push(startDate);
      }

      if (endDate) {
        whereClause += ' AND created_at <= ?';
        params.push(endDate);
      }

      const [rows] = await db.execute(
        `SELECT * FROM visitors_log ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
        [...params, limit, offset]
      );

      const [countResult] = await db.execute(
        `SELECT COUNT(*) as total FROM visitors_log ${whereClause}`,
        params
      );
      const total = countResult[0].total;

      return {
        logs: rows,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      throw error;
    }
  }

  // Clean old logs (older than specified days)
  static async cleanOldLogs(days = 90) {
    try {
      const [result] = await db.execute(
        'DELETE FROM visitors_log WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)',
        [days]
      );

      return result.affectedRows;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = VisitorLog;