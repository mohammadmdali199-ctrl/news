const User = require('../models/User');
const News = require('../models/News');
const { Category, Subcategory } = require('../models/Category');
const Tag = require('../models/Tag');
const Comment = require('../models/Comment');
const Advertisement = require('../models/Advertisement');
const ContactMessage = require('../models/ContactMessage');
const Setting = require('../models/Setting');
const VisitorLog = require('../models/VisitorLog');

// Dashboard stats
const getDashboardStats = async (req, res) => {
  try {
    const [
      userStats,
      newsStats,
      commentStats,
      contactStats
    ] = await Promise.all([
      User.getStats(),
      News.getStats(),
      Comment.getStats(),
      ContactMessage.getStats()
    ]);

    const visitorStats = await VisitorLog.getStats({ days: 30 });

    res.json({
      success: true,
      data: {
        users: userStats,
        news: newsStats,
        comments: commentStats,
        contacts: contactStats,
        visitors: {
          total: visitorStats.total,
          recent: visitorStats.recent,
          recentUnique: visitorStats.recentUnique
        }
      }
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// User management
const getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const result = await User.findAll(parseInt(page), parseInt(limit));

    res.json({
      success: true,
      data: result.users,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role_id, status } = req.body;

    const success = await User.update(id, { name, email, role_id, status });

    if (success) {
      res.json({ success: true, message: 'User updated successfully' });
    } else {
      res.status(404).json({ success: false, message: 'User not found' });
    }
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const success = await User.delete(id);

    if (success) {
      res.json({ success: true, message: 'User deleted successfully' });
    } else {
      res.status(404).json({ success: false, message: 'User not found' });
    }
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Category management
const getCategories = async (req, res) => {
  try {
    const categories = await Category.findAllWithCount();
    res.json({ success: true, data: categories });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : null;

    const categoryId = await Category.create({ name, description, image });

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: { id: categoryId }
    });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : null;

    const success = await Category.update(id, { name, description, image });

    if (success) {
      res.json({ success: true, message: 'Category updated successfully' });
    } else {
      res.status(404).json({ success: false, message: 'Category not found' });
    }
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    await Category.delete(id);
    res.json({ success: true, message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Delete category error:', error);
    if (error.message.includes('existing news posts')) {
      res.status(400).json({ success: false, message: error.message });
    } else {
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }
};

// Subcategory management
const getSubcategories = async (req, res) => {
  try {
    const subcategories = await Subcategory.findAll();
    res.json({ success: true, data: subcategories });
  } catch (error) {
    console.error('Get subcategories error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const createSubcategory = async (req, res) => {
  try {
    const { name, category_id, description } = req.body;

    const subcategoryId = await Subcategory.create({ name, category_id, description });

    res.status(201).json({
      success: true,
      message: 'Subcategory created successfully',
      data: { id: subcategoryId }
    });
  } catch (error) {
    console.error('Create subcategory error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const updateSubcategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category_id, description } = req.body;

    const success = await Subcategory.update(id, { name, category_id, description });

    if (success) {
      res.json({ success: true, message: 'Subcategory updated successfully' });
    } else {
      res.status(404).json({ success: false, message: 'Subcategory not found' });
    }
  } catch (error) {
    console.error('Update subcategory error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const deleteSubcategory = async (req, res) => {
  try {
    const { id } = req.params;
    await Subcategory.delete(id);
    res.json({ success: true, message: 'Subcategory deleted successfully' });
  } catch (error) {
    console.error('Delete subcategory error:', error);
    if (error.message.includes('existing news posts')) {
      res.status(400).json({ success: false, message: error.message });
    } else {
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }
};

// Tag management
const getTags = async (req, res) => {
  try {
    const tags = await Tag.findAllWithCount();
    res.json({ success: true, data: tags });
  } catch (error) {
    console.error('Get tags error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const createTag = async (req, res) => {
  try {
    const { name } = req.body;
    const tagId = await Tag.create({ name });

    res.status(201).json({
      success: true,
      message: 'Tag created successfully',
      data: { id: tagId }
    });
  } catch (error) {
    console.error('Create tag error:', error);
    if (error.message.includes('already exists')) {
      res.status(400).json({ success: false, message: error.message });
    } else {
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }
};

const updateTag = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const success = await Tag.update(id, { name });

    if (success) {
      res.json({ success: true, message: 'Tag updated successfully' });
    } else {
      res.status(404).json({ success: false, message: 'Tag not found' });
    }
  } catch (error) {
    console.error('Update tag error:', error);
    if (error.message.includes('already exists')) {
      res.status(400).json({ success: false, message: error.message });
    } else {
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }
};

const deleteTag = async (req, res) => {
  try {
    const { id } = req.params;
    await Tag.delete(id);
    res.json({ success: true, message: 'Tag deleted successfully' });
  } catch (error) {
    console.error('Delete tag error:', error);
    if (error.message.includes('being used')) {
      res.status(400).json({ success: false, message: error.message });
    } else {
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }
};

// Comment management
const getComments = async (req, res) => {
  try {
    const { page = 1, limit = 10, approved } = req.query;
    const approvedFilter = approved === undefined ? null : approved === 'true';

    const result = await Comment.findAll({
      page: parseInt(page),
      limit: parseInt(limit),
      approved: approvedFilter
    });

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

const approveComment = async (req, res) => {
  try {
    const { id } = req.params;
    const success = await Comment.approve(id);

    if (success) {
      res.json({ success: true, message: 'Comment approved successfully' });
    } else {
      res.status(404).json({ success: false, message: 'Comment not found' });
    }
  } catch (error) {
    console.error('Approve comment error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const rejectComment = async (req, res) => {
  try {
    const { id } = req.params;
    const success = await Comment.reject(id);

    if (success) {
      res.json({ success: true, message: 'Comment rejected successfully' });
    } else {
      res.status(404).json({ success: false, message: 'Comment not found' });
    }
  } catch (error) {
    console.error('Reject comment error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Advertisement management
const getAdvertisements = async (req, res) => {
  try {
    const advertisements = await Advertisement.findAll();
    res.json({ success: true, data: advertisements });
  } catch (error) {
    console.error('Get advertisements error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const createAdvertisement = async (req, res) => {
  try {
    const { title, link, position, active } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : null;

    const adId = await Advertisement.create({ title, image, link, position, active });

    res.status(201).json({
      success: true,
      message: 'Advertisement created successfully',
      data: { id: adId }
    });
  } catch (error) {
    console.error('Create advertisement error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const updateAdvertisement = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, link, position, active } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : null;

    const success = await Advertisement.update(id, { title, image, link, position, active });

    if (success) {
      res.json({ success: true, message: 'Advertisement updated successfully' });
    } else {
      res.status(404).json({ success: false, message: 'Advertisement not found' });
    }
  } catch (error) {
    console.error('Update advertisement error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const deleteAdvertisement = async (req, res) => {
  try {
    const { id } = req.params;
    const success = await Advertisement.delete(id);

    if (success) {
      res.json({ success: true, message: 'Advertisement deleted successfully' });
    } else {
      res.status(404).json({ success: false, message: 'Advertisement not found' });
    }
  } catch (error) {
    console.error('Delete advertisement error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Contact messages
const getContactMessages = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    const result = await ContactMessage.findAll({
      page: parseInt(page),
      limit: parseInt(limit),
      status
    });

    res.json({
      success: true,
      data: result.messages,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Get contact messages error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const updateContactMessageStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const success = await ContactMessage.updateStatus(id, status);

    if (success) {
      res.json({ success: true, message: 'Message status updated successfully' });
    } else {
      res.status(404).json({ success: false, message: 'Message not found' });
    }
  } catch (error) {
    console.error('Update contact message status error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Settings
const getSettings = async (req, res) => {
  try {
    const settings = await Setting.findAll();
    res.json({ success: true, data: settings });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const updateSettings = async (req, res) => {
  try {
    await Setting.updateMultiple(req.body);
    res.json({ success: true, message: 'Settings updated successfully' });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Analytics
const getAnalytics = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const stats = await VisitorLog.getStats({ days: parseInt(days) });

    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  getDashboardStats,
  getUsers,
  updateUser,
  deleteUser,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getSubcategories,
  createSubcategory,
  updateSubcategory,
  deleteSubcategory,
  getTags,
  createTag,
  updateTag,
  deleteTag,
  getComments,
  approveComment,
  rejectComment,
  getAdvertisements,
  createAdvertisement,
  updateAdvertisement,
  deleteAdvertisement,
  getContactMessages,
  updateContactMessageStatus,
  getSettings,
  updateSettings,
  getAnalytics
};