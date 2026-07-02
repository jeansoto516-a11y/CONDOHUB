const app = document.querySelector('#app');

const state = {
    user: null,
    view: 'dashboard',
    data: {},
};

const moduleCopy = {
    condos: {
        title: 'Condominios',
        description: 'Tenha uma visao clara dos empreendimentos, unidades, cidades e status de operacao.',
        button: 'Novo condominio',
        icon: 'CO',
    },
    residents: {
        title: 'Moradores',
        description: 'Centralize contatos, unidades e perfis para atendimento mais rapido e humano.',
        button: 'Novo morador',
        icon: 'MO',
    },
    tickets: {
        title: 'Chamados',
        description: 'Acompanhe solicitacoes com prioridade, contexto e ritmo de resolucao.',
        button: 'Novo chamado',
        icon: 'CH',
    },
    notices: {
        title: 'Avisos',
        description: 'Publique comunicados com clareza e mantenha todos alinhados sobre a rotina.',
        button: 'Novo aviso',
        icon: 'AV',
    },
    packages: {
        title: 'Encomendas',
        description: 'Controle recebimentos, retiradas e rastreios sem depender de planilhas soltas.',
        button: 'Nova encomenda',
        icon: 'EN',
    },
    reservations: {
        title: 'Reservas',
        description: 'Organize espacos comuns, horarios e aprovacoes com previsibilidade.',
        button: 'Nova reserva',
        icon: 'RE',
    },
};

const modules = {
    condos: {
        ...moduleCopy.condos,
        endpoint: '/api/condos',
        columns: ['name', 'city', 'address', 'units_count', 'status'],
        labels: { name: 'Nome', city: 'Cidade', address: 'Endereco', units_count: 'Unidades', status: 'Status' },
        fields: [
            ['name', 'Nome'],
            ['address', 'Endereco'],
            ['city', 'Cidade'],
            ['units_count', 'Unidades', 'number'],
            ['status', 'Status', 'select', ['active', 'inactive']],
        ],
    },
    residents: {
        ...moduleCopy.residents,
        endpoint: '/api/residents',
        columns: ['name', 'unit', 'phone', 'email', 'type', 'status'],
        labels: { name: 'Nome', unit: 'Unidade', phone: 'Telefone', email: 'Email', type: 'Tipo', status: 'Status' },
        fields: [
            ['condo_id', 'Condominio', 'condo'],
            ['name', 'Nome'],
            ['unit', 'Unidade'],
            ['email', 'Email', 'email'],
            ['phone', 'Telefone'],
            ['type', 'Tipo', 'select', ['morador', 'proprietario', 'inquilino']],
            ['status', 'Status', 'select', ['active', 'inactive']],
        ],
    },
    tickets: {
        ...moduleCopy.tickets,
        endpoint: '/api/tickets',
        columns: ['title', 'category', 'priority', 'status', 'created_at'],
        labels: { title: 'Titulo', category: 'Categoria', priority: 'Prioridade', status: 'Status', created_at: 'Criado em' },
        fields: [
            ['condo_id', 'Condominio', 'condo'],
            ['resident_id', 'Morador', 'resident'],
            ['title', 'Titulo'],
            ['category', 'Categoria', 'select', ['manutencao', 'seguranca', 'financeiro', 'barulho', 'outros']],
            ['priority', 'Prioridade', 'select', ['baixa', 'media', 'alta']],
            ['status', 'Status', 'select', ['aberto', 'em_andamento', 'resolvido']],
            ['description', 'Descricao', 'textarea'],
        ],
    },
    notices: {
        ...moduleCopy.notices,
        endpoint: '/api/notices',
        columns: ['title', 'body', 'publish_at'],
        labels: { title: 'Titulo', body: 'Mensagem', publish_at: 'Publicacao' },
        fields: [
            ['condo_id', 'Condominio', 'condo'],
            ['title', 'Titulo'],
            ['body', 'Mensagem', 'textarea'],
            ['publish_at', 'Publicar em', 'datetime-local'],
        ],
    },
    packages: {
        ...moduleCopy.packages,
        endpoint: '/api/packages',
        columns: ['recipient', 'unit', 'carrier', 'tracking_code', 'status'],
        labels: { recipient: 'Destinatario', unit: 'Unidade', carrier: 'Transportadora', tracking_code: 'Codigo', status: 'Status' },
        fields: [
            ['condo_id', 'Condominio', 'condo'],
            ['resident_id', 'Morador', 'resident'],
            ['recipient', 'Destinatario'],
            ['unit', 'Unidade'],
            ['carrier', 'Transportadora'],
            ['tracking_code', 'Codigo'],
            ['status', 'Status', 'select', ['recebida', 'retirada']],
        ],
    },
    reservations: {
        ...moduleCopy.reservations,
        endpoint: '/api/reservations',
        columns: ['space', 'starts_at', 'ends_at', 'status', 'notes'],
        labels: { space: 'Espaco', starts_at: 'Inicio', ends_at: 'Fim', status: 'Status', notes: 'Observacoes' },
        fields: [
            ['condo_id', 'Condominio', 'condo'],
            ['resident_id', 'Morador', 'resident'],
            ['space', 'Espaco', 'select', ['Salao de festas', 'Churrasqueira', 'Quadra', 'Coworking']],
            ['starts_at', 'Inicio', 'datetime-local'],
            ['ends_at', 'Fim', 'datetime-local'],
            ['status', 'Status', 'select', ['pendente', 'aprovada', 'recusada']],
            ['notes', 'Observacoes', 'textarea'],
        ],
    },
};

async function api(path, options = {}) {
    const response = await fetch(path, {
        headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
        credentials: 'same-origin',
        ...options,
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error(data.message || 'Erro na requisicao.');
    }

    return data;
}

function esc(value) {
    return String(value ?? '').replace(/[&<>"']/g, (char) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;',
    }[char]));
}

function formatDate(value) {
    if (!value) return '-';
    const date = new Date(String(value).replace(' ', 'T'));
    return Number.isNaN(date.getTime()) ? value : date.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

function labelize(value) {
    return esc(String(value || '-').replaceAll('_', ' '));
}

function badge(value) {
    const warn = ['pendente', 'em_andamento', 'recebida', 'media'].includes(value);
    const danger = ['alta', 'aberto', 'recusada'].includes(value);
    return `<span class="badge ${warn ? 'warn' : ''} ${danger ? 'danger' : ''}">${labelize(value)}</span>`;
}

function renderLogin() {
    app.innerHTML = `
        <section class="login">
            <div class="login-visual">
                <div class="login-copy">
                    <p class="eyebrow">Operacao condominial em um so lugar</p>
                    <h1>CondoHub</h1>
                    <p>Um painel feito para sindicos e administradoras que precisam enxergar moradores, chamados, reservas, comunicados e encomendas sem perder o senso de cuidado com cada condominio.</p>
                    <div class="login-points">
                        <span>Rotina organizada</span>
                        <span>Atendimento mais claro</span>
                        <span>Dados prontos para agir</span>
                    </div>
                </div>
            </div>
            <form class="login-card" id="loginForm">
                <p class="eyebrow">Acesso seguro</p>
                <h2>Entrar no painel</h2>
                <p class="intro">Acesse o hub para acompanhar a operacao do condominio com uma interface leve, bonita e direta ao ponto.</p>
                <div class="field">
                    <label>Email</label>
                    <input name="email" type="email" value="admin@condohub.com" autocomplete="email" required>
                </div>
                <div class="field">
                    <label>Senha</label>
                    <input name="password" type="password" value="123456" autocomplete="current-password" required>
                </div>
                <p class="error" id="loginError"></p>
                <button type="submit">Acessar painel</button>
                <div class="access-hint">
                    <strong>Acesso inicial</strong>
                    <span>admin@condohub.com / 123456</span>
                </div>
            </form>
        </section>
    `;

    document.querySelector('#loginForm').addEventListener('submit', async (event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        const error = document.querySelector('#loginError');
        error.textContent = '';

        try {
            const result = await api('/api/login', {
                method: 'POST',
                body: JSON.stringify(Object.fromEntries(form)),
            });
            state.user = result.user;
            state.view = 'dashboard';
            await loadApp();
        } catch (exception) {
            error.textContent = exception.message;
        }
    });
}

function shell(content) {
    const navItems = [
        ['dashboard', 'Dashboard', 'DB'],
        ...Object.entries(moduleCopy).map(([key, item]) => [key, item.title, item.icon]),
    ];

    app.innerHTML = `
        <div class="app-shell">
            <aside class="sidebar">
                <div class="brand"><span class="brand-mark">CH</span> CondoHub</div>
                <nav class="nav">
                    ${navItems.map(([key, label, icon]) => `
                        <button class="${state.view === key ? 'active' : ''}" data-view="${key}">
                            <span class="nav-icon">${icon}</span>${label}
                        </button>
                    `).join('')}
                    <button class="danger" id="logoutBtn">Sair</button>
                </nav>
            </aside>
            <section class="content">${content}</section>
        </div>
        <div class="modal" id="modal"></div>
    `;

    document.querySelectorAll('[data-view]').forEach((button) => {
        button.addEventListener('click', async () => {
            state.view = button.dataset.view;
            await loadApp();
        });
    });

    document.querySelector('#logoutBtn').addEventListener('click', async () => {
        await api('/api/logout', { method: 'POST', body: '{}' });
        state.user = null;
        renderLogin();
    });
}

function topbar(title, description, action = '') {
    return `
        <div class="topbar">
            <div>
                <p class="eyebrow">CondoHub</p>
                <h1>${esc(title)}</h1>
                <p>${esc(description)}</p>
            </div>
            ${action}
        </div>
    `;
}

function renderSpotlight(data) {
    const activeWork = data.open_tickets + data.pending_packages + data.pending_reservations;
    return `
        <section class="spotlight">
            <div>
                <strong>Hoje o painel tem ${activeWork} item(ns) pedindo atencao.</strong>
                <span>Use os modulos para reduzir pendencias, manter comunicados atualizados e deixar a administracao com cara de concierge.</span>
            </div>
            <div class="spotlight-pill">${data.residents} moradores conectados</div>
        </section>
    `;
}

async function renderDashboard() {
    const data = await api('/api/dashboard');
    const stats = [
        ['Condominios', data.condos, 'Carteira ativa'],
        ['Moradores', data.residents, 'Base de contato'],
        ['Chamados abertos', data.open_tickets, 'Prioridade operacional'],
        ['Encomendas pendentes', data.pending_packages, 'Portaria'],
        ['Reservas pendentes', data.pending_reservations, 'Areas comuns'],
    ];

    shell(`
        ${topbar('Painel de bordo', `Bem-vindo, ${state.user?.name || 'admin'}. Tudo que merece atencao aparece aqui primeiro.`)}
        ${renderSpotlight(data)}
        <div class="grid stats">
            ${stats.map(([label, value, context]) => `
                <div class="stat">
                    <small>${esc(context)}</small>
                    <strong>${value}</strong>
                    <span>${esc(label)}</span>
                </div>
            `).join('')}
        </div>
        <div class="grid two-col">
            <section class="panel">
                <div class="section-head">
                    <div>
                        <h2>Chamados recentes</h2>
                        <p>O que precisa de acompanhamento.</p>
                    </div>
                </div>
                <div class="list">
                    ${data.latest_tickets.map((ticket) => `
                        <div class="list-item">
                            <strong>${esc(ticket.title)}</strong>
                            <span>${esc(ticket.condo_name)} - ${badge(ticket.status)}</span>
                        </div>
                    `).join('') || '<p class="hint">Nenhum chamado cadastrado.</p>'}
                </div>
            </section>
            <section class="panel">
                <div class="section-head">
                    <div>
                        <h2>Avisos recentes</h2>
                        <p>Comunicados publicados para a comunidade.</p>
                    </div>
                </div>
                <div class="list">
                    ${data.latest_notices.map((notice) => `
                        <div class="list-item">
                            <strong>${esc(notice.title)}</strong>
                            <span>${esc(notice.condo_name)} - ${formatDate(notice.publish_at)}</span>
                        </div>
                    `).join('') || '<p class="hint">Nenhum aviso publicado.</p>'}
                </div>
            </section>
        </div>
    `);
}

async function loadReferenceData() {
    state.data.condos = state.data.condos || await api('/api/condos');
    state.data.residents = state.data.residents || await api('/api/residents');
}

function moduleSummary(key, rows) {
    const total = rows.length;
    const active = rows.filter((row) => ['active', 'aberto', 'em_andamento', 'recebida', 'pendente'].includes(row.status)).length;
    const newest = rows[0]?.created_at ? formatDate(rows[0].created_at) : 'Sem registros';

    return `
        <div class="module-summary">
            <div class="summary-card"><strong>${total}</strong><span>Registros no modulo</span></div>
            <div class="summary-card"><strong>${active}</strong><span>Itens ativos ou pendentes</span></div>
            <div class="summary-card"><strong>${esc(newest)}</strong><span>Ultima movimentacao</span></div>
        </div>
    `;
}

async function renderModule(key) {
    const module = modules[key];
    state.data[key] = await api(module.endpoint);
    await loadReferenceData();

    shell(`
        ${topbar(module.title, module.description, `<button id="newItem">${module.button}</button>`)}
        ${moduleSummary(key, state.data[key])}
        <div class="table-wrap">
            <table>
                <thead>
                    <tr>${module.columns.map((column) => `<th>${esc(module.labels[column] || column)}</th>`).join('')}</tr>
                </thead>
                <tbody>
                    ${state.data[key].map((row) => `
                        <tr>${module.columns.map((column) => `<td>${renderCell(column, row[column])}</td>`).join('')}</tr>
                    `).join('') || `<tr><td colspan="${module.columns.length}">Nenhum registro encontrado.</td></tr>`}
                </tbody>
            </table>
        </div>
    `);

    document.querySelector('#newItem').addEventListener('click', () => openForm(key));
}

function renderCell(column, value) {
    if (column === 'status' || column === 'priority') return badge(value);
    if (column.endsWith('_at') || ['starts_at', 'ends_at'].includes(column)) return esc(formatDate(value));
    return esc(value || '-');
}

function fieldHtml([name, label, type = 'text', options = []]) {
    const wide = type === 'textarea' ? 'wide' : '';
    const common = `name="${name}" ${['condo_id', 'name', 'unit', 'title', 'body', 'recipient', 'space', 'starts_at', 'ends_at'].includes(name) ? 'required' : ''}`;

    if (type === 'textarea') {
        return `<div class="field ${wide}"><label>${label}</label><textarea ${common}></textarea></div>`;
    }

    if (type === 'select') {
        return `<div class="field"><label>${label}</label><select ${common}>${options.map((option) => `<option value="${option}">${labelize(option)}</option>`).join('')}</select></div>`;
    }

    if (type === 'condo') {
        return `<div class="field"><label>${label}</label><select ${common}>${state.data.condos.map((condo) => `<option value="${condo.id}">${esc(condo.name)}</option>`).join('')}</select></div>`;
    }

    if (type === 'resident') {
        return `<div class="field"><label>${label}</label><select name="${name}"><option value="">Nao vincular</option>${state.data.residents.map((resident) => `<option value="${resident.id}">${esc(resident.name)} - ${esc(resident.unit)}</option>`).join('')}</select></div>`;
    }

    return `<div class="field"><label>${label}</label><input ${common} type="${type}"></div>`;
}

function openForm(key) {
    const module = modules[key];
    const modal = document.querySelector('#modal');
    modal.classList.add('open');
    modal.innerHTML = `
        <form class="modal-body" id="itemForm">
            <h2>${module.button}</h2>
            <p class="hint">Preencha os dados essenciais. Depois o registro aparece instantaneamente na tabela.</p>
            <div class="form-grid">${module.fields.map(fieldHtml).join('')}</div>
            <p class="error" id="formError"></p>
            <div class="actions">
                <button type="button" class="secondary" id="closeModal">Cancelar</button>
                <button type="submit">Salvar</button>
            </div>
        </form>
    `;

    document.querySelector('#closeModal').addEventListener('click', closeModal);
    document.querySelector('#itemForm').addEventListener('submit', async (event) => {
        event.preventDefault();
        const formData = Object.fromEntries(new FormData(event.currentTarget));
        Object.keys(formData).forEach((field) => {
            if (formData[field] === '') delete formData[field];
        });

        try {
            await api(module.endpoint, { method: 'POST', body: JSON.stringify(formData) });
            state.data = {};
            closeModal();
            await renderModule(key);
        } catch (exception) {
            document.querySelector('#formError').textContent = exception.message;
        }
    });
}

function closeModal() {
    const modal = document.querySelector('#modal');
    modal.classList.remove('open');
    modal.innerHTML = '';
}

async function loadApp() {
    try {
        if (state.view === 'dashboard') {
            await renderDashboard();
            return;
        }

        await renderModule(state.view);
    } catch (exception) {
        if (exception.message.includes('autenticado')) {
            state.user = null;
            renderLogin();
            return;
        }

        app.innerHTML = `<main class="content"><p class="error">${esc(exception.message)}</p></main>`;
    }
}

async function bootstrap() {
    try {
        const result = await api('/api/me');
        state.user = result.user;
    } catch {
        state.user = null;
    }

    if (!state.user) {
        renderLogin();
        return;
    }

    await loadApp();
}

bootstrap();
