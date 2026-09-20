'use strict';

const config = require('../config');
const { WeatherApiError } = require('../errors');

/**
 * GET-запрос с таймаутом (AbortController) и обработкой сетевых и HTTP-ошибок.
 * Логика переиспользована из модуля работы с Open-Meteo (Кейс 1).
 */
async function getJson(url, { timeout = config.requestTimeoutMs } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  let response;
  try {
    response = await fetch(url, { signal: controller.signal });
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new WeatherApiError(`Превышен таймаут запроса к погодному API (${timeout} мс).`);
    }
    throw new WeatherApiError(`Не удалось выполнить запрос к погодному API: ${err.message}`);
  } finally {
    clearTimeout(timer);
  }

  if (response.status >= 400) {
    throw new WeatherApiError(`Погодный API вернул ошибку (HTTP ${response.status}).`);
  }

  try {
    return await response.json();
  } catch (err) {
    throw new WeatherApiError(`Некорректный JSON в ответе погодного API: ${err.message}`);
  }
}

/**
 * Текущая погода по координатам: скорость ветра (м/с) и осадки (мм).
 */
async function getForecast(latitude, longitude) {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current: 'wind_speed_10m,precipitation',
    wind_speed_unit: 'ms',
    timezone: 'auto',
  });

  return getJson(`${config.weatherApiUrl}?${params.toString()}`);
}

module.exports = { getForecast };
