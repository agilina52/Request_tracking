'use strict';

function get(req, res) {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
}

module.exports = { get };
