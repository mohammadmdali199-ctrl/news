const db = require('../config/database');
const bcrypt = require('bcrypt');

class User {
  // Create a new user
  static async create(userData) {
    const { name, email, password, role_id = 3, profile_image, bio } = userData;

    try {
      const hashedPassword = await bcrypt.hash(password, 10);

      const [result] = await db.execute(
        'INSERT INTO users (name, email, password, role_id, profile_image, bio) VALUES (?, ?, ?, ?, ?, ?)',
        [name, email, hashedPassword, role_id, profile_image, bio]
      );

      return result.insertId;
    } catch (error) {
      throw error;
    }
  }

  // Find user by email
  static async findByEmail(email) {
    try {
      const [rows] = await db.execute(
        'SELECT u.*, r.name as role_name FROM users u JOIN roles r ON u.role_id = r.id WHERE u.email = ?',
        [email]
      );
      return rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Find user by ID
  static async findById(id) {
    try {
      const [rows] = await db.execute(
        'SELECT u.*, r.name as role_name FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = ?',
        [id]
      );
      return rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Get all users with pagination
  static async findAll(page = 1, limit = 10) {
    try {
      const offset = (page - 1) * limit;
      const [rows] = await db.execute(
        'SELECT u.*, r.name as role_name FROM users u JOIN roles r ON u.role_id = r.id ORDER BY u.created_at DESC LIMIT ? OFFSET ?',
        [limit, offset]
      );

      const [countResult] = await db.execute('SELECT COUNT(*) as total FROM users');
      const total = countResult[0].total;

      return {
        users: rows,
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

  // Update user
  static async update(id, userData) {
    const { name, email, role_id, profile_image, bio, status } = userData;

    try {
      const [result] = await db.execute(
        'UPDATE users SET name = ?, email = ?, role_id = ?, profile_image = ?, bio = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [name, email, role_id, profile_image, bio, status, id]
      );

      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  // Update password
  static async updatePassword(id, newPassword) {
    try {
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      const [result] = await db.execute(
        'UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [hashedPassword, id]
      );

      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  // Delete user
  static async delete(id) {
    try {
      const [result] = await db.execute('DELETE FROM users WHERE id = ?', [id]);
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  // Verify password
  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  // Get user stats
  static async getStats() {
    try {
      const [totalUsers] = await db.execute('SELECT COUNT(*) as total FROM users');
      const [activeUsers] = await db.execute('SELECT COUNT(*) as total FROM users WHERE status = "active"');
      const [admins] = await db.execute('SELECT COUNT(*) as total FROM users WHERE role_id = 1');
      const [editors] = await db.execute('SELECT COUNT(*) as total FROM users WHERE role_id = 2');
      const [authors] = await db.execute('SELECT COUNT(*) as total FROM users WHERE role_id = 3');

      return {
        total: totalUsers[0].total,
        active: activeUsers[0].total,
        admins: admins[0].total,
        editors: editors[0].total,
        authors: authors[0].total
      };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = User;