'use strict';

jest.mock('../src/integrations/openMeteo');

const request = require('supertest');
const createApp = require('../src/app');
const { getForecast } = require('../src/integrations/openMeteo');
const { WeatherApiError } = require('../src/errors');

const API_KEY = 'change-me';

describe('Weather endpoint', () => {
  let app;
  let equipmentId;

  beforeEach(async () => {
    app = createApp();
    getForecast.mockReset();

    const created = await request(app)
      .post('/api/equipment')
      .set('X-API-Key', API_KEY)
      .send({
        name: 'Турбина A1',
        type: 'turbine',
        serialNumber: 'SN-001',
        location: { lat: 55.75, lon: 37.61 },
        installedAt: '2025-01-15T00:00:00.000Z',
      });
    equipmentId = created.body.data.id;
  });

  test('возвращает suitable=true при слабом ветре и без осадков', async () => {
    getForecast.mockResolvedValue({ current: { wind_speed_10m: 5, precipitation: 0 } });

    const response = await request(app).get(`/api/equipment/${equipmentId}/weather`);
    expect(response.status).toBe(200);
    expect(response.body.data.suitable).toBe(true);
    expect(response.body.data).toHaveProperty('windSpeedMs', 5);
  });

  test('возвращает suitable=false при сильном ветре', async () => {
    getForecast.mockResolvedValue({ current: { wind_speed_10m: 20, precipitation: 0 } });

    const response = await request(app).get(`/api/equipment/${equipmentId}/weather`);
    expect(response.status).toBe(200);
    expect(response.body.data.suitable).toBe(false);
  });

  test('возвращает 503 при недоступности погодного API', async () => {
    getForecast.mockRejectedValue(new WeatherApiError('Сеть недоступна'));

    const response = await request(app).get(`/api/equipment/${equipmentId}/weather`);
    expect(response.status).toBe(503);
    expect(response.body.error.code).toBe('WEATHER_UNAVAILABLE');
  });

  test('возвращает 404 для несуществующего оборудования', async () => {
    const response = await request(app).get('/api/equipment/00000000-0000-4000-8000-000000000000/weather');
    expect(response.status).toBe(404);
    expect(getForecast).not.toHaveBeenCalled();
  });
});
