'use strict';

const AppError = require('./appError');

class ConflictError extends AppError {
  constructor(message) {
    super(message, { status: 409, code: 'CONFLICT' });
  }
}

module.exports = ConflictError;
