const { ok } = require('../../../core/api-response');
const asyncHandler = require('../../../core/async-handler');
const userService = require('../services/user.service');

const listUsers = asyncHandler(async (req, res) => {
  const result = await userService.listUsers(req.query, req.user);
  return ok(res, result.items, result.meta);
});

const getUserById = asyncHandler(async (req, res) => {
  const item = await userService.getUserById(req.params.id, req.user);
  return ok(res, item);
});

const updateUser = asyncHandler(async (req, res) => {
  const item = await userService.updateUser(req.params.id, req.body, req.user);
  return ok(res, item);
});

const updateUserStatus = asyncHandler(async (req, res) => {
  const item = await userService.updateUserStatus(req.params.id, req.body, req.user);
  return ok(res, item);
});

module.exports = {
  listUsers,
  getUserById,
  updateUser,
  updateUserStatus,
};
