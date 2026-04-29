const db = require('../config/database');
const slugify = require('slugify');

class Category {
  // Create a new category
  static async create(categoryData) {
    const { name, description, image } = categoryData;

    try {
      const slug = slugify(name, { lower: true, strict: true });

      const [result] = await db.execute(
        'INSERT INTO categories (name, slug, description, image) VALUES (?, ?, ?, ?)',
        [name, slug, description, image]
      );

      return result.insertId;
    } catch (error) {
      throw error;
    }
  }

  // Find category by ID
  static async findById(id) {
    try {
      const [rows] = await db.execute('SELECT * FROM categories WHERE id = ?', [id]);
      return rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Find category by slug
  static async findBySlug(slug) {
    try {
      const [rows] = await db.execute('SELECT * FROM categories WHERE slug = ?', [slug]);
      return rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Get all categories
  static async findAll() {
    try {
      const [rows] = await db.execute('SELECT * FROM categories ORDER BY name ASC');
      return rows;
    } catch (error) {
      throw error;
    }
  }

  // Get categories with news count
  static async findAllWithCount() {
    try {
      const [rows] = await db.execute(
        `SELECT c.*, COUNT(n.id) as news_count
         FROM categories c
         LEFT JOIN news_posts n ON c.id = n.category_id AND n.status = 'published'
         GROUP BY c.id
         ORDER BY c.name ASC`
      );
      return rows;
    } catch (error) {
      throw error;
    }
  }

  // Update category
  static async update(id, categoryData) {
    const { name, description, image } = categoryData;

    try {
      let slug = null;
      if (name) {
        slug = slugify(name, { lower: true, strict: true });
      }

      const [result] = await db.execute(
        'UPDATE categories SET name = COALESCE(?, name), slug = COALESCE(?, slug), description = COALESCE(?, description), image = COALESCE(?, image) WHERE id = ?',
        [name, slug, description, image, id]
      );

      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  // Delete category
  static async delete(id) {
    try {
      // Check if category has news posts
      const [newsCount] = await db.execute('SELECT COUNT(*) as count FROM news_posts WHERE category_id = ?', [id]);

      if (newsCount[0].count > 0) {
        throw new Error('Cannot delete category with existing news posts');
      }

      const [result] = await db.execute('DELETE FROM categories WHERE id = ?', [id]);
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  // Get subcategories for a category
  static async getSubcategories(categoryId) {
    try {
      const [rows] = await db.execute(
        'SELECT * FROM subcategories WHERE category_id = ? ORDER BY name ASC',
        [categoryId]
      );
      return rows;
    } catch (error) {
      throw error;
    }
  }
}

class Subcategory {
  // Create a new subcategory
  static async create(subcategoryData) {
    const { name, category_id, description } = subcategoryData;

    try {
      const slug = slugify(name, { lower: true, strict: true });

      const [result] = await db.execute(
        'INSERT INTO subcategories (name, slug, category_id, description) VALUES (?, ?, ?, ?)',
        [name, slug, category_id, description]
      );

      return result.insertId;
    } catch (error) {
      throw error;
    }
  }

  // Find subcategory by ID
  static async findById(id) {
    try {
      const [rows] = await db.execute(
        'SELECT s.*, c.name as category_name FROM subcategories s JOIN categories c ON s.category_id = c.id WHERE s.id = ?',
        [id]
      );
      return rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Find subcategory by slug
  static async findBySlug(slug) {
    try {
      const [rows] = await db.execute(
        'SELECT s.*, c.name as category_name FROM subcategories s JOIN categories c ON s.category_id = c.id WHERE s.slug = ?',
        [slug]
      );
      return rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Get all subcategories
  static async findAll() {
    try {
      const [rows] = await db.execute(
        'SELECT s.*, c.name as category_name FROM subcategories s JOIN categories c ON s.category_id = c.id ORDER BY c.name ASC, s.name ASC'
      );
      return rows;
    } catch (error) {
      throw error;
    }
  }

  // Update subcategory
  static async update(id, subcategoryData) {
    const { name, category_id, description } = subcategoryData;

    try {
      let slug = null;
      if (name) {
        slug = slugify(name, { lower: true, strict: true });
      }

      const [result] = await db.execute(
        'UPDATE subcategories SET name = COALESCE(?, name), slug = COALESCE(?, slug), category_id = COALESCE(?, category_id), description = COALESCE(?, description) WHERE id = ?',
        [name, slug, category_id, description, id]
      );

      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  // Delete subcategory
  static async delete(id) {
    try {
      // Check if subcategory has news posts
      const [newsCount] = await db.execute('SELECT COUNT(*) as count FROM news_posts WHERE subcategory_id = ?', [id]);

      if (newsCount[0].count > 0) {
        throw new Error('Cannot delete subcategory with existing news posts');
      }

      const [result] = await db.execute('DELETE FROM subcategories WHERE id = ?', [id]);
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = { Category, Subcategory };