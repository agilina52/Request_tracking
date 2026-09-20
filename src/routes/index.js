'use strict';

const { Router } = require('express');
const healthController = require('../controllers/healthController');
const equipmentRoutes = require('./equipmentRoutes');

const router = Router();

router.get('/health', healthController.get);
router.use('/equipment', equipmentRoutes);

module.exports = router;
