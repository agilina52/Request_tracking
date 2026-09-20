'use strict';

const { Router } = require('express');
const asyncHandler = require('../middlewares/asyncHandler');
const validate = require('../middlewares/validate');
const equipmentSchemas = require('../validators/equipmentSchemas');
const requestSchemas = require('../validators/requestSchemas');

function createEquipmentRouter(controller) {
  const router = Router();

  router.get('/', validate({ query: equipmentSchemas.listQuery }), asyncHandler(controller.list));
  router.post('/', validate({ body: equipmentSchemas.createBody }), asyncHandler(controller.create));
  router.get('/:id/requests', validate({ params: equipmentSchemas.idParams, query: requestSchemas.listQuery }), asyncHandler(controller.listRequests));
  router.get('/:id/weather', validate({ params: equipmentSchemas.idParams }), asyncHandler(controller.getWeather));
  router.get('/:id', validate({ params: equipmentSchemas.idParams }), asyncHandler(controller.getById));
  router.patch('/:id', validate({ params: equipmentSchemas.idParams, body: equipmentSchemas.updateBody }), asyncHandler(controller.update));
  router.delete('/:id', validate({ params: equipmentSchemas.idParams }), asyncHandler(controller.delete));

  return router;
}

module.exports = createEquipmentRouter;
