import { obterLocale, traduzir } from './i18n.js';

function normalizarTelefone(telefone) {
    let digitos = String(telefone || '').replace(/\D/g, '');
    if (digitos.length === 10 || digitos.length === 11) digitos = `55${digitos}`;
    return /^\d{10,15}$/.test(digitos) ? digitos : '';
}

export function gerarUrlWhatsApp(telefone, mensagem) {
    const telefoneNormalizado = normalizarTelefone(telefone);
    if (!telefoneNormalizado) return null;
    return `https://wa.me/${telefoneNormalizado}?text=${encodeURIComponent(mensagem)}`;
}

function formatarDataEtapa(dataHora) {
    if (!dataHora) return '';
    return new Date(dataHora).toLocaleString(obterLocale(), {
        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
}

export function gerarMensagemPedido(pedido, cliente) {
    const chavesStatus = {
        Scheduled: 'status.scheduled',
        Pending: 'status.pending',
        'In Progress': 'status.inProgress',
        'Awaiting Approval': 'status.awaitingApproval',
        Completed: 'status.completed',
        Cancelled: 'status.cancelled'
    };
    return traduzir('whatsapp.orderMessage', {
        name: cliente?.name || '',
        service: pedido.description,
        status: traduzir(chavesStatus[pedido.status] || 'status.pending')
    });
}

export function gerarMensagemEtapa(pedido, cliente, etapa) {
    const chavesStatus = {
        Pending: 'status.pending',
        'In Progress': 'status.inProgress',
        Completed: 'status.completed'
    };
    return traduzir('whatsapp.stepMessage', {
        name: cliente?.name || '',
        service: pedido.description,
        step: etapa.name,
        date: formatarDataEtapa(etapa.dateTime),
        status: traduzir(chavesStatus[etapa.status] || 'status.pending')
    });
}

export function gerarMensagemContato(cliente) {
    return traduzir('whatsapp.contactMessage', { name: cliente?.name || '' });
}