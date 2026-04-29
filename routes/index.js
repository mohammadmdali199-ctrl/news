const express = require('express');
const router = express.Router();
const newsController = require('../controllers/newsController');
const authController = require('../controllers/authController');
const { optionalAuth } = require('../middleware/auth');
const VisitorLog = require('../models/VisitorLog');

// Middleware to log visitors
const logVisitor = async (req, res, next) => {
  try {
    const visitorData = {
      ip: req.ip || req.connection.remoteAddress,
      user_agent: req.get('User-Agent'),
      url: req.originalUrl,
      referrer: req.get('Referrer'),
      session_id: req.sessionID
    };

    await VisitorLog.log(visitorData);
  } catch (error) {
    // Don't block request if logging fails
    console.error('Visitor logging error:', error);
  }
  next();
};

// Apply visitor logging to all routes
router.use(logVisitor);

// Home page
router.get('/', async (req, res) => {
  try {
    // Get data for homepage
    const News = require('../models/News');
    const Category = require('../models/Category');
    
    const featuredNews = await News.getFeatured();
    const breakingNews = await News.getBreaking();
    const latestNews = await News.getRecent(8);
    const popularNews = await News.getPopular(5);
    const categories = await Category.findAll();
    const videos = await News.getVideos(3);
    const opinionNews = await News.getByCategory('opinion', 4);

    // Add news to categories
    for (let category of categories) {
      category.news = await News.getByCategory(category.slug, 3);
    }

    res.render('home', {
      title: 'Home - News Portal',
      description: 'Latest news and updates from Bangladesh and around the world',
      featuredNews,
      breakingNews,
      latestNews,
      popularNews,
      categories,
      videos,
      opinionNews
    });
  } catch (error) {
    console.error('Home page error:', error);
    res.status(500).render('500', { title: 'Server Error' });
  }
});

// News routes
router.get('/news', newsController.getNews);
router.get('/news/popular', newsController.getPopularNews);
router.get('/news/recent', newsController.getRecentNews);
router.get('/news/breaking', newsController.getBreakingNews);
router.get('/news/featured', newsController.getFeaturedNews);
router.get('/news/:slug', newsController.getNewsBySlug);

// Category routes
router.get('/category/:slug', async (req, res) => {
  try {
    const { Category } = require('../models/Category');
    const category = await Category.findBySlug(req.params.slug);

    if (!category) {
      return res.status(404).render('404', { title: 'Category Not Found' });
    }

    const News = require('../models/News');
    const news = await News.findAll({
      category: category.id,
      status: 'published',
      limit: 12
    });

    res.render('category', {
      title: category.name,
      category,
      news: news.news,
      pagination: news.pagination
    });
  } catch (error) {
    console.error('Category page error:', error);
    res.status(500).render('500', { title: 'Server Error' });
  }
});

// Search
router.get('/search', async (req, res) => {
  try {
    const { q: query } = req.query;

    if (!query) {
      return res.render('search', {
        title: 'Search',
        query: '',
        news: [],
        pagination: null
      });
    }

    const News = require('../models/News');
    const result = await News.findAll({
      search: query,
      status: 'published',
      limit: 12
    });

    res.render('search', {
      title: `Search: ${query}`,
      query,
      news: result.news,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).render('500', { title: 'Server Error' });
  }
});

// Contact page
router.get('/contact', (req, res) => {
  res.render('contact', { title: 'Contact Us' });
});

router.post('/contact', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    const ContactMessage = require('../models/ContactMessage');

    await ContactMessage.create({ name, email, subject, message });

    req.flash('success_msg', 'Your message has been sent successfully!');
    res.redirect('/contact');
  } catch (error) {
    console.error('Contact form error:', error);
    req.flash('error_msg', 'Failed to send message. Please try again.');
    res.redirect('/contact');
  }
});

// Authentication routes (for frontend)
router.get('/login', (req, res) => {
  if (req.isAuthenticated()) {
    return res.redirect('/admin');
  }
  res.render('login', { title: 'Login' });
});

router.post('/login', authController.loginValidation, authController.login, (req, res) => {
  res.redirect('/admin');
});

router.get('/register', (req, res) => {
  if (req.isAuthenticated()) {
    return res.redirect('/admin');
  }
  res.render('register', { title: 'Register' });
});

router.post('/register', authController.registerValidation, async (req, res) => {
  try {
    await authController.register(req, res);
    req.flash('success_msg', 'Registration successful! Please login.');
    res.redirect('/login');
  } catch (error) {
    req.flash('error_msg', 'Registration failed. Please try again.');
    res.redirect('/register');
  }
});

router.get('/logout', authController.logout);

// Comments (with optional auth)
router.get('/news/:newsId/comments', optionalAuth, newsController.getComments);
router.post('/news/:newsId/comments', optionalAuth, newsController.commentValidation, newsController.addComment);

// 404 for frontend
router.use((req, res) => {
  res.status(404).render('404', { title: 'Page Not Found' });
});

module.exports = router;