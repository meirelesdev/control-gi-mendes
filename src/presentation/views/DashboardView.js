/**
 * View: Dashboard
 * Exibe lista de eventos ativos e card com total a receber
 */
import { Formatters } from '../utils/Formatters.js';
import { DEFAULT_VALUES } from '../../domain/constants/DefaultValues.js';

class DashboardView {
  constructor(eventRepository, transactionRepository, settingsRepository, createEventUseCase = null, generateMonthlyReportUseCase = null, getEventSummaryUseCase = null) {
    this.eventRepository = eventRepository;
    this.transactionRepository = transactionRepository;
    this.settingsRepository = settingsRepository;
    this.createEventUseCase = createEventUseCase;
    this.generateMonthlyReportUseCase = generateMonthlyReportUseCase;
    this.getEventSummaryUseCase = getEventSummaryUseCase;
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
      // Usa GetEventSummary para garantir que a lógica de cálculo está centralizada no Use Case
      let totalUpfrontCost = 0; // Investimento realizado
      let totalNetProfit = 0; // Lucro líquido
      let totalReimbursements = 0; // Reembolsos
      
      // Filtra apenas eventos pendentes (não pagos e não cancelados) para o cálculo consolidado
      const eventsForCalculation = events.filter(e => 
        e.status !== 'CANCELLED' && 
        e.status !== 'PAID' // Exclui eventos pagos do resumo financeiro
      );
      
      // Depende EXCLUSIVAMENTE do Use Case GetEventSummary (lógica de negócio centralizada)
      if (!this.getEventSummaryUseCase) {
        console.error('GetEventSummaryUseCase não está disponível. Resumo financeiro não será calculado.');
      } else {
        // Usa GetEventSummary para cada evento (lógica de negócio centralizada)
        for (const event of eventsForCalculation) {
          const summaryResult = await this.getEventSummaryUseCase.execute({ eventId: event.id });
          if (summaryResult.success && summaryResult.data) {
            const summary = summaryResult.data;
            totalUpfrontCost += summary.totals.upfrontCost;
            totalNetProfit += summary.totals.netProfit;
            totalReimbursements += summary.totals.reimbursementValue;
          }
        }
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
          
          <!-- Total a Receber em destaque completo (abaixo do grid) -->
          <div style="padding: var(--spacing-lg); background: linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%); border-radius: var(--radius-lg); border: 2px solid #2196F3; box-shadow: 0 4px 16px rgba(33, 150, 243, 0.25); margin-bottom: var(--spacing-md);">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div>
                <div style="font-size: var(--font-size-base); color: #1565C0; font-weight: var(--font-weight-bold); margin-bottom: var(--spacing-xs);">
                  📥 Total a Receber
                </div>
                <div style="font-size: var(--font-size-xs); color: #1976D2;">
                  Reembolsos (${this.formatCurrency(totalReimbursements)}) + Lucro (${this.formatCurrency(totalNetProfit)})
                </div>
              </div>
              <div style="font-size: var(--font-size-2xl); font-weight: var(--font-weight-bold); color: #1565C0;">
                ${this.formatCurrency(totalToReceive)}
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
          <h2 style="margin: 0;">Eventos</h2>
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
            <p>Nenhum evento no momento.</p>
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
        // Remove listener anterior se existir (pode ser de uma instância anterior)
        if (DashboardView._globalCreateEventHandler) {
          window.removeEventListener('create-new-event', DashboardView._globalCreateEventHandler);
          DashboardView._globalCreateEventHandler = null;
        }
        
        // Cria função handler que referencia esta instância
        const handler = () => {
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
        
        // Armazena referência estática para poder remover depois
        DashboardView._globalCreateEventHandler = handler;
        this._handleCreateNewEvent = handler;
        
        // Adiciona o listener
        window.addEventListener('create-new-event', handler);
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
    
    // Formata a data do evento (usa startDate/endDate se disponível, senão usa date)
    let eventDateDisplay = '';
    if (event.startDate && event.endDate && event.startDate !== event.endDate) {
      eventDateDisplay = `${this.formatDate(event.startDate)} a ${this.formatDate(event.endDate)}`;
    } else {
      eventDateDisplay = this.formatDate(event.startDate || event.date);
    }

    return `
      <div class="event-item" data-event-id="${event.id}">
        <div class="event-item-header">
          <div class="event-item-name">${this.escapeHtml(event.name)}</div>
          <span class="badge" style="background-color: ${statusConfig.badgeColor}; color: ${statusConfig.badgeTextColor};">
            ${statusConfig.label}
          </span>
        </div>
        <div class="event-item-date">${eventDateDisplay}</div>
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
    return Formatters.currency(value);
  }

  formatDate(dateString) {
    if (!dateString) return '';
    
    // Se a data está no formato YYYY-MM-DD, parse diretamente para evitar problemas de timezone
    if (typeof dateString === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      const [year, month, day] = dateString.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }).format(date);
    }
    
    return Formatters.dateShort(dateString);
  }

  escapeHtml(text) {
    return Formatters.escapeHtml(text);
  }

  async showCreateEventModal() {
    // Verifica se já existe um modal aberto
    const existingModal = document.querySelector('.modal-backdrop.active');
    if (existingModal) {
      return; // Não cria novo modal se já existe um
    }

    // Busca o valor da diária padrão das configurações
    let dailyRate = DEFAULT_VALUES.DAILY_RATE; // Valor padrão
    try {
      const settings = await this.settingsRepository.find();
      if (settings && settings.standardDailyRate) {
        dailyRate = settings.standardDailyRate;
      }
    } catch (error) {
      // Usa valor padrão em caso de erro
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
              <label class="form-label">Data de Início *</label>
              <input type="date" class="form-input" id="event-start-date" required>
            </div>
            <div class="form-group">
              <label class="form-label">Data de Fim (opcional)</label>
              <input type="date" class="form-input" id="event-end-date">
              <small class="text-muted">Se não informada, usa a data de início</small>
            </div>
            <div class="form-group">
              <label class="form-label">Cliente *</label>
              <input type="text" class="form-input" id="event-client" required 
                     placeholder="Ex: Bom Princípio">
            </div>
            <div class="form-group">
              <label class="form-label">Cidade *</label>
              <input type="text" class="form-input" id="event-city" required 
                     placeholder="Ex: Tupandi - RS">
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
      const startDateInput = modal.querySelector('#event-start-date');
      const endDateInput = modal.querySelector('#event-end-date');
      
      if (startDateInput) {
        const today = new Date().toISOString().split('T')[0];
        startDateInput.value = today;
        
        // Sincroniza endDate com startDate inicialmente
        if (endDateInput) {
          endDateInput.value = today;
        }
      }
      
      // Validação: endDate não pode ser anterior a startDate
      if (startDateInput && endDateInput) {
        const validateDates = () => {
          const startDate = startDateInput.value;
          const endDate = endDateInput.value;
          
          if (startDate && endDate && endDate < startDate) {
            endDateInput.setCustomValidity('Data de fim não pode ser anterior à data de início');
            endDateInput.reportValidity();
          } else {
            endDateInput.setCustomValidity('');
          }
          
          // Se endDate estiver vazia, sincroniza com startDate
          if (startDate && !endDate) {
            endDateInput.value = startDate;
          }
        };
        
        startDateInput.addEventListener('change', validateDates);
        endDateInput.addEventListener('change', validateDates);
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
    const startDateInput = modal.querySelector('#event-start-date');
    const endDateInput = modal.querySelector('#event-end-date');
    const clientInput = modal.querySelector('#event-client');
    const cityInput = modal.querySelector('#event-city');
    const descriptionInput = modal.querySelector('#event-description');
    const autoCreateDailyInput = modal.querySelector('#auto-create-daily');

    if (!nameInput || !startDateInput || !clientInput || !cityInput) {
      console.error('Campos do formulário não encontrados');
      window.toast.error('Erro ao processar formulário. Tente novamente.');
      return;
    }

    const name = nameInput.value.trim();
    const startDate = startDateInput.value.trim();
    const endDate = endDateInput?.value.trim() || null;
    const client = clientInput.value.trim();
    const city = cityInput.value.trim();
    const description = descriptionInput ? descriptionInput.value.trim() : '';
    const autoCreateDaily = autoCreateDailyInput ? autoCreateDailyInput.checked : false;
    
    // Validação de datas
    if (!startDate) {
      window.toast.warning('Data de início é obrigatória.');
      startDateInput.focus();
      return;
    }
    
    if (endDate && endDate < startDate) {
      window.toast.warning('Data de fim não pode ser anterior à data de início.');
      endDateInput.focus();
      return;
    }

    // Validação mais robusta
    if (!name || name.length < 3) {
      window.toast.warning('O nome do evento deve ter pelo menos 3 caracteres.');
      nameInput.focus();
      return;
    }

    if (!client || client.length < 3) {
      window.toast.warning('O cliente deve ter pelo menos 3 caracteres.');
      clientInput.focus();
      return;
    }

    if (!city || city.length < 3) {
      window.toast.warning('A cidade deve ter pelo menos 3 caracteres.');
      cityInput.focus();
      return;
    }

    // Valida formato da data (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(startDate)) {
      window.toast.warning('Data de início inválida. Por favor, selecione uma data válida.');
      startDateInput.focus();
      return;
    }
    
    if (endDate && !dateRegex.test(endDate)) {
      window.toast.warning('Data de fim inválida. Por favor, selecione uma data válida.');
      endDateInput.focus();
      return;
    }

    try {
      const result = await this.createEventUseCase.execute({
        name,
        date: startDate, // Mantém compatibilidade com o use case
        client,
        city,
        description: description || null,
        startDate: startDate,
        endDate: endDate || null,
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

