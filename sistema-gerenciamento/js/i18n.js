import { gravarArmazenamento, lerArmazenamento } from './storage.js';

const CHAVE_IDIOMA = 'northstar_language_preference';
const idiomasSuportados = ['en', 'pt-BR', 'es'];
const locales = { 'pt-BR': 'pt-BR', en: 'en-US', es: 'es-ES' };

// A ordem de cada vetor corresponde a idiomasSuportados.
const traducoesPorChave = {
    'app.title': ['G.Arts | Dashboard', 'G.Arts | Painel', 'G.Arts | Panel'],
    'brand.home': ['G.Arts home', 'Página inicial G.Arts', 'Inicio de G.Arts'],
    'profile.role': ['Administrator', 'Administrador', 'Administrador'],
    'sidebar.workspace': ['WORKSPACE', 'ESPAÇO DE TRABALHO', 'ESPACIO DE TRABAJO'],
    'sidebar.version': ['G.ARTS · LOCAL WORKSPACE', 'G.ARTS · ESPAÇO LOCAL', 'G.ARTS · ESPACIO LOCAL'],
    'sidebar.navigation': ['Main navigation', 'Navegação principal', 'Navegación principal'],
    'sidebar.workspaceInfo': ['Local workspace', 'Espaço de trabalho local', 'Espacio de trabajo local'],
    'sidebar.localStorage': ['Data stays in this browser', 'Os dados ficam neste navegador', 'Los datos quedan en este navegador'],
    'sidebar.logout': ['Log out', 'Sair', 'Cerrar sesión'],
    'nav.dashboard': ['Dashboard', 'Painel', 'Panel'],
    'nav.orders': ['Orders / Services', 'Pedidos / Serviços', 'Pedidos / Servicios'],
    'nav.clients': ['Clients', 'Clientes', 'Clientes'],
    'nav.schedule': ['Schedule', 'Agenda', 'Agenda'],
    'nav.settings': ['Settings', 'Configurações', 'Configuración'],
    'header.workspace': ['Workspace', 'Espaço de trabalho', 'Espacio de trabajo'],
    'header.overview': ['Overview', 'Visão geral', 'Resumen'],
    'header.profile': ['{name} profile', 'Perfil de {name}', 'Perfil de {name}'],
    'language.label': ['Select language', 'Selecionar idioma', 'Seleccionar idioma'],
    'theme.switchToLight': ['Switch to light theme', 'Mudar para o tema claro', 'Cambiar al tema claro'],
    'theme.switchToDark': ['Switch to dark theme', 'Mudar para o tema escuro', 'Cambiar al tema oscuro'],
    'search.global': ['Search services, clients...', 'Buscar serviços, clientes...', 'Buscar servicios y clientes...'],
    'search.orders': ['Search orders...', 'Buscar pedidos...', 'Buscar pedidos...'],
    'welcome.title': ['Welcome back, {name}', 'Boas-vindas, {name}', 'Te damos la bienvenida, {name}'],
    'welcome.copy': ['Here’s what’s happening with your services today.', 'Veja o que está acontecendo com seus serviços hoje.', 'Esto es lo que ocurre hoy con tus servicios.'],
    'actions.newService': ['New service', 'Novo serviço', 'Nuevo servicio'],
    'actions.quickOrder': ['Quick New Order', 'Novo pedido rápido', 'Nuevo pedido rápido'],
    'dashboard.activity': ['ACTIVITY', 'ATIVIDADE', 'ACTIVIDAD'],
    'dashboard.recentOrders': ['Recent orders', 'Pedidos recentes', 'Pedidos recientes'],
    'dashboard.deadlines': ['DEADLINES', 'PRAZOS', 'FECHAS LÍMITE'],
    'dashboard.upcomingDeadlines': ['Upcoming deadlines', 'Próximos prazos', 'Próximas fechas límite'],
    'dashboard.insights': ['INSIGHTS', 'ANÁLISE', 'ANÁLISIS'],
    'dashboard.revenueOverview': ['Order value by month', 'Valor dos pedidos por mês', 'Valor de pedidos por mes'],
    'dashboard.revenueChart': ['Monthly order value chart', 'Gráfico mensal do valor dos pedidos', 'Gráfico mensual del valor de los pedidos'],
    'dashboard.noRecentOrders': ['No orders yet.', 'Ainda não há pedidos.', 'Aún no hay pedidos.'],
    'dashboard.noUpcomingDeadlines': ['No upcoming deadlines.', 'Nenhum prazo próximo.', 'No hay fechas próximas.'],
    'dashboard.monthlyRevenue': ['Orders (R$)', 'Pedidos (R$)', 'Pedidos (R$)'],
    'filter.all': ['All', 'Todos', 'Todos'],
    'filter.active': ['Scheduled / Pending / In Progress', 'Agendado / Pendente / Em andamento', 'Programado / Pendiente / En curso'],
    'filter.approval': ['Awaiting Approval', 'Aguardando aprovação', 'Esperando aprobación'],
    'filter.completed': ['Completed', 'Concluído', 'Completado'],
    'agenda.timelineTitle': ['Milestone timeline', 'Linha do tempo das etapas', 'Cronología de hitos'],
    'agenda.filterLabel': ['Filter milestones by date', 'Filtrar etapas por data', 'Filtrar hitos por fecha'],
    'agenda.today': ['Today', 'Hoje', 'Hoy'],
    'agenda.nextWeek': ['Next 7 Days', 'Próximos 7 dias', 'Próximos 7 días'],
    'agenda.overdue': ['Overdue', 'Atrasados', 'Atrasados'],
    'agenda.progress': ['{completed} of {total} milestones complete', '{completed} de {total} etapas concluídas', '{completed} de {total} hitos completados'],
    'agenda.empty': ['No milestones match this timeframe.', 'Nenhuma etapa neste período.', 'No hay hitos en este período.'],
    'clients.historyTitle': ['Service history', 'Histórico de serviços', 'Historial de servicios'],
    'clients.noHistory': ['No service history for this client yet.', 'Este cliente ainda não possui histórico de serviços.', 'Este cliente aún no tiene historial de servicios.'],
    'clients.totalSpent': ['Total expenditure', 'Total gasto', 'Gasto total'],
    'clients.completedServices': ['Completed services', 'Serviços concluídos', 'Servicios completados'],
    'clients.lastRequest': ['Last request', 'Último pedido', 'Última solicitud'],
    'clients.historySteps': ['Milestones', 'Etapas', 'Hitos'],
    'metrics.label': ['Overview metrics', 'Métricas gerais', 'Métricas generales'],
    'metrics.allRecords': ['All records', 'Todos os registros', 'Todos los registros'],
    'metrics.totalOrders': ['Total Orders', 'Total de pedidos', 'Total de pedidos'],
    'metrics.savedWorkspace': ['Saved in this workspace', 'Salvos neste espaço', 'Guardados en este espacio'],
    'metrics.liveCount': ['Live count', 'Atualizado agora', 'Conteo actualizado'],
    'metrics.completedServices': ['Completed Services', 'Serviços concluídos', 'Servicios completados'],
    'metrics.completedCaption': ['Successfully completed', 'Finalizados com sucesso', 'Finalizados correctamente'],
    'metrics.currentTotal': ['Current total', 'Total atual', 'Total actual'],
    'metrics.revenue': ['Order value', 'Valor dos pedidos', 'Valor de pedidos'],
    'metrics.revenueCaption': ['Excluding cancelled orders', 'Sem pedidos cancelados', 'Sin pedidos cancelados'],
    'storage.unavailable': [
        'Browser storage is unavailable. Changes will not be saved after this page is closed.',
        'O armazenamento do navegador está indisponível. As alterações não serão mantidas quando esta página for fechada.',
        'El almacenamiento del navegador no está disponible. Los cambios no se conservarán al cerrar esta página.'
    ],
    'metrics.needsAttention': ['Needs attention', 'Atenção necessária', 'Requiere atención'],
    'metrics.pendingSteps': ['Pending Steps', 'Etapas pendentes', 'Pasos pendientes'],
    'metrics.stepsLeft': ['Steps left to complete', 'Etapas restantes', 'Pasos por completar'],
    'orders.kicker': ['SERVICE MANAGEMENT', 'GESTÃO DE SERVIÇOS', 'GESTIÓN DE SERVICIOS'],
    'orders.title': ['Orders & services', 'Pedidos e serviços', 'Pedidos y servicios'],
    'orders.subtitle': ['Keep track of your clients and every scheduled milestone.', 'Acompanhe seus clientes e cada etapa agendada.', 'Sigue a tus clientes y cada paso programado.'],
    'orders.filter': ['Filter by status', 'Filtrar por status', 'Filtrar por estado'],
    'orders.deleteTitle': ['Delete this order?', 'Excluir este pedido?', '¿Eliminar este pedido?'],
    'orders.countOne': ['Showing {count} service', 'Exibindo {count} serviço', 'Mostrando {count} servicio'],
    'orders.countMany': ['Showing {count} services', 'Exibindo {count} serviços', 'Mostrando {count} servicios'],
    'status.all': ['All status', 'Todos os status', 'Todos los estados'],
    'status.scheduled': ['Scheduled', 'Agendado', 'Programado'],
    'status.inProgress': ['In Progress', 'Em andamento', 'En curso'],
    'status.completed': ['Completed', 'Concluído', 'Completado'],
    'status.cancelled': ['Cancelled', 'Cancelado', 'Cancelado'],
    'status.pending': ['Pending', 'Pendente', 'Pendiente'],
    'status.awaitingApproval': ['Awaiting Approval', 'Aguardando aprovação', 'Esperando aprobación'],
    'table.client': ['CLIENT', 'CLIENTE', 'CLIENTE'],
    'table.service': ['SERVICE', 'SERVIÇO', 'SERVICIO'],
    'table.value': ['VALUE', 'VALOR', 'VALOR'],
    'table.nextStep': ['NEXT SCHEDULED STEP', 'PRÓXIMA ETAPA', 'PRÓXIMO PASO'],
    'table.status': ['STATUS', 'STATUS', 'ESTADO'],
    'table.actions': ['ACTIONS', 'AÇÕES', 'ACCIONES'],
    'table.allStepsComplete': ['All steps complete', 'Todas as etapas concluídas', 'Todos los pasos completados'],
    'table.noSteps': ['No steps scheduled', 'Nenhuma etapa agendada', 'Sin pasos programados'],
    'schedule.kicker': ['UP NEXT', 'A SEGUIR', 'A CONTINUACIÓN'],
    'schedule.title': ['Upcoming schedule', 'Próximos horários', 'Próxima agenda'],
    'schedule.empty': ['No upcoming milestones. Add steps to a service to see them here.', 'Nenhuma etapa próxima. Adicione etapas a um serviço para vê-las aqui.', 'No hay próximos hitos. Añade pasos a un servicio para verlos aquí.'],
    'clients.kicker': ['YOUR NETWORK', 'SUA REDE', 'TU RED'],
    'clients.title': ['Clients', 'Clientes', 'Clientes'],
    'clients.countOne': ['{count} client', '{count} cliente', '{count} cliente'],
    'clients.countMany': ['{count} clients', '{count} clientes', '{count} clientes'],
    'clients.empty': ['Client contacts will appear here when you create a service.', 'Os contatos aparecerão aqui quando você cadastrar um serviço.', 'Los contactos aparecerán aquí cuando crees un servicio.'],
    'clients.noContact': ['No contact details', 'Sem dados de contato', 'Sin datos de contacto'],
    'clients.unknown': ['Unknown client', 'Cliente desconhecido', 'Cliente desconocido'],
    'clients.open': ['Open client list', 'Abrir lista de clientes', 'Abrir lista de clientes'],
    'clients.noneNow': ['No clients at the moment', 'Nenhum cliente no momento', 'Ningún cliente por el momento'],
    'profile.menu.personal': ['👤 Personal details', '👤 Dados Pessoais', '👤 Datos personales'],
    'profile.menu.settings': ['⚙️ Settings', '⚙️ Configurações', '⚙️ Configuración'],
    'profile.menu.logout': ['🚪 Log out', '🚪 Sair', '🚪 Cerrar sesión'],
    'profile.modal.kicker': ['PERSONAL PROFILE', 'PERFIL PESSOAL', 'PERFIL PERSONAL'],
    'profile.modal.title': ['Personal details', 'Dados Pessoais', 'Datos personales'],
    'profile.modal.photo': ['Profile photo URL', 'URL da foto do perfil', 'URL de la foto de perfil'],
    'profile.modal.photoPlaceholder': ['https://example.com/photo.jpg', 'https://exemplo.com/foto.jpg', 'https://ejemplo.com/foto.jpg'],
    'profile.modal.photoHint': ['Add an image URL, or leave it empty to use your initials.', 'Informe a URL de uma imagem ou deixe vazio para exibir suas iniciais.', 'Añade la URL de una imagen o déjala vacía para mostrar tus iniciales.'],
    'profile.modal.save': ['Save profile', 'Salvar perfil', 'Guardar perfil'],
    'settings.title': ['Workspace settings', 'Configurações do espaço', 'Configuración del espacio'],
    'settings.branding': ['Workspace branding', 'Identidade do espaço', 'Marca del espacio'],
    'settings.copy': ['Data is saved in this browser. Connect a backend to share it with your team.', 'Os dados ficam salvos neste navegador. Conecte um backend para compartilhar com sua equipe.', 'Los datos se guardan en este navegador. Conecta un backend para compartirlos con tu equipo.'],
    'settings.workspaceName': ['Workspace / Business Name', 'Nome do espaço / negócio', 'Nombre del espacio / negocio'],
    'settings.adminName': ['Administrator Name', 'Nome do administrador', 'Nombre del administrador'],
    'settings.saveBranding': ['Save branding', 'Salvar identidade', 'Guardar identidad'],
    'settings.saved': ['Workspace branding saved.', 'Identidade do espaço salva.', 'Identidad del espacio guardada.'],
    'settings.language': ['LANGUAGE', 'IDIOMA', 'IDIOMA'],
    'settings.languageTitle': ['Language preference', 'Preferência de idioma', 'Preferencia de idioma'],
    'settings.appearance': ['APPEARANCE', 'APARÊNCIA', 'APARIENCIA'],
    'settings.themeTitle': ['Color theme', 'Tema de cores', 'Tema de color'],
    'settings.themeCopy': ['Switch between light and dark appearance.', 'Alterne entre a aparência clara e escura.', 'Cambia entre la apariencia clara y oscura.'],
    'settings.data': ['DATA', 'DADOS', 'DATOS'],
    'settings.backupTitle': ['Backup & storage', 'Backup e armazenamento', 'Copia de seguridad y almacenamiento'],
    'settings.export': ['Export Data (JSON)', 'Exportar dados (JSON)', 'Exportar datos (JSON)'],
    'settings.import': ['Import Data', 'Importar dados', 'Importar datos'],
    'settings.reset': ['Reset Workspace', 'Redefinir espaço', 'Restablecer espacio'],
    'settings.exported': ['Backup downloaded.', 'Backup baixado.', 'Copia descargada.'],
    'settings.imported': ['Backup restored successfully.', 'Backup restaurado com sucesso.', 'Copia restaurada correctamente.'],
    'settings.importInvalid': ['Could not import this file. Check that it is a valid workspace JSON backup.', 'Não foi possível importar o arquivo. Verifique se é um backup JSON válido.', 'No se pudo importar el archivo. Comprueba que sea una copia JSON válida.'],
    'settings.operationFailed': ['The backup could not be saved. Check available browser storage and try again.', 'Não foi possível salvar o backup. Verifique o armazenamento disponível no navegador e tente novamente.', 'No se pudo guardar la copia. Comprueba el almacenamiento disponible en el navegador e inténtalo de nuevo.'],
    'settings.warning': ['WARNING', 'ATENÇÃO', 'ADVERTENCIA'],
    'settings.resetTitle': ['Reset workspace?', 'Redefinir espaço?', '¿Restablecer espacio?'],
    'settings.resetWarning': ['This permanently removes workspace orders, clients and branding stored in this browser.', 'Isso remove permanentemente pedidos, clientes e identidade do espaço salvos neste navegador.', 'Esto elimina permanentemente los pedidos, clientes y la identidad del espacio guardados en este navegador.'],
    'settings.confirmReset': ['Reset everything', 'Redefinir tudo', 'Restablecer todo'],
    'settings.resetDone': ['Workspace reset. All local orders and clients were removed.', 'Espaço redefinido. Todos os pedidos e clientes locais foram removidos.', 'Espacio restablecido. Se eliminaron los pedidos y clientes locales.'],
    'footer.copyright': ['© 2026 G.Arts Workspace', '© 2026 G.Arts Workspace', '© 2026 G.Arts Workspace'],
    'footer.saved': ['All changes are saved automatically', 'As alterações são salvas automaticamente', 'Todos los cambios se guardan automáticamente'],
    'form.kicker': ['SERVICE DETAILS', 'DADOS DO SERVIÇO', 'DETALLES DEL SERVICIO'],
    'form.createTitle': ['Create a service', 'Criar serviço', 'Crear servicio'],
    'form.editTitle': ['Edit service', 'Editar serviço', 'Editar servicio'],
    'form.clientContact': ['Client contact', 'Contato do cliente', 'Contacto del cliente'],
    'form.existingClient': ['Existing client', 'Cliente existente', 'Cliente existente'],
    'form.newClient': ['Add a new client', 'Adicionar cliente', 'Añadir cliente'],
    'form.clientName': ['Client name', 'Nome do cliente', 'Nombre del cliente'],
    'form.phone': ['Phone / WhatsApp', 'Telefone / WhatsApp', 'Teléfono / WhatsApp'],
    'form.email': ['Email', 'E-mail', 'Correo electrónico'],
    'form.orderInfo': ['Order information', 'Dados do pedido', 'Datos del pedido'],
    'form.description': ['Service description', 'Descrição do serviço', 'Descripción del servicio'],
    'form.value': ['Total value (R$)', 'Valor total (R$)', 'Valor total (R$)'],
    'form.orderStatus': ['Order status', 'Status do pedido', 'Estado del pedido'],
    'form.steps': ['Scheduled steps', 'Etapas agendadas', 'Pasos programados'],
    'form.stepsHint': ['Add milestones with a date and time.', 'Adicione etapas com data e horário.', 'Añade hitos con fecha y hora.'],
    'form.milestone': ['Milestone', 'Etapa', 'Hito'],
    'form.dateTime': ['Date & time', 'Data e horário', 'Fecha y hora'],
    'form.stepStatus': ['Status', 'Status', 'Estado'],
    'placeholder.clientName': ['Full name', 'Nome completo', 'Nombre completo'],
    'placeholder.phone': ['+55 (11) 99999-9999', '+55 (11) 99999-9999', '+55 (11) 99999-9999'],
    'placeholder.email': ['client@email.com', 'cliente@email.com', 'cliente@ejemplo.com'],
    'placeholder.description': ['Describe the service', 'Descreva o serviço', 'Describe el servicio'],
    'placeholder.value': ['0.00', '0,00', '0,00'],
    'placeholder.milestone': ['e.g. Initial consultation', 'Ex.: Consulta inicial', 'Ej.: Consulta inicial'],
    'actions.close': ['Close', 'Fechar', 'Cerrar'],
    'actions.removeStep': ['Remove step', 'Remover etapa', 'Eliminar paso'],
    'actions.cancel': ['Cancel', 'Cancelar', 'Cancelar'],
    'actions.save': ['Save service', 'Salvar serviço', 'Guardar servicio'],
    'actions.saveChanges': ['Save changes', 'Salvar alterações', 'Guardar cambios'],
    'actions.addStep': ['＋ Add step', '＋ Adicionar etapa', '＋ Añadir paso'],
    'actions.timeline': ['Timeline', 'Etapas', 'Cronología'],
    'actions.edit': ['Edit service', 'Editar serviço', 'Editar servicio'],
    'actions.delete': ['Delete service', 'Excluir serviço', 'Eliminar servicio'],
    'actions.timelineFor': ['View timeline for {service}', 'Ver etapas de {service}', 'Ver cronología de {service}'],
    'actions.editFor': ['Edit {service}', 'Editar {service}', 'Editar {service}'],
    'actions.deleteFor': ['Delete {service}', 'Excluir {service}', 'Eliminar {service}'],
    'actions.whatsapp': ['Send WhatsApp Message', 'Enviar mensagem pelo WhatsApp', 'Enviar mensaje por WhatsApp'],
    'actions.whatsappShort': ['WhatsApp', 'WhatsApp', 'WhatsApp'],
    'timeline.kicker': ['SERVICE TIMELINE', 'LINHA DO TEMPO', 'CRONOLOGÍA DEL SERVICIO'],
    'timeline.title': ['Service schedule', 'Agenda do serviço', 'Agenda del servicio'],
    'timeline.noSteps': ['There are no milestones on this service yet. Edit the service to add steps.', 'Este serviço ainda não tem etapas. Edite o serviço para adicionar etapas.', 'Este servicio aún no tiene hitos. Edítalo para añadir pasos.'],
    'timeline.summaryZero': ['{amount} · No scheduled milestones', '{amount} · Nenhuma etapa agendada', '{amount} · Sin hitos programados'],
    'timeline.summaryOne': ['{amount} · 1 scheduled step', '{amount} · 1 etapa agendada', '{amount} · 1 paso programado'],
    'timeline.summaryMany': ['{amount} · {count} scheduled steps', '{amount} · {count} etapas agendadas', '{amount} · {count} pasos programados'],
    'timeline.changeStepStatus': ['Change status for {step}', 'Alterar status de {step}', 'Cambiar estado de {step}'],
    'empty.matches': ['No services match your search.', 'Nenhum serviço corresponde à busca.', 'Ningún servicio coincide con la búsqueda.'],
    'empty.orders': ['No services yet. Create your first service to get started.', 'Ainda não há serviços. Crie o primeiro para começar.', 'Aún no hay servicios. Crea el primero para empezar.'],
    'confirm.delete': ['Delete this service and its scheduled steps?', 'Excluir este serviço e suas etapas agendadas?', '¿Eliminar este servicio y sus pasos programados?'],
    'alert.logout': ['This local workspace does not have an authentication session.', 'Este espaço local não possui uma sessão de autenticação.', 'Este espacio local no tiene una sesión de autenticación.'],
    'whatsapp.orderMessage': ['Hello {name}! This is an update about your service: {service}. Current order status: {status}.', 'Olá, {name}! Esta é uma atualização sobre seu serviço: {service}. Status atual do pedido: {status}.', 'Hola, {name}. Esta es una actualización sobre tu servicio: {service}. Estado actual: {status}.'],
    'whatsapp.contactMessage': ['Hello {name}! How can we help you today?', 'Olá, {name}! Como podemos ajudar você hoje?', 'Hola, {name}. ¿Cómo podemos ayudarte hoy?'],
    'whatsapp.stepMessage': ['Hello {name}! The {step} milestone for {service} is scheduled for {date}. Current status: {status}.', 'Olá, {name}! A etapa {step} do serviço {service} está prevista para {date}. Status atual: {status}.', 'Hola, {name}. El paso {step} del servicio {service} está programado para {date}. Estado actual: {status}.']
};

export const i18n = Object.fromEntries(idiomasSuportados.map((idioma, indice) => [
    idioma,
    Object.fromEntries(Object.entries(traducoesPorChave).map(([chave, valores]) => [chave, valores[indice]]))
]));

const idiomaSalvo = lerArmazenamento(CHAVE_IDIOMA);
let idiomaAtual = idiomasSuportados.includes(idiomaSalvo) ? idiomaSalvo : 'pt-BR';

export function obterIdioma() {
    return idiomaAtual;
}

export function obterLocale() {
    return locales[idiomaAtual];
}

export function traduzir(chave, valores = {}) {
    let texto = i18n[idiomaAtual][chave] || i18n.en[chave] || chave;
    Object.entries(valores).forEach(([nome, valor]) => {
        texto = texto.replaceAll(`{${nome}}`, String(valor));
    });
    return texto;
}

function traduzirElementos(root) {
    root.querySelectorAll('[data-i18n]').forEach(elemento => {
        elemento.textContent = traduzir(elemento.dataset.i18n);
    });
    root.querySelectorAll('[data-i18n-placeholder]').forEach(elemento => {
        elemento.setAttribute('placeholder', traduzir(elemento.dataset.i18nPlaceholder));
    });
    root.querySelectorAll('[data-i18n-aria]').forEach(elemento => {
        elemento.setAttribute('aria-label', traduzir(elemento.dataset.i18nAria));
    });
    root.querySelectorAll('[data-i18n-title]').forEach(elemento => {
        elemento.setAttribute('title', traduzir(elemento.dataset.i18nTitle));
    });
}

function aplicarIdioma() {
    document.documentElement.lang = idiomaAtual === 'pt-BR' ? 'pt-BR' : idiomaAtual;
    document.title = traduzir('app.title');
    document.getElementById('lang-selector').value = idiomaAtual;
    document.getElementById('settings-language-selector').value = idiomaAtual;
    document.getElementById('welcome-date').textContent = new Date().toLocaleDateString(obterLocale(), {
        weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
    });
    traduzirElementos(document);
    traduzirElementos(document.getElementById('step-template').content);
}

export function inicializarIdioma(aoTrocarIdioma) {
    const seletoresIdioma = [
        document.getElementById('lang-selector'),
        document.getElementById('settings-language-selector')
    ];
    seletoresIdioma.forEach(seletorIdioma => seletorIdioma.addEventListener('change', () => {
        const idiomaSelecionado = seletorIdioma.value;
        idiomaAtual = idiomasSuportados.includes(idiomaSelecionado) ? idiomaSelecionado : 'en';
        gravarArmazenamento(CHAVE_IDIOMA, idiomaAtual);
        aplicarIdioma();
        aoTrocarIdioma();
    }));

    aplicarIdioma();
}