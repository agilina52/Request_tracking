'use strict';

const Joi = require('joi');
const { idParams } = require('./commonSchemas');

const TYPES = ['turbine', 'inverter', 'sensor', 'substation'];
const STATUSES = ['operational', 'maintenance', 'fault', 'decommissioned'];

const locationSchema = Joi.object({
  lat: Joi.number().min(-90).max(90).required(),
  lon: Joi.number().min(-180).max(180).required(),
});

const createBody = Joi.object({
  name: Joi.string().min(3).max(100).required(),
  type: Joi.string().valid(...TYPES).required(),
  serialNumber: Joi.string().required(),
  location: locationSchema.required(),
  status: Joi.string().valid(...STATUSES).default('operational'),
  installedAt: Joi.date().iso().max('now').required(),
});

const updateBody = Joi.object({
  name: Joi.string().min(3).max(100),
  type: Joi.string().valid(...TYPES),
  serialNumber: Joi.string(),
  location: locationSchema,
  status: Joi.string().valid(...STATUSES),
  installedAt: Joi.date().iso().max('now'),
}).min(1);

const listQuery = Joi.object({
  type: Joi.string().valid(...TYPES),
  status: Joi.string().valid(...STATUSES),
  sort: Joi.string().valid('name', 'type', 'status', 'serialNumber', 'installedAt').default('name'),
  order: Joi.string().valid('asc', 'desc').default('asc'),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
});

module.exports = { idParams, createBody, updateBody, listQuery };
