const db = require('../config/database');
const slugify = require('slugify');

class Tag {
  // Create a new tag
  static async create(tagData) {
    const { name } = tagData;

    try {
      const slug = slugify(name, { lower: true, strict: true });

      const [result] = await db.execute(
        'INSERT INTO tags (name, slug) VALUES (?, ?)',
        [name, slug]
      );

      return result.insertId;
    } catch (error) {
      // Handle duplicate key error
      if (error.code === 'ER_DUP_ENTRY') {
        throw new Error('Tag already exists');
      }
      throw error;
    }
  }

  // Find tag by ID
  static async findById(id) {
    try {
      const [rows] = await db.execute('SELECT * FROM tags WHERE id = ?', [id]);
      return rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Find tag by slug
  static async findBySlug(slug) {
    try {
      const [rows] = await db.execute('SELECT * FROM tags WHERE slug = ?', [slug]);
      return rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Find tag by name
  static async findByName(name) {
    try {
      const [rows] = await db.execute('SELECT * FROM tags WHERE name = ?', [name]);
      return rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Get all tags
  static async findAll() {
    try {
      const [rows] = await db.execute('SELECT * FROM tags ORDER BY name ASC');
      return rows;
    } catch (error) {
      throw error;
    }
  }

  // Get tags with usage count
  static async findAllWithCount() {
    try {
      const [rows] = await db.execute(
        `SELECT t.*, COUNT(nt.news_id) as usage_count
         FROM tags t
         LEFT JOIN news_tags nt ON t.id = nt.tag_id
         GROUP BY t.id
         ORDER BY t.name ASC`
      );
      return rows;
    } catch (error) {
      throw error;
    }
  }

  // Get popular tags
  static async getPopular(limit = 20) {
    try {
      const [rows] = await db.execute(
        `SELECT t.*, COUNT(nt.news_id) as usage_count
         FROM tags t
         JOIN news_tags nt ON t.id = nt.tag_id
         GROUP BY t.id
         ORDER BY usage_count DESC
         LIMIT ?`,
        [limit]
      );
      return rows;
    } catch (error) {
      throw error;
    }
  }

  // Update tag
  static async update(id, tagData) {
    const { name } = tagData;

    try {
      let slug = null;
      if (name) {
        slug = slugify(name, { lower: true, strict: true });
      }

      const [result] = await db.execute(
        'UPDATE tags SET name = COALESCE(?, name), slug = COALESCE(?, slug) WHERE id = ?',
        [name, slug, id]
      );

      return result.affectedRows > 0;
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        throw new Error('Tag name already exists');
      }
      throw error;
    }
  }

  // Delete tag
  static async delete(id) {
    try {
      // Check if tag is being used
      const [usageCount] = await db.execute('SELECT COUNT(*) as count FROM news_tags WHERE tag_id = ?', [id]);

      if (usageCount[0].count > 0) {
        throw new Error('Cannot delete tag that is being used by news posts');
      }

      const [result] = await db.execute('DELETE FROM tags WHERE id = ?', [id]);
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  // Get news posts for a tag
  static async getNewsByTag(tagId, page = 1, limit = 10) {
    try {
      const offset = (page - 1) * limit;

      const [rows] = await db.execute(
        `SELECT n.*, u.name as author_name, c.name as category_name
         FROM news_posts n
         JOIN users u ON n.author_id = u.id
         JOIN categories c ON n.category_id = c.id
         JOIN news_tags nt ON n.id = nt.news_id
         WHERE nt.tag_id = ? AND n.status = 'published'
         ORDER BY n.published_at DESC
         LIMIT ? OFFSET ?`,
        [tagId, limit, offset]
      );

      const [countResult] = await db.execute(
        `SELECT COUNT(*) as total
         FROM news_posts n
         JOIN news_tags nt ON n.id = nt.news_id
         WHERE nt.tag_id = ? AND n.status = 'published'`,
        [tagId]
      );
      const total = countResult[0].total;

      return {
        news: rows,
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

  // Search tags
  static async search(query, limit = 10) {
    try {
      const [rows] = await db.execute(
        'SELECT * FROM tags WHERE name LIKE ? ORDER BY name ASC LIMIT ?',
        [`%${query}%`, limit]
      );
      return rows;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Tag;