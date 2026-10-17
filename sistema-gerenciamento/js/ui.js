import {
    buscarCliente,
    listarClientes,
    listarPedidos,
    normalizarStatusEtapa
} from './state.js';
import { obterLocale, traduzir } from './i18n.js';
import {
    gerarMensagemContato,
    gerarMensagemEtapa,
    gerarMensagemPedido,
    gerarUrlWhatsApp
} from './whatsapp.js';

const formularioPedido = document.getElementById('order-form');
const modalPedido = document.getElementById('order-modal');
const modalTimeline = document.getElementById('timeline-modal');
const modeloEtapa = document.getElementById('step-template');
const listaCamposEtapas = document.getElementById('order-steps');
let pedidoTimelineAtualId = '';
let filtroPedidosAtual = 'all';
let filtroAgendaAtual = 'today';
let graficoReceita = null;
let navigationInitialized = false;

export function initNavigation() {
    if (navigationInitialized) return;
    navigationInitialized = true;
    const links = document.querySelectorAll('.nav-link[data-target]');
    const views = document.querySelectorAll('.page-view');

    const atualizarNavegacao = () => {
        const destino = document.getElementById(window.location.hash.slice(1));
        const view = destino?.classList.contains('page-view')
            ? destino
            : document.getElementById('view-painel');
        links.forEach(item => {
            const ativo = item.dataset.target === view.id;
            item.classList.toggle('is-active', ativo);
            if (ativo) item.setAttribute('aria-current', 'page');
            else item.removeAttribute('aria-current');
        });
        views.forEach(item => item.classList.toggle('active', item === view));
    };

    window.addEventListener('hashchange', atualizarNavegacao);
    atualizarNavegacao();
}

function criarElemento(tag, classe = '', texto = '') {
    const elemento = document.createElement(tag);
    if (classe) elemento.className = classe;
    if (texto !== undefined) elemento.textContent = texto;
    return elemento;
}

function formatarMoeda(valor) {
    return Number(valor || 0).toLocaleString(obterLocale(), {
        style: 'currency', currency: 'BRL', currencyDisplay: 'narrowSymbol'
    });
}

function formatarDataHora(valor) {
    if (!valor) return traduzir('table.noSteps');
    const data = new Date(valor);
    if (Number.isNaN(data.getTime())) return traduzir('table.noSteps');
    return data.toLocaleString(obterLocale(), {
        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
}

function obterClasseStatus(status) {
    return `badge-${status.toLowerCase().replaceAll(' ', '-')}`;
}

function obterRotuloStatus(status) {
    const chavesStatus = {
        Scheduled: 'status.scheduled',
        Pending: 'status.pending',
        'In Progress': 'status.inProgress',
        'Awaiting Approval': 'status.awaitingApproval',
        Completed: 'status.completed',
        Cancelled: 'status.cancelled'
    };
    return traduzir(chavesStatus[status] || 'status.pending');
}

function obterProximaEtapa(pedido) {
    return [...(pedido.steps || [])]
        .filter(etapa => etapa.status !== 'Completed')
        .sort((primeira, segunda) => primeira.dateTime.localeCompare(segunda.dateTime))[0];
}

function criarLinkWhatsApp(telefone, mensagem, compacto = false) {
    const url = gerarUrlWhatsApp(telefone, mensagem);
    if (!url) return null;
    const link = criarElemento('a', `whatsapp-link${compacto ? ' whatsapp-compact' : ''}`, compacto ? '↗' : traduzir('actions.whatsappShort'));
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.title = traduzir('actions.whatsapp');
    link.setAttribute('aria-label', traduzir('actions.whatsapp'));
    return link;
}

function renderizarMetricas(pedidos) {
    document.getElementById('metric-orders').textContent = pedidos.length;
    document.getElementById('metric-completed').textContent = pedidos.filter(pedido => pedido.status === 'Completed').length;
    const receita = pedidos
        .filter(pedido => pedido.status !== 'Cancelled')
        .reduce((total, pedido) => total + Number(pedido.value || 0), 0);
    document.getElementById('metric-revenue').textContent = formatarMoeda(receita);
    const etapasPendentes = pedidos
        .filter(pedido => pedido.status !== 'Cancelled')
        .reduce((total, pedido) => total + (pedido.steps || []).filter(etapa => etapa.status !== 'Completed').length, 0);
    document.getElementById('metric-pending').textContent = etapasPendentes;
}

function renderizarTabelaPedidos(pedidos) {
    const corpoTabela = document.getElementById('orders-table-body');
    const busca = document.getElementById('table-search').value.trim().toLocaleLowerCase(obterLocale());
    const pedidosFiltrados = pedidos.filter(pedido => {
        const cliente = buscarCliente(pedido.clientId);
        const textoBusca = `${cliente?.name || ''} ${pedido.description}`.toLocaleLowerCase(obterLocale());
        const correspondeStatus = filtroPedidosAtual === 'all' ||
            (filtroPedidosAtual === 'active' && ['Scheduled', 'Pending', 'In Progress'].includes(pedido.status)) ||
            (filtroPedidosAtual === 'approval' && pedido.status === 'Awaiting Approval') ||
            (filtroPedidosAtual === 'completed' && pedido.status === 'Completed');
        return correspondeStatus && textoBusca.includes(busca);
    }).sort((primeiro, segundo) => (obterProximaEtapa(primeiro)?.dateTime || '9999').localeCompare(obterProximaEtapa(segundo)?.dateTime || '9999'));

    corpoTabela.replaceChildren();
    if (!pedidosFiltrados.length) {
        const linha = document.createElement('tr');
        const mensagem = pedidos.length ? traduzir('empty.matches') : traduzir('empty.orders');
        const celula = criarElemento('td', 'empty-cell', mensagem);
        celula.colSpan = 6;
        linha.append(celula);
        corpoTabela.append(linha);
    }

    pedidosFiltrados.forEach(pedido => {
        const cliente = buscarCliente(pedido.clientId) || { name: traduzir('clients.unknown'), phone: '', email: '' };
        const linha = document.createElement('tr');
        const celulaCliente = document.createElement('td');
        const identidade = criarElemento('div', 'client-identity');
        const iniciais = cliente.name.split(/\s+/).slice(0, 2).map(parte => parte[0] || '').join('').toUpperCase();
        identidade.append(criarElemento('span', 'avatar table-avatar', iniciais), criarElemento('span', 'client-lines'));
        const detalhesCliente = identidade.lastElementChild;
        detalhesCliente.append(criarElemento('strong', '', cliente.name));
        const linhaContato = criarElemento('span', 'client-contact-row');
        linhaContato.append(criarElemento('small', '', cliente.phone || cliente.email || traduzir('clients.noContact')));
        if (cliente.phone) {
            const linkWhatsApp = criarLinkWhatsApp(cliente.phone, gerarMensagemPedido(pedido, cliente), true);
            if (linkWhatsApp) linhaContato.append(linkWhatsApp);
        }
        detalhesCliente.append(linhaContato);
        if (cliente.phone && cliente.email) detalhesCliente.append(criarElemento('small', 'client-email', cliente.email));
        celulaCliente.append(identidade);

        const celulaServico = criarElemento('td', 'service-cell', pedido.description);
        const celulaValor = criarElemento('td', 'value-cell', formatarMoeda(pedido.value));
        const celulaProximaEtapa = criarElemento('td', 'next-step-cell');
        const proximaEtapa = obterProximaEtapa(pedido);
        if (proximaEtapa) {
            celulaProximaEtapa.append(criarElemento('strong', '', proximaEtapa.name), criarElemento('small', '', formatarDataHora(proximaEtapa.dateTime)));
        } else {
            celulaProximaEtapa.textContent = pedido.steps?.length ? traduzir('table.allStepsComplete') : traduzir('table.noSteps');
        }
        const celulaStatus = document.createElement('td');
        celulaStatus.append(criarElemento('span', `status-badge ${obterClasseStatus(pedido.status)}`, obterRotuloStatus(pedido.status)));

        const celulaAcoes = criarElemento('td', 'actions-cell');
        const botaoTimeline = criarElemento('button', 'text-action', traduzir('actions.timeline'));
        botaoTimeline.type = 'button';
        botaoTimeline.dataset.timelineId = pedido.id;
        botaoTimeline.setAttribute('aria-label', traduzir('actions.timelineFor', { service: pedido.description }));
        const botaoEditar = criarElemento('button', 'row-icon-button', '✎');
        botaoEditar.type = 'button';
        botaoEditar.dataset.editId = pedido.id;
        botaoEditar.title = traduzir('actions.edit');
        botaoEditar.setAttribute('aria-label', traduzir('actions.editFor', { service: pedido.description }));
        const botaoExcluir = criarElemento('button', 'row-icon-button delete-action', '×');
        botaoExcluir.type = 'button';
        botaoExcluir.dataset.deleteId = pedido.id;
        botaoExcluir.title = traduzir('actions.delete');
        botaoExcluir.setAttribute('aria-label', traduzir('actions.deleteFor', { service: pedido.description }));
        celulaAcoes.append(botaoTimeline, botaoEditar, botaoExcluir);
        linha.append(celulaCliente, celulaServico, celulaValor, celulaProximaEtapa, celulaStatus, celulaAcoes);
        corpoTabela.append(linha);
    });

    const total = pedidosFiltrados.length;
    document.getElementById('orders-count').textContent = traduzir(total === 1 ? 'orders.countOne' : 'orders.countMany', { count: total });
    document.querySelectorAll('[data-order-filter]').forEach(botao => {
        botao.classList.toggle('is-active', botao.dataset.orderFilter === filtroPedidosAtual);
        botao.setAttribute('aria-pressed', String(botao.dataset.orderFilter === filtroPedidosAtual));
    });
}

function obterEtapas(pedidos) {
    return pedidos.filter(pedido => pedido.status !== 'Cancelled').flatMap(pedido =>
        (pedido.steps || []).map(etapa => ({
            ...etapa,
            pedidoId: pedido.id,
            servico: pedido.description,
            cliente: buscarCliente(pedido.clientId)?.name || traduzir('clients.unknown')
        }))
    ).sort((primeira, segunda) => (primeira.dateTime || '').localeCompare(segunda.dateTime || ''));
}

function etapaDentroDoFiltro(etapa, filtro) {
    if (!etapa.dateTime) return false;
    const data = new Date(etapa.dateTime);
    if (Number.isNaN(data.getTime())) return false;
    const agora = new Date();
    const inicioHoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
    const amanha = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate() + 1);
    if (filtro === 'overdue') return etapa.status !== 'Completed' && data < agora;
    if (filtro === 'week') {
        const fim = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate() + 7);
        return data >= inicioHoje && data < fim;
    }
    return data >= inicioHoje && data < amanha;
}

function criarItemPrazo(etapa) {
    const item = criarElemento('button', 'upcoming-item');
    item.type = 'button';
    item.dataset.timelineId = etapa.pedidoId;
    const data = new Date(etapa.dateTime);
    const blocoData = criarElemento('span', 'date-block');
    blocoData.append(
        criarElemento('strong', '', data.toLocaleDateString(obterLocale(), { day: '2-digit' })),
        criarElemento('small', '', data.toLocaleDateString(obterLocale(), { month: 'short' }))
    );
    const detalhes = criarElemento('span', 'upcoming-details');
    detalhes.append(criarElemento('strong', '', etapa.name), criarElemento('small', '', `${etapa.servico} · ${etapa.cliente}`));
    item.append(blocoData, detalhes, criarElemento('span', 'upcoming-time', data.toLocaleTimeString(obterLocale(), { hour: '2-digit', minute: '2-digit' })));
    return item;
}

function renderizarAgenda(pedidos) {
    const etapas = obterEtapas(pedidos);
    const agenda = document.getElementById('agenda-timeline');
    const filtradas = etapas.filter(etapa => etapaDentroDoFiltro(etapa, filtroAgendaAtual));
    agenda.replaceChildren();
    if (!filtradas.length) {
        agenda.append(criarElemento('p', 'empty-state', traduzir('agenda.empty')));
    } else {
        const porPedido = new Map();
        filtradas.forEach(etapa => {
            if (!porPedido.has(etapa.pedidoId)) porPedido.set(etapa.pedidoId, []);
            porPedido.get(etapa.pedidoId).push(etapa);
        });

        porPedido.forEach((etapasVisiveis, pedidoId) => {
            const pedido = pedidos.find(item => item.id === pedidoId);
            if (!pedido) return;
            const todasEtapas = pedido.steps || [];
            const concluidas = todasEtapas.filter(etapa => etapa.status === 'Completed').length;
            const grupo = criarElemento('article', 'agenda-order');
            const cabecalho = criarElemento('div', 'agenda-order-heading');
            cabecalho.append(criarElemento('strong', '', pedido.description));
            const cliente = buscarCliente(pedido.clientId);
            cabecalho.append(criarElemento('small', '', cliente?.name || traduzir('clients.unknown')));
            const progresso = criarElemento('div', 'agenda-progress');
            const barra = criarElemento('span', 'agenda-progress-bar');
            const percentual = todasEtapas.length ? Math.round(concluidas / todasEtapas.length * 100) : 0;
            barra.style.width = `${percentual}%`;
            progresso.setAttribute('role', 'progressbar');
            progresso.setAttribute('aria-valuemin', '0');
            progresso.setAttribute('aria-valuemax', '100');
            progresso.setAttribute('aria-valuenow', String(percentual));
            progresso.setAttribute('aria-label', traduzir('agenda.progress', { completed: concluidas, total: todasEtapas.length }));
            progresso.append(barra);
            const resumo = criarElemento('small', 'agenda-progress-label', traduzir('agenda.progress', { completed: concluidas, total: todasEtapas.length }));
            const lista = criarElemento('ol', 'agenda-steps');
            etapasVisiveis.forEach(etapa => {
                const linha = criarElemento('li', `agenda-step${etapa.status === 'Completed' ? ' is-complete' : ''}`);
                const rotulo = criarElemento('label', 'agenda-step-label');
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.checked = etapa.status === 'Completed';
                checkbox.dataset.agendaStep = 'true';
                checkbox.dataset.orderId = pedidoId;
                checkbox.dataset.stepId = etapa.id;
                checkbox.setAttribute('aria-label', etapa.name);
                const detalhe = criarElemento('span', 'agenda-step-copy');
                detalhe.append(criarElemento('strong', '', etapa.name), criarElemento('small', '', formatarDataHora(etapa.dateTime)));
                rotulo.append(checkbox, detalhe);
                linha.append(rotulo, criarElemento('span', `status-badge ${obterClasseStatus(etapa.status)}`, obterRotuloStatus(etapa.status)));
                lista.append(linha);
            });
            grupo.append(cabecalho, progresso, resumo, lista);
            agenda.append(grupo);
        });
    }
    document.querySelectorAll('[data-agenda-filter]').forEach(botao => {
        botao.classList.toggle('is-active', botao.dataset.agendaFilter === filtroAgendaAtual);
        botao.setAttribute('aria-pressed', String(botao.dataset.agendaFilter === filtroAgendaAtual));
    });
}

function obterUltimaSolicitacao(pedidosDoCliente) {
    const datas = pedidosDoCliente.map(pedido => {
        const ultimaEtapa = (pedido.steps || []).map(etapa => etapa.dateTime)
            .filter(Boolean).sort();
        return new Date(pedido.createdAt || ultimaEtapa[ultimaEtapa.length - 1] || '');
    }).filter(data => !Number.isNaN(data.getTime()));
    return datas.sort((primeira, segunda) => segunda - primeira)[0] || null;
}

function renderizarClientes(pedidos) {
    const grade = document.getElementById('client-cards-grid');
    const clientes = listarClientes().sort((primeiro, segundo) => primeiro.name.localeCompare(segundo.name, obterLocale()));
    grade.replaceChildren();
    document.getElementById('clients-count').textContent = traduzir(clientes.length === 1 ? 'clients.countOne' : 'clients.countMany', { count: clientes.length });
    if (!clientes.length) {
        grade.append(criarElemento('p', 'empty-state', traduzir('clients.empty')));
        return;
    }
    clientes.forEach(cliente => {
        const pedidosCliente = pedidos.filter(pedido => pedido.clientId === cliente.id);
        const gasto = pedidosCliente.filter(pedido => pedido.status !== 'Cancelled')
            .reduce((total, pedido) => total + Number(pedido.value || 0), 0);
        const concluidos = pedidosCliente.filter(pedido => pedido.status === 'Completed').length;
        const ultimaSolicitacao = obterUltimaSolicitacao(pedidosCliente);
        const cartao = criarElemento('article', 'client-card');
        const topo = criarElemento('div', 'client-card-top');
        const iniciais = cliente.name.split(/\s+/).slice(0, 2).map(parte => parte[0] || '').join('').toUpperCase();
        topo.append(criarElemento('span', 'avatar client-avatar', iniciais), criarElemento('h3', '', cliente.name));
        const historico = criarElemento('button', 'client-history-trigger', traduzir('clients.historyTitle'));
        historico.type = 'button';
        historico.dataset.clientHistory = cliente.id;
        const lista = criarElemento('dl', 'client-card-stats');
        [
            [traduzir('clients.totalSpent'), formatarMoeda(gasto)],
            [traduzir('clients.completedServices'), String(concluidos)],
            [traduzir('clients.lastRequest'), ultimaSolicitacao ? ultimaSolicitacao.toLocaleDateString(obterLocale()) : '—']
        ].forEach(([titulo, valor]) => {
            lista.append(criarElemento('dt', '', titulo), criarElemento('dd', '', valor));
        });
        const acoes = criarElemento('div', 'client-card-actions');
        const contato = criarElemento('small', 'client-card-contact', cliente.phone || cliente.email || traduzir('clients.noContact'));
        acoes.append(contato);
        if (cliente.phone) {
            const whatsapp = criarLinkWhatsApp(cliente.phone, gerarMensagemContato(cliente));
            if (whatsapp) acoes.append(whatsapp);
        }
        cartao.append(topo, lista, acoes, historico);
        grade.append(cartao);
    });
}

function renderizarResumoAtividade(pedidos) {
    const recentes = document.getElementById('recent-orders-list');
    const prazos = document.getElementById('deadlines-preview');
    recentes.replaceChildren();
    prazos.replaceChildren();
    const pedidosRecentes = [...pedidos].sort((primeiro, segundo) =>
        (segundo.createdAt || '').localeCompare(primeiro.createdAt || '')
    ).slice(0, 5);
    if (!pedidosRecentes.length) recentes.append(criarElemento('p', 'empty-state', traduzir('dashboard.noRecentOrders')));
    pedidosRecentes.forEach(pedido => {
        const item = criarElemento('button', 'recent-order-item');
        item.type = 'button';
        item.dataset.timelineId = pedido.id;
        const cliente = buscarCliente(pedido.clientId);
        item.append(
            criarElemento('span', 'recent-order-name', pedido.description),
            criarElemento('span', 'recent-order-client', cliente?.name || traduzir('clients.unknown')),
            criarElemento('span', `status-badge ${obterClasseStatus(pedido.status)}`, obterRotuloStatus(pedido.status))
        );
        recentes.append(item);
    });
    const proximosPrazos = obterEtapas(pedidos)
        .filter(etapa => etapa.status !== 'Completed' && etapa.dateTime && new Date(etapa.dateTime) >= new Date())
        .slice(0, 5);
    if (!proximosPrazos.length) prazos.append(criarElemento('p', 'empty-state', traduzir('dashboard.noUpcomingDeadlines')));
    proximosPrazos.forEach(etapa => prazos.append(criarItemPrazo(etapa)));
}

function renderizarGraficoReceita(pedidos) {
    const canvas = document.getElementById('revenueChart');
    if (graficoReceita) graficoReceita.destroy();
    if (typeof Chart === 'undefined') return;
    const corTexto = getComputedStyle(document.documentElement).getPropertyValue('--text-main').trim();
    const corGrade = getComputedStyle(document.documentElement).getPropertyValue('--border-color').trim();
    const meses = Array.from({ length: 6 }, (_, indice) => {
        const data = new Date();
        data.setDate(1);
        data.setMonth(data.getMonth() - (5 - indice));
        return data;
    });
    const valores = meses.map(mes => pedidos.reduce((total, pedido) => {
        if (pedido.status === 'Cancelled') return total;
        if (!pedido.createdAt) return total;
        const data = new Date(pedido.createdAt);
        if (Number.isNaN(data.getTime())) return total;
        return data.getFullYear() === mes.getFullYear() && data.getMonth() === mes.getMonth()
            ? total + Number(pedido.value || 0)
            : total;
    }, 0));
    graficoReceita = new Chart(canvas, {
        type: 'line',
        data: {
            labels: meses.map(mes => mes.toLocaleDateString(obterLocale(), { month: 'short' })),
            datasets: [{
                label: traduzir('dashboard.monthlyRevenue'),
                data: valores,
                borderColor: '#C6A75E',
                backgroundColor: 'rgba(198,167,94,.18)',
                fill: true,
                tension: .35
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { labels: { color: corTexto } } },
            scales: {
                x: { ticks: { color: corTexto }, grid: { color: corGrade } },
                y: { beginAtZero: true, ticks: { color: corTexto, callback: valor => formatarMoeda(valor) }, grid: { color: corGrade } }
            }
        }
    });
}

export function renderizarDashboard() {
    const pedidos = listarPedidos();
    renderizarMetricas(pedidos);
    renderizarTabelaPedidos(pedidos);
    renderizarAgenda(pedidos);
    renderizarClientes(pedidos);
    renderizarResumoAtividade(pedidos);
    renderizarGraficoReceita(pedidos);
    atualizarSeletorClientes();
}

export function renderizarPerfil(nome, fotoUrl = '') {
    const nomeUsuario = nome.trim() || 'Anna Giulia';
    const iniciais = nomeUsuario.split(/\s+/).filter(Boolean).slice(0, 2).map(parte => parte[0]).join('').toUpperCase();
    document.querySelectorAll('[data-profile-name]').forEach(elemento => {
        elemento.textContent = nomeUsuario;
    });
    document.querySelectorAll('[data-profile-avatar]').forEach(avatar => {
        avatar.replaceChildren();
        if (fotoUrl) {
            const imagem = document.createElement('img');
            imagem.src = fotoUrl;
            imagem.alt = nomeUsuario;
            imagem.addEventListener('error', () => {
                avatar.textContent = iniciais;
            }, { once: true });
            avatar.append(imagem);
        } else {
            avatar.textContent = iniciais;
        }
    });
    document.getElementById('welcome-title').querySelector('[data-i18n="welcome.title"]').textContent = traduzir('welcome.title', {
        name: nomeUsuario.split(/\s+/)[0]
    });
    document.getElementById('profile-menu-toggle').setAttribute('aria-label', traduzir('header.profile', { name: nomeUsuario }));
}

export function renderizarNomeWorkspace(nome) {
    const nomeWorkspace = nome.trim() || 'G.Arts';
    document.querySelectorAll('[data-workspace-name]').forEach(elemento => {
        elemento.textContent = nomeWorkspace;
    });
}

export function abrirHistoricoCliente(clienteId) {
    const modal = document.getElementById('clients-modal');
    const mensagemVazia = document.getElementById('clients-modal-empty');
    const lista = document.getElementById('clients-modal-list');
    const cliente = buscarCliente(clienteId);
    if (!cliente) return;
    const pedidosCliente = listarPedidos().filter(pedido => pedido.clientId === clienteId)
        .sort((primeiro, segundo) => (segundo.createdAt || '').localeCompare(primeiro.createdAt || ''));
    document.getElementById('client-history-name').textContent = `${cliente.name} · ${cliente.phone || cliente.email || traduzir('clients.noContact')}`;
    lista.replaceChildren();
    mensagemVazia.hidden = pedidosCliente.length > 0;
    lista.hidden = pedidosCliente.length === 0;
    pedidosCliente.forEach(pedido => {
        const item = criarElemento('li', 'client-history-item');
        const heading = criarElemento('div', 'client-history-heading');
        heading.append(criarElemento('strong', '', pedido.description));
        heading.append(criarElemento('span', `status-badge ${obterClasseStatus(pedido.status)}`, obterRotuloStatus(pedido.status)));
        const detalhes = criarElemento('small', '', `${formatarMoeda(pedido.value)} · ${pedido.createdAt ? new Date(pedido.createdAt).toLocaleDateString(obterLocale()) : traduzir('table.noSteps')}`);
        const etapas = criarElemento('ul', 'client-history-steps');
        (pedido.steps || []).forEach(etapa => {
            const linha = criarElemento('li', '', `${etapa.name} · ${obterRotuloStatus(etapa.status)} · ${formatarDataHora(etapa.dateTime)}`);
            etapas.append(linha);
        });
        item.append(heading, detalhes);
        if (etapas.childElementCount) item.append(criarElemento('strong', 'client-history-label', traduzir('clients.historySteps')), etapas);
        lista.append(item);
    });
    if (!modal.open) modal.showModal();
}

export function definirFiltroPedidos(filtro) {
    filtroPedidosAtual = filtro;
    renderizarTabelaPedidos(listarPedidos());
}

export function definirFiltroAgenda(filtro) {
    filtroAgendaAtual = filtro;
    renderizarAgenda(listarPedidos());
}

export function fecharModalClientes() {
    const modal = document.getElementById('clients-modal');
    if (modal.open) modal.close();
}

function atualizarSeletorClientes(clienteSelecionadoId = '') {
    const seletor = document.getElementById('existing-client');
    if (!seletor) return;
    seletor.replaceChildren(new Option(traduzir('form.newClient'), ''));
    listarClientes().sort((primeiro, segundo) => primeiro.name.localeCompare(segundo.name, 'pt-BR'))
        .forEach(cliente => seletor.add(new Option(cliente.name, cliente.id)));
    seletor.value = clienteSelecionadoId;
}

function atualizarTituloModalPedido() {
    const editando = Boolean(document.getElementById('order-id').value);
    document.getElementById('order-modal-title').textContent = traduzir(editando ? 'form.editTitle' : 'form.createTitle');
    const botaoSalvar = formularioPedido.querySelector('button[type="submit"]');
    botaoSalvar.dataset.i18n = editando ? 'actions.saveChanges' : 'actions.save';
    botaoSalvar.textContent = traduzir(botaoSalvar.dataset.i18n);
}

export function abrirModalPedido(pedido = null) {
    formularioPedido.reset();
    document.getElementById('order-id').value = pedido?.id || '';
    listaCamposEtapas.replaceChildren();
    atualizarSeletorClientes(pedido?.clientId || '');

    if (pedido) {
        const cliente = buscarCliente(pedido.clientId);
        document.getElementById('client-name').value = cliente?.name || '';
        document.getElementById('client-phone').value = cliente?.phone || '';
        document.getElementById('client-email').value = cliente?.email || '';
        document.getElementById('service-description').value = pedido.description;
        document.getElementById('service-value').value = pedido.value;
        document.getElementById('order-status').value = pedido.status;
        (pedido.steps || []).forEach(adicionarCampoEtapa);
    }

    atualizarTituloModalPedido();
    if (!modalPedido.open) modalPedido.showModal();
}

export function fecharModalPedido() {
    if (modalPedido.open) modalPedido.close();
    formularioPedido.reset();
    document.getElementById('order-id').value = '';
    listaCamposEtapas.replaceChildren();
    atualizarSeletorClientes();
    atualizarTituloModalPedido();
}

export function adicionarCampoEtapa(etapa = {}) {
    const fragmento = modeloEtapa.content.cloneNode(true);
    traduzirFragmento(fragmento);
    const editor = fragmento.querySelector('.step-editor');
    editor.dataset.stepId = etapa.id || globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`;
    editor.querySelector('.step-name').value = etapa.name || '';
    editor.querySelector('.step-date').value = etapa.dateTime || '';
    editor.querySelector('.step-status').value = normalizarStatusEtapa(etapa.status);
    editor.querySelector('.remove-step').addEventListener('click', () => editor.remove());
    listaCamposEtapas.append(fragmento);
}

function traduzirFragmento(fragmento) {
    fragmento.querySelectorAll('[data-i18n]').forEach(elemento => {
        const chaves = elemento.dataset.i18n;
        elemento.textContent = traduzir(chaves);
    });
    fragmento.querySelectorAll('[data-i18n-placeholder]').forEach(elemento => {
        elemento.setAttribute('placeholder', traduzir(elemento.dataset.i18nPlaceholder));
    });
    fragmento.querySelectorAll('[data-i18n-aria]').forEach(elemento => {
        elemento.setAttribute('aria-label', traduzir(elemento.dataset.i18nAria));
    });
    fragmento.querySelectorAll('[data-i18n-title]').forEach(elemento => {
        elemento.setAttribute('title', traduzir(elemento.dataset.i18nTitle));
    });
}

export function coletarDadosFormulario() {
    const camposEtapas = [...listaCamposEtapas.querySelectorAll('.step-editor')];
    const etapas = camposEtapas.map(editor => ({
        id: editor.dataset.stepId,
        name: editor.querySelector('.step-name').value.trim(),
        dateTime: editor.querySelector('.step-date').value,
        status: editor.querySelector('.step-status').value
    })).sort((primeira, segunda) => primeira.dateTime.localeCompare(segunda.dateTime));

    return {
        id: document.getElementById('order-id').value,
        clienteId: document.getElementById('existing-client').value,
        cliente: {
            name: document.getElementById('client-name').value.trim(),
            phone: document.getElementById('client-phone').value.trim(),
            email: document.getElementById('client-email').value.trim()
        },
        pedido: {
            description: document.getElementById('service-description').value.trim(),
            value: Number(document.getElementById('service-value').value) || 0,
            status: document.getElementById('order-status').value,
            steps: etapas
        }
    };
}

export function preencherContatoCliente(clienteId) {
    const cliente = buscarCliente(clienteId);
    document.getElementById('client-name').value = cliente?.name || '';
    document.getElementById('client-phone').value = cliente?.phone || '';
    document.getElementById('client-email').value = cliente?.email || '';
}

export function abrirTimeline(pedidoId) {
    const pedido = listarPedidos().find(item => item.id === pedidoId);
    if (!pedido) return;
    pedidoTimelineAtualId = pedidoId;
    renderizarTimeline(pedido);
    if (!modalTimeline.open) modalTimeline.showModal();
}

function renderizarTimeline(pedido) {
    const cliente = buscarCliente(pedido.clientId);
    document.getElementById('timeline-title').textContent = pedido.description;
    document.getElementById('timeline-client').textContent = `${cliente?.name || traduzir('clients.unknown')} · ${obterRotuloStatus(pedido.status)}`;
    const quantidadeEtapas = pedido.steps.length;
    const chaveResumo = quantidadeEtapas === 0 ? 'timeline.summaryZero' : quantidadeEtapas === 1 ? 'timeline.summaryOne' : 'timeline.summaryMany';
    document.getElementById('timeline-summary').textContent = traduzir(chaveResumo, {
        amount: formatarMoeda(pedido.value), count: quantidadeEtapas
    });

    const listaTimeline = document.getElementById('timeline-list');
    listaTimeline.replaceChildren();
    const etapasOrdenadas = [...pedido.steps].sort((primeira, segunda) => primeira.dateTime.localeCompare(segunda.dateTime));
    if (!etapasOrdenadas.length) {
        listaTimeline.append(criarElemento('li', 'timeline-empty', traduzir('timeline.noSteps')));
        return;
    }

    etapasOrdenadas.forEach(etapa => {
        const item = criarElemento('li', `timeline-item ${etapa.status === 'Completed' ? 'is-complete' : ''}`);
        const marcador = criarElemento('span', 'timeline-marker', etapa.status === 'Completed' ? '✓' : '');
        const conteudo = criarElemento('span', 'timeline-step-body');
        conteudo.append(criarElemento('strong', '', etapa.name), criarElemento('small', '', formatarDataHora(etapa.dateTime)));
        const acoes = criarElemento('span', 'timeline-step-actions');
        const seletorStatus = document.createElement('select');
        seletorStatus.className = `timeline-status-select ${obterClasseStatus(etapa.status)}`;
        seletorStatus.dataset.stepStatus = 'true';
        seletorStatus.dataset.orderId = pedido.id;
        seletorStatus.dataset.stepId = etapa.id;
        seletorStatus.setAttribute('aria-label', traduzir('timeline.changeStepStatus', { step: etapa.name }));
        ['Pending', 'In Progress', 'Completed'].forEach(status => {
            seletorStatus.add(new Option(obterRotuloStatus(status), status, false, status === etapa.status));
        });
        acoes.append(seletorStatus);

        const linkWhatsApp = criarLinkWhatsApp(cliente?.phone, gerarMensagemEtapa(pedido, cliente, etapa));
        if (linkWhatsApp) acoes.append(linkWhatsApp);
        conteudo.append(acoes);
        item.append(marcador, conteudo);
        listaTimeline.append(item);
    });
}

export function obterPedidoTimelineAtualId() {
    return pedidoTimelineAtualId;
}

export function fecharTimeline() {
    if (modalTimeline.open) modalTimeline.close();
    pedidoTimelineAtualId = '';
}

export function atualizarModaisPorIdioma() {
    if (modalPedido.open) atualizarTituloModalPedido();
    if (pedidoTimelineAtualId) {
        const pedido = listarPedidos().find(item => item.id === pedidoTimelineAtualId);
        if (pedido) renderizarTimeline(pedido);
    }
}