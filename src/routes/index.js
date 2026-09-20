'use strict';

const { Router } = require('express');
const healthController = require('../controllers/healthController');
const createContainer = require('../container');
const createEquipmentRouter = require('./equipmentRoutes');
const createRequestRouter = require('./requestRoutes');

function createRouter() {
  const { equipmentController, requestController } = createContainer();

  const router = Router();

  router.get('/health', healthController.get);
  router.use('/equipment', createEquipmentRouter(equipmentController));
  router.use('/requests', createRequestRouter(requestController));

  return router;
}

module.exports = createRouter;
