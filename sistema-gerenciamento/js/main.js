import {
    adicionarPedido,
    atualizarEtapa,
    atualizarPedido,
    excluirPedido,
    exportarBackup,
    importarBackup,
    listarPedidos,
    resetarDadosWorkspace,
    salvarCliente
} from './state.js';
import { inicializarIdioma, traduzir } from './i18n.js';
import {
    armazenamentoIndisponivel,
    gravarArmazenamento,
    lerArmazenamento,
    removerArmazenamento
} from './storage.js';
import { atualizarRotuloThemeToggle, initThemeToggle } from './theme.js';
import {
    abrirModalPedido,
    abrirTimeline,
    abrirHistoricoCliente,
    atualizarModaisPorIdioma,
    adicionarCampoEtapa,
    coletarDadosFormulario,
    fecharModalClientes,
    fecharModalPedido,
    fecharTimeline,
    definirFiltroAgenda,
    definirFiltroPedidos,
    initNavigation,
    preencherContatoCliente,
    renderizarDashboard,
    renderizarNomeWorkspace,
    renderizarPerfil
} from './ui.js';

const CHAVE_PERFIL = 'garts_user_profile_v1';
const CHAVE_WORKSPACE = 'garts_workspace_settings_v1';
const NOME_PERFIL_PADRAO = 'Anna Giulia';
let pedidoPendenteExclusaoId = '';

function exibirFeedback(elementoId, chave) {
    const elemento = document.getElementById(elementoId);
    elemento.dataset.i18n = chave;
    elemento.textContent = traduzir(chave);
}

function carregarPerfil() {
    try {
        const perfilSalvo = JSON.parse(lerArmazenamento(CHAVE_PERFIL) || 'null');
        return {
            nome: perfilSalvo?.nome || NOME_PERFIL_PADRAO,
            email: perfilSalvo?.email || '',
            fotoUrl: perfilSalvo?.fotoUrl || ''
        };
    } catch (error) {
        console.error('Could not read the saved administrator profile.', error);
        return { nome: NOME_PERFIL_PADRAO, email: '', fotoUrl: '' };
    }
}

let perfilUsuario = carregarPerfil();

function fecharMenuPerfil() {
    document.getElementById('profile-dropdown').hidden = true;
    document.getElementById('profile-menu-toggle').setAttribute('aria-expanded', 'false');
}

function abrirEditorPerfil() {
    fecharMenuPerfil();
    document.getElementById('profile-name').value = perfilUsuario.nome;
    document.getElementById('profile-email').value = perfilUsuario.email;
    document.getElementById('profile-photo').value = perfilUsuario.fotoUrl;
    document.getElementById('profile-modal').showModal();
}

function salvarPerfil(evento) {
    evento.preventDefault();
    perfilUsuario = {
        nome: document.getElementById('profile-name').value.trim() || NOME_PERFIL_PADRAO,
        email: document.getElementById('profile-email').value.trim(),
        fotoUrl: document.getElementById('profile-photo').value.trim()
    };
    gravarArmazenamento(CHAVE_PERFIL, JSON.stringify(perfilUsuario));
    renderizarPerfil(perfilUsuario.nome, perfilUsuario.fotoUrl);
    document.getElementById('workspace-admin-name').value = perfilUsuario.nome;
    document.getElementById('profile-modal').close();
}

function encerrarSessao() {
    fecharMenuPerfil();
    window.alert(traduzir('alert.logout'));
}

function salvarFormularioPedido(evento) {
    evento.preventDefault();
    const dadosFormulario = coletarDadosFormulario();
    const cliente = salvarCliente(dadosFormulario.clienteId, dadosFormulario.cliente);
    const dadosPedido = { ...dadosFormulario.pedido, clientId: cliente.id };

    if (dadosFormulario.id) atualizarPedido(dadosFormulario.id, dadosPedido);
    else adicionarPedido(dadosPedido);

    fecharModalPedido();
    renderizarDashboard();
}

function atualizarStatusEtapa(evento) {
    const seletor = evento.target.closest('[data-step-status]');
    if (!seletor) return;
    const pedidoId = seletor.dataset.orderId;
    atualizarEtapa(pedidoId, seletor.dataset.stepId, seletor.value);
    renderizarDashboard();
    abrirTimeline(pedidoId);
}

function tratarAcoesTabela(evento) {
    const botao = evento.target.closest('button');
    if (!botao) return;

    if (botao.dataset.editId) {
        const pedido = listarPedidos().find(item => item.id === botao.dataset.editId);
        if (pedido) abrirModalPedido(pedido);
    }
    if (botao.dataset.timelineId) abrirTimeline(botao.dataset.timelineId);
    if (botao.dataset.deleteId) {
        pedidoPendenteExclusaoId = botao.dataset.deleteId;
        document.getElementById('delete-confirmation-modal').showModal();
    }
}

function sincronizarBusca(campoOrigem) {
    const outroCampo = campoOrigem.id === 'table-search'
        ? document.getElementById('search-input')
        : document.getElementById('table-search');
    outroCampo.value = campoOrigem.value;
    renderizarDashboard();
}

function carregarConfiguracaoWorkspace() {
    const armazenado = lerArmazenamento(CHAVE_WORKSPACE);
    let nome = 'G.Arts';
    if (armazenado) {
        try {
            const configuracao = JSON.parse(armazenado);
            if (typeof configuracao.name === 'string' && configuracao.name.trim()) nome = configuracao.name.trim();
        } catch (error) {
            console.error('Could not read saved workspace branding.', error);
        }
    }
    document.getElementById('workspace-name').value = nome;
    document.getElementById('workspace-admin-name').value = perfilUsuario.nome;
    renderizarNomeWorkspace(nome);
    renderizarPerfil(perfilUsuario.nome, perfilUsuario.fotoUrl);
}

function salvarConfiguracaoWorkspace(evento) {
    evento.preventDefault();
    const nome = document.getElementById('workspace-name').value.trim();
    const nomeAdministrador = document.getElementById('workspace-admin-name').value.trim();
    const workspaceSalvo = gravarArmazenamento(CHAVE_WORKSPACE, JSON.stringify({ name: nome }));
    perfilUsuario = { ...perfilUsuario, nome: nomeAdministrador };
    const perfilSalvo = gravarArmazenamento(CHAVE_PERFIL, JSON.stringify(perfilUsuario));
    renderizarNomeWorkspace(nome);
    renderizarPerfil(perfilUsuario.nome, perfilUsuario.fotoUrl);
    exibirFeedback('settings-feedback', workspaceSalvo && perfilSalvo ? 'settings.saved' : 'settings.operationFailed');
}

function exportarDadosWorkspace() {
    const backup = exportarBackup();
    const arquivo = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(arquivo);
    const link = document.createElement('a');
    link.href = url;
    link.download = `garts-workspace-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    exibirFeedback('backup-feedback', 'settings.exported');
}

async function importarDadosWorkspace(evento) {
    const campoArquivo = evento.currentTarget;
    const arquivo = campoArquivo.files?.[0];
    if (!arquivo) return;
    try {
        const backup = JSON.parse(await arquivo.text());
        try {
            importarBackup(backup);
        } catch (error) {
            console.error('Workspace backup import failed.', error);
            exibirFeedback('backup-feedback', error instanceof TypeError
                ? 'settings.importInvalid'
                : 'settings.operationFailed');
            return;
        }
        renderizarDashboard();
        exibirFeedback('backup-feedback', 'settings.imported');
    } catch (error) {
        console.error('Workspace backup file could not be read.', error);
        exibirFeedback('backup-feedback', 'settings.importInvalid');
    } finally {
        campoArquivo.value = '';
    }
}

function confirmarResetWorkspace() {
    const dadosResetados = resetarDadosWorkspace();
    const workspaceRemovido = removerArmazenamento(CHAVE_WORKSPACE);
    const perfilRemovido = removerArmazenamento(CHAVE_PERFIL);
    perfilUsuario = { nome: NOME_PERFIL_PADRAO, email: '', fotoUrl: '' };
    document.getElementById('workspace-name').value = 'G.Arts';
    document.getElementById('workspace-admin-name').value = NOME_PERFIL_PADRAO;
    document.getElementById('search-input').value = '';
    document.getElementById('table-search').value = '';
    exibirFeedback('settings-feedback', '');
    exibirFeedback('backup-feedback', dadosResetados && workspaceRemovido && perfilRemovido
        ? 'settings.resetDone'
        : 'settings.operationFailed');
    renderizarNomeWorkspace('G.Arts');
    renderizarPerfil(perfilUsuario.nome);
    definirFiltroPedidos('all');
    definirFiltroAgenda('today');
    renderizarDashboard();
    document.getElementById('reset-confirmation-modal').close();
}

function confirmarExclusaoPedido() {
    if (!pedidoPendenteExclusaoId) return;
    excluirPedido(pedidoPendenteExclusaoId);
    pedidoPendenteExclusaoId = '';
    document.getElementById('delete-confirmation-modal').close();
    renderizarDashboard();
}

function conectarEventos() {
    // O entry point conecta os eventos; renderização e persistência ficam nos módulos próprios.
    inicializarIdioma(() => {
        renderizarDashboard();
        renderizarPerfil(perfilUsuario.nome, perfilUsuario.fotoUrl);
        atualizarModaisPorIdioma();
        atualizarRotuloThemeToggle();
    });

    document.getElementById('order-form').addEventListener('submit', salvarFormularioPedido);
    document.getElementById('new-order-button').addEventListener('click', () => abrirModalPedido());
    document.getElementById('quick-new-order-button').addEventListener('click', () => abrirModalPedido());
    document.getElementById('add-step-button').addEventListener('click', () => adicionarCampoEtapa());
    document.querySelectorAll('[data-close-order]').forEach(botao => botao.addEventListener('click', fecharModalPedido));
    document.getElementById('close-timeline').addEventListener('click', fecharTimeline);
    document.getElementById('timeline-modal').addEventListener('close', fecharTimeline);
    document.getElementById('close-clients-modal').addEventListener('click', fecharModalClientes);
    document.getElementById('profile-menu-toggle').addEventListener('click', () => {
        const menu = document.getElementById('profile-dropdown');
        menu.hidden = !menu.hidden;
        document.getElementById('profile-menu-toggle').setAttribute('aria-expanded', String(!menu.hidden));
    });
    document.getElementById('open-profile-modal').addEventListener('click', abrirEditorPerfil);
    document.getElementById('profile-settings-link').addEventListener('click', evento => {
        evento.preventDefault();
        fecharMenuPerfil();
        document.querySelector('.nav-link[data-target="view-configuracoes"]').click();
    });
    document.getElementById('profile-logout').addEventListener('click', encerrarSessao);
    document.getElementById('profile-form').addEventListener('submit', salvarPerfil);
    document.getElementById('close-profile-modal').addEventListener('click', () => document.getElementById('profile-modal').close());
    document.getElementById('cancel-profile-modal').addEventListener('click', () => document.getElementById('profile-modal').close());
    document.addEventListener('click', evento => {
        if (!evento.target.closest('.profile-menu-wrap')) fecharMenuPerfil();
    });
    document.getElementById('existing-client').addEventListener('change', evento => preencherContatoCliente(evento.target.value));
    document.getElementById('timeline-list').addEventListener('change', atualizarStatusEtapa);
    document.getElementById('agenda-filter-pills').addEventListener('click', evento => {
        const filtro = evento.target.closest('[data-agenda-filter]');
        if (filtro) definirFiltroAgenda(filtro.dataset.agendaFilter);
    });
    document.getElementById('agenda-timeline').addEventListener('change', evento => {
        const checkbox = evento.target.closest('[data-agenda-step]');
        if (!checkbox) return;
        atualizarEtapa(checkbox.dataset.orderId, checkbox.dataset.stepId, checkbox.checked ? 'Completed' : 'Pending');
        renderizarDashboard();
    });
    document.getElementById('orders-table-body').addEventListener('click', tratarAcoesTabela);
    document.getElementById('recent-orders-list').addEventListener('click', tratarAcoesTabela);
    document.getElementById('deadlines-preview').addEventListener('click', tratarAcoesTabela);
    document.getElementById('client-cards-grid').addEventListener('click', evento => {
        const botao = evento.target.closest('[data-client-history]');
        if (botao) abrirHistoricoCliente(botao.dataset.clientHistory);
    });
    document.getElementById('order-filter-pills').addEventListener('click', evento => {
        const botao = evento.target.closest('[data-order-filter]');
        if (botao) definirFiltroPedidos(botao.dataset.orderFilter);
    });
    document.getElementById('table-search').addEventListener('input', evento => sincronizarBusca(evento.currentTarget));
    document.getElementById('search-input').addEventListener('input', evento => sincronizarBusca(evento.currentTarget));
    document.getElementById('workspace-settings-form').addEventListener('submit', salvarConfiguracaoWorkspace);
    document.getElementById('export-data-button').addEventListener('click', exportarDadosWorkspace);
    document.getElementById('import-data-button').addEventListener('click', () => document.getElementById('import-data-file').click());
    document.getElementById('import-data-file').addEventListener('change', importarDadosWorkspace);
    document.getElementById('reset-workspace-button').addEventListener('click', () => document.getElementById('reset-confirmation-modal').showModal());
    document.getElementById('cancel-reset-button').addEventListener('click', () => document.getElementById('reset-confirmation-modal').close());
    document.getElementById('confirm-reset-button').addEventListener('click', confirmarResetWorkspace);
    document.getElementById('cancel-delete-button').addEventListener('click', () => {
        pedidoPendenteExclusaoId = '';
        document.getElementById('delete-confirmation-modal').close();
    });
    document.getElementById('confirm-delete-button').addEventListener('click', confirmarExclusaoPedido);
    document.getElementById('delete-confirmation-modal').addEventListener('close', () => {
        pedidoPendenteExclusaoId = '';
    });
    document.getElementById('logout-button').addEventListener('click', encerrarSessao);

    document.addEventListener('keydown', evento => {
        if ((evento.metaKey || evento.ctrlKey) && evento.key.toLowerCase() === 'k') {
            evento.preventDefault();
            document.getElementById('search-input').focus();
            globalThis.lucide?.createIcons();
        }
        if (evento.key === 'Escape') {
            document.getElementById('order-modal').close();
            fecharTimeline();
            fecharModalClientes();
            document.getElementById('profile-modal').close();
            document.getElementById('reset-confirmation-modal').close();
            document.getElementById('delete-confirmation-modal').close();
            fecharMenuPerfil();
        }
    });
}

function inicializarAplicacao() {
    const avisoArmazenamento = document.getElementById('storage-warning');
    const mostrarAvisoArmazenamento = () => {
        avisoArmazenamento.textContent = traduzir('storage.unavailable');
        avisoArmazenamento.hidden = false;
    };
    window.addEventListener('localstorageerror', mostrarAvisoArmazenamento);
    if (armazenamentoIndisponivel()) mostrarAvisoArmazenamento();

    initNavigation();
    if (globalThis.lucide?.createIcons) {
        globalThis.lucide.createIcons();
    } else {
        console.error('Lucide icons could not be loaded. The workspace will continue without icon replacement.');
    }
    initThemeToggle();
    conectarEventos();
    window.addEventListener('themechange', renderizarDashboard);
    renderizarDashboard();
    renderizarPerfil(perfilUsuario.nome, perfilUsuario.fotoUrl);
    carregarConfiguracaoWorkspace();
}

document.addEventListener('DOMContentLoaded', inicializarAplicacao, { once: true });