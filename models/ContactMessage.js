const db = require('../config/database');

class ContactMessage {
  // Create a new contact message
  static async create(messageData) {
    const { name, email, subject, message } = messageData;

    try {
      const [result] = await db.execute(
        'INSERT INTO contact_messages (name, email, subject, message) VALUES (?, ?, ?, ?)',
        [name, email, subject, message]
      );

      return result.insertId;
    } catch (error) {
      throw error;
    }
  }

  // Find message by ID
  static async findById(id) {
    try {
      const [rows] = await db.execute('SELECT * FROM contact_messages WHERE id = ?', [id]);
      return rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Get all messages with pagination
  static async findAll(options = {}) {
    const { page = 1, limit = 10, status } = options;

    try {
      const offset = (page - 1) * limit;
      let whereClause = 'WHERE 1=1';
      let params = [];

      if (status) {
        whereClause += ' AND status = ?';
        params.push(status);
      }

      const [rows] = await db.execute(
        `SELECT * FROM contact_messages ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
        [...params, limit, offset]
      );

      const [countResult] = await db.execute(
        `SELECT COUNT(*) as total FROM contact_messages ${whereClause}`,
        params
      );
      const total = countResult[0].total;

      return {
        messages: rows,
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

  // Update message status
  static async updateStatus(id, status) {
    try {
      const [result] = await db.execute(
        'UPDATE contact_messages SET status = ? WHERE id = ?',
        [status, id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  // Mark as read
  static async markAsRead(id) {
    try {
      const [result] = await db.execute(
        'UPDATE contact_messages SET status = "read" WHERE id = ?',
        [id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  // Mark as replied
  static async markAsReplied(id) {
    try {
      const [result] = await db.execute(
        'UPDATE contact_messages SET status = "replied" WHERE id = ?',
        [id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  // Delete message
  static async delete(id) {
    try {
      const [result] = await db.execute('DELETE FROM contact_messages WHERE id = ?', [id]);
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  // Get message stats
  static async getStats() {
    try {
      const [total] = await db.execute('SELECT COUNT(*) as total FROM contact_messages');
      const [unread] = await db.execute('SELECT COUNT(*) as total FROM contact_messages WHERE status = "unread"');
      const [read] = await db.execute('SELECT COUNT(*) as total FROM contact_messages WHERE status = "read"');
      const [replied] = await db.execute('SELECT COUNT(*) as total FROM contact_messages WHERE status = "replied"');

      return {
        total: total[0].total,
        unread: unread[0].total,
        read: read[0].total,
        replied: replied[0].total
      };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = ContactMessage;