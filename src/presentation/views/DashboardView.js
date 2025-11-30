/**
 * View: Dashboard
 * Exibe lista de eventos ativos e card com total a receber
 */
class DashboardView {
  constructor(eventRepository, transactionRepository, settingsRepository) {
    this.eventRepository = eventRepository;
    this.transactionRepository = transactionRepository;
    this.settingsRepository = settingsRepository;
  }

  async render() {
    const container = document.getElementById('dashboard-content');
    if (!container) return;

    container.innerHTML = '<div class="loading">Carregando...</div>';

    try {
      // Busca eventos ativos (não cancelados)
      const events = await this.eventRepository.findAll({
        orderBy: 'date',
        order: 'desc'
      });

      const activeEvents = events.filter(e => e.status !== 'CANCELLED');

      // Calcula total a receber em aberto
      let totalToReceive = 0;
      for (const event of activeEvents) {
        const transactions = await this.transactionRepository.findByEventId(event.id);
        const expenses = transactions.filter(t => t.type === 'EXPENSE');
        const fees = transactions.filter(t => t.type === 'INCOME' && !t.metadata.isReimbursement);
        totalToReceive += expenses.reduce((sum, e) => sum + e.amount, 0) + 
                          fees.reduce((sum, f) => sum + f.amount, 0);
      }

      // Renderiza
      container.innerHTML = `
        <div class="card-highlight">
          <div class="card-title">Total a Receber em Aberto</div>
          <div class="card-value">${this.formatCurrency(totalToReceive)}</div>
          <div class="card-subtitle">${activeEvents.length} evento(s) ativo(s)</div>
        </div>

        <h2 style="margin-bottom: var(--spacing-md);">Eventos Ativos</h2>
        
        ${activeEvents.length === 0 ? `
          <div class="empty-state">
            <div class="empty-state-icon">📅</div>
            <p>Nenhum evento ativo no momento.</p>
          </div>
        ` : `
          <div class="event-list">
            ${activeEvents.map(event => this.renderEventItem(event)).join('')}
          </div>
        `}
      `;

      // Adiciona event listeners
      container.querySelectorAll('.event-item').forEach(item => {
        item.addEventListener('click', () => {
          const eventId = item.dataset.eventId;
          this.navigateToEvent(eventId);
        });
      });
    } catch (error) {
      container.innerHTML = `
        <div class="card" style="border-left-color: var(--color-danger);">
          <p style="color: var(--color-danger);">Erro ao carregar dashboard: ${error.message}</p>
        </div>
      `;
    }
  }

  renderEventItem(event) {
    const statusLabels = {
      'PLANNED': 'Planejado',
      'IN_PROGRESS': 'Em Andamento',
      'COMPLETED': 'Concluído'
    };

    return `
      <div class="event-item" data-event-id="${event.id}">
        <div class="event-item-header">
          <div class="event-item-name">${this.escapeHtml(event.name)}</div>
          <span class="event-item-status">${statusLabels[event.status] || event.status}</span>
        </div>
        <div class="event-item-date">${this.formatDate(event.date)}</div>
      </div>
    `;
  }

  navigateToEvent(eventId) {
    // Dispara evento customizado para mudar de view
    window.dispatchEvent(new CustomEvent('navigate', { 
      detail: { view: 'event-detail', eventId } 
    }));
  }

  formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  }

  formatDate(dateString) {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(date);
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

