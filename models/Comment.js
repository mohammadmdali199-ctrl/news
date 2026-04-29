const db = require('../config/database');

class Comment {
  // Create a new comment
  static async create(commentData) {
    const { news_id, user_id, name, email, comment } = commentData;

    try {
      const [result] = await db.execute(
        'INSERT INTO comments (news_id, user_id, name, email, comment) VALUES (?, ?, ?, ?, ?)',
        [news_id, user_id, name, email, comment]
      );

      return result.insertId;
    } catch (error) {
      throw error;
    }
  }

  // Find comment by ID
  static async findById(id) {
    try {
      const [rows] = await db.execute(
        `SELECT c.*, n.title as news_title, u.name as user_name
         FROM comments c
         JOIN news_posts n ON c.news_id = n.id
         LEFT JOIN users u ON c.user_id = u.id
         WHERE c.id = ?`,
        [id]
      );
      return rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Get comments for a news post
  static async findByNewsId(newsId, approved = true, page = 1, limit = 10) {
    try {
      const offset = (page - 1) * limit;
      let whereClause = 'WHERE c.news_id = ?';
      let params = [newsId];

      if (approved !== null) {
        whereClause += ' AND c.approved = ?';
        params.push(approved);
      }

      const [rows] = await db.execute(
        `SELECT c.*, u.name as user_name, u.profile_image
         FROM comments c
         LEFT JOIN users u ON c.user_id = u.id
         ${whereClause}
         ORDER BY c.created_at DESC
         LIMIT ? OFFSET ?`,
        [...params, limit, offset]
      );

      const [countResult] = await db.execute(
        `SELECT COUNT(*) as total FROM comments c ${whereClause}`,
        params
      );
      const total = countResult[0].total;

      return {
        comments: rows,
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

  // Get all comments with pagination
  static async findAll(options = {}) {
    const { page = 1, limit = 10, approved, news_id } = options;

    try {
      const offset = (page - 1) * limit;
      let whereClause = 'WHERE 1=1';
      let params = [];

      if (approved !== undefined) {
        whereClause += ' AND c.approved = ?';
        params.push(approved);
      }

      if (news_id) {
        whereClause += ' AND c.news_id = ?';
        params.push(news_id);
      }

      const [rows] = await db.execute(
        `SELECT c.*, n.title as news_title, u.name as user_name
         FROM comments c
         JOIN news_posts n ON c.news_id = n.id
         LEFT JOIN users u ON c.user_id = u.id
         ${whereClause}
         ORDER BY c.created_at DESC
         LIMIT ? OFFSET ?`,
        [...params, limit, offset]
      );

      const [countResult] = await db.execute(
        `SELECT COUNT(*) as total FROM comments c ${whereClause}`,
        params
      );
      const total = countResult[0].total;

      return {
        comments: rows,
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

  // Approve comment
  static async approve(id) {
    try {
      const [result] = await db.execute(
        'UPDATE comments SET approved = TRUE WHERE id = ?',
        [id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  // Reject comment (delete)
  static async reject(id) {
    try {
      const [result] = await db.execute('DELETE FROM comments WHERE id = ?', [id]);
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  // Delete comment
  static async delete(id) {
    try {
      const [result] = await db.execute('DELETE FROM comments WHERE id = ?', [id]);
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  // Get comment stats
  static async getStats() {
    try {
      const [total] = await db.execute('SELECT COUNT(*) as total FROM comments');
      const [approved] = await db.execute('SELECT COUNT(*) as total FROM comments WHERE approved = TRUE');
      const [pending] = await db.execute('SELECT COUNT(*) as total FROM comments WHERE approved = FALSE');

      return {
        total: total[0].total,
        approved: approved[0].total,
        pending: pending[0].total
      };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Comment;