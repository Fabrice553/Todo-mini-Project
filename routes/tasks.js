const express = require('express');
const router = express.Router();
const ensureAuth = require('../middleware/auth');
const ctrl = require('../controllers/taskController');

router.get('/', ensureAuth, ctrl.listTasks);
router.post('/create', ensureAuth, ctrl.createTask);
router.post('/:id/state', ensureAuth, ctrl.updateTaskState);

module.exports = router;