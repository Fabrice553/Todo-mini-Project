const Task = require('../models/Task');
const logger = require('../utils/logger');

async function listTasks(req, res, next) {
  try {
    const userId = req.session.userId;
    const { state = 'all' } = req.query;
    const filter = { owner: userId };
    if (state === 'pending' || state === 'completed' || state === 'deleted') filter.state = state;
    const tasks = await Task.find(filter).sort({ createdAt: -1 });
    res.render('index', { tasks, username: req.session.username, state });
  } catch (err) {
    logger.error('List tasks error', err);
    next(err);
  }
}

async function createTask(req, res, next) {
  try {
    const { title } = req.body;
    if (!title || !title.trim()) return res.redirect('/');
    const task = new Task({ title: title.trim(), owner: req.session.userId });
    await task.save();
    res.redirect('/');
  } catch (err) {
    logger.error('Create task error', err);
    next(err);
  }
}

async function updateTaskState(req, res, next) {
  try {
    const { id } = req.params;
    const { state } = req.body; // expected "pending"|"completed"|"deleted"
    if (!['pending', 'completed', 'deleted'].includes(state)) return res.status(400).send('Invalid state');
    const task = await Task.findOne({ _id: id, owner: req.session.userId });
    if (!task) return res.status(404).send('Not found');
    task.state = state;
    await task.save();
    res.redirect('back');
  } catch (err) {
    logger.error('Update state error', err);
    next(err);
  }
}

module.exports = { listTasks, createTask, updateTaskState };