const { body, validationResult } = require('express-validator');
const News = require('../models/News');
const { Category, Subcategory } = require('../models/Category');
const Tag = require('../models/Tag');
const Comment = require('../models/Comment');

// Validation rules
const newsValidation = [
  body('title').trim().isLength({ min: 5, max: 255 }).withMessage('Title must be between 5 and 255 characters'),
  body('content').trim().isLength({ min: 50 }).withMessage('Content must be at least 50 characters'),
  body('category_id').isInt().withMessage('Valid category is required'),
  body('seo_title').optional().isLength({ max: 255 }).withMessage('SEO title must be less than 255 characters'),
  body('seo_description').optional().isLength({ max: 500 }).withMessage('SEO description must be less than 500 characters')
];

const commentValidation = [
  body('comment').trim().isLength({ min: 10, max: 1000 }).withMessage('Comment must be between 10 and 1000 characters'),
  body('name').optional().trim().isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
  body('email').optional().isEmail().withMessage('Valid email is required for guest comments')
];

// Get all news (public)
const getNews = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      category,
      subcategory,
      author,
      search,
      featured,
      breaking
    } = req.query;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      status: 'published',
      category: category ? parseInt(category) : null,
      subcategory: subcategory ? parseInt(subcategory) : null,
      author: author ? parseInt(author) : null,
      search,
      featured: featured === 'true',
      breaking: breaking === 'true'
    };

    const result = await News.findAll(options);

    res.json({
      success: true,
      data: result.news,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Get news error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get single news by slug (public)
const getNewsBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const news = await News.findBySlug(slug);

    if (!news) {
      return res.status(404).json({ success: false, message: 'News not found' });
    }

    res.json({ success: true, data: news });
  } catch (error) {
    console.error('Get news by slug error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get popular news
const getPopularNews = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const news = await News.getPopular(limit);

    res.json({ success: true, data: news });
  } catch (error) {
    console.error('Get popular news error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get recent news
const getRecentNews = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const news = await News.getRecent(limit);

    res.json({ success: true, data: news });
  } catch (error) {
    console.error('Get recent news error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get breaking news
const getBreakingNews = async (req, res) => {
  try {
    const news = await News.getBreaking();
    res.json({ success: true, data: news });
  } catch (error) {
    console.error('Get breaking news error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get featured news
const getFeaturedNews = async (req, res) => {
  try {
    const news = await News.getFeatured();
    res.json({ success: true, data: news });
  } catch (error) {
    console.error('Get featured news error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Create news (admin/editor)
const createNews = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const newsData = {
      ...req.body,
      author_id: req.user.id,
      image: req.file ? `/uploads/${req.file.filename}` : req.body.image
    };

    // Handle tags
    if (req.body.tags) {
      if (typeof req.body.tags === 'string') {
        newsData.tags = JSON.parse(req.body.tags);
      } else {
        newsData.tags = req.body.tags;
      }
    }

    const newsId = await News.create(newsData);

    res.status(201).json({
      success: true,
      message: 'News created successfully',
      data: { id: newsId }
    });
  } catch (error) {
    console.error('Create news error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Update news (admin/editor)
const updateNews = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { id } = req.params;
    const newsData = req.body;

    // Handle image upload
    if (req.file) {
      newsData.image = `/uploads/${req.file.filename}`;
    }

    // Handle tags
    if (req.body.tags) {
      if (typeof req.body.tags === 'string') {
        newsData.tags = JSON.parse(req.body.tags);
      }
    }

    const success = await News.update(id, newsData);

    if (success) {
      res.json({ success: true, message: 'News updated successfully' });
    } else {
      res.status(404).json({ success: false, message: 'News not found' });
    }
  } catch (error) {
    console.error('Update news error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Delete news (admin/editor)
const deleteNews = async (req, res) => {
  try {
    const { id } = req.params;
    const success = await News.delete(id);

    if (success) {
      res.json({ success: true, message: 'News deleted successfully' });
    } else {
      res.status(404).json({ success: false, message: 'News not found' });
    }
  } catch (error) {
    console.error('Delete news error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Publish news (admin/editor)
const publishNews = async (req, res) => {
  try {
    const { id } = req.params;
    const success = await News.publish(id);

    if (success) {
      res.json({ success: true, message: 'News published successfully' });
    } else {
      res.status(404).json({ success: false, message: 'News not found' });
    }
  } catch (error) {
    console.error('Publish news error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Archive news (admin/editor)
const archiveNews = async (req, res) => {
  try {
    const { id } = req.params;
    const success = await News.archive(id);

    if (success) {
      res.json({ success: true, message: 'News archived successfully' });
    } else {
      res.status(404).json({ success: false, message: 'News not found' });
    }
  } catch (error) {
    console.error('Archive news error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get comments for news
const getComments = async (req, res) => {
  try {
    const { newsId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const result = await Comment.findByNewsId(newsId, true, parseInt(page), parseInt(limit));

    res.json({
      success: true,
      data: result.comments,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Add comment to news
const addComment = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { newsId } = req.params;
    const { comment, name, email } = req.body;

    const commentData = {
      news_id: newsId,
      comment
    };

    if (req.user) {
      // Authenticated user
      commentData.user_id = req.user.id;
    } else {
      // Guest user
      commentData.name = name;
      commentData.email = email;
    }

    const commentId = await Comment.create(commentData);

    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      data: { id: commentId }
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get news for admin
const getAdminNews = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      category,
      author,
      search
    } = req.query;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      status,
      category: category ? parseInt(category) : null,
      author: author ? parseInt(author) : null,
      search
    };

    const result = await News.findAll(options);

    res.json({
      success: true,
      data: result.news,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Get admin news error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get single news for admin
const getAdminNewsById = async (req, res) => {
  try {
    const { id } = req.params;
    const news = await News.findById(id);

    if (!news) {
      return res.status(404).json({ success: false, message: 'News not found' });
    }

    res.json({ success: true, data: news });
  } catch (error) {
    console.error('Get admin news by ID error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  getNews,
  getNewsBySlug,
  getPopularNews,
  getRecentNews,
  getBreakingNews,
  getFeaturedNews,
  createNews,
  updateNews,
  deleteNews,
  publishNews,
  archiveNews,
  getComments,
  addComment,
  getAdminNews,
  getAdminNewsById,
  newsValidation,
  commentValidation
};