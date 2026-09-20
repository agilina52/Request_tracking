'use strict';

const AppError = require('./appError');

class ValidationError extends AppError {
  constructor(message = 'Некорректные данные запроса', details = []) {
    super(message, { status: 422, code: 'VALIDATION_ERROR' });
    this.details = details;
  }
}

module.exports = ValidationError;
