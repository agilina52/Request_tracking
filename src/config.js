'use strict';

const path = require('node:path');

if (typeof process.loadEnvFile === 'function') {
  try {
    process.loadEnvFile(path.join(process.cwd(), '.env'));
  } catch {
    // Файл .env отсутствует — используются значения по умолчанию.
  }
}

const config = {
  port: readInt('PORT', 3000),
  nodeEnv: readString('NODE_ENV', 'development'),
  corsOrigins: readList('CORS_ORIGINS', 'http://localhost:3000'),
  rateLimitWindowMs: readInt('RATE_LIMIT_WINDOW_MS', 60_000),
  rateLimitMax: readInt('RATE_LIMIT_MAX', 100),
  weatherApiUrl: readString('WEATHER_API_URL', 'https://api.open-meteo.com/v1/forecast'),
  requestTimeoutMs: readInt('REQUEST_TIMEOUT_MS', 5000),
  maxWindMs: readNumber('WEATHER_MAX_WIND_MS', 15),
  maxPrecipitationMm: readNumber('WEATHER_MAX_PRECIPITATION_MM', 0),
  bodyLimit: readString('BODY_LIMIT', '100kb'),
  apiKey: readString('API_KEY', 'change-me'),
};

function readString(key, fallback) {
  const value = process.env[key];
  return value === undefined || value === '' ? fallback : value;
}

function readInt(key, fallback) {
  const value = Number(process.env[key]);
  return Number.isInteger(value) && value > 0 ? value : fallback;
}

function readNumber(key, fallback) {
  const value = Number(process.env[key]);
  return Number.isFinite(value) ? value : fallback;
}

function readList(key, fallback) {
  const value = process.env[key];
  if (value === undefined || value === '') {
    return [fallback];
  }
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

module.exports = config;
