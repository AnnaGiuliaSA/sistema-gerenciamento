const CHAVE_ARMAZENAMENTO = 'northstar_dashboard_v1';
const CHAVE_LEGADA = 'pedidos_db';
const STATUS_PEDIDO = ['Scheduled', 'Pending', 'In Progress', 'Awaiting Approval', 'Completed', 'Cancelled'];
const STATUS_ETAPA = ['Pending', 'In Progress', 'Completed'];

let pedidos = [];
let clientes = [];

function criarId() {
    return globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function validarDataOpcional(valor, campo) {
    if (valor !== undefined && typeof valor !== 'string') {
        throw new TypeError(`${campo} must be a string.`);
    }
    if (valor && Number.isNaN(Date.parse(valor))) {
        throw new TypeError(`${campo} must be a valid date.`);
    }
    return valor || '';
}

function normalizarClientesSalvos(clientesSalvos) {
    const ids = new Set();
    return clientesSalvos.map(cliente => {
        if (!cliente || typeof cliente !== 'object' || Array.isArray(cliente) ||
            typeof cliente.id !== 'string' || !cliente.id.trim() ||
            typeof cliente.name !== 'string' || !cliente.name.trim()) {
            throw new TypeError('Every saved client must have a string id and name.');
        }
        if (ids.has(cliente.id)) throw new TypeError('Saved client ids must be unique.');
        ids.add(cliente.id);
        return {
            ...cliente,
            name: cliente.name.trim(),
            phone: String(cliente.phone || ''),
            email: String(cliente.email || '')
        };
    });
}

function normalizarPedidosSalvos(pedidosSalvos, clientesSalvos) {
    const idsClientes = new Set(clientesSalvos.map(cliente => cliente.id));
    const idsPedidos = new Set();
    return pedidosSalvos.map(pedido => {
        if (!pedido || typeof pedido !== 'object' || Array.isArray(pedido) ||
            typeof pedido.id !== 'string' || !pedido.id.trim() ||
            typeof pedido.clientId !== 'string' || !idsClientes.has(pedido.clientId) ||
            typeof pedido.description !== 'string' || !pedido.description.trim() ||
            !Number.isFinite(Number(pedido.value)) ||
            (pedido.steps !== undefined && !Array.isArray(pedido.steps))) {
            throw new TypeError('Every saved order must have a valid client, description, value and steps.');
        }
        if (idsPedidos.has(pedido.id)) throw new TypeError('Saved order ids must be unique.');
        idsPedidos.add(pedido.id);
        return {
            ...pedido,
            description: pedido.description.trim(),
            value: Number(pedido.value),
            status: normalizarStatusPedido(pedido.status),
            createdAt: validarDataOpcional(pedido.createdAt, 'Order createdAt'),
            steps: (pedido.steps || []).map(etapa => {
                if (!etapa || typeof etapa !== 'object' || Array.isArray(etapa) ||
                    typeof etapa.id !== 'string' || !etapa.id.trim() ||
                    typeof etapa.name !== 'string' || !etapa.name.trim()) {
                    throw new TypeError('Every saved milestone must have a string id and name.');
                }
                return {
                    ...etapa,
                    name: etapa.name.trim(),
                    dateTime: validarDataOpcional(etapa.dateTime, 'Milestone dateTime'),
                    status: normalizarStatusEtapa(etapa.status)
                };
            })
        };
    });
}

export function normalizarStatusPedido(status) {
    const valor = String(status || '').toLocaleLowerCase('pt-BR');
    const statusConhecidos = {
        agendado: 'Scheduled', scheduled: 'Scheduled', programado: 'Scheduled', programada: 'Scheduled',
        pendente: 'Pending', pending: 'Pending',
        'aguardando aprovação': 'Awaiting Approval', 'awaiting approval': 'Awaiting Approval',
        'esperando aprobación': 'Awaiting Approval',
        'em andamento': 'In Progress', 'in progress': 'In Progress', 'en curso': 'In Progress',
        'concluído': 'Completed', completed: 'Completed', completado: 'Completed',
        cancelado: 'Cancelled', cancelled: 'Cancelled', canceled: 'Cancelled'
    };
    return statusConhecidos[valor] || 'Scheduled';
}

export function normalizarStatusEtapa(status) {
    const valor = String(status || '').toLocaleLowerCase('pt-BR');
    const statusConhecidos = {
        pendente: 'Pending', pending: 'Pending',
        'em andamento': 'In Progress', 'in progress': 'In Progress', 'en curso': 'In Progress',
        'concluído': 'Completed', 'concluída': 'Completed', completed: 'Completed', completado: 'Completed'
    };
    return statusConhecidos[valor] || 'Pending';
}

function carregarDados() {
    try {
        const dadosSalvos = JSON.parse(localStorage.getItem(CHAVE_ARMAZENAMENTO) || 'null');
        if (dadosSalvos !== null) {
            if (!dadosSalvos || typeof dadosSalvos !== 'object' || Array.isArray(dadosSalvos) ||
                !Array.isArray(dadosSalvos.clients) || !Array.isArray(dadosSalvos.orders)) {
                throw new TypeError('Saved workspace data must contain clients and orders arrays.');
            }
            const clientesCarregados = normalizarClientesSalvos(dadosSalvos.clients);
            const pedidosCarregados = normalizarPedidosSalvos(dadosSalvos.orders, clientesCarregados);
            clientes = clientesCarregados;
            pedidos = pedidosCarregados;
            return;
        }
    } catch (error) {
        console.error('Could not load saved workspace data. The stored data was preserved.', error);
        return;
    }

    migrarPedidosAntigos();
}

function migrarPedidosAntigos() {
    // Importa o formato antigo sem remover a chave original do navegador.
    clientes = [];
    pedidos = [];

    try {
        const pedidosAntigos = JSON.parse(localStorage.getItem(CHAVE_LEGADA) || '[]');
        pedidos = pedidosAntigos.map(pedidoAntigo => {
            const cliente = {
                id: criarId(),
                name: pedidoAntigo.cliente || 'Cliente sem nome',
                phone: '',
                email: ''
            };
            clientes.push(cliente);
            return {
                id: String(pedidoAntigo.id || criarId()),
                clientId: cliente.id,
                description: pedidoAntigo.descricao || 'Serviço importado',
                value: Number(pedidoAntigo.valor) || 0,
                status: normalizarStatusPedido(pedidoAntigo.status),
                createdAt: '',
                steps: []
            };
        });
    } catch (error) {
        console.error('Could not migrate legacy order data.', error);
        clientes = [];
        pedidos = [];
    }
}

export function salvarPedidos() {
    localStorage.setItem(CHAVE_ARMAZENAMENTO, JSON.stringify({ clients: clientes, orders: pedidos }));
    return listarPedidos();
}

export function listarPedidos() {
    return pedidos.map(pedido => ({
        ...pedido,
        steps: (pedido.steps || []).map(etapa => ({ ...etapa }))
    }));
}

export function buscarPedido(pedidoId) {
    const pedido = pedidos.find(item => item.id === pedidoId);
    return pedido ? { ...pedido, steps: (pedido.steps || []).map(etapa => ({ ...etapa })) } : null;
}

export function listarClientes() {
    return clientes.map(cliente => ({ ...cliente }));
}

export function buscarCliente(clienteId) {
    const cliente = clientes.find(item => item.id === clienteId);
    return cliente ? { ...cliente } : null;
}

export function salvarCliente(clienteId, dadosCliente) {
    const dadosNormalizados = {
        name: String(dadosCliente?.name || '').trim(),
        phone: String(dadosCliente?.phone || '').trim(),
        email: String(dadosCliente?.email || '').trim()
    };
    if (!dadosNormalizados.name) throw new TypeError('Client name is required.');

    const clienteExistente = clientes.find(cliente => cliente.id === clienteId);
    if (clienteExistente) {
        Object.assign(clienteExistente, dadosNormalizados);
        salvarPedidos();
        return { ...clienteExistente };
    }

    const telefoneNormalizado = dadosNormalizados.phone.replace(/\D/g, '');
    const clienteDuplicado = clientes.find(cliente =>
        (dadosNormalizados.email && cliente.email.toLowerCase() === dadosNormalizados.email.toLowerCase()) ||
        (telefoneNormalizado && cliente.phone.replace(/\D/g, '') === telefoneNormalizado)
    );
    if (clienteDuplicado) {
        Object.assign(clienteDuplicado, dadosNormalizados);
        salvarPedidos();
        return { ...clienteDuplicado };
    }

    const novoCliente = { id: criarId(), ...dadosNormalizados };
    clientes.push(novoCliente);
    salvarPedidos();
    return { ...novoCliente };
}

export function adicionarPedido(dadosPedido) {
    const novoPedido = {
        ...dadosPedido,
        id: dadosPedido.id || criarId(),
        createdAt: dadosPedido.createdAt || new Date().toISOString(),
        status: normalizarStatusPedido(dadosPedido.status),
        steps: (dadosPedido.steps || []).map(etapa => ({ ...etapa, status: normalizarStatusEtapa(etapa.status) }))
    };
    pedidos.push(novoPedido);
    salvarPedidos();
    return buscarPedido(novoPedido.id);
}

export function atualizarPedido(pedidoId, dadosPedido) {
    const indicePedido = pedidos.findIndex(pedido => pedido.id === pedidoId);
    if (indicePedido < 0) return null;

    pedidos[indicePedido] = {
        ...pedidos[indicePedido],
        ...dadosPedido,
        id: pedidoId,
        createdAt: dadosPedido.createdAt || pedidos[indicePedido].createdAt || '',
        status: normalizarStatusPedido(dadosPedido.status),
        steps: (dadosPedido.steps || []).map(etapa => ({ ...etapa, status: normalizarStatusEtapa(etapa.status) }))
    };
    salvarPedidos();
    return buscarPedido(pedidoId);
}

export function excluirPedido(pedidoId) {
    pedidos = pedidos.filter(pedido => pedido.id !== pedidoId);
    salvarPedidos();
}

export function adicionarEtapa(pedidoId, dadosEtapa) {
    const pedido = pedidos.find(item => item.id === pedidoId);
    if (!pedido) return null;
    const novaEtapa = { ...dadosEtapa, id: dadosEtapa.id || criarId(), status: normalizarStatusEtapa(dadosEtapa.status) };
    pedido.steps.push(novaEtapa);
    salvarPedidos();
    return { ...novaEtapa };
}

export function atualizarEtapa(pedidoId, etapaId, status) {
    if (!STATUS_ETAPA.includes(status)) return null;
    const pedido = pedidos.find(item => item.id === pedidoId);
    const etapa = pedido?.steps.find(item => item.id === etapaId);
    if (!etapa) return null;
    etapa.status = status;
    salvarPedidos();
    return { ...etapa };
}

export function excluirEtapa(pedidoId, etapaId) {
    const pedido = pedidos.find(item => item.id === pedidoId);
    if (!pedido) return;
    pedido.steps = pedido.steps.filter(etapa => etapa.id !== etapaId);
    salvarPedidos();
}

export function exportarBackup() {
    return {
        version: 1,
        exportedAt: new Date().toISOString(),
        clients: listarClientes(),
        orders: listarPedidos()
    };
}

export function importarBackup(backup) {
    if (!backup || typeof backup !== 'object' || Array.isArray(backup) ||
    !Array.isArray(backup.clients) || !Array.isArray(backup.orders)) {
    throw new TypeError('Backup must contain clients and orders arrays.');
    }
    backup.orders.forEach(pedido => {
    if (!STATUS_PEDIDO.includes(pedido?.status)) {
        throw new TypeError('Every order must have a valid status.');
    }
    if (pedido.steps !== undefined && (!Array.isArray(pedido.steps) ||
        pedido.steps.some(etapa => !STATUS_ETAPA.includes(etapa?.status)))) {
        throw new TypeError('Every milestone must have a valid status.');
    }
    });

    const clientesImportados = normalizarClientesSalvos(backup.clients);
    const pedidosImportados = normalizarPedidosSalvos(backup.orders, clientesImportados);

    localStorage.setItem(CHAVE_ARMAZENAMENTO, JSON.stringify({
    clients: clientesImportados,
        orders: pedidosImportados
    }));
    clientes = clientesImportados;
    pedidos = pedidosImportados;
}

export function resetarDadosWorkspace() {
    localStorage.setItem(CHAVE_ARMAZENAMENTO, JSON.stringify({ clients: [], orders: [] }));
    clientes = [];
    pedidos = [];
    localStorage.removeItem(CHAVE_LEGADA);
}

carregarDados();