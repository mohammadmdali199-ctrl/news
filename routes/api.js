const express = require('express');
const router = express.Router();
const newsController = require('../controllers/newsController');
const authController = require('../controllers/authController');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

// Public API routes (no authentication required)
router.get('/news', newsController.getNews);
router.get('/news/popular', newsController.getPopularNews);
router.get('/news/recent', newsController.getRecentNews);
router.get('/news/breaking', newsController.getBreakingNews);
router.get('/news/featured', newsController.getFeaturedNews);
router.get('/news/:slug', newsController.getNewsBySlug);

// Comments (optional auth for posting)
router.get('/news/:newsId/comments', optionalAuth, newsController.getComments);
router.post('/news/:newsId/comments', optionalAuth, newsController.commentValidation, newsController.addComment);

// Categories
router.get('/categories', async (req, res) => {
  try {
    const { Category } = require('../models/Category');
    const categories = await Category.findAllWithCount();
    res.json({ success: true, data: categories });
  } catch (error) {
    console.error('Get categories API error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/categories/:slug', async (req, res) => {
  try {
    const { Category } = require('../models/Category');
    const category = await Category.findBySlug(req.params.slug);

    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    const News = require('../models/News');
    const news = await News.findAll({
      category: category.id,
      status: 'published',
      limit: parseInt(req.query.limit) || 10
    });

    res.json({
      success: true,
      data: {
        category,
        news: news.news,
        pagination: news.pagination
      }
    });
  } catch (error) {
    console.error('Get category API error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Tags
router.get('/tags', async (req, res) => {
  try {
    const Tag = require('../models/Tag');
    const tags = await Tag.findAllWithCount();
    res.json({ success: true, data: tags });
  } catch (error) {
    console.error('Get tags API error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/tags/:slug', async (req, res) => {
  try {
    const Tag = require('../models/Tag');
    const tag = await Tag.findBySlug(req.params.slug);

    if (!tag) {
      return res.status(404).json({ success: false, message: 'Tag not found' });
    }

    const news = await Tag.getNewsByTag(tag.id, 1, parseInt(req.query.limit) || 10);

    res.json({
      success: true,
      data: {
        tag,
        news: news.news,
        pagination: news.pagination
      }
    });
  } catch (error) {
    console.error('Get tag API error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Search
router.get('/search', async (req, res) => {
  try {
    const { q: query } = req.query;

    if (!query) {
      return res.json({ success: true, data: [], pagination: null });
    }

    const News = require('../models/News');
    const result = await News.findAll({
      search: query,
      status: 'published',
      limit: parseInt(req.query.limit) || 10
    });

    res.json({
      success: true,
      data: result.news,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Search API error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Authentication routes
router.post('/auth/register', authController.registerValidation, authController.register);
router.post('/auth/login', authController.loginValidation, authController.apiLogin);
router.post('/auth/logout', authController.logout);
router.get('/auth/me', authenticateToken, authController.getCurrentUser);

// Contact
router.post('/contact', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    const ContactMessage = require('../models/ContactMessage');

    const messageId = await ContactMessage.create({ name, email, subject, message });

    res.json({
      success: true,
      message: 'Message sent successfully',
      data: { id: messageId }
    });
  } catch (error) {
    console.error('Contact API error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Protected API routes (require authentication)
router.use(authenticateToken);

// User profile
router.get('/user/profile', authController.getCurrentUser);
router.put('/user/profile', authController.updateProfile);
router.put('/user/password', authController.changePassword);

// Admin only routes
router.use(async (req, res, next) => {
  if (req.user.role_id !== 1) {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
});

// Admin API routes are handled in admin.js routes
// This is just for pure API access without HTML rendering

module.exports = router;