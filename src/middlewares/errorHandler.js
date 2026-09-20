'use strict';

const logger = require('../logger');

function errorHandler(err, req, res, next) {
  const requestId = req.id;
  logger.error(err.message, { stack: err.stack, requestId });

  const status = err.status ?? 500;
  const isInternal = status >= 500;
  const isProduction = process.env.NODE_ENV === 'production';

  res.status(status).json({
    error: {
      code: err.code ?? 'INTERNAL_ERROR',
      message: isInternal && isProduction ? 'Внутренняя ошибка сервиса' : err.message,
      requestId,
    },
  });
}

module.exports = errorHandler;
