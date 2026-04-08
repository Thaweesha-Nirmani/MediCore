const { fail } = require('../core/api-response');
const connectDatabase = require('../database/mongoose');

function requireDatabaseReady(_req, res, next) {
  const state = connectDatabase.getState();

  if (state.ready) {
    return next();
  }

  return fail(res, 503, 'Database is not ready yet', {
    database: state,
  });
}

module.exports = requireDatabaseReady;
