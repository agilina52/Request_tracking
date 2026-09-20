'use strict';

const crypto = require('node:crypto');
const { NotFoundError, ConflictError } = require('../errors');
const requestSchemas = require('../validators/requestSchemas');

const TRANSITIONS = {
  new: ['in_progress', 'rejected'],
  in_progress: ['done', 'rejected'],
  done: [],
  rejected: [],
};

class RequestService {
  constructor(repository, equipmentRepository) {
    this.repository = repository;
    this.equipmentRepository = equipmentRepository;
  }

  async list(query) {
    return this.repository.list(query);
  }

  async listByEquipment(equipmentId, query) {
    await this.ensureEquipmentExists(equipmentId);
    return this.repository.list({ ...query, equipmentId });
  }

  async getById(id) {
    const request = await this.repository.findById(id);
    if (!request) throw new NotFoundError('Заявка не найдена');
    return request;
  }

  async create(data) {
    await this.ensureEquipmentExists(data.equipmentId);

    const now = new Date().toISOString();
    return this.repository.create({
      id: crypto.randomUUID(),
      ...data,
      status: 'new',
      createdAt: now,
      updatedAt: now,
    });
  }

  async update(id, changes) {
    await this.getById(id);
    return this.repository.update(id, { ...changes, updatedAt: new Date().toISOString() });
  }

  async changeStatus(id, newStatus) {
    const request = await this.getById(id);

    if (!TRANSITIONS[request.status].includes(newStatus)) {
      throw new ConflictError(`Недопустимый переход статуса: ${request.status} → ${newStatus}`);
    }

    return this.repository.update(id, { status: newStatus, updatedAt: new Date().toISOString() });
  }

  async delete(id) {
    await this.getById(id);
    await this.repository.delete(id);
  }

  async importMany(records) {
    const results = [];

    for (let index = 0; index < records.length; index++) {
      const { error, value } = requestSchemas.createBody.validate(records[index], {
        abortEarly: false,
        stripUnknown: true,
      });

      if (error) {
        results.push({
          index,
          status: 'failed',
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Некорректные данные заявки',
            details: error.details.map((item) => ({ field: item.path.join('.'), message: item.message })),
          },
        });
        continue;
      }

      try {
        const request = await this.create(value);
        results.push({ index, status: 'created', request });
      } catch (err) {
        results.push({
          index,
          status: 'failed',
          error: { code: err.code ?? 'INTERNAL_ERROR', message: err.message },
        });
      }
    }

    return results;
  }

  async ensureEquipmentExists(equipmentId) {
    const equipment = await this.equipmentRepository.findById(equipmentId);
    if (!equipment) throw new NotFoundError('Оборудование не найдено');
    return equipment;
  }
}

module.exports = RequestService;
