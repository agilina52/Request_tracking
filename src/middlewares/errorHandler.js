'use strict';

const logger = require('../logger');

function mapError(err) {
  if (err.type === 'entity.parse.failed') {
    return { status: 400, code: 'INVALID_JSON', message: 'Некорректный JSON в теле запроса' };
  }
  if (err.type === 'entity.too.large') {
    return { status: 413, code: 'PAYLOAD_TOO_LARGE', message: 'Тело запроса превышает допустимый размер' };
  }
  return { status: err.status ?? 500, code: err.code ?? 'INTERNAL_ERROR', message: err.message };
}

function errorHandler(err, req, res, next) {
  const requestId = req.id;
  const { status, code, message } = mapError(err);
  const isInternal = status >= 500;

  if (isInternal) {
    logger.error(message, { stack: err.stack, requestId });
  } else {
    logger.warn(message, { requestId });
  }

  const isProduction = process.env.NODE_ENV === 'production';

  const body = {
    error: {
      code,
      message: isInternal && isProduction ? 'Внутренняя ошибка сервиса' : message || 'Внутренняя ошибка сервиса',
      requestId,
    },
  };

  if (Array.isArray(err.details) && err.details.length > 0) {
    body.error.details = err.details;
  }

  res.status(status).json(body);
}

module.exports = errorHandler;
