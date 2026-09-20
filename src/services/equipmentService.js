'use strict';

const crypto = require('node:crypto');
const { NotFoundError, ConflictError } = require('../errors');

class EquipmentService {
  constructor(repository, requestRepository) {
    this.repository = repository;
    this.requestRepository = requestRepository;
  }

  async list(query) {
    return this.repository.list(query);
  }

  async getById(id) {
    const equipment = await this.repository.findById(id);
    if (!equipment) throw new NotFoundError('Оборудование не найдено');
    return equipment;
  }

  async create(data) {
    const existing = await this.repository.findBySerialNumber(data.serialNumber);
    if (existing) {
      throw new ConflictError(`Серийный номер уже занят: ${data.serialNumber}`);
    }

    return this.repository.create({ id: crypto.randomUUID(), ...data });
  }

  async update(id, changes) {
    const current = await this.getById(id);

    if (changes.serialNumber && changes.serialNumber !== current.serialNumber) {
      const existing = await this.repository.findBySerialNumber(changes.serialNumber);
      if (existing && existing.id !== id) {
        throw new ConflictError(`Серийный номер уже занят: ${changes.serialNumber}`);
      }
    }

    return this.repository.update(id, changes);
  }

  async delete(id) {
    await this.getById(id);

    const openRequests = await this.requestRepository.findOpenByEquipmentId(id);
    if (openRequests.length > 0) {
      throw new ConflictError('Нельзя удалить оборудование с открытыми заявками');
    }

    await this.repository.delete(id);
  }
}

module.exports = EquipmentService;
