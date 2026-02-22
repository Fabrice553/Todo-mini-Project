const User = require('../models/User');
const logger = require('../utils/logger');

async function getSignup(req, res) {
  res.render('signup', { error: null });
}

async function postSignup(req, res, next) {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.render('signup', { error: 'Provide username and password' });
    const existing = await User.findOne({ username: username.toLowerCase() });
    if (existing) return res.render('signup', { error: 'Username already taken' });

    const user = new User({ username, password });
    await user.save();
    req.session.userId = user._id;
    req.session.username = user.username;
    res.redirect('/');
  } catch (err) {
    logger.error('Signup error', err);
    next(err);
  }
}

async function getLogin(req, res) {
  res.render('login', { error: null });
}

async function postLogin(req, res, next) {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username: username.toLowerCase() });
    if (!user) return res.render('login', { error: 'Invalid credentials' });
    const ok = await user.comparePassword(password);
    if (!ok) return res.render('login', { error: 'Invalid credentials' });
    req.session.userId = user._id;
    req.session.username = user.username;
    res.redirect('/');
  } catch (err) {
    logger.error('Login error', err);
    next(err);
  }
}

function logout(req, res) {
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.redirect('/auth/login');
  });
}

module.exports = { getSignup, postSignup, getLogin, postLogin, logout };