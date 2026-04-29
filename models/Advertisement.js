const db = require('../config/database');

class Advertisement {
  // Create a new advertisement
  static async create(adData) {
    const { title, image, link, position, active = true } = adData;

    try {
      const [result] = await db.execute(
        'INSERT INTO advertisements (title, image, link, position, active) VALUES (?, ?, ?, ?, ?)',
        [title, image, link, position, active]
      );

      return result.insertId;
    } catch (error) {
      throw error;
    }
  }

  // Find advertisement by ID
  static async findById(id) {
    try {
      const [rows] = await db.execute('SELECT * FROM advertisements WHERE id = ?', [id]);
      return rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Get all advertisements
  static async findAll() {
    try {
      const [rows] = await db.execute('SELECT * FROM advertisements ORDER BY created_at DESC');
      return rows;
    } catch (error) {
      throw error;
    }
  }

  // Get active advertisements by position
  static async findActiveByPosition(position) {
    try {
      const [rows] = await db.execute(
        'SELECT * FROM advertisements WHERE position = ? AND active = TRUE ORDER BY created_at DESC',
        [position]
      );
      return rows;
    } catch (error) {
      throw error;
    }
  }

  // Get advertisements by position
  static async findByPosition(position) {
    try {
      const [rows] = await db.execute(
        'SELECT * FROM advertisements WHERE position = ? ORDER BY created_at DESC',
        [position]
      );
      return rows;
    } catch (error) {
      throw error;
    }
  }

  // Update advertisement
  static async update(id, adData) {
    const { title, image, link, position, active } = adData;

    try {
      const [result] = await db.execute(
        'UPDATE advertisements SET title = COALESCE(?, title), image = COALESCE(?, image), link = COALESCE(?, link), position = COALESCE(?, position), active = COALESCE(?, active) WHERE id = ?',
        [title, image, link, position, active, id]
      );

      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  // Delete advertisement
  static async delete(id) {
    try {
      const [result] = await db.execute('DELETE FROM advertisements WHERE id = ?', [id]);
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  // Toggle active status
  static async toggleActive(id) {
    try {
      const [result] = await db.execute(
        'UPDATE advertisements SET active = NOT active WHERE id = ?',
        [id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  // Get advertisement stats
  static async getStats() {
    try {
      const [total] = await db.execute('SELECT COUNT(*) as total FROM advertisements');
      const [active] = await db.execute('SELECT COUNT(*) as total FROM advertisements WHERE active = TRUE');

      // Count by position
      const [positions] = await db.execute(
        'SELECT position, COUNT(*) as count FROM advertisements GROUP BY position'
      );

      return {
        total: total[0].total,
        active: active[0].total,
        positions: positions
      };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Advertisement;