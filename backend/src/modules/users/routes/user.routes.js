const express = require('express');

const controller = require('../controllers/user.controller');
const validators = require('../validators/user.validators');
const { protect } = require('../../auth/utils/access-control');

const router = express.Router();

router.use(protect);

router.get('/', validators.listUsers, controller.listUsers);
router.patch('/:id/status', validators.updateUserStatus, controller.updateUserStatus);
router.get('/:id', validators.userById, controller.getUserById);
router.patch('/:id', validators.updateUser, controller.updateUser);

module.exports = router;
