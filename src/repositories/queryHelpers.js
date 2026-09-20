'use strict';

function sortItems(items, field, order) {
  const direction = order === 'desc' ? -1 : 1;
  return [...items].sort((a, b) => {
    if (a[field] < b[field]) return -1 * direction;
    if (a[field] > b[field]) return 1 * direction;
    return 0;
  });
}

function paginate(items, page, limit) {
  const start = (page - 1) * limit;
  return items.slice(start, start + limit);
}

module.exports = { sortItems, paginate };
