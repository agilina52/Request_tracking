'use strict';

const { Router } = require('express');
const asyncHandler = require('../middlewares/asyncHandler');
const validate = require('../middlewares/validate');
const requestSchemas = require('../validators/requestSchemas');

function createRequestRouter(controller) {
  const router = Router();

  router.get('/', validate({ query: requestSchemas.listQuery }), asyncHandler(controller.list));
  router.post('/', validate({ body: requestSchemas.createBody }), asyncHandler(controller.create));
  router.get('/:id', validate({ params: requestSchemas.idParams }), asyncHandler(controller.getById));
  router.patch('/:id', validate({ params: requestSchemas.idParams, body: requestSchemas.updateBody }), asyncHandler(controller.update));
  router.patch('/:id/status', validate({ params: requestSchemas.idParams, body: requestSchemas.statusBody }), asyncHandler(controller.changeStatus));
  router.delete('/:id', validate({ params: requestSchemas.idParams }), asyncHandler(controller.delete));

  return router;
}

module.exports = createRequestRouter;
