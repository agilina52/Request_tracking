'use strict';

const API = '/api';

const tableBody = document.getElementById('requests-body');
const messageEl = document.getElementById('message');
const createForm = document.getElementById('create-form');

function showMessage(text, ok) {
  messageEl.textContent = text;
  messageEl.className = ok ? 'ok' : 'error';
}

function appendCell(row, text) {
  const cell = document.createElement('td');
  cell.textContent = text;
  row.appendChild(cell);
}

function renderList(items) {
  tableBody.replaceChildren();

  for (const item of items) {
    const row = document.createElement('tr');
    appendCell(row, item.title);
    appendCell(row, item.priority);
    appendCell(row, item.status);
    appendCell(row, item.equipmentId);
    tableBody.appendChild(row);
  }

  if (items.length === 0) {
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    cell.colSpan = 4;
    cell.textContent = 'Заявок нет';
    row.appendChild(cell);
    tableBody.appendChild(row);
  }
}

async function loadRequests() {
  const params = new URLSearchParams();
  const status = document.getElementById('filter-status').value;
  const priority = document.getElementById('filter-priority').value;

  if (status) params.set('status', status);
  if (priority) params.set('priority', priority);
  params.set('limit', '50');

  try {
    const response = await fetch(`${API}/requests?${params.toString()}`);
    const body = await response.json();
    renderList(body.data ?? []);
  } catch (err) {
    showMessage(`Не удалось загрузить список: ${err.message}`, false);
  }
}

async function createRequest(event) {
  event.preventDefault();

  const apiKey = document.getElementById('api-key').value;
  const payload = {
    equipmentId: document.getElementById('equipmentId').value,
    title: document.getElementById('title').value,
    description: document.getElementById('description').value,
    priority: document.getElementById('priority').value,
  };

  try {
    const response = await fetch(`${API}/requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-API-Key': apiKey },
      body: JSON.stringify(payload),
    });

    const body = await response.json();
    if (response.ok) {
      showMessage('Заявка создана', true);
      createForm.reset();
      loadRequests();
    } else {
      showMessage(`Ошибка: ${body.error?.message ?? response.status}`, false);
    }
  } catch (err) {
    showMessage(`Не удалось создать заявку: ${err.message}`, false);
  }
}

createForm.addEventListener('submit', createRequest);
document.getElementById('apply-filters').addEventListener('click', loadRequests);

loadRequests();
