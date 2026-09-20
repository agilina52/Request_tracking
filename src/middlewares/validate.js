'use strict';

const { ValidationError } = require('../errors');

function validate({ body: bodySchema, params: paramsSchema, query: querySchema }) {
  return (req, res, next) => {
    const details = [];
    const validated = {};

    const sources = [
      ['body', bodySchema],
      ['params', paramsSchema],
      ['query', querySchema],
    ];

    for (const [source, schema] of sources) {
      if (!schema) continue;

      const { error, value } = schema.validate(req[source] ?? {}, {
        abortEarly: false,
        stripUnknown: true,
      });

      if (error) {
        for (const item of error.details) {
          details.push({ field: item.path.join('.'), message: item.message });
        }
      } else {
        validated[source] = value;
      }
    }

    if (details.length > 0) {
      return next(new ValidationError('Некорректные данные запроса', details));
    }

    req.validated = validated;
    next();
  };
}

module.exports = validate;
