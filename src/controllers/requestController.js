'use strict';

class RequestController {
  constructor(service) {
    this.service = service;
  }

  list = async (req, res) => {
    const { query } = req.validated;
    const { items, total } = await this.service.list(query);
    res.json({ data: items, meta: { total, page: query.page, limit: query.limit } });
  };

  create = async (req, res) => {
    const request = await this.service.create(req.validated.body);
    res.status(201).location(`/api/requests/${request.id}`).json({ data: request });
  };

  importMany = async (req, res) => {
    const results = await this.service.importMany(req.validated.body.requests);
    const created = results.filter((item) => item.status === 'created').length;
    const failed = results.filter((item) => item.status === 'failed').length;
    res.status(207).json({ data: { total: results.length, created, failed, results } });
  };

  getById = async (req, res) => {
    const request = await this.service.getById(req.validated.params.id);
    res.json({ data: request });
  };

  update = async (req, res) => {
    const request = await this.service.update(req.validated.params.id, req.validated.body);
    res.json({ data: request });
  };

  changeStatus = async (req, res) => {
    const request = await this.service.changeStatus(req.validated.params.id, req.validated.body.status);
    res.json({ data: request });
  };

  delete = async (req, res) => {
    await this.service.delete(req.validated.params.id);
    res.status(204).end();
  };
}

module.exports = RequestController;
