'use strict';

const { sortItems, paginate } = require('./queryHelpers');

class EquipmentRepository {
  constructor() {
    this.items = new Map();
  }

  async create(equipment) {
    this.items.set(equipment.id, equipment);
    return equipment;
  }

  async findById(id) {
    return this.items.get(id) ?? null;
  }

  async findBySerialNumber(serialNumber) {
    for (const item of this.items.values()) {
      if (item.serialNumber === serialNumber) return item;
    }
    return null;
  }

  async list({ type, status, sort, order, page, limit }) {
    let items = [...this.items.values()];

    if (type) items = items.filter((item) => item.type === type);
    if (status) items = items.filter((item) => item.status === status);

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

module.exports = EquipmentRepository;
