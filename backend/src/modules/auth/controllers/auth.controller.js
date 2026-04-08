const { ok, created } = require('../../../core/api-response');
const asyncHandler = require('../../../core/async-handler');
const authService = require('../services/auth.service');

const register = asyncHandler(async (req, res) => {
  const result = await authService.register(req.body, req.user, req);
  return created(res, result);
});

const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body, req);
  return ok(res, result);
});

const refresh = asyncHandler(async (req, res) => {
  const result = await authService.refresh(req.body, req);
  return ok(res, result);
});

const logout = asyncHandler(async (req, res) => {
  const result = await authService.logout(req.body, req.user);
  return ok(res, result);
});

const me = asyncHandler(async (req, res) => {
  const result = await authService.getMe(req.user);
  return ok(res, result);
});

module.exports = {
  register,
  login,
  refresh,
  logout,
  me,
};
