'use strict';

const { Router } = require('express');
const asyncHandler = require('../middlewares/asyncHandler');
const apiKeyAuth = require('../middlewares/apiKeyAuth');
const validate = require('../middlewares/validate');
const requestSchemas = require('../validators/requestSchemas');

function createRequestRouter(controller) {
  const router = Router();

  router.get('/', validate({ query: requestSchemas.listQuery }), asyncHandler(controller.list));
  router.post('/', apiKeyAuth, validate({ body: requestSchemas.createBody }), asyncHandler(controller.create));
  router.post('/import', apiKeyAuth, validate({ body: requestSchemas.importBody }), asyncHandler(controller.importMany));
  router.get('/:id', validate({ params: requestSchemas.idParams }), asyncHandler(controller.getById));
  router.patch('/:id', apiKeyAuth, validate({ params: requestSchemas.idParams, body: requestSchemas.updateBody }), asyncHandler(controller.update));
  router.patch('/:id/status', apiKeyAuth, validate({ params: requestSchemas.idParams, body: requestSchemas.statusBody }), asyncHandler(controller.changeStatus));
  router.delete('/:id', apiKeyAuth, validate({ params: requestSchemas.idParams }), asyncHandler(controller.delete));

  return router;
}

module.exports = createRequestRouter;
