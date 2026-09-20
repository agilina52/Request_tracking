'use strict';

const { Router } = require('express');
const validate = require('../middlewares/validate');
const equipmentSchemas = require('../validators/equipmentSchemas');
const requestSchemas = require('../validators/requestSchemas');

function createEquipmentRouter(controller) {
  const router = Router();

  router.get('/', validate({ query: equipmentSchemas.listQuery }), controller.list);
  router.post('/', validate({ body: equipmentSchemas.createBody }), controller.create);
  router.get('/:id/requests', validate({ params: equipmentSchemas.idParams, query: requestSchemas.listQuery }), controller.listRequests);
  router.get('/:id/weather', validate({ params: equipmentSchemas.idParams }), controller.getWeather);
  router.get('/:id', validate({ params: equipmentSchemas.idParams }), controller.getById);
  router.patch('/:id', validate({ params: equipmentSchemas.idParams, body: equipmentSchemas.updateBody }), controller.update);
  router.delete('/:id', validate({ params: equipmentSchemas.idParams }), controller.delete);

  return router;
}

module.exports = createEquipmentRouter;
