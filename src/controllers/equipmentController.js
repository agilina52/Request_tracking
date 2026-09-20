'use strict';

class EquipmentController {
  constructor(service) {
    this.service = service;
  }

  list = async (req, res) => {
    const { query } = req.validated;
    const { items, total } = await this.service.list(query);
    res.json({ data: items, meta: { total, page: query.page, limit: query.limit } });
  };

  create = async (req, res) => {
    const equipment = await this.service.create(req.validated.body);
    res.status(201).location(`/api/equipment/${equipment.id}`).json({ data: equipment });
  };

  getById = async (req, res) => {
    const equipment = await this.service.getById(req.validated.params.id);
    res.json({ data: equipment });
  };

  update = async (req, res) => {
    const equipment = await this.service.update(req.validated.params.id, req.validated.body);
    res.json({ data: equipment });
  };

  delete = async (req, res) => {
    await this.service.delete(req.validated.params.id);
    res.status(204).end();
  };
}

module.exports = EquipmentController;
