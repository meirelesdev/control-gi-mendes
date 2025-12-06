/**
 * View: Dashboard
 * Exibe lista de eventos ativos e card com total a receber
 */
class DashboardView {
  constructor(eventRepository, transactionRepository, settingsRepository, createEventUseCase = null, generateMonthlyReportUseCase = null) {
    this.eventRepository = eventRepository;
    this.transactionRepository = transactionRepository;
    this.settingsRepository = settingsRepository;
    this.createEventUseCase = createEventUseCase;
    this.generateMonthlyReportUseCase = generateMonthlyReportUseCase;
    this.currentFilter = 'all'; // 'all', 'pending', 'paid'
    this._handleCreateNewEvent = null; // Referência para o handler do evento
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

      // Calcula resumo financeiro consolidado apenas de eventos PENDENTES (não pagos e não cancelados)
      let totalUpfrontCost = 0; // Investimento realizado
      let totalNetProfit = 0; // Lucro líquido
      let totalReimbursements = 0; // Reembolsos
      
      // Filtra apenas eventos pendentes (não pagos e não cancelados) para o cálculo consolidado
      const eventsForCalculation = events.filter(e => 
        e.status !== 'CANCELLED' && 
        e.status !== 'PAID' // Exclui eventos pagos do resumo financeiro
      );
      
      for (const event of eventsForCalculation) {
        const transactions = await this.transactionRepository.findByEventId(event.id);
        
        // Separa transações
        const expenses = transactions.filter(t => t.type === 'EXPENSE');
        const incomes = transactions.filter(t => t.type === 'INCOME');
        
        // Honorários (Lucro): Diárias e Horas Extras
        const fees = incomes.filter(t => 
          (t.metadata.category === 'diaria' || t.metadata.category === 'hora_extra') &&
          t.metadata.isReimbursement !== true
        );
        
        // Reembolsos: KM e Tempo de Viagem
        const reimbursements = incomes.filter(t => 
          t.metadata.category === 'km' || 
          t.metadata.category === 'tempo_viagem' ||
          t.metadata.isReimbursement === true
        );
        
        // KM (gasolina paga hoje)
        const kmTransactions = reimbursements.filter(r => r.metadata.category === 'km');
        const travelTimeTransactions = reimbursements.filter(r => r.metadata.category === 'tempo_viagem');
        
        // Calcula valores do evento (mesma lógica do EventDetailView)
        const eventExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
        const eventKmCost = kmTransactions.reduce((sum, k) => sum + k.amount, 0);
        const eventTravelTimeCost = travelTimeTransactions.reduce((sum, t) => sum + t.amount, 0);
        const eventFees = fees.reduce((sum, f) => sum + f.amount, 0);
        
        // Acumula totais (mesma lógica do EventDetailView)
        totalUpfrontCost += eventExpenses + eventKmCost; // Investimento: Insumos + Gasolina
        totalNetProfit += eventFees; // Lucro: Apenas Honorários
        
        // Valor de reembolso = Insumos + KM + Tempo de Viagem
        const eventReimbursementValue = eventExpenses + eventKmCost + eventTravelTimeCost;
        totalReimbursements += eventReimbursementValue;
      }
      
      // Total a receber = Reembolsos + Lucro
      const totalToReceive = totalReimbursements + totalNetProfit;

      // Renderiza
      container.innerHTML = `
        <!-- Card de Resumo Financeiro Consolidado (Card destacado) -->
        <div class="card" style="background: linear-gradient(135deg, #F4F7F6 0%, #FFFFFF 100%); border: 2px solid var(--color-primary); margin-bottom: var(--spacing-md); box-shadow: 0 4px 12px rgba(233, 30, 99, 0.1);">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--spacing-md);">
            <h3 style="margin: 0; color: var(--color-text); font-size: var(--font-size-lg); display: flex; align-items: center; gap: var(--spacing-sm);">
              💰 Resumo Financeiro Consolidado
            </h3>
            ${this.generateMonthlyReportUseCase ? `
            <button class="btn btn-sm btn-primary" id="btn-monthly-report-dashboard" 
                    style="white-space: nowrap; padding: 6px 12px; font-size: 12px;">
              📅 Mensal
            </button>
            ` : ''}
          </div>
          
          <!-- Cards compactos em grid 2x2 -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--spacing-sm); margin-bottom: var(--spacing-md);">
            <!-- Investimento Realizado -->
            <div style="padding: var(--spacing-sm); background: linear-gradient(135deg, #FFEBEE 0%, #FFF3E0 100%); border-radius: var(--radius-md); border-left: 3px solid #EF5350;">
              <div style="font-size: 10px; color: #C62828; font-weight: var(--font-weight-semibold); margin-bottom: 4px;">
                💸 Investimento
              </div>
              <div style="font-size: var(--font-size-lg); font-weight: var(--font-weight-bold); color: #C62828;">
                ${this.formatCurrency(totalUpfrontCost)}
              </div>
            </div>

            <!-- Reembolsos -->
            <div style="padding: var(--spacing-sm); background: linear-gradient(135deg, #F3E5F5 0%, #E1BEE7 100%); border-radius: var(--radius-md); border-left: 3px solid #9C27B0;">
              <div style="font-size: 10px; color: #7B1FA2; font-weight: var(--font-weight-semibold); margin-bottom: 4px;">
                💳 Reembolsos
              </div>
              <div style="font-size: var(--font-size-lg); font-weight: var(--font-weight-bold); color: #7B1FA2;">
                ${this.formatCurrency(totalReimbursements)}
              </div>
            </div>

            <!-- Total a Receber -->
            <div style="padding: var(--spacing-sm); background: linear-gradient(135deg, #E3F2FD 0%, #E1F5FE 100%); border-radius: var(--radius-md); border-left: 3px solid #2196F3;">
              <div style="font-size: 10px; color: #1565C0; font-weight: var(--font-weight-semibold); margin-bottom: 4px;">
                📥 Total a Receber
              </div>
              <div style="font-size: var(--font-size-lg); font-weight: var(--font-weight-bold); color: #1565C0;">
                ${this.formatCurrency(totalToReceive)}
              </div>
            </div>

            <!-- Lucro Líquido -->
            <div style="padding: var(--spacing-sm); background: linear-gradient(135deg, #E0F2F1 0%, #C8E6C9 100%); border-radius: var(--radius-md); border-left: 3px solid #26A69A;">
              <div style="font-size: 10px; color: #00897B; font-weight: var(--font-weight-semibold); margin-bottom: 4px;">
                ✨ Lucro Líquido
              </div>
              <div style="font-size: var(--font-size-lg); font-weight: var(--font-weight-bold); color: #00897B;">
                ${this.formatCurrency(totalNetProfit)}
              </div>
            </div>
          </div>
          
          <div style="text-align: center; padding-top: var(--spacing-sm); border-top: 1px solid var(--color-border-light);">
            <p style="margin: 0; color: var(--color-text-secondary); font-size: var(--font-size-xs);">
              📊 ${eventsForCalculation.length} evento(s) pendente(s) • Eventos pagos não incluídos
            </p>
          </div>
        </div>

        <div style="margin-bottom: var(--spacing-md);">
          <h2 style="margin: 0;">Eventos Ativos</h2>
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
            <p class="text-muted" style="font-size: var(--font-size-sm); margin-top: var(--spacing-sm);">
              Use o botão ➕ abaixo para criar seu primeiro evento
            </p>
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

      // Event listener para fechamento mensal no dashboard
      if (this.generateMonthlyReportUseCase) {
        const btnMonthlyReport = document.getElementById('btn-monthly-report-dashboard');
        if (btnMonthlyReport) {
          btnMonthlyReport.addEventListener('click', () => {
            window.dispatchEvent(new CustomEvent('navigate', { 
              detail: { view: 'monthly-report' } 
            }));
          });
        }
      }

      // Event listener para criar evento (apenas via FAB)
      if (this.createEventUseCase) {
        // Listener global para o FAB (botão flutuante)
        // Remove listener anterior se existir para evitar duplicação
        window.removeEventListener('create-new-event', this._handleCreateNewEvent);
        this._handleCreateNewEvent = () => {
          // Verifica se já existe um modal aberto
          const existingModal = document.querySelector('.modal-backdrop.active');
          if (existingModal) {
            return; // Não abre novo modal se já existe um
          }
          
          // Só abre o modal se estiver na view do dashboard
          const container = document.getElementById('dashboard-content');
          if (container && container.classList.contains('active')) {
            this.showCreateEventModal();
          }
        };
        window.addEventListener('create-new-event', this._handleCreateNewEvent);
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
        label: 'Planejando',
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

  async showCreateEventModal() {
    // Verifica se já existe um modal aberto
    const existingModal = document.querySelector('.modal-backdrop.active');
    if (existingModal) {
      return; // Não cria novo modal se já existe um
    }

    // Busca o valor da diária padrão das configurações
    let dailyRate = 300.00; // Valor padrão
    try {
      const settings = await this.settingsRepository.find();
      if (settings && settings.standardDailyRate) {
        dailyRate = settings.standardDailyRate;
      }
    } catch (error) {
      console.warn('Erro ao buscar configurações, usando valor padrão:', error);
    }

    const modal = document.createElement('div');
    modal.className = 'modal-backdrop active';
    modal.setAttribute('data-modal-type', 'create-event');
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
                <span>Lançar Diária Padrão Automaticamente (<span id="daily-rate-display">${this.formatCurrency(dailyRate)}</span>)</span>
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

      // Adiciona classe para bloquear scroll do body
      document.body.classList.add('modal-open');
      document.documentElement.classList.add('modal-open');

      // Event listeners
      const closeModal = () => {
        document.body.classList.remove('modal-open');
        document.documentElement.classList.remove('modal-open');
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
        let isSubmitting = false;
        
        form.addEventListener('submit', async (e) => {
          e.preventDefault();
          e.stopPropagation();
          
          // Previne múltiplos submits
          if (isSubmitting) {
            return;
          }
          isSubmitting = true;
          
          // Desabilita o botão de submit durante o processamento
          const submitBtn = form.querySelector('button[type="submit"]');
          if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Criando...';
          }
          
          try {
            await this.createEvent(modal);
          } catch (error) {
            console.error('Erro ao criar evento:', error);
            window.toast.error('Erro ao criar evento. Tente novamente.');
          } finally {
            isSubmitting = false;
            if (submitBtn && document.body.contains(modal)) {
              submitBtn.disabled = false;
              submitBtn.textContent = 'Criar Evento';
            }
          }
        });
      }
    }, 0);
  }

  async createEvent(modal) {
    // Busca os elementos dentro do modal para evitar conflitos
    const nameInput = modal.querySelector('#event-name');
    const dateInput = modal.querySelector('#event-date');
    const descriptionInput = modal.querySelector('#event-description');
    const autoCreateDailyInput = modal.querySelector('#auto-create-daily');

    if (!nameInput || !dateInput) {
      console.error('Campos do formulário não encontrados');
      window.toast.error('Erro ao processar formulário. Tente novamente.');
      return;
    }

    const name = nameInput.value.trim();
    const date = dateInput.value.trim();
    const description = descriptionInput ? descriptionInput.value.trim() : '';
    const autoCreateDaily = autoCreateDailyInput ? autoCreateDailyInput.checked : false;

    // Validação mais robusta
    if (!name || name.length < 3) {
      window.toast.warning('O nome do evento deve ter pelo menos 3 caracteres.');
      nameInput.focus();
      return;
    }

    if (!date) {
      window.toast.warning('Por favor, selecione uma data para o evento.');
      dateInput.focus();
      return;
    }

    // Valida formato da data (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      window.toast.warning('Data inválida. Por favor, selecione uma data válida.');
      dateInput.focus();
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
        // Remove classe e fecha o modal antes de navegar
        document.body.classList.remove('modal-open');
        document.documentElement.classList.remove('modal-open');
        if (document.body.contains(modal)) {
          document.body.removeChild(modal);
        }
        
        window.toast.success('Evento criado com sucesso!');
        
        // Navega para os detalhes do evento criado
        if (result.data && result.data.id) {
          // Pequeno delay para garantir que o modal foi fechado
          setTimeout(() => {
            this.navigateToEvent(result.data.id);
          }, 100);
        } else {
          // Fallback: recarrega o dashboard
          await this.render();
        }
      } else {
        window.toast.error(`Erro ao criar evento: ${result.error || 'Erro desconhecido'}`);
      }
    } catch (error) {
      window.toast.error(`Erro ao criar evento: ${error.message}`);
    }
  }
}

// Export para uso em módulos ES6
export { DashboardView };

