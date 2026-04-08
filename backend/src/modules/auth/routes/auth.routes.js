const express = require('express');

const controller = require('../controllers/auth.controller');
const validators = require('../validators/auth.validators');
const { protect, optionalProtect } = require('../utils/access-control');

const router = express.Router();

router.post('/register', optionalProtect, validators.register, controller.register);
router.post('/login', validators.login, controller.login);
router.post('/refresh', validators.refresh, controller.refresh);
router.post('/logout', protect, validators.logout, controller.logout);
router.get('/me', protect, controller.me);

module.exports = router;
