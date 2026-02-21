const path = require('path');
const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const morgan = require('morgan');
const engine = require('ejs-mate');
require('dotenv').config();

const logger = require('./utils/logger');
const { connectDB } = require('./db');

const app = express();
const PORT = process.env.PORT || 8000;
const MONGO_URL = process.env.MONGO_DB_CONNECTION_URL;

// Connect to DB unless running tests (tests control DB themselves)
if (process.env.NODE_ENV !== 'test') {
  connectDB().catch(err => logger.error('Initial DB connection error', err));
}

// view engine setup - enable layout() helper via ejs-mate
app.engine('ejs', engine);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// middlewares
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// morgan -> winston logging
app.use(morgan('tiny', { stream: { write: (msg) => logger.info(msg.trim()) } }));

// Session configuration - only attach Mongo store when MONGO_URL is present
const sessionOptions = {
  secret: process.env.JWT_SECRET || 'dev_secret',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 24 } // 1 day
};

if (MONGO_URL) {
  sessionOptions.store = MongoStore.create({
    mongoUrl: MONGO_URL,
    collectionName: 'sessions',
    // optional ttl, autoRemove, etc.
  });
} else {
  logger.warn('MONGO_DB_CONNECTION_URL not set - using in-memory session store (not for production)');
}

app.use(session(sessionOptions));

// Static assets
app.use('/public', express.static(path.join(__dirname, 'public')));

// Provide safe defaults for template locals so templates never reference undefined variables
app.use((req, res, next) => {
  res.locals.title = 'Todo App'; // default page title
  res.locals.username = req.session && req.session.username ? req.session.username : null;
  next();
});

// Routes
app.use('/auth', require('./routes/auth'));
app.use('/tasks', require('./routes/tasks'));

// Root route
app.get('/', (req, res) => {
  if (!req.session || !req.session.userId) return res.redirect('/auth/login');
  res.redirect('/tasks');
});

// 404 handler
app.use((req, res, next) => {
  res.status(404).render('error', { title: 'Not Found', message: 'Resource not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  // Log full error with stack
  logger.error('Unhandled error', err);
  // Render error page with safe locals
  const message = err && err.message ? err.message : 'Server error';
  res.status(err.status || 500).render('error', { title: 'Error', message });
});

// start server only when run directly (so tests can require the app without listening)
if (require.main === module) {
  const server = app.listen(PORT, () => {
    logger.info(`Server running on port: http://localhost:${PORT}`);
    console.log(`Server running on port: http://localhost:${PORT}`);
  });

  // Graceful shutdown
  const shutdown = (signal) => {
    logger.info(`Received ${signal}. Shutting down...`);
    server.close(() => {
      logger.info('HTTP server closed.');
      // optionally close DB connection here if needed
      process.exit(0);
    });
    // force exit after timeout
    setTimeout(() => process.exit(1), 10000).unref();
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('uncaughtException', (err) => {
    logger.error('uncaughtException', err);
    // allow process to exit after logging
    shutdown('uncaughtException');
  });
  process.on('unhandledRejection', (reason) => {
    logger.error('unhandledRejection', reason);
  });
}

module.exports = app;