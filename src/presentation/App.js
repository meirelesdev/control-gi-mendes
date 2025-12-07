/**
 * Aplicação Principal - Chef Finance
 * Gerencia navegação e inicialização das views
 */
import { DashboardView } from './views/DashboardView.js';
import { EventDetailView } from './views/EventDetailView.js';
import { SettingsView } from './views/SettingsView.js';
import { MonthlyReportView } from './views/MonthlyReportView.js';

class App {
  constructor(dependencies) {
    this.dependencies = dependencies;
    this.currentView = 'dashboard';
    this.currentEventId = null;
    this.init();
  }

  navigateTo(view) {
    this.currentView = view;
    this.render();
  }

  init() {
    this.setupNavigation();
    this.setupEventListeners();
    // Garante que o FAB está visível inicialmente (dashboard)
    const fab = document.getElementById('fab-new-event');
    if (fab) {
      fab.classList.remove('hidden');
    }
    this.render();
  }

  setupNavigation() {
    // Event listeners para bottom navigation
    document.querySelectorAll('.bottom-nav-item').forEach(btn => {
      btn.addEventListener('click', () => {
        const view = btn.dataset.view;
        if (view) {
          this.navigateTo(view);
        }
      });
    });

    // Event listener para FAB (Novo Evento)
    const fabNewEvent = document.getElementById('fab-new-event');
    if (fabNewEvent) {
      fabNewEvent.addEventListener('click', () => {
        // Dispara evento customizado para criar novo evento
        window.dispatchEvent(new CustomEvent('create-new-event'));
      });
    }

    // Event listener para navegação customizada (ex: ir para detalhe do evento ou voltar ao dashboard)
    window.addEventListener('navigate', (e) => {
      const { view, eventId } = e.detail;
      if (view === 'event-detail' && eventId) {
        this.currentEventId = eventId;
        this.navigateTo('event-detail');
      } else if (view === 'dashboard') {
        this.currentEventId = null; // Limpa o ID do evento ao voltar ao dashboard
        this.navigateTo('dashboard');
      } else if (view === 'monthly-report') {
        this.navigateTo('monthly-report');
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
    // Atualiza bottom navigation
    document.querySelectorAll('.bottom-nav-item').forEach(btn => {
      btn.classList.remove('active');
      if (btn.dataset.view === view) {
        btn.classList.add('active');
      }
    });

    // Oculta todos os conteúdos
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.remove('active');
    });

    // Controla visibilidade do FAB (só aparece no dashboard e monthly-report)
    const fab = document.getElementById('fab-new-event');
    if (fab) {
      if (view === 'dashboard' || view === 'monthly-report') {
        fab.classList.remove('hidden');
      } else {
        fab.classList.add('hidden');
      }
    }

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
      deleteTransaction,
      updateSettings,
      generateEventReport,
      generateMonthlyReport,
      updateEventStatus,
      updateEvent,
      updateTransaction,
      deleteEvent
    } = this.dependencies;

    if (this.currentView === 'dashboard') {
      const dashboardView = new DashboardView(
        eventRepository,
        transactionRepository,
        settingsRepository,
        this.dependencies.createEvent,
        generateMonthlyReport,
        this.dependencies.getEventSummary
      );
      const content = document.getElementById('dashboard-content');
      if (content) {
        content.classList.add('active');
        await dashboardView.render();
      }
    } else if (this.currentView === 'monthly-report') {
      const monthlyReportView = new MonthlyReportView(generateMonthlyReport, settingsRepository);
      const content = document.getElementById('monthly-report-content');
      if (content) {
        content.classList.add('active');
        await monthlyReportView.render();
      }
    } else if (this.currentView === 'event-detail') {
      const eventDetailView = new EventDetailView(
        eventRepository,
        transactionRepository,
        settingsRepository,
        addTransaction,
        deleteTransaction,
        generateEventReport,
        updateEventStatus,
        updateEvent,
        updateTransaction,
        deleteEvent,
        this.dependencies.getEventSummary
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
        updateSettings,
        this.dependencies.exportData,
        this.dependencies.importData,
        this.dependencies.exportTransactionsToCSV,
        this.dependencies.eventRepository,
        this.dependencies.transactionRepository
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

