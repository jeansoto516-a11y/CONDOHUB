const app = document.querySelector('#app');

const state = {
    user: null,
    view: 'dashboard',
    data: {},
};

const modules = {
    condos: {
        title: 'Condominios',
        endpoint: '/api/condos',
        button: 'Novo condominio',
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
        title: 'Moradores',
        endpoint: '/api/residents',
        button: 'Novo morador',
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
        title: 'Chamados',
        endpoint: '/api/tickets',
        button: 'Novo chamado',
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
        title: 'Avisos',
        endpoint: '/api/notices',
        button: 'Novo aviso',
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
        title: 'Encomendas',
        endpoint: '/api/packages',
        button: 'Nova encomenda',
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
        title: 'Reservas',
        endpoint: '/api/reservations',
        button: 'Nova reserva',
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

function badge(value) {
    const text = esc(value || '-');
    const warn = ['pendente', 'em_andamento', 'recebida', 'media'].includes(value);
    const danger = ['alta', 'aberto', 'recusada'].includes(value);
    return `<span class="badge ${warn ? 'warn' : ''} ${danger ? 'danger' : ''}">${text}</span>`;
}

function renderLogin() {
    app.innerHTML = `
        <section class="login">
            <div class="login-hero">
                <h1>CondoHub</h1>
                <p>Gestao completa para condominios: moradores, chamados, reservas, avisos e encomendas em um painel unico.</p>
            </div>
            <form class="login-card" id="loginForm">
                <h2>Entrar</h2>
                <p class="hint">Acesso inicial: admin@condohub.com / 123456</p>
                <div class="field">
                    <label>Email</label>
                    <input name="email" type="email" value="admin@condohub.com" required>
                </div>
                <div class="field">
                    <label>Senha</label>
                    <input name="password" type="password" value="123456" required>
                </div>
                <p class="error" id="loginError"></p>
                <button type="submit">Acessar painel</button>
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
        ['dashboard', 'Dashboard'],
        ['condos', 'Condominios'],
        ['residents', 'Moradores'],
        ['tickets', 'Chamados'],
        ['notices', 'Avisos'],
        ['packages', 'Encomendas'],
        ['reservations', 'Reservas'],
    ];

    app.innerHTML = `
        <div class="app-shell">
            <aside class="sidebar">
                <div class="brand"><span class="brand-mark">C</span> CondoHub</div>
                <nav class="nav">
                    ${navItems.map(([key, label]) => `<button class="${state.view === key ? 'active' : ''}" data-view="${key}">${label}</button>`).join('')}
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
                <h1>${esc(title)}</h1>
                <p>${esc(description)}</p>
            </div>
            ${action}
        </div>
    `;
}

async function renderDashboard() {
    const data = await api('/api/dashboard');
    const stats = [
        ['Condominios', data.condos],
        ['Moradores', data.residents],
        ['Chamados abertos', data.open_tickets],
        ['Encomendas pendentes', data.pending_packages],
        ['Reservas pendentes', data.pending_reservations],
    ];

    shell(`
        ${topbar('Dashboard', `Bem-vindo, ${state.user?.name || 'admin'}. Acompanhe a operacao do condominio em tempo real.`)}
        <div class="grid stats">
            ${stats.map(([label, value]) => `<div class="stat"><strong>${value}</strong><span>${label}</span></div>`).join('')}
        </div>
        <div class="grid two-col">
            <section class="panel">
                <h3>Chamados recentes</h3>
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
                <h3>Avisos recentes</h3>
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

async function renderModule(key) {
    const module = modules[key];
    state.data[key] = await api(module.endpoint);
    await loadReferenceData();

    shell(`
        ${topbar(module.title, 'Cadastre, acompanhe e mantenha as informacoes operacionais sempre atualizadas.', `<button id="newItem">${module.button}</button>`)}
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
        return `<div class="field"><label>${label}</label><select ${common}>${options.map((option) => `<option value="${option}">${option}</option>`).join('')}</select></div>`;
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
