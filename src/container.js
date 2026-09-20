'use strict';

const EquipmentRepository = require('./repositories/equipmentRepository');
const RequestRepository = require('./repositories/requestRepository');
const EquipmentService = require('./services/equipmentService');
const RequestService = require('./services/requestService');
const WeatherService = require('./services/weatherService');
const EquipmentController = require('./controllers/equipmentController');
const RequestController = require('./controllers/requestController');

function createContainer() {
  const equipmentRepository = new EquipmentRepository();
  const requestRepository = new RequestRepository();

  const equipmentService = new EquipmentService(equipmentRepository, requestRepository);
  const requestService = new RequestService(requestRepository, equipmentRepository);
  const weatherService = new WeatherService();

  const equipmentController = new EquipmentController(equipmentService, requestService, weatherService);
  const requestController = new RequestController(requestService);

  return { equipmentController, requestController };
}

module.exports = createContainer;
