'use strict';

const createApp = require('./app');
const config = require('./config');
const logger = require('./logger');

const app = createApp();

app.listen(config.port, () => {
  logger.info('Сервис запущен', { port: config.port, env: config.nodeEnv });
});
