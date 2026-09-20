'use strict';

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const config = require('./config');
const requestContext = require('./middlewares/requestContext');
const notFound = require('./middlewares/notFound');
const errorHandler = require('./middlewares/errorHandler');
const createRouter = require('./routes');

function createApp() {
  const app = express();

  app.disable('x-powered-by');

  app.use(requestContext);
  app.use(helmet());
  app.use(
    cors({
      origin: config.corsOrigins,
      methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    })
  );
  app.use(express.json({ limit: config.bodyLimit }));

  app.use('/api', createRouter());

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = createApp;
