'use strict';

const express = require('express');
const config = require('./config');
const requestContext = require('./middlewares/requestContext');
const notFound = require('./middlewares/notFound');
const errorHandler = require('./middlewares/errorHandler');
const routes = require('./routes');

function createApp() {
  const app = express();

  app.disable('x-powered-by');

  app.use(requestContext);
  app.use(express.json({ limit: config.bodyLimit }));

  app.use('/api', routes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = createApp;
