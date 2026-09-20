'use strict';

const { sortItems, paginate } = require('./queryHelpers');

const CLOSED_STATUSES = ['done', 'rejected'];

class RequestRepository {
  constructor() {
    this.items = new Map();
  }

  async create(request) {
    this.items.set(request.id, request);
    return request;
  }

  async findById(id) {
    return this.items.get(id) ?? null;
  }

  async findOpenByEquipmentId(equipmentId) {
    return [...this.items.values()].filter(
      (item) => item.equipmentId === equipmentId && !CLOSED_STATUSES.includes(item.status)
    );
  }

  async list({ status, priority, equipmentId, from, to, sort, order, page, limit }) {
    let items = [...this.items.values()];

    if (status) items = items.filter((item) => item.status === status);
    if (priority) items = items.filter((item) => item.priority === priority);
    if (equipmentId) items = items.filter((item) => item.equipmentId === equipmentId);
    if (from) items = items.filter((item) => item.createdAt >= from);
    if (to) items = items.filter((item) => item.createdAt <= to);

    items = sortItems(items, sort, order);
    const total = items.length;

    return { items: paginate(items, page, limit), total };
  }

  async update(id, changes) {
    const current = this.items.get(id);
    if (!current) return null;

    const updated = { ...current, ...changes };
    this.items.set(id, updated);
    return updated;
  }

  async delete(id) {
    return this.items.delete(id);
  }
}

module.exports = RequestRepository;
