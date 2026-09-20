# Maintenance API

REST API сервиса учёта заявок на техническое обслуживание оборудования производственной площадки (ветропарка).

Сервис ведёт справочник оборудования и заявки на его обслуживание, контролирует жизненный цикл заявки через переходы статусов и оценивает погодные условия на объекте перед планированием наружных работ.

## Требования к окружению

- Node.js 20+ (проверено на Node.js 22)
- npm 9+
- Доступ к https://api.open-meteo.com (для эндпоинта прогноза погоды; ключ не требуется)

## Установка и запуск

```bash
npm install
cp .env.example .env   # Windows: copy .env.example .env
npm start              # продакшн-запуск: node src/server.js
npm run dev            # разработка с автоперезагрузкой: node --watch src/server.js
```

Проверка доступности:

```bash
curl http://localhost:3000/api/health
```

### Запуск через Docker

```bash
docker compose up --build
```

Сервис будет доступен на http://localhost:3000, контейнер проходит healthcheck по `/api/health`.

```bash
docker compose ps          # статус контейнера и healthcheck
curl http://localhost:3000/api/health
```

### Веб-интерфейс

После запуска откройте http://localhost:3000/ — простая HTML-страница, работающая с API через `fetch`: список заявок с фильтрами по статусу и приоритету и форма создания новой заявки. Для создания используется API-ключ (поле на форме, по умолчанию `change-me`).

## Тестирование

Автотесты API (Jest + Supertest):

```bash
npm test
```

Покрывают основные сценарии: CRUD оборудования и заявок, переходы статусов, валидацию, ошибки (400/404/409/422/401), аутентификацию, массовый импорт (207) и погодный эндпоинт (внешний API замокан).

## Переменные окружения

Все параметры настраиваются только через переменные окружения (файл `.env`), значения по умолчанию указаны в `.env.example`.

| Переменная | По умолчанию | Описание |
|---|---|---|
| `PORT` | `3000` | Порт HTTP-сервера |
| `NODE_ENV` | `development` | Режим запуска: `development`, `production`, `test` |
| `CORS_ORIGINS` | `http://localhost:3000` | Разрешённые источники CORS через запятую |
| `RATE_LIMIT_WINDOW_MS` | `60000` | Окно ограничения частоты запросов, мс |
| `RATE_LIMIT_MAX` | `100` | Максимум запросов на `/api` за окно |
| `WEATHER_API_URL` | `https://api.open-meteo.com/v1/forecast` | Базовый URL погодного API (Open-Meteo) |
| `REQUEST_TIMEOUT_MS` | `5000` | Таймаут HTTP-запроса к погодному API, мс |
| `WEATHER_MAX_WIND_MS` | `15` | Порог скорости ветра для наружных работ, м/с |
| `WEATHER_MAX_PRECIPITATION_MM` | `0` | Порог осадков для наружных работ, мм |
| `BODY_LIMIT` | `100kb` | Максимальный размер тела запроса |
| `API_KEY` | `change-me` | API-ключ для изменяющих операций, заголовок `X-API-Key` |

## Эндпоинты

| Метод | Путь | Назначение | Коды ответов |
|---|---|---|---|
| GET | `/api/health` | Проверка доступности | 200 |
| GET | `/api/equipment` | Список оборудования (фильтры, сортировка, пагинация) | 200, 422 |
| POST | `/api/equipment` | Создание единицы оборудования | 201, 409, 422 |
| GET | `/api/equipment/:id` | Карточка оборудования | 200, 404, 422 |
| PATCH | `/api/equipment/:id` | Частичное обновление | 200, 404, 409, 422 |
| DELETE | `/api/equipment/:id` | Удаление (запрещено при открытых заявках) | 204, 404, 409 |
| GET | `/api/equipment/:id/requests` | Заявки по единице оборудования | 200, 404, 422 |
| GET | `/api/equipment/:id/weather` | Прогноз и пригодность окна для наружных работ | 200, 404, 503 |
| GET | `/api/requests` | Список заявок (фильтры, сортировка, пагинация) | 200, 422 |
| POST | `/api/requests` | Создание заявки | 201, 404, 422 |
| POST | `/api/requests/import` | Массовый импорт заявок (частичный успех, отчёт по записи) | 207, 422 |
| GET | `/api/requests/:id` | Карточка заявки | 200, 404, 422 |
| PATCH | `/api/requests/:id` | Редактирование полей заявки | 200, 404, 422 |
| PATCH | `/api/requests/:id/status` | Смена статуса с проверкой перехода | 200, 404, 409, 422 |
| DELETE | `/api/requests/:id` | Удаление заявки | 204, 404, 422 |

Параметры списочных эндпоинтов (query):

- **Фильтры:** `equipment` — `type`, `status`; `requests` — `status`, `priority`, `equipmentId`, `from`, `to` (диапазон дат по `createdAt`).
- **Сортировка:** `sort` (поле), `order` (`asc`/`desc`).
- **Пагинация:** `page` (по умолчанию 1), `limit` (по умолчанию 20, максимум 100).

Ответ списка содержит `data` и `meta` с `total`, `page`, `limit`.

## Модель данных

### Оборудование (equipment)

| Поле | Тип | Ограничения |
|---|---|---|
| `id` | string (uuid v4) | генерируется сервером |
| `name` | string | 3–100 символов, обязательное |
| `type` | enum | `turbine`, `inverter`, `sensor`, `substation` |
| `serialNumber` | string | уникальный в пределах системы |
| `location` | object | `{ lat: number, lon: number }` |
| `status` | enum | `operational`, `maintenance`, `fault`, `decommissioned` (по умолчанию `operational`) |
| `installedAt` | ISO-дата | не в будущем |

### Заявка на обслуживание (maintenance request)

| Поле | Тип | Ограничения |
|---|---|---|
| `id` | string (uuid v4) | генерируется сервером |
| `equipmentId` | string (uuid v4) | ссылка на существующее оборудование |
| `title` | string | 5–120 символов, обязательное |
| `description` | string | до 2000 символов |
| `priority` | enum | `low`, `medium`, `high`, `critical` (по умолчанию `low`) |
| `status` | enum | `new`, `in_progress`, `done`, `rejected` (по умолчанию `new`) |
| `plannedAt` | ISO-дата-время | необязательное |
| `createdAt` | ISO-дата-время | проставляется сервером |
| `updatedAt` | ISO-дата-время | проставляется сервером |

### Переходы статусов заявки

```
new ──────────> in_progress ──────────> done
 │                    │
 └────> rejected <────┘
```

| Из | В | Допустимость |
|---|---|---|
| `new` | `in_progress` | да |
| `new` | `rejected` | да |
| `in_progress` | `done` | да |
| `in_progress` | `rejected` | да |
| `done` / `rejected` | любой | нет (409) |

## Формат ответа об ошибке

Все ошибки возвращаются в едином формате:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Некорректные данные запроса",
    "details": [
      { "field": "priority", "message": "Недопустимое значение" }
    ],
    "requestId": "b1f2c3d4"
  }
}
```

`requestId` совпадает с идентификатором в логах и заголовком `X-Request-Id`. Коды ошибок: `VALIDATION_ERROR` (422), `NOT_FOUND` (404), `CONFLICT` (409), `INVALID_JSON` (400), `PAYLOAD_TOO_LARGE` (413), `RATE_LIMIT_EXCEEDED` (429), `WEATHER_UNAVAILABLE` (503), `INTERNAL_ERROR` (500).

## Примеры запросов и ответов

### Создание оборудования

```bash
curl -X POST http://localhost:3000/api/equipment \
  -H "Content-Type: application/json" \
  -d '{"name":"Турбина A1","type":"turbine","serialNumber":"SN-001","location":{"lat":55.75,"lon":37.61},"installedAt":"2025-01-15T00:00:00.000Z"}'
```

```json
// 201 Created, Location: /api/equipment/<id>
{
  "data": {
    "id": "d4b24d44-51f2-4588-9914-44953c648310",
    "name": "Турбина A1",
    "type": "turbine",
    "serialNumber": "SN-001",
    "location": { "lat": 55.75, "lon": 37.61 },
    "status": "operational",
    "installedAt": "2025-01-15T00:00:00.000Z"
  }
}
```

### Дубль серийного номера (409)

```json
{
  "error": {
    "code": "CONFLICT",
    "message": "Серийный номер уже занят: SN-001",
    "requestId": "…"
  }
}
```

### Создание заявки и смена статуса

```bash
curl -X POST http://localhost:3000/api/requests \
  -H "Content-Type: application/json" \
  -d '{"equipmentId":"d4b24d44-…","title":"Замена лопасти","priority":"high"}'

curl -X PATCH http://localhost:3000/api/requests/<id>/status \
  -H "Content-Type: application/json" -d '{"status":"in_progress"}'
```

### Недопустимый переход (409)

```json
{
  "error": {
    "code": "CONFLICT",
    "message": "Недопустимый переход статуса: new → done",
    "requestId": "…"
  }
}
```

### Массовый импорт заявок (207)

```bash
curl -X POST http://localhost:3000/api/requests/import \
  -H "Content-Type: application/json" -H "X-API-Key: change-me" \
  -d '{"requests":[{"equipmentId":"<id>","title":"Заявка 1"},{"equipmentId":"<id>","title":"X","priority":"urgent"}]}'
```

```json
{
  "data": {
    "total": 2,
    "created": 1,
    "failed": 1,
    "results": [
      { "index": 0, "status": "created", "request": { "id": "…", "title": "Заявка 1", "status": "new" } },
      { "index": 1, "status": "failed", "error": { "code": "VALIDATION_ERROR", "message": "Некорректные данные заявки", "details": [ { "field": "title", "message": "…" } ] } }
    ]
  }
}
```

### Прогноз погоды

```bash
curl http://localhost:3000/api/equipment/<id>/weather
```

```json
{
  "data": {
    "equipmentId": "d4b24d44-…",
    "location": { "lat": 55.75, "lon": 37.61 },
    "windSpeedMs": 2.7,
    "precipitationMm": 0,
    "suitable": true,
    "thresholds": { "maxWindMs": 15, "maxPrecipitationMm": 0 }
  }
}
```

Правило пригодности: окно считается подходящим, если скорость ветра ≤ `WEATHER_MAX_WIND_MS` и осадки ≤ `WEATHER_MAX_PRECIPITATION_MM`. При недоступности внешнего API возвращается `503 WEATHER_UNAVAILABLE` (сервис не падает).

## Безопасность

- **CORS** — разрешённые источники задаются явным списком `CORS_ORIGINS` (не `*`). По умолчанию разрешён только `http://localhost:3000` — локальный dev-клиент. Методы: `GET`, `POST`, `PATCH`, `DELETE`.
- **Аутентификация** — изменяющие операции (`POST`, `PATCH`, `DELETE`) требуют API-ключ в заголовке `X-API-Key` (значение `API_KEY`); при отсутствии/неверном ключе — `401 UNAUTHORIZED`. Читающие операции (`GET`) открыты.
- **Rate limiting** — на все маршруты `/api` действует лимит `RATE_LIMIT_MAX` запросов за `RATE_LIMIT_WINDOW_MS`; при превышении — `429` с заголовками `RateLimit-*` и `Retry-After`.
- **Защитные заголовки** — `helmet` (CSP, `X-Content-Type-Options`, `X-Frame-Options`, HSTS и др.).
- **Размер тела** — ограничен `BODY_LIMIT` (по умолчанию 100kb), при превышении — `413`.
- **Cookies / SameSite / Secure Context** — сервис не использует cookie (аутентификация по заголовкам, сессии на клиенте), поэтому флаги `HttpOnly`/`Secure`/`SameSite` не применяются. В продакшне сервис должен раздаваться только по HTTPS (Secure Context), а HSTS уже включён через helmet.
- **Стеки** — в режиме `production` сообщения о внутренних ошибках не раскрывают деталей и стек-трейсов.
- **Секреты** — конфигурация через `.env`, файл `.env` в `.gitignore`, в репозитории только `.env.example`.

## Структура проекта

```
public/                     # статический веб-интерфейс
├── index.html              # страница списка заявок и формы создания
└── app.js                  # логика работы с API через fetch

src/
├── app.js                  # сборка Express-приложения (отделена от запуска)
├── server.js               # запуск HTTP-сервера
├── config.js               # загрузка конфигурации из переменных окружения
├── container.js            # композиция зависимостей (DI)
├── logger.js               # структурированное логирование по уровням
├── routes/                 # маршруты (роутинг)
│   ├── index.js
│   ├── equipmentRoutes.js
│   └── requestRoutes.js
├── controllers/            # HTTP-слой (приём/ответ, без бизнес-логики)
│   ├── equipmentController.js
│   └── requestController.js
├── services/               # бизнес-логика
│   ├── equipmentService.js
│   ├── requestService.js
│   └── weatherService.js
├── repositories/           # доступ к данным (изолирован для замены на PostgreSQL)
│   ├── equipmentRepository.js
│   ├── requestRepository.js
│   └── queryHelpers.js
├── integrations/
│   └── openMeteo.js        # HTTP-клиент Open-Meteo (переиспользован из Кейса 1)
├── validators/             # Joi-схемы валидации
│   ├── commonSchemas.js
│   ├── equipmentSchemas.js
│   └── requestSchemas.js
├── middlewares/
│   ├── requestContext.js   # requestId + логирование запросов
│   ├── validate.js         # валидация body/params/query
│   ├── asyncHandler.js     # проброс async-ошибок
│   ├── notFound.js         # обработчик 404
│   └── errorHandler.js     # централизованный обработчик ошибок
└── errors/                 # типы ошибок приложения
    ├── appError.js
    ├── notFoundError.js
    ├── conflictError.js
    ├── validationError.js
    ├── weatherApiError.js
    └── index.js
```

Архитектура слоёная: `routes → controllers → services → repositories`. Бизнес-логика находится в сервисах, работа с данными — только в репозиториях. Замена in-memory хранилища на PostgreSQL (Неделя 3) затронет только слой репозиториев.
