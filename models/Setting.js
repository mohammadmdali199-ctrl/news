const db = require('../config/database');

class Setting {
  // Get all settings
  static async findAll() {
    try {
      const [rows] = await db.execute('SELECT * FROM settings ORDER BY setting_key ASC');
      const settings = {};
      rows.forEach(row => {
        settings[row.setting_key] = row.setting_value;
      });
      return settings;
    } catch (error) {
      throw error;
    }
  }

  // Get setting by key
  static async findByKey(key) {
    try {
      const [rows] = await db.execute(
        'SELECT * FROM settings WHERE setting_key = ?',
        [key]
      );
      return rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Update setting
  static async update(key, value) {
    try {
      const [result] = await db.execute(
        'UPDATE settings SET setting_value = ?, updated_at = CURRENT_TIMESTAMP WHERE setting_key = ?',
        [value, key]
      );

      if (result.affectedRows === 0) {
        // Setting doesn't exist, create it
        await db.execute(
          'INSERT INTO settings (setting_key, setting_value) VALUES (?, ?)',
          [key, value]
        );
      }

      return true;
    } catch (error) {
      throw error;
    }
  }

  // Update multiple settings
  static async updateMultiple(settings) {
    try {
      const promises = Object.entries(settings).map(([key, value]) =>
        this.update(key, value)
      );
      await Promise.all(promises);
      return true;
    } catch (error) {
      throw error;
    }
  }

  // Delete setting
  static async delete(key) {
    try {
      const [result] = await db.execute('DELETE FROM settings WHERE setting_key = ?', [key]);
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  // Get site settings (commonly used ones)
  static async getSiteSettings() {
    try {
      const settings = await this.findAll();
      return {
        siteName: settings.site_name || 'News Portal',
        siteDescription: settings.site_description || 'Professional News Portal',
        siteUrl: settings.site_url || 'http://localhost:3000',
        adminEmail: settings.admin_email || 'admin@newsportal.com',
        language: settings.language || 'en',
        theme: settings.theme || 'light'
      };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Setting;