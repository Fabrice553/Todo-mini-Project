const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/authController');

router.get('/signup', ctrl.getSignup);
router.post('/signup', ctrl.postSignup);

router.get('/login', ctrl.getLogin);
router.post('/login', ctrl.postLogin);

router.post('/logout', ctrl.logout);

module.exports = router;