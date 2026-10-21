const api = {
  async request(path, options = {}) {
    const response = await fetch(path, {
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
      ...options,
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = Array.isArray(body.message) ? body.message.join(', ') : body.message;
      throw new Error(message || `Falha na requisição (${response.status}).`);
    }
    return body;
  },
};

const groupLabels = {
  'orders-consumer-group': 'Pedidos',
  'stock-consumer-group': 'Estoque',
};
const grid = document.querySelector('#groups-grid');
const eventList = document.querySelector('#event-list');
const events = [];
let currentState = null;

function setConnection(connected) {
  const indicator = document.querySelector('.connection');
  indicator.classList.toggle('connected', connected);
  document.querySelector('#connection-label').textContent = connected
    ? 'NestJS conectado'
    : 'Reconectando…';
}

function formatTime(value) {
  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  }).format(new Date(value));
}

function renderState(state) {
  currentState = state;
  const groups = state?.groups || [];
  const anyRebalancing = groups.some((group) => group.rebalancing);
  const rebalance = document.querySelector('#rebalance-indicator');
  rebalance.classList.toggle('stable', !anyRebalancing);
  document.querySelector('#rebalance-label').textContent = anyRebalancing
    ? 'Rebalanceamento em andamento'
    : 'Grupos estáveis';

  grid.innerHTML = groups.map((group) => {
    const consumers = group.consumers || [];
    const partitionRows = (group.partitions || []).map((partition) => {
      const assigned = Boolean(partition.consumerName);
      return `<div class="partition-row">
        <span class="partition-label">PARTITION ${partition.partition}</span>
        <div class="partition-owner ${assigned ? '' : 'unassigned'}">
          ${assigned ? '<span class="owner-dot"></span>' : ''}
          ${escapeHtml(partition.consumerName || 'Sem consumer atribuído')}
        </div>
      </div>`;
    }).join('');
    const consumerChips = consumers.map((consumer) => `<span class="consumer-chip ${consumer.status === 'rebalancing' ? 'rebalancing' : ''}">
      <span class="status-dot"></span>${escapeHtml(consumer.name)}
      <button class="remove-consumer" type="button" data-remove="${escapeHtml(consumer.id)}" title="Encerrar ${escapeHtml(consumer.name)}" aria-label="Encerrar ${escapeHtml(consumer.name)}">×</button>
    </span>`).join('');

    return `<article class="group-card ${group.rebalancing ? 'rebalancing' : ''}">
      <div class="group-top">
        <div><span class="group-name">${escapeHtml(group.groupId)}</span><span class="group-topic">TOPIC / ${escapeHtml(group.topic)}</span></div>
        <span class="group-state ${group.rebalancing ? 'rebalancing' : ''}">${group.rebalancing ? 'REBALANCEANDO' : 'ESTÁVEL'}</span>
      </div>
      <div class="partition-list">${partitionRows || '<div class="empty-state">Tópico sem partições disponíveis.</div>'}</div>
      <div class="consumer-list">${consumerChips || '<span class="form-hint">Nenhum consumer neste grupo.</span>'}</div>
    </article>`;
  }).join('') || '<div class="empty-state">Nenhum grupo disponível.</div>';
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[char]);
}

const eventTitles = {
  published: 'PEDIDO ENVIADO',
  consumed: 'MENSAGEM CONSUMIDA',
  rebalancing: 'REBALANCEAMENTO',
  group_stable: 'GRUPO ESTÁVEL',
  consumer_created: 'CONSUMER CRIADO',
  consumer_stopping: 'CONSUMER SAINDO',
  consumer_removed: 'CONSUMER REMOVIDO',
  consumer_error: 'ERRO NO CONSUMER',
  state_error: 'ERRO DE ESTADO',
};

function addEvent(event) {
  if (event.type === 'state' && event.state) {
    renderState(event.state);
    return;
  }
  if (event.type === 'state_error') {
    addEvent({ ...event, type: 'consumer_error' });
    return;
  }
  events.unshift(event);
  if (events.length > 100) events.pop();
  renderEvents();
}

function renderEvents() {
  if (!events.length) {
    eventList.innerHTML = '<div class="empty-log">Os eventos de publicação, consumo e rebalanceamento aparecerão aqui.</div>';
    return;
  }
  eventList.innerHTML = events.map((event) => {
    const title = eventTitles[event.type] || event.type.toUpperCase();
    const details = event.description || event.message || 'Evento recebido.';
    const extra = event.type === 'consumed'
      ? `<span class="event-meta">Grupo ${escapeHtml(groupLabels[event.groupId] || event.groupId)} · partição ${event.partition} · offset ${escapeHtml(event.offset)}${event.key ? ` · chave ${escapeHtml(event.key)}` : ''}</span>`
      : event.type === 'published'
        ? `<span class="event-meta">Tópico ${escapeHtml(event.destination)} · pedido ${escapeHtml(event.orderId)}</span>`
        : event.groupId
          ? `<span class="event-meta">Grupo ${escapeHtml(groupLabels[event.groupId] || event.groupId)}</span>`
          : '';
    return `<div class="event-row">
      <div><span class="event-type ${escapeHtml(event.type)}">${escapeHtml(title)}</span></div>
      <div class="event-description">${escapeHtml(details)}${extra}</div>
      <time class="event-time">${formatTime(event.timestamp)}</time>
    </div>`;
  }).join('');
}

document.querySelector('#order-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const button = form.querySelector('button');
  const feedback = document.querySelector('#order-feedback');
  const data = new FormData(form);
  const orderId = String(data.get('orderId')).trim();
  const message = String(data.get('message')).trim();
  button.disabled = true;
  feedback.textContent = 'Enviando pedido…';
  try {
    const result = await api.request('/orders', {
      method: 'POST',
      body: JSON.stringify({ orderId, message }),
    });
    feedback.textContent = result.status || `Pedido ${orderId} enviado para o Kafka.`;
    form.elements.orderId.value = '';
    form.elements.orderId.focus();
  } catch (error) {
    feedback.textContent = error.message;
  } finally {
    button.disabled = false;
  }
});

document.querySelector('#consumer-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const button = form.querySelector('button');
  const data = new FormData(form);
  button.disabled = true;
  try {
    await api.request('/demo/consumers', {
      method: 'POST',
      body: JSON.stringify({ groupId: data.get('groupId'), name: data.get('name') }),
    });
    form.elements.name.value = '';
  } catch (error) {
    addEvent({ type: 'consumer_error', message: error.message, timestamp: new Date().toISOString() });
  } finally {
    button.disabled = false;
  }
});

grid.addEventListener('click', async (event) => {
  const button = event.target.closest('[data-remove]');
  if (!button) return;
  button.disabled = true;
  try {
    await api.request(`/demo/consumers/${encodeURIComponent(button.dataset.remove)}`, { method: 'DELETE' });
  } catch (error) {
    addEvent({ type: 'consumer_error', message: error.message, timestamp: new Date().toISOString() });
    button.disabled = false;
  }
});

document.querySelector('#clear-log').addEventListener('click', () => {
  events.length = 0;
  renderEvents();
});

async function loadState() {
  try {
    renderState(await api.request('/demo/state'));
  } catch (error) {
    grid.innerHTML = `<div class="empty-state">Não foi possível consultar o Kafka: ${escapeHtml(error.message)}</div>`;
  }
}

const stream = new EventSource('/demo/events');
stream.onopen = () => setConnection(true);
stream.onerror = () => setConnection(false);
stream.onmessage = (message) => {
  try { addEvent(JSON.parse(message.data)); } catch { /* ignora mensagens malformadas */ }
};
loadState();
