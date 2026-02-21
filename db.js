const mongoose = require('mongoose');
require('dotenv').config();
const logger = require('./utils/logger');

const MONGO_URL = process.env.MONGO_DB_CONNECTION_URL;

async function connectDB() {
  if (!MONGO_URL) {
    logger.warn('MONGO_DB_CONNECTION_URL not set - skipping DB connection');
    return;
  }

  if (!MONGO_URL.startsWith('mongodb://') && !MONGO_URL.startsWith('mongodb+srv://')) {
    logger.error("Invalid MONGO_DB_CONNECTION_URL. It must start with 'mongodb://' or 'mongodb+srv://'");
    logger.error('Current value:', MONGO_URL);
    return;
  }

  try {
    await mongoose.connect(MONGO_URL);
    logger.info('Database connected successfully');
  } catch (err) {
    logger.error('Database connection failed:', err);
    throw err;
  }

  mongoose.connection.on('error', (err) => {
    logger.error('Database connection error', err);
  });
}

module.exports = { connectDB };