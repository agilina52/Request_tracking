'use strict';

const { Router } = require('express');
const validate = require('../middlewares/validate');
const equipmentSchemas = require('../validators/equipmentSchemas');
const EquipmentRepository = require('../repositories/equipmentRepository');
const EquipmentService = require('../services/equipmentService');
const EquipmentController = require('../controllers/equipmentController');

const repository = new EquipmentRepository();
const service = new EquipmentService(repository);
const controller = new EquipmentController(service);

const router = Router();

router.get('/', validate({ query: equipmentSchemas.listQuery }), controller.list);
router.post('/', validate({ body: equipmentSchemas.createBody }), controller.create);
router.get('/:id', validate({ params: equipmentSchemas.idParams }), controller.getById);
router.patch('/:id', validate({ params: equipmentSchemas.idParams, body: equipmentSchemas.updateBody }), controller.update);
router.delete('/:id', validate({ params: equipmentSchemas.idParams }), controller.delete);

module.exports = router;
