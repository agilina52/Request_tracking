'use strict';

const Joi = require('joi');
const { idParams } = require('./commonSchemas');

const PRIORITIES = ['low', 'medium', 'high', 'critical'];
const STATUSES = ['new', 'in_progress', 'done', 'rejected'];

const createBody = Joi.object({
  equipmentId: Joi.string().guid().required(),
  title: Joi.string().min(5).max(120).required(),
  description: Joi.string().max(2000).allow('').default(''),
  priority: Joi.string().valid(...PRIORITIES).default('low'),
  plannedAt: Joi.date().iso().allow(null),
});

const updateBody = Joi.object({
  title: Joi.string().min(5).max(120),
  description: Joi.string().max(2000).allow(''),
  priority: Joi.string().valid(...PRIORITIES),
  plannedAt: Joi.date().iso().allow(null),
}).min(1);

const statusBody = Joi.object({
  status: Joi.string().valid(...STATUSES).required(),
});

const importBody = Joi.object({
  requests: Joi.array().items(Joi.object()).min(1).required(),
});

const listQuery = Joi.object({
  status: Joi.string().valid(...STATUSES),
  priority: Joi.string().valid(...PRIORITIES),
  equipmentId: Joi.string().guid(),
  from: Joi.date().iso(),
  to: Joi.date().iso(),
  sort: Joi.string().valid('createdAt', 'updatedAt', 'priority', 'status', 'plannedAt').default('createdAt'),
  order: Joi.string().valid('asc', 'desc').default('desc'),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
});

module.exports = { idParams, createBody, updateBody, statusBody, importBody, listQuery };
