'use strict';

const request = require('supertest');
const createApp = require('../src/app');

const API_KEY = 'change-me';

async function createEquipment(app) {
  const response = await request(app)
    .post('/api/equipment')
    .set('X-API-Key', API_KEY)
    .send({
      name: 'Турбина A1',
      type: 'turbine',
      serialNumber: 'SN-001',
      location: { lat: 55.75, lon: 37.61 },
      installedAt: '2025-01-15T00:00:00.000Z',
    });
  return response.body.data.id;
}

describe('Requests API', () => {
  let app;
  let equipmentId;

  beforeEach(async () => {
    app = createApp();
    equipmentId = await createEquipment(app);
  });

  const createRequest = (overrides = {}) =>
    request(app)
      .post('/api/requests')
      .set('X-API-Key', API_KEY)
      .send({ equipmentId, title: 'Замена лопасти', priority: 'high', ...overrides });

  test('создаёт заявку со статусом new и серверными датами', async () => {
    const response = await createRequest();
    expect(response.status).toBe(201);
    expect(response.body.data.status).toBe('new');
    expect(response.body.data.createdAt).toBeDefined();
    expect(response.body.data.updatedAt).toBeDefined();
  });

  test('отклоняет заявку на несуществующее оборудование: 404', async () => {
    const response = await request(app)
      .post('/api/requests')
      .set('X-API-Key', API_KEY)
      .send({ equipmentId: '00000000-0000-4000-8000-000000000000', title: 'Заявка' });
    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('NOT_FOUND');
  });

  test('выполняет валидный переход new → in_progress → done', async () => {
    const created = await createRequest();
    const id = created.body.data.id;

    const inProgress = await request(app)
      .patch(`/api/requests/${id}/status`)
      .set('X-API-Key', API_KEY)
      .send({ status: 'in_progress' });
    expect(inProgress.status).toBe(200);
    expect(inProgress.body.data.status).toBe('in_progress');

    const done = await request(app)
      .patch(`/api/requests/${id}/status`)
      .set('X-API-Key', API_KEY)
      .send({ status: 'done' });
    expect(done.status).toBe(200);
    expect(done.body.data.status).toBe('done');
  });

  test('отклоняет недопустимый переход new → done: 409', async () => {
    const created = await createRequest();
    const id = created.body.data.id;

    const response = await request(app)
      .patch(`/api/requests/${id}/status`)
      .set('X-API-Key', API_KEY)
      .send({ status: 'done' });
    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('CONFLICT');
  });

  test('запрещает переход из done: 409', async () => {
    const created = await createRequest();
    const id = created.body.data.id;

    await request(app).patch(`/api/requests/${id}/status`).set('X-API-Key', API_KEY).send({ status: 'in_progress' });
    await request(app).patch(`/api/requests/${id}/status`).set('X-API-Key', API_KEY).send({ status: 'done' });

    const response = await request(app)
      .patch(`/api/requests/${id}/status`)
      .set('X-API-Key', API_KEY)
      .send({ status: 'rejected' });
    expect(response.status).toBe(409);
  });

  test('запрещает удаление оборудования с открытыми заявками: 409', async () => {
    await createRequest();

    const response = await request(app)
      .delete(`/api/equipment/${equipmentId}`)
      .set('X-API-Key', API_KEY);
    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('CONFLICT');
  });

  test('возвращает заявки по оборудованию (вложенный ресурс)', async () => {
    await createRequest();

    const response = await request(app).get(`/api/equipment/${equipmentId}/requests`);
    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].equipmentId).toBe(equipmentId);
  });

  test('массовый импорт: 207 с отчётом по каждой записи', async () => {
    const response = await request(app)
      .post('/api/requests/import')
      .set('X-API-Key', API_KEY)
      .send({
        requests: [
          { equipmentId, title: 'Валидная заявка' },
          { equipmentId, title: 'X', priority: 'urgent' },
          { equipmentId: '00000000-0000-4000-8000-000000000000', title: 'Нет оборудования' },
        ],
      });

    expect(response.status).toBe(207);
    expect(response.body.data).toMatchObject({ total: 3, created: 1, failed: 2 });
    expect(response.body.data.results[0].status).toBe('created');
    expect(response.body.data.results[1].status).toBe('failed');
    expect(response.body.data.results[2].status).toBe('failed');
  });

  test('возвращает карточку заявки: 200', async () => {
    const created = await createRequest();
    const id = created.body.data.id;

    const response = await request(app).get(`/api/requests/${id}`);
    expect(response.status).toBe(200);
    expect(response.body.data.id).toBe(id);
  });

  test('редактирует поля заявки: 200', async () => {
    const created = await createRequest();
    const id = created.body.data.id;

    const response = await request(app)
      .patch(`/api/requests/${id}`)
      .set('X-API-Key', API_KEY)
      .send({ priority: 'critical', title: 'Новое название' });
    expect(response.status).toBe(200);
    expect(response.body.data.priority).toBe('critical');
    expect(response.body.data.title).toBe('Новое название');
  });

  test('удаляет заявку: 204', async () => {
    const created = await createRequest();
    const id = created.body.data.id;

    const response = await request(app).delete(`/api/requests/${id}`).set('X-API-Key', API_KEY);
    expect(response.status).toBe(204);
  });

  test('фильтрует по статусу', async () => {
    const created = await createRequest();
    await request(app)
      .patch(`/api/requests/${created.body.data.id}/status`)
      .set('X-API-Key', API_KEY)
      .send({ status: 'in_progress' });

    const response = await request(app).get('/api/requests?status=in_progress');
    expect(response.body.meta.total).toBe(1);
    expect(response.body.data[0].status).toBe('in_progress');
  });

  test('фильтрует по приоритету', async () => {
    await createRequest({ priority: 'high' });
    await createRequest({ priority: 'low' });

    const response = await request(app).get('/api/requests?priority=high');
    expect(response.body.meta.total).toBe(1);
    expect(response.body.data[0].priority).toBe('high');
  });

  test('отклоняет слишком короткий title: 422', async () => {
    const response = await createRequest({ title: 'X' });
    expect(response.status).toBe(422);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  test('отклоняет недопустимый priority: 422', async () => {
    const response = await createRequest({ priority: 'urgent' });
    expect(response.status).toBe(422);
  });

  test('возвращает 404 для несуществующей заявки', async () => {
    const response = await request(app).get('/api/requests/00000000-0000-4000-8000-000000000000');
    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('NOT_FOUND');
  });
});
