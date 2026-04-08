function ok(res, data, meta = {}) {
  return res.status(200).json({
    success: true,
    data,
    meta,
  });
}

function created(res, data, meta = {}) {
  return res.status(201).json({
    success: true,
    data,
    meta,
  });
}

function fail(res, statusCode, message, details = null) {
  return res.status(statusCode).json({
    success: false,
    error: {
      message,
      details,
    },
  });
}

module.exports = {
  ok,
  created,
  fail,
};

