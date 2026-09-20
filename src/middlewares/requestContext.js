'use strict';

const crypto = require('node:crypto');
const logger = require('../logger');

function requestContext(req, res, next) {
  const requestId = req.get('x-request-id') || crypto.randomUUID();
  req.id = requestId;
  res.setHeader('X-Request-Id', requestId);

  const start = process.hrtime.bigint();

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
    logger.info('request', {
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      durationMs: Math.round(durationMs * 10) / 10,
      requestId,
    });
  });

  next();
}

module.exports = requestContext;
