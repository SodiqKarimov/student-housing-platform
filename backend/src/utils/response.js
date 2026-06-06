const success = (res, data = null, message = 'Muvaffaqiyatli', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
  });
};

const error = (res, message = 'Xato yuz berdi', statusCode = 500, errors = null) => {
  return res.status(statusCode).json({
    success: false,
    message,
    errors,
    timestamp: new Date().toISOString(),
  });
};

const paginated = (res, data, total, page, limit, message = 'Muvaffaqiyatli') => {
  return res.status(200).json({
    success: true,
    message,
    data,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit),
    },
    timestamp: new Date().toISOString(),
  });
};

module.exports = { success, error, paginated };
