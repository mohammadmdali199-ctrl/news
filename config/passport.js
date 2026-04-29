const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const db = require('./database');

module.exports = (passport) => {
  passport.use(new LocalStrategy({
    usernameField: 'email'
  }, async (email, password, done) => {
    try {
      const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
      if (rows.length === 0) {
        return done(null, false, { message: 'Invalid email or password' });
      }
      const user = rows[0];
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return done(null, false, { message: 'Invalid email or password' });
      }
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }));

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const [rows] = await db.execute('SELECT u.*, r.name as role_name FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = ?', [id]);
      done(null, rows[0]);
    } catch (err) {
      done(err);
    }
  });
};