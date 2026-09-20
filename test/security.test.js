'use strict';

const request = require('supertest');
const createApp = require('../src/app');

const API_KEY = 'change-me';

describe('Security and errors', () => {
  let app;

  beforeEach(() => {
    app = createApp();
  });

  test('POST без ключа: 401 UNAUTHORIZED', async () => {
    const response = await request(app).post('/api/equipment').send({});
    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('UNAUTHORIZED');
  });

  test('POST с неверным ключом: 401', async () => {
    const response = await request(app).post('/api/equipment').set('X-API-Key', 'wrong').send({});
    expect(response.status).toBe(401);
  });

  test('GET открыт без ключа', async () => {
    const response = await request(app).get('/api/equipment');
    expect(response.status).toBe(200);
  });

  test('некорректный JSON: 400 INVALID_JSON', async () => {
    const response = await request(app)
      .post('/api/equipment')
      .set('X-API-Key', API_KEY)
      .set('Content-Type', 'application/json')
      .send('{bad json');
    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('INVALID_JSON');
  });

  test('несуществующий маршрут: 404 в едином формате', async () => {
    const response = await request(app).get('/api/unknown');
    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('NOT_FOUND');
    expect(response.body.error.requestId).toBeDefined();
  });

  test('невалидный uuid в params: 422', async () => {
    const response = await request(app).get('/api/equipment/not-a-uuid');
    expect(response.status).toBe(422);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  test('health endpoint: 200', async () => {
    const response = await request(app).get('/api/health');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
  });

  test('возвращает CORS-заголовок для разрешённого источника', async () => {
    const response = await request(app).get('/api/health').set('Origin', 'http://localhost:3000');
    expect(response.headers['access-control-allow-origin']).toBe('http://localhost:3000');
  });

  test('ошибки содержат requestId для трассировки', async () => {
    const response = await request(app).get('/api/equipment/00000000-0000-4000-8000-000000000000');
    expect(response.status).toBe(404);
    expect(response.body.error.requestId).toBeDefined();
    expect(response.headers['x-request-id']).toBe(response.body.error.requestId);
  });
});
