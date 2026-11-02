# 🎨 G.Arts — Sistema de Gerenciamento de Pedidos & Serviços

> Um painel web moderno, responsivo e intuitivo projetado para otimizar o fluxo de trabalho de serviços, controle de clientes e acompanhamento financeiro em tempo real.

![Licença](https://img.shields.io/badge/license-MIT-gold)
![Status](https://img.shields.io/badge/status-Em_Desenvolvimento-indigo)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38BDF8?style=flat&logo=tailwind-css&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?style=flat&logo=javascript&logoColor=black)

---

## 📸 Demonstração do Projeto

| Modo Claro (Light Theme) | Modo Escuro (Dark Theme) |
| :---: | :---: |
| *[Insira aqui uma imagem ou GIF do tema claro]* | *[Insira aqui uma imagem ou GIF do tema escuro]* |

---

## 🚀 Funcionalidades Principais

- **📊 Dashboard & Métricas em Tempo Real:** Visualização de KPIs como total de pedidos, serviços concluídos, etapas pendentes e faturamento.
- **📦 Gestão de Pedidos & Serviços:** Filtros por status, busca em tempo real e integração direta com WhatsApp para contato rápido com o cliente.
- **👥 Controle de Clientes:** Grid responsivo de clientes com histórico de serviços prestados e métricas de consumo.
- **📅 Agenda & Linha do Tempo:** Acompanhamento milestone por milestone dos serviços em andamento.
- **⚙️ Configurações & Personalização:**
  - Alternância dinâmica entre **Modo Claro** e **Modo Escuro (Luxury Navy / Soft Gold)** com persistência em `localStorage`.
  - Suporte a múltiplos idiomas (Português, Inglês e Espanhol).
  - Importação e exportação de backups em formato JSON.
- **⌨️ Atalhos de Teclado:** Busca rápida acessível via `Ctrl + K` (Windows/Linux) ou `Cmd + K` (macOS).

---

## 🛠️ Tecnologias Utilizadas

- **Front-end:** HTML5, CSS3 / Tailwind CSS, JavaScript (ES Modules).
- **Ícones & UI:** [Lucide Icons](https://lucide.dev/).
- **Gráficos:** [Chart.js](https://www.chartjs.org/) (Visão geral de faturamento).
- **Armazenamento:** Web Storage API (`localStorage`).

---

## 📂 Estrutura de Pastas

```text
├── css/
│   ├── components.css    # Estilos de cards, botões, badges e modais
│   ├── layout.css        # Estrutura flex/grid do header e views
│   └── variables.css     # Variáveis CSS de temas (Light/Dark Mode)
├── js/
│   ├── main.js           # Inicialização de módulos e listeners
│   ├── theme.js          # Lógica de alternância e suporte a temas
│   └── ui.js             # Manipulação do DOM e renderização
├── index.html            # Estrutura principal Single Page Application (SPA)
└── README.md             # Documentação do repositório
