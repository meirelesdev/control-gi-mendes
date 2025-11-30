/**
 * Aplicação Principal - Gi Finanças
 * Gerencia navegação e inicialização das views
 */
import { DashboardView } from './views/DashboardView.js';
import { EventDetailView } from './views/EventDetailView.js';
import { SettingsView } from './views/SettingsView.js';

class App {
  constructor(dependencies) {
    this.dependencies = dependencies;
    this.currentView = 'dashboard';
    this.currentEventId = null;
    this.init();
  }

  init() {
    this.setupNavigation();
    this.setupEventListeners();
    this.render();
  }

  setupNavigation() {
    // Event listeners para abas
    document.querySelectorAll('.tab-button').forEach(btn => {
      btn.addEventListener('click', () => {
        const view = btn.dataset.view;
        this.navigateTo(view);
      });
    });

    // Event listener para navegação customizada (ex: ir para detalhe do evento)
    window.addEventListener('navigate', (e) => {
      const { view, eventId } = e.detail;
      if (view === 'event-detail' && eventId) {
        this.currentEventId = eventId;
        this.navigateTo('event-detail');
      }
    });
  }

  setupEventListeners() {
    // Botão voltar do detalhe do evento
    window.addEventListener('popstate', () => {
      if (this.currentView === 'event-detail') {
        this.navigateTo('dashboard');
      }
    });
  }

  navigateTo(view) {
    // Atualiza abas
    document.querySelectorAll('.tab-button').forEach(btn => {
      btn.classList.remove('active');
      if (btn.dataset.view === view) {
        btn.classList.add('active');
      }
    });

    // Oculta todos os conteúdos
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.remove('active');
    });

    // Mostra conteúdo selecionado
    this.currentView = view;
    this.render();
  }

  async render() {
    const { 
      eventRepository, 
      transactionRepository, 
      settingsRepository,
      addTransaction,
      updateSettings
    } = this.dependencies;

    if (this.currentView === 'dashboard') {
      const dashboardView = new DashboardView(
        eventRepository,
        transactionRepository,
        settingsRepository,
        this.dependencies.createEvent
      );
      const content = document.getElementById('dashboard-content');
      if (content) {
        content.classList.add('active');
        await dashboardView.render();
      }
    } else if (this.currentView === 'event-detail') {
      const eventDetailView = new EventDetailView(
        eventRepository,
        transactionRepository,
        settingsRepository,
        addTransaction
      );
      const content = document.getElementById('event-detail-content');
      if (content) {
        content.classList.add('active');
        if (this.currentEventId) {
          await eventDetailView.render(this.currentEventId);
        }
      }
    } else if (this.currentView === 'settings') {
      const settingsView = new SettingsView(
        settingsRepository,
        updateSettings
      );
      const content = document.getElementById('settings-content');
      if (content) {
        content.classList.add('active');
        await settingsView.render();
      }
    }
  }
}

// Export para uso em módulos ES6
export { App };

