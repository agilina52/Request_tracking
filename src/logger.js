'use strict';

const LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };

const threshold = process.env.NODE_ENV === 'production' ? LEVELS.info : LEVELS.debug;

function write(level, message, meta = {}) {
  if (LEVELS[level] > threshold) {
    return;
  }
  const line = JSON.stringify({ time: new Date().toISOString(), level, message, ...meta });
  if (level === 'error' || level === 'warn') {
    console.error(line);
  } else {
    console.info(line);
  }
}

module.exports = {
  error: (message, meta) => write('error', message, meta),
  warn: (message, meta) => write('warn', message, meta),
  info: (message, meta) => write('info', message, meta),
  debug: (message, meta) => write('debug', message, meta),
};
