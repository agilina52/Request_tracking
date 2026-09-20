'use strict';

const AppError = require('./appError');

class WeatherApiError extends AppError {
  constructor(message) {
    super(message, { status: 503, code: 'WEATHER_UNAVAILABLE' });
  }
}

module.exports = WeatherApiError;
