const db = require('../config/database');
const slugify = require('slugify');

class News {
  // Create a new news post
  static async create(newsData) {
    const {
      title,
      content,
      summary,
      image,
      author_id,
      category_id,
      subcategory_id,
      status = 'draft',
      seo_title,
      seo_description,
      featured = false,
      breaking = false,
      tags = []
    } = newsData;

    try {
      const slug = slugify(title, { lower: true, strict: true });

      const [result] = await db.execute(
        `INSERT INTO news_posts
         (title, slug, content, summary, image, author_id, category_id, subcategory_id,
          status, seo_title, seo_description, featured, breaking)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [title, slug, content, summary, image, author_id, category_id, subcategory_id,
         status, seo_title, seo_description, featured, breaking]
      );

      const newsId = result.insertId;

      // Add tags if provided
      if (tags && tags.length > 0) {
        await this.addTags(newsId, tags);
      }

      return newsId;
    } catch (error) {
      throw error;
    }
  }

  // Find news by ID
  static async findById(id) {
    try {
      const [rows] = await db.execute(
        `SELECT n.*, u.name as author_name, c.name as category_name, sc.name as subcategory_name
         FROM news_posts n
         JOIN users u ON n.author_id = u.id
         JOIN categories c ON n.category_id = c.id
         LEFT JOIN subcategories sc ON n.subcategory_id = sc.id
         WHERE n.id = ?`,
        [id]
      );

      if (rows[0]) {
        rows[0].tags = await this.getTags(id);
      }

      return rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Find news by slug
  static async findBySlug(slug) {
    try {
      const [rows] = await db.execute(
        `SELECT n.*, u.name as author_name, c.name as category_name, sc.name as subcategory_name
         FROM news_posts n
         JOIN users u ON n.author_id = u.id
         JOIN categories c ON n.category_id = c.id
         LEFT JOIN subcategories sc ON n.subcategory_id = sc.id
         WHERE n.slug = ? AND n.status = 'published'`,
        [slug]
      );

      if (rows[0]) {
        rows[0].tags = await this.getTags(rows[0].id);
        // Increment view count
        await this.incrementViews(rows[0].id);
      }

      return rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Get all news with pagination and filters
  static async findAll(options = {}) {
    const {
      page = 1,
      limit = 10,
      category,
      subcategory,
      author,
      status = 'published',
      featured,
      breaking,
      search,
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = options;

    try {
      let whereClause = 'WHERE 1=1';
      let params = [];

      if (status) {
        whereClause += ' AND n.status = ?';
        params.push(status);
      }

      if (category) {
        whereClause += ' AND n.category_id = ?';
        params.push(category);
      }

      if (subcategory) {
        whereClause += ' AND n.subcategory_id = ?';
        params.push(subcategory);
      }

      if (author) {
        whereClause += ' AND n.author_id = ?';
        params.push(author);
      }

      if (featured !== undefined) {
        whereClause += ' AND n.featured = ?';
        params.push(featured);
      }

      if (breaking !== undefined) {
        whereClause += ' AND n.breaking = ?';
        params.push(breaking);
      }

      if (search) {
        whereClause += ' AND (n.title LIKE ? OR n.content LIKE ? OR n.summary LIKE ?)';
        params.push(`%${search}%`, `%${search}%`, `%${search}%`);
      }

      const offset = (page - 1) * limit;
      const orderBy = `n.${sortBy} ${sortOrder}`;

      const [rows] = await db.execute(
        `SELECT n.*, u.name as author_name, c.name as category_name, sc.name as subcategory_name
         FROM news_posts n
         JOIN users u ON n.author_id = u.id
         JOIN categories c ON n.category_id = c.id
         LEFT JOIN subcategories sc ON n.subcategory_id = sc.id
         ${whereClause}
         ORDER BY ${orderBy}
         LIMIT ? OFFSET ?`,
        [...params, limit, offset]
      );

      // Get tags for each news item
      for (let news of rows) {
        news.tags = await this.getTags(news.id);
      }

      // Get total count
      const [countResult] = await db.execute(
        `SELECT COUNT(*) as total FROM news_posts n ${whereClause}`,
        params
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

  // Update news
  static async update(id, newsData) {
    const {
      title,
      content,
      summary,
      image,
      category_id,
      subcategory_id,
      status,
      seo_title,
      seo_description,
      featured,
      breaking,
      tags
    } = newsData;

    try {
      let slug = null;
      if (title) {
        slug = slugify(title, { lower: true, strict: true });
      }

      const [result] = await db.execute(
        `UPDATE news_posts SET
         title = COALESCE(?, title),
         slug = COALESCE(?, slug),
         content = COALESCE(?, content),
         summary = COALESCE(?, summary),
         image = COALESCE(?, image),
         category_id = COALESCE(?, category_id),
         subcategory_id = ?,
         status = COALESCE(?, status),
         seo_title = COALESCE(?, seo_title),
         seo_description = COALESCE(?, seo_description),
         featured = COALESCE(?, featured),
         breaking = COALESCE(?, breaking),
         updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [title, slug, content, summary, image, category_id, subcategory_id,
         status, seo_title, seo_description, featured, breaking, id]
      );

      // Update tags if provided
      if (tags !== undefined) {
        await this.updateTags(id, tags);
      }

      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  // Delete news
  static async delete(id) {
    try {
      // Tags will be deleted automatically due to CASCADE constraint
      const [result] = await db.execute('DELETE FROM news_posts WHERE id = ?', [id]);
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  // Publish news
  static async publish(id) {
    try {
      const [result] = await db.execute(
        'UPDATE news_posts SET status = "published", published_at = CURRENT_TIMESTAMP WHERE id = ?',
        [id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  // Archive news
  static async archive(id) {
    try {
      const [result] = await db.execute(
        'UPDATE news_posts SET status = "archived" WHERE id = ?',
        [id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  // Increment view count
  static async incrementViews(id) {
    try {
      await db.execute('UPDATE news_posts SET views = views + 1 WHERE id = ?', [id]);
    } catch (error) {
      // Don't throw error for view count updates
      console.error('Error updating view count:', error);
    }
  }

  // Add tags to news
  static async addTags(newsId, tagIds) {
    try {
      const values = tagIds.map(tagId => [newsId, tagId]);
      await db.query('INSERT IGNORE INTO news_tags (news_id, tag_id) VALUES ?', [values]);
    } catch (error) {
      throw error;
    }
  }

  // Update tags for news
  static async updateTags(newsId, tagIds) {
    try {
      // Remove existing tags
      await db.execute('DELETE FROM news_tags WHERE news_id = ?', [newsId]);

      // Add new tags
      if (tagIds && tagIds.length > 0) {
        await this.addTags(newsId, tagIds);
      }
    } catch (error) {
      throw error;
    }
  }

  // Get tags for news
  static async getTags(newsId) {
    try {
      const [rows] = await db.execute(
        'SELECT t.* FROM tags t JOIN news_tags nt ON t.id = nt.tag_id WHERE nt.news_id = ?',
        [newsId]
      );
      return rows;
    } catch (error) {
      throw error;
    }
  }

  // Get popular news
  static async getPopular(limit = 10) {
    try {
      const [rows] = await db.execute(
        `SELECT n.*, u.name as author_name, c.name as category_name
         FROM news_posts n
         JOIN users u ON n.author_id = u.id
         JOIN categories c ON n.category_id = c.id
         WHERE n.status = 'published'
         ORDER BY n.views DESC
         LIMIT ?`,
        [limit]
      );

      for (let news of rows) {
        news.tags = await this.getTags(news.id);
      }

      return rows;
    } catch (error) {
      throw error;
    }
  }

  // Get recent news
  static async getRecent(limit = 10) {
    try {
      const [rows] = await db.execute(
        `SELECT n.*, u.name as author_name, c.name as category_name
         FROM news_posts n
         JOIN users u ON n.author_id = u.id
         JOIN categories c ON n.category_id = c.id
         WHERE n.status = 'published'
         ORDER BY n.published_at DESC
         LIMIT ?`,
        [limit]
      );

      for (let news of rows) {
        news.tags = await this.getTags(news.id);
      }

      return rows;
    } catch (error) {
      throw error;
    }
  }

  // Get breaking news
  static async getBreaking() {
    try {
      const [rows] = await db.execute(
        `SELECT n.*, u.name as author_name, c.name as category_name
         FROM news_posts n
         JOIN users u ON n.author_id = u.id
         JOIN categories c ON n.category_id = c.id
         WHERE n.status = 'published' AND n.breaking = TRUE
         ORDER BY n.published_at DESC`
      );

      for (let news of rows) {
        news.tags = await this.getTags(news.id);
      }

      return rows;
    } catch (error) {
      throw error;
    }
  }

  // Get featured news
  static async getFeatured() {
    try {
      const [rows] = await db.execute(
        `SELECT n.*, u.name as author_name, c.name as category_name, fn.display_order
         FROM news_posts n
         JOIN users u ON n.author_id = u.id
         JOIN categories c ON n.category_id = c.id
         JOIN featured_news fn ON n.id = fn.news_id
         WHERE n.status = 'published' AND n.featured = TRUE
         ORDER BY fn.display_order ASC, n.published_at DESC`
      );

      for (let news of rows) {
        news.tags = await this.getTags(news.id);
      }

      return rows;
    } catch (error) {
      throw error;
    }
  }

  // Get news stats
  static async getStats() {
    try {
      const [total] = await db.execute('SELECT COUNT(*) as total FROM news_posts');
      const [published] = await db.execute('SELECT COUNT(*) as total FROM news_posts WHERE status = "published"');
      const [drafts] = await db.execute('SELECT COUNT(*) as total FROM news_posts WHERE status = "draft"');
      const [featured] = await db.execute('SELECT COUNT(*) as total FROM news_posts WHERE featured = TRUE');
      const [breaking] = await db.execute('SELECT COUNT(*) as total FROM news_posts WHERE breaking = TRUE');

      return {
        total: total[0].total,
        published: published[0].total,
        drafts: drafts[0].total,
        featured: featured[0].total,
        breaking: breaking[0].total
      };
    } catch (error) {
      throw error;
    }
  }

  // Get news by category slug
  static async getByCategory(categorySlug, limit = 10) {
    try {
      const [rows] = await db.execute(
        `SELECT n.*, u.name as author_name, c.name as category_name
         FROM news_posts n
         JOIN users u ON n.author_id = u.id
         JOIN categories c ON n.category_id = c.id
         WHERE c.slug = ? AND n.status = 'published'
         ORDER BY n.published_at DESC
         LIMIT ?`,
        [categorySlug, limit]
      );

      for (let news of rows) {
        news.tags = await this.getTags(news.id);
      }

      return rows;
    } catch (error) {
      throw error;
    }
  }

  // Get videos
  static async getVideos(limit = 10) {
    try {
      const [rows] = await db.execute(
        'SELECT * FROM videos WHERE status = "active" ORDER BY created_at DESC LIMIT ?',
        [limit]
      );
      return rows;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = News;