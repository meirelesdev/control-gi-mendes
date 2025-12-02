/**
 * View: Dashboard
 * Exibe lista de eventos ativos e card com total a receber
 */
class DashboardView {
  constructor(eventRepository, transactionRepository, settingsRepository, createEventUseCase = null) {
    this.eventRepository = eventRepository;
    this.transactionRepository = transactionRepository;
    this.settingsRepository = settingsRepository;
    this.createEventUseCase = createEventUseCase;
    this.currentFilter = 'all'; // 'all', 'pending', 'paid'
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

      let activeEvents = events.filter(e => e.status !== 'CANCELLED');
      
      // Aplica filtro de status
      if (this.currentFilter === 'pending') {
        // A Receber: DONE ou REPORT_SENT
        activeEvents = activeEvents.filter(e => 
          e.status === 'DONE' || 
          e.status === 'REPORT_SENT' || 
          e.status === 'COMPLETED' ||
          e.status === 'IN_PROGRESS'
        );
      } else if (this.currentFilter === 'paid') {
        // Pagos: PAID
        activeEvents = activeEvents.filter(e => e.status === 'PAID');
      }
      // 'all' não filtra nada

      // Calcula total a receber em aberto (apenas eventos realizados ou com relatório enviado)
      let totalToReceive = 0;
      const eventsToReceive = events.filter(e => 
        e.status !== 'CANCELLED' && 
        (e.status === 'DONE' || e.status === 'REPORT_SENT' || e.status === 'COMPLETED' || e.status === 'IN_PROGRESS')
      );
      
      for (const event of eventsToReceive) {
        const transactions = await this.transactionRepository.findByEventId(event.id);
        const expenses = transactions.filter(t => t.type === 'EXPENSE');
        const fees = transactions.filter(t => 
          t.type === 'INCOME' && 
          (t.metadata.category === 'diaria' || t.metadata.category === 'hora_extra' || 
           t.metadata.isReimbursement === false)
        );
        // Total a receber = Honorários (lucro) + Despesas (reembolsos)
        totalToReceive += fees.reduce((sum, f) => sum + f.amount, 0) + 
                          expenses.reduce((sum, e) => sum + e.amount, 0);
      }

      // Renderiza
      container.innerHTML = `
        <div class="card-highlight">
          <div class="card-title">Total a Receber em Aberto</div>
          <div class="card-value">${this.formatCurrency(totalToReceive)}</div>
          <div class="card-subtitle">${activeEvents.length} evento(s) ativo(s)</div>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--spacing-md);">
          <h2 style="margin: 0;">Eventos Ativos</h2>
          ${this.createEventUseCase ? `
            <button class="btn btn-primary" id="btn-create-event">
              ➕ Novo Evento
            </button>
          ` : ''}
        </div>

        <div class="card" style="margin-bottom: var(--spacing-md);">
          <div style="display: flex; gap: var(--spacing-sm); flex-wrap: wrap;">
            <button class="btn btn-sm ${this.currentFilter === 'all' ? 'btn-primary' : 'btn-secondary'}" 
                    id="filter-all" data-filter="all">
              Todos
            </button>
            <button class="btn btn-sm ${this.currentFilter === 'pending' ? 'btn-primary' : 'btn-secondary'}" 
                    id="filter-pending" data-filter="pending">
              A Receber
            </button>
            <button class="btn btn-sm ${this.currentFilter === 'paid' ? 'btn-primary' : 'btn-secondary'}" 
                    id="filter-paid" data-filter="paid">
              Pagos
            </button>
          </div>
        </div>
        
        ${activeEvents.length === 0 ? `
          <div class="empty-state">
            <div class="empty-state-icon">📅</div>
            <p>Nenhum evento ativo no momento.</p>
            ${this.createEventUseCase ? `
              <button class="btn btn-primary" style="margin-top: var(--spacing-md);" id="btn-create-event-empty">
                ➕ Criar Primeiro Evento
              </button>
            ` : ''}
          </div>
        ` : `
          <div class="event-list">
            ${activeEvents.map(event => this.renderEventItem(event)).join('')}
          </div>
        `}
      `;

      // Adiciona event listeners para filtros
      container.querySelectorAll('[data-filter]').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const filter = btn.dataset.filter;
          this.currentFilter = filter;
          this.render();
        });
      });

      // Adiciona event listeners
      container.querySelectorAll('.event-item').forEach(item => {
        item.addEventListener('click', () => {
          const eventId = item.dataset.eventId;
          this.navigateToEvent(eventId);
        });
      });

      // Event listener para criar evento
      if (this.createEventUseCase) {
        // Usa event delegation para garantir que funciona mesmo se o botão for adicionado depois
        container.addEventListener('click', (e) => {
          if (e.target.id === 'btn-create-event' || e.target.id === 'btn-create-event-empty' || 
              e.target.closest('#btn-create-event') || e.target.closest('#btn-create-event-empty')) {
            e.preventDefault();
            e.stopPropagation();
            this.showCreateEventModal();
          }
        });

        // Também adiciona listeners diretos como fallback
        const btnCreate = container.querySelector('#btn-create-event');
        const btnCreateEmpty = container.querySelector('#btn-create-event-empty');
        
        if (btnCreate) {
          btnCreate.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.showCreateEventModal();
          });
        }
        
        if (btnCreateEmpty) {
          btnCreateEmpty.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.showCreateEventModal();
          });
        }

        // Listener global para o FAB (botão flutuante)
        window.addEventListener('create-new-event', () => {
          // Só abre o modal se estiver na view do dashboard
          const container = document.getElementById('dashboard-content');
          if (container && container.classList.contains('active')) {
            this.showCreateEventModal();
          }
        });
      }
    } catch (error) {
      container.innerHTML = `
        <div class="card" style="border-left-color: var(--color-danger);">
          <p style="color: var(--color-danger);">Erro ao carregar dashboard: ${error.message}</p>
        </div>
      `;
    }
  }

  renderEventItem(event) {
    const statusConfig = this._getStatusConfig(event.status);

    return `
      <div class="event-item" data-event-id="${event.id}">
        <div class="event-item-header">
          <div class="event-item-name">${this.escapeHtml(event.name)}</div>
          <span class="badge" style="background-color: ${statusConfig.badgeColor}; color: ${statusConfig.badgeTextColor};">
            ${statusConfig.label}
          </span>
        </div>
        <div class="event-item-date">${this.formatDate(event.date)}</div>
        ${event.expectedPaymentDate ? `
          <div class="text-muted" style="font-size: 0.9em; margin-top: var(--spacing-xs);">
            💰 Pagamento previsto: ${this.formatDate(event.expectedPaymentDate)}
          </div>
        ` : ''}
      </div>
    `;
  }

  /**
   * Retorna configuração visual do status
   * @private
   */
  _getStatusConfig(status) {
    const configs = {
      'PLANNED': {
        label: 'Planejado',
        badgeColor: '#6b7280', // Cinza
        badgeTextColor: '#fff'
      },
      'DONE': {
        label: 'Realizado',
        badgeColor: '#3b82f6', // Azul
        badgeTextColor: '#fff'
      },
      'COMPLETED': {
        label: 'Realizado',
        badgeColor: '#3b82f6', // Azul (compatibilidade)
        badgeTextColor: '#fff'
      },
      'IN_PROGRESS': {
        label: 'Em Andamento',
        badgeColor: '#3b82f6', // Azul (compatibilidade)
        badgeTextColor: '#fff'
      },
      'REPORT_SENT': {
        label: 'Relatório Enviado',
        badgeColor: '#f97316', // Laranja
        badgeTextColor: '#fff'
      },
      'PAID': {
        label: 'Pago',
        badgeColor: '#22c55e', // Verde
        badgeTextColor: '#fff'
      }
    };

    return configs[status] || configs['PLANNED'];
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

  showCreateEventModal() {
    const modal = document.createElement('div');
    modal.className = 'modal-backdrop active';
    modal.innerHTML = `
      <div class="modal" style="max-width: 500px;">
        <div class="modal-header">
          <h2>Criar Novo Evento</h2>
          <button class="modal-close" id="modal-close-create">×</button>
        </div>
        <div class="modal-body">
          <form id="form-create-event">
            <div class="form-group">
              <label class="form-label">Nome do Evento *</label>
              <input type="text" class="form-input" id="event-name" required 
                     placeholder="Ex: Evento Corporativo - Empresa XYZ">
            </div>
            <div class="form-group">
              <label class="form-label">Data do Evento *</label>
              <input type="date" class="form-input" id="event-date" required>
            </div>
            <div class="form-group">
              <label class="form-label">Descrição (opcional)</label>
              <textarea class="form-input" id="event-description" rows="3" 
                        placeholder="Detalhes sobre o evento..."></textarea>
            </div>
            <div class="form-group">
              <label style="display: flex; align-items: center; gap: var(--spacing-sm); cursor: pointer;">
                <input type="checkbox" id="auto-create-daily" checked style="cursor: pointer;">
                <span>Lançar Diária Padrão Automaticamente (R$ 300,00)</span>
              </label>
              <small class="text-muted" style="display: block; margin-top: var(--spacing-xs); margin-left: 24px;">
                Cria automaticamente uma receita de "Diária Técnica Padrão" ao criar o evento
              </small>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" id="btn-cancel-create">Cancelar</button>
              <button type="submit" class="btn btn-primary">Criar Evento</button>
            </div>
          </form>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Aguarda o DOM estar pronto antes de adicionar listeners
    setTimeout(() => {
      // Preenche data de hoje como padrão
      const dateInput = modal.querySelector('#event-date');
      if (dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.value = today;
      }

      // Event listeners
      const closeModal = () => {
        if (document.body.contains(modal)) {
          document.body.removeChild(modal);
        }
      };

      const closeBtn = modal.querySelector('#modal-close-create');
      const cancelBtn = modal.querySelector('#btn-cancel-create');
      const form = modal.querySelector('#form-create-event');

      if (closeBtn) {
        closeBtn.addEventListener('click', closeModal);
      }

      if (cancelBtn) {
        cancelBtn.addEventListener('click', closeModal);
      }

      // Fecha ao clicar no backdrop
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          closeModal();
        }
      });

      // Previne fechamento ao clicar dentro do modal
      const modalContent = modal.querySelector('.modal');
      if (modalContent) {
        modalContent.addEventListener('click', (e) => {
          e.stopPropagation();
        });
      }

      if (form) {
        form.addEventListener('submit', async (e) => {
          e.preventDefault();
          await this.createEvent(modal);
        });
      }
    }, 0);
  }

  async createEvent(modal) {
    const name = document.getElementById('event-name').value.trim();
    const date = document.getElementById('event-date').value;
    const description = document.getElementById('event-description').value.trim();
    const autoCreateDaily = document.getElementById('auto-create-daily').checked;

    if (!name || !date) {
      window.toast.warning('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    try {
      const result = await this.createEventUseCase.execute({
        name,
        date,
        description: description || null,
        autoCreateDaily
      });

      if (result.success) {
        // Fecha o modal
        document.body.removeChild(modal);
        window.toast.success('Evento criado com sucesso!');
        
        // Navega para os detalhes do evento criado
        if (result.data && result.data.id) {
          this.navigateToEvent(result.data.id);
        } else {
          // Fallback: recarrega o dashboard
          await this.render();
        }
      } else {
        window.toast.error(`Erro ao criar evento: ${result.error}`);
      }
    } catch (error) {
      window.toast.error(`Erro ao criar evento: ${error.message}`);
    }
  }
}

// Export para uso em módulos ES6
export { DashboardView };

