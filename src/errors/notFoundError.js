'use strict';

const AppError = require('./appError');

class NotFoundError extends AppError {
  constructor(message = 'Ресурс не найден') {
    super(message, { status: 404, code: 'NOT_FOUND' });
  }
}

module.exports = NotFoundError;
