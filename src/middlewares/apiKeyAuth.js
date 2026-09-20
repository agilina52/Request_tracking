'use strict';

const config = require('../config');
const { AppError } = require('../errors');

function apiKeyAuth(req, res, next) {
  if (req.get('x-api-key') !== config.apiKey) {
    return next(new AppError('Неверный или отсутствующий API-ключ', { status: 401, code: 'UNAUTHORIZED' }));
  }
  next();
}

module.exports = apiKeyAuth;
