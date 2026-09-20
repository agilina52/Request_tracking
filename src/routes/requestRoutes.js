'use strict';

const { Router } = require('express');
const validate = require('../middlewares/validate');
const requestSchemas = require('../validators/requestSchemas');

function createRequestRouter(controller) {
  const router = Router();

  router.get('/', validate({ query: requestSchemas.listQuery }), controller.list);
  router.post('/', validate({ body: requestSchemas.createBody }), controller.create);
  router.get('/:id', validate({ params: requestSchemas.idParams }), controller.getById);
  router.patch('/:id', validate({ params: requestSchemas.idParams, body: requestSchemas.updateBody }), controller.update);
  router.patch('/:id/status', validate({ params: requestSchemas.idParams, body: requestSchemas.statusBody }), controller.changeStatus);
  router.delete('/:id', validate({ params: requestSchemas.idParams }), controller.delete);

  return router;
}

module.exports = createRequestRouter;
