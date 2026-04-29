const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const newsController = require('../controllers/newsController');
const authController = require('../controllers/authController');
const { uploadSingle, uploadMultiple, handleUploadError } = require('../middleware/upload');
const { isAuthenticated, isAdmin, isEditorOrAdmin } = require('../middleware/auth');

// All admin routes require authentication
router.use(isAuthenticated);

// Admin dashboard
router.get('/', (req, res) => {
  res.render('admin/dashboard', { title: 'Admin Dashboard' });
});

// API routes for dashboard data
router.get('/api/dashboard/stats', adminController.getDashboardStats);

// User management
router.get('/users', isAdmin, (req, res) => {
  res.render('admin/users', { title: 'User Management' });
});

router.get('/api/users', isAdmin, adminController.getUsers);
router.put('/api/users/:id', isAdmin, adminController.updateUser);
router.delete('/api/users/:id', isAdmin, adminController.deleteUser);

// News management
router.get('/news', isEditorOrAdmin, (req, res) => {
  res.render('admin/news', { title: 'News Management' });
});

router.get('/news/create', isEditorOrAdmin, async (req, res) => {
  try {
    const { Category } = require('../models/Category');
    const Tag = require('../models/Tag');

    const categories = await Category.findAll();
    const tags = await Tag.findAll();

    res.render('admin/news-form', {
      title: 'Create News',
      news: null,
      categories,
      tags,
      isEdit: false
    });
  } catch (error) {
    console.error('Create news page error:', error);
    req.flash('error_msg', 'Failed to load page');
    res.redirect('/admin/news');
  }
});

router.get('/news/:id/edit', isEditorOrAdmin, async (req, res) => {
  try {
    const { Category } = require('../models/Category');
    const Tag = require('../models/Tag');

    const news = await newsController.getAdminNewsById(req, { json: (data) => data });
    const categories = await Category.findAll();
    const tags = await Tag.findAll();

    if (!news.success) {
      req.flash('error_msg', 'News not found');
      return res.redirect('/admin/news');
    }

    res.render('admin/news-form', {
      title: 'Edit News',
      news: news.data,
      categories,
      tags,
      isEdit: true
    });
  } catch (error) {
    console.error('Edit news page error:', error);
    req.flash('error_msg', 'Failed to load page');
    res.redirect('/admin/news');
  }
});

router.get('/api/news', isEditorOrAdmin, newsController.getAdminNews);
router.get('/api/news/:id', isEditorOrAdmin, newsController.getAdminNewsById);
router.post('/api/news', isEditorOrAdmin, uploadSingle, handleUploadError, newsController.newsValidation, newsController.createNews);
router.put('/api/news/:id', isEditorOrAdmin, uploadSingle, handleUploadError, newsController.newsValidation, newsController.updateNews);
router.delete('/api/news/:id', isEditorOrAdmin, newsController.deleteNews);
router.put('/api/news/:id/publish', isEditorOrAdmin, newsController.publishNews);
router.put('/api/news/:id/archive', isEditorOrAdmin, newsController.archiveNews);

// Category management
router.get('/categories', isAdmin, (req, res) => {
  res.render('admin/categories', { title: 'Category Management' });
});

router.get('/api/categories', isAdmin, adminController.getCategories);
router.post('/api/categories', isAdmin, uploadSingle, handleUploadError, adminController.createCategory);
router.put('/api/categories/:id', isAdmin, uploadSingle, handleUploadError, adminController.updateCategory);
router.delete('/api/categories/:id', isAdmin, adminController.deleteCategory);

// Subcategory management
router.get('/subcategories', isAdmin, (req, res) => {
  res.render('admin/subcategories', { title: 'Subcategory Management' });
});

router.get('/api/subcategories', isAdmin, adminController.getSubcategories);
router.post('/api/subcategories', isAdmin, adminController.createSubcategory);
router.put('/api/subcategories/:id', isAdmin, adminController.updateSubcategory);
router.delete('/api/subcategories/:id', isAdmin, adminController.deleteSubcategory);

// Tag management
router.get('/tags', isEditorOrAdmin, (req, res) => {
  res.render('admin/tags', { title: 'Tag Management' });
});

router.get('/api/tags', isEditorOrAdmin, adminController.getTags);
router.post('/api/tags', isEditorOrAdmin, adminController.createTag);
router.put('/api/tags/:id', isEditorOrAdmin, adminController.updateTag);
router.delete('/api/tags/:id', isEditorOrAdmin, adminController.deleteTag);

// Comment management
router.get('/comments', isEditorOrAdmin, (req, res) => {
  res.render('admin/comments', { title: 'Comment Management' });
});

router.get('/api/comments', isEditorOrAdmin, adminController.getComments);
router.put('/api/comments/:id/approve', isEditorOrAdmin, adminController.approveComment);
router.delete('/api/comments/:id', isEditorOrAdmin, adminController.rejectComment);

// Advertisement management
router.get('/advertisements', isAdmin, (req, res) => {
  res.render('admin/advertisements', { title: 'Advertisement Management' });
});

router.get('/api/advertisements', isAdmin, adminController.getAdvertisements);
router.post('/api/advertisements', isAdmin, uploadSingle, handleUploadError, adminController.createAdvertisement);
router.put('/api/advertisements/:id', isAdmin, uploadSingle, handleUploadError, adminController.updateAdvertisement);
router.delete('/api/advertisements/:id', isAdmin, adminController.deleteAdvertisement);

// Contact messages
router.get('/contacts', isEditorOrAdmin, (req, res) => {
  res.render('admin/contacts', { title: 'Contact Messages' });
});

router.get('/api/contacts', isEditorOrAdmin, adminController.getContactMessages);
router.put('/api/contacts/:id/status', isEditorOrAdmin, adminController.updateContactMessageStatus);

// Settings
router.get('/settings', isAdmin, async (req, res) => {
  try {
    const settings = await adminController.getSettings({}, { json: (data) => data });
    res.render('admin/settings', {
      title: 'Settings',
      settings: settings.success ? settings.data : {}
    });
  } catch (error) {
    console.error('Settings page error:', error);
    res.render('admin/settings', { title: 'Settings', settings: {} });
  }
});

router.get('/api/settings', isAdmin, adminController.getSettings);
router.put('/api/settings', isAdmin, adminController.updateSettings);

// Analytics
router.get('/analytics', isAdmin, (req, res) => {
  res.render('admin/analytics', { title: 'Analytics' });
});

router.get('/api/analytics', isAdmin, adminController.getAnalytics);

// Profile management
router.get('/profile', (req, res) => {
  res.render('admin/profile', { title: 'My Profile' });
});

router.get('/api/profile', authController.getCurrentUser);
router.put('/api/profile', authController.updateProfile);
router.put('/api/profile/password', authController.changePassword);

// File upload for general use
router.post('/upload', uploadMultiple, handleUploadError, (req, res) => {
  const files = req.files.map(file => ({
    filename: file.filename,
    path: `/uploads/${file.filename}`,
    size: file.size,
    mimetype: file.mimetype
  }));

  res.json({ success: true, files });
});

module.exports = router;