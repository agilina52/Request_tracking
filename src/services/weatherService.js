'use strict';

const config = require('../config');
const { getForecast } = require('../integrations/openMeteo');

class WeatherService {
  async getWorkWindow(location) {
    const data = await getForecast(location.lat, location.lon);

    const windSpeed = data.current?.wind_speed_10m ?? null;
    const precipitation = data.current?.precipitation ?? null;

    const suitable =
      windSpeed !== null &&
      precipitation !== null &&
      windSpeed <= config.maxWindMs &&
      precipitation <= config.maxPrecipitationMm;

    return {
      windSpeedMs: windSpeed,
      precipitationMm: precipitation,
      suitable,
      thresholds: { maxWindMs: config.maxWindMs, maxPrecipitationMm: config.maxPrecipitationMm },
    };
  }
}

module.exports = WeatherService;
