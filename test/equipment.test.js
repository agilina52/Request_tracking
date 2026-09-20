'use strict';

const request = require('supertest');
const createApp = require('../src/app');

const API_KEY = 'change-me';

const validEquipment = {
  name: 'Турбина A1',
  type: 'turbine',
  serialNumber: 'SN-001',
  location: { lat: 55.75, lon: 37.61 },
  installedAt: '2025-01-15T00:00:00.000Z',
};

describe('Equipment API', () => {
  let app;

  beforeEach(() => {
    app = createApp();
  });

  const createEquipment = (overrides = {}) =>
    request(app)
      .post('/api/equipment')
      .set('X-API-Key', API_KEY)
      .send({ ...validEquipment, ...overrides });

  test('создаёт оборудование: 201, Location и статус по умолчанию', async () => {
    const response = await createEquipment();
    expect(response.status).toBe(201);
    expect(response.body.data.id).toBeDefined();
    expect(response.body.data.status).toBe('operational');
    expect(response.headers.location).toBe(`/api/equipment/${response.body.data.id}`);
  });

  test('возвращает список с метаданными пагинации', async () => {
    await createEquipment();
    const response = await request(app).get('/api/equipment?limit=5');
    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.meta).toMatchObject({ total: 1, page: 1, limit: 5 });
  });

  test('отклоняет дубль серийного номера: 409', async () => {
    await createEquipment();
    const response = await createEquipment({ name: 'Турбина A2' });
    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('CONFLICT');
  });

  test('отклоняет некорректное тело: 422 с details', async () => {
    const response = await createEquipment({ name: 'X', type: 'alien' });
    expect(response.status).toBe(422);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(response.body.error.details).toEqual(expect.any(Array));
  });

  test('возвращает 404 для несуществующего id', async () => {
    const response = await request(app).get('/api/equipment/00000000-0000-4000-8000-000000000000');
    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('NOT_FOUND');
  });

  test('обновляет оборудование, не трогая id', async () => {
    const created = await createEquipment();
    const id = created.body.data.id;

    const response = await request(app)
      .patch(`/api/equipment/${id}`)
      .set('X-API-Key', API_KEY)
      .send({ status: 'maintenance', id: '00000000-0000-4000-8000-000000000000' });

    expect(response.status).toBe(200);
    expect(response.body.data.status).toBe('maintenance');
    expect(response.body.data.id).toBe(id);
  });

  test('удаляет оборудование: 204', async () => {
    const created = await createEquipment();
    const id = created.body.data.id;

    const response = await request(app).delete(`/api/equipment/${id}`).set('X-API-Key', API_KEY);
    expect(response.status).toBe(204);
  });

  test('фильтрует по типу', async () => {
    await createEquipment();
    await createEquipment({ name: 'Инвертор I1', type: 'inverter', serialNumber: 'SN-002' });

    const response = await request(app).get('/api/equipment?type=turbine');
    expect(response.status).toBe(200);
    expect(response.body.meta.total).toBe(1);
    expect(response.body.data[0].type).toBe('turbine');
  });

  test('фильтрует по статусу', async () => {
    const created = await createEquipment();
    await request(app)
      .patch(`/api/equipment/${created.body.data.id}`)
      .set('X-API-Key', API_KEY)
      .send({ status: 'maintenance' });

    const response = await request(app).get('/api/equipment?status=maintenance');
    expect(response.body.meta.total).toBe(1);
    expect(response.body.data[0].status).toBe('maintenance');
  });

  test('сортирует по имени', async () => {
    await createEquipment({ name: 'Бета', serialNumber: 'SN-002' });
    await createEquipment({ name: 'Альфа', serialNumber: 'SN-003' });

    const response = await request(app).get('/api/equipment?sort=name&order=asc');
    expect(response.body.data.map((item) => item.name)).toEqual(['Альфа', 'Бета']);
  });

  test('пагинирует список', async () => {
    await createEquipment();
    await createEquipment({ name: 'Турбина A2', serialNumber: 'SN-002' });
    await createEquipment({ name: 'Турбина A3', serialNumber: 'SN-003' });

    const response = await request(app).get('/api/equipment?page=2&limit=1&sort=name&order=asc');
    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.meta).toMatchObject({ total: 3, page: 2, limit: 1 });
  });

  test('отклоняет смену серийного номера на занятый: 409', async () => {
    await createEquipment({ serialNumber: 'SN-002' });
    const created = await createEquipment({ serialNumber: 'SN-003' });

    const response = await request(app)
      .patch(`/api/equipment/${created.body.data.id}`)
      .set('X-API-Key', API_KEY)
      .send({ serialNumber: 'SN-002' });
    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('CONFLICT');
  });

  test('возвращает 404 при обновлении несуществующего оборудования', async () => {
    const response = await request(app)
      .patch('/api/equipment/00000000-0000-4000-8000-000000000000')
      .set('X-API-Key', API_KEY)
      .send({ status: 'fault' });
    expect(response.status).toBe(404);
  });

  test('возвращает 404 при удалении несуществующего оборудования', async () => {
    const response = await request(app)
      .delete('/api/equipment/00000000-0000-4000-8000-000000000000')
      .set('X-API-Key', API_KEY);
    expect(response.status).toBe(404);
  });
});
