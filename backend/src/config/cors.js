const env = require('./env');

if (env.corsOrigins === '*' || !env.corsOrigins.trim()) {
  module.exports = {
    origin: true,
    credentials: true,
  };
} else {
  const allowList = env.corsOrigins
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  module.exports = {
    origin(origin, callback) {
      if (!origin || allowList.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`CORS blocked origin: ${origin}`));
    },
    credentials: true,
  };
}

