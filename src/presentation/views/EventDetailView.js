/**
 * View: Detalhe do Evento
 * Exibe detalhes do evento, botões de ação e lista de despesas
 */
import { ReportView } from './ReportView.js';

class EventDetailView {
  constructor(eventRepository, transactionRepository, settingsRepository, addTransactionUseCase, deleteTransactionUseCase = null, generateEventReportUseCase = null, updateEventStatusUseCase = null, updateEventUseCase = null) {
    this.eventRepository = eventRepository;
    this.transactionRepository = transactionRepository;
    this.settingsRepository = settingsRepository;
    this.addTransactionUseCase = addTransactionUseCase;
    this.deleteTransactionUseCase = deleteTransactionUseCase;
    this.generateEventReportUseCase = generateEventReportUseCase;
    this.updateEventStatusUseCase = updateEventStatusUseCase;
    this.updateEventUseCase = updateEventUseCase;
    this.currentEventId = null;
  }

  async render(eventId) {
    const container = document.getElementById('event-detail-content');
    if (!container) return;

    this.currentEventId = eventId;

    container.innerHTML = '<div class="loading">Carregando...</div>';

    try {
      const event = await this.eventRepository.findById(eventId);
      if (!event) {
        container.innerHTML = '<div class="empty-state"><p>Evento não encontrado.</p></div>';
        return;
      }

      const transactions = await this.transactionRepository.findByEventId(eventId);
      const expenses = transactions.filter(t => t.type === 'EXPENSE');
      const expensesWithoutReceipt = expenses.filter(e => !e.metadata.hasReceipt);
      
      // Separa receitas: reembolsos (KM/Viagem) vs honorários (Diária/Hora Extra)
      const incomes = transactions.filter(t => t.type === 'INCOME');
      // Reembolsos: KM e Tempo de Viagem
      const reimbursements = incomes.filter(i => 
        i.metadata.category === 'km' || i.metadata.category === 'tempo_viagem'
      );
      // Honorários: Diária e Hora Extra
      const fees = incomes.filter(i => 
        i.metadata.category === 'diaria' || i.metadata.category === 'hora_extra'
      );
      
      // Calcula totais
      const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
      const totalReimbursements = reimbursements.reduce((sum, r) => sum + r.amount, 0);
      const totalFees = fees.reduce((sum, f) => sum + f.amount, 0);
      const totalIncomes = incomes.reduce((sum, i) => sum + i.amount, 0);

      // Define cores e labels por status
      const statusConfig = this._getStatusConfig(event.status);
      const statusBorderColor = statusConfig.borderColor;
      const statusBgColor = statusConfig.bgColor;

      container.innerHTML = `
        <div class="card" style="border-left: 4px solid ${statusBorderColor}; background-color: ${statusBgColor};">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: var(--spacing-md);">
            <div style="flex: 1;">
              <div style="display: flex; align-items: center; gap: var(--spacing-md); margin-bottom: var(--spacing-sm); flex-wrap: wrap;">
                <h2 style="margin: 0; flex: 1; min-width: 200px;">${this.escapeHtml(event.name)}</h2>
                <div style="display: flex; align-items: center; gap: var(--spacing-sm);">
                  ${event.isEditable && this.updateEventUseCase ? `
                    <button class="btn btn-sm" id="btn-edit-event" 
                            style="background: transparent; color: ${statusBgColor === 'var(--color-surface)' ? 'var(--color-primary)' : 'white'}; padding: 8px 12px; border-radius: var(--radius-full); border: 1px solid ${statusBgColor === 'var(--color-surface)' ? 'var(--color-border)' : 'rgba(255,255,255,0.3)'};"
                            title="Editar Evento">
                      ✏️
                    </button>
                  ` : !event.isEditable ? `
                    <button class="btn btn-sm" disabled
                            style="background: transparent; color: var(--color-text-secondary); padding: 8px 12px; border-radius: var(--radius-full); border: 1px solid var(--color-border); opacity: 0.6; cursor: not-allowed;"
                            title="Evento não pode ser editado (Relatório enviado ou Pago)">
                      🔒
                    </button>
                  ` : ''}
                  <span class="badge" style="background-color: ${statusConfig.badgeColor}; color: ${statusConfig.badgeTextColor};">
                    ${statusConfig.label}
                  </span>
                </div>
              </div>
              <p class="text-muted">${this.formatDate(event.date)}</p>
              ${event.description ? `<p>${this.escapeHtml(event.description)}</p>` : ''}
              ${event.expectedPaymentDate ? `
                <p style="margin-top: var(--spacing-sm);">
                  <strong>💰 Pagamento previsto:</strong> ${this.formatDate(event.expectedPaymentDate)}
                </p>
              ` : ''}
            </div>
            ${this.generateEventReportUseCase ? `
            <button class="btn btn-success" id="btn-generate-report" style="margin-left: var(--spacing-md);">
              📄 Gerar Relatório
            </button>
            ` : ''}
          </div>
          
          ${this.updateEventStatusUseCase ? `
          <div style="margin-top: var(--spacing-md); padding-top: var(--spacing-md); border-top: 1px solid var(--color-border);">
            <label class="form-label" style="margin-bottom: var(--spacing-sm); display: block;">
              <strong>Status do Evento:</strong>
            </label>
            <select class="form-input" id="event-status-select" style="max-width: 300px;">
              <option value="PLANNED" ${event.status === 'PLANNED' ? 'selected' : ''}>Planejado</option>
              <option value="DONE" ${event.status === 'DONE' || event.status === 'COMPLETED' ? 'selected' : ''}>Realizado</option>
              <option value="REPORT_SENT" ${event.status === 'REPORT_SENT' ? 'selected' : ''}>Relatório/NF Enviada</option>
              <option value="PAID" ${event.status === 'PAID' ? 'selected' : ''}>Finalizado/Pago</option>
            </select>
          </div>
          ` : ''}
        </div>

        <div class="card">
          <h3 style="margin-bottom: var(--spacing-md);">Ações Rápidas</h3>
          <div style="display: flex; flex-direction: column; gap: var(--spacing-md);">
            <button class="btn btn-primary btn-lg" id="btn-add-expense">
              ➕ Adicionar Despesa Rápida
            </button>
            <button class="btn btn-success btn-lg" id="btn-add-fee">
              💰 Adicionar Honorário
            </button>
            <button class="btn btn-secondary btn-lg" id="btn-add-km-travel">
              🚗 Adicionar KM / Viagem
            </button>
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <h3 class="card-title">Despesas</h3>
            ${expensesWithoutReceipt.length > 0 ? `
              <span class="badge badge-warning">${expensesWithoutReceipt.length} sem NF</span>
            ` : ''}
            ${expenses.length > 0 ? `
              <span class="badge badge-info">Total: ${this.formatCurrency(totalExpenses)}</span>
            ` : ''}
          </div>
          ${expenses.length === 0 ? `
            <div class="empty-state">
              <p class="text-muted">Nenhuma despesa cadastrada ainda.</p>
            </div>
          ` : `
            <div class="expense-list">
              ${expenses.map(expense => this.renderExpenseItem(expense)).join('')}
            </div>
          `}
        </div>

        <div class="card">
          <div class="card-header">
            <h3 class="card-title">💰 Honorários (Lucro)</h3>
            ${fees.length > 0 ? `
              <span class="badge badge-success">Total: ${this.formatCurrency(totalFees)}</span>
            ` : ''}
          </div>
          ${fees.length === 0 ? `
            <div class="empty-state">
              <p class="text-muted">Nenhum honorário cadastrado ainda.</p>
            </div>
          ` : `
            <div class="expense-list">
              ${fees.map(fee => this.renderFeeItem(fee)).join('')}
            </div>
          `}
        </div>

        <div class="card">
          <div class="card-header">
            <h3 class="card-title">🚗 KM / Viagens (Reembolso)</h3>
            ${reimbursements.length > 0 ? `
              <span class="badge badge-info">Total: ${this.formatCurrency(totalReimbursements)}</span>
            ` : ''}
          </div>
          ${reimbursements.length === 0 ? `
            <div class="empty-state">
              <p class="text-muted">Nenhuma KM/Viagem cadastrada ainda.</p>
            </div>
          ` : `
            <div class="expense-list">
              ${reimbursements.map(reimbursement => this.renderIncomeItem(reimbursement)).join('')}
            </div>
          `}
        </div>
      `;

      // Event listeners
      document.getElementById('btn-add-expense').addEventListener('click', () => {
        this.showAddExpenseModal();
      });

      document.getElementById('btn-add-fee').addEventListener('click', () => {
        this.showAddFeeModal();
      });

      document.getElementById('btn-add-km-travel').addEventListener('click', () => {
        this.showAddKmTravelModal();
      });

      // Event listener para gerar relatório
      if (this.generateEventReportUseCase) {
        const btnGenerateReport = document.getElementById('btn-generate-report');
        if (btnGenerateReport) {
          btnGenerateReport.addEventListener('click', () => {
            this.generateReport();
          });
        }
      }

      // Event listener para mudança de status
      if (this.updateEventStatusUseCase) {
        const statusSelect = document.getElementById('event-status-select');
        if (statusSelect) {
          statusSelect.addEventListener('change', async (e) => {
            await this.updateStatus(e.target.value);
          });
        }
      }

      // Event listener para editar evento
      if (this.updateEventUseCase && event.isEditable) {
        const btnEditEvent = document.getElementById('btn-edit-event');
        if (btnEditEvent) {
          btnEditEvent.addEventListener('click', () => {
            this.showEditEventModal(event);
          });
        }
      }

      // Event listeners para marcar nota fiscal
      container.querySelectorAll('.btn-mark-receipt').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          const transactionId = e.target.dataset.transactionId;
          await this.markReceiptAsIssued(transactionId);
        });
      });

      // Event listeners para excluir transações
      container.querySelectorAll('.btn-delete-transaction').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          const transactionId = e.target.dataset.transactionId;
          await this.deleteTransaction(transactionId);
        });
      });
    } catch (error) {
      container.innerHTML = `
        <div class="card" style="border-left-color: var(--color-danger);">
          <p style="color: var(--color-danger);">Erro ao carregar evento: ${error.message}</p>
        </div>
      `;
    }
  }

  renderExpenseItem(expense) {
    const hasReceipt = expense.metadata.hasReceipt;
    
    return `
      <div class="expense-item ${hasReceipt ? '' : 'no-receipt'}" style="border-left-color: var(--color-danger);">
        <div class="expense-item-info">
          <div class="expense-item-description">🔴 ${this.escapeHtml(expense.description)}</div>
          <div class="expense-item-value" style="color: var(--color-danger);">${this.formatCurrency(expense.amount)}</div>
        </div>
        <div class="expense-item-actions">
        ${!hasReceipt ? `
          <div class="expense-item-receipt">
            <span>⚠️</span>
            <button class="btn btn-sm btn-success btn-mark-receipt" data-transaction-id="${expense.id}">
              Marcar NF
            </button>
          </div>
        ` : `
          <span class="badge badge-success">NF OK</span>
        `}
          <button class="btn btn-sm btn-delete-transaction" 
                  data-transaction-id="${expense.id}"
                  title="Excluir despesa">
            🗑️
          </button>
        </div>
      </div>
    `;
  }

  renderIncomeItem(income) {
    const category = income.metadata.category || '';
    const categoryLabels = {
      'km': 'KM Rodado',
      'tempo_viagem': 'Tempo de Viagem',
      'diaria': 'Diária',
      'hora_extra': 'Hora Extra'
    };
    const categoryLabel = categoryLabels[category] || category || 'Receita';
    const isReimbursement = income.metadata.isReimbursement !== false;
    
    return `
      <div class="expense-item">
        <div class="expense-item-info">
          <div class="expense-item-description">
            ${this.escapeHtml(income.description)}
            <span class="badge badge-info" style="margin-left: var(--spacing-sm);">${categoryLabel}</span>
            ${isReimbursement ? '<span class="badge badge-secondary" style="margin-left: var(--spacing-xs);">Reembolso</span>' : ''}
          </div>
          <div class="expense-item-value" style="color: var(--color-success);">${this.formatCurrency(income.amount)}</div>
        </div>
        <div class="expense-item-actions">
          <button class="btn btn-sm btn-delete-transaction" 
                  data-transaction-id="${income.id}"
                  title="Excluir receita">
            🗑️
          </button>
        </div>
      </div>
    `;
  }

  renderFeeItem(fee) {
    const category = fee.metadata.category || '';
    const categoryLabels = {
      'diaria': 'Diária',
      'hora_extra': 'Hora Extra'
    };
    const categoryLabel = categoryLabels[category] || 'Honorário';
    
    return `
      <div class="expense-item" style="border-left-color: var(--color-success); background-color: rgba(34, 197, 94, 0.05);">
        <div class="expense-item-info">
          <div class="expense-item-description">
            🟢 ${this.escapeHtml(fee.description)}
            <span class="badge badge-success" style="margin-left: var(--spacing-sm);">${categoryLabel}</span>
            <span class="badge badge-success" style="margin-left: var(--spacing-xs);">Lucro</span>
          </div>
          <div class="expense-item-value" style="color: var(--color-success); font-weight: bold;">${this.formatCurrency(fee.amount)}</div>
        </div>
        <div class="expense-item-actions">
          <button class="btn btn-sm btn-delete-transaction" 
                  data-transaction-id="${fee.id}"
                  title="Excluir honorário">
            🗑️
          </button>
        </div>
      </div>
    `;
  }

  showAddExpenseModal() {
    const modal = this.createModal('Adicionar Despesa Rápida', `
      <form id="form-add-expense">
        <div class="form-group">
          <label class="form-label">Descrição</label>
          <input type="text" class="form-input" id="expense-description" 
                 placeholder="Ex: Compra de ingredientes" required>
        </div>
        <div class="form-group">
          <label class="form-label">Valor (R$)</label>
          <input type="number" class="form-input" id="expense-amount" 
                 step="0.01" min="0.01" placeholder="0,00" required>
        </div>
        <div class="form-group">
          <label style="display: flex; align-items: center; gap: var(--spacing-sm);">
            <input type="checkbox" id="expense-has-receipt">
            <span>Nota fiscal já emitida/arquivada</span>
          </label>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" onclick="this.closest('.modal-backdrop').remove()">
            Cancelar
          </button>
          <button type="submit" class="btn btn-primary">Salvar</button>
        </div>
      </form>
    `);

    document.body.appendChild(modal);
    modal.classList.add('active');

    document.getElementById('form-add-expense').addEventListener('submit', async (e) => {
      e.preventDefault();
      const result = await this.saveExpense();
      // Só remove o modal se saveExpense retornou sucesso (sem erro)
      if (result !== false) {
      modal.remove();
      }
    });
  }

  showAddFeeModal() {
    const modal = this.createModal('Adicionar Honorário', `
      <form id="form-add-fee">
        <div class="form-group">
          <label class="form-label">Tipo de Honorário</label>
          <div style="display: flex; flex-direction: column; gap: var(--spacing-sm); margin-top: var(--spacing-xs);">
            <label style="display: flex; align-items: center; gap: var(--spacing-sm); cursor: pointer; padding: var(--spacing-sm); border: 1px solid var(--color-border); border-radius: var(--radius-md);">
              <input type="radio" name="fee-type" value="diaria" id="fee-type-diaria" checked style="cursor: pointer;">
              <div style="flex: 1;">
                <strong>Diária Adicional</strong>
                <div class="text-muted" style="font-size: 0.9em;" id="diaria-value">Valor: R$ 300,00</div>
              </div>
            </label>
            <label style="display: flex; align-items: center; gap: var(--spacing-sm); cursor: pointer; padding: var(--spacing-sm); border: 1px solid var(--color-border); border-radius: var(--radius-md);">
              <input type="radio" name="fee-type" value="hora_extra" id="fee-type-hora" style="cursor: pointer;">
              <div style="flex: 1;">
                <strong>Hora Extra</strong>
                <div class="text-muted" style="font-size: 0.9em;" id="hora-extra-info">Taxa: R$ 75,00 por hora</div>
              </div>
            </label>
          </div>
        </div>
        <div class="form-group" id="hours-group" style="display: none;">
          <label class="form-label">Quantidade de Horas</label>
          <input type="number" class="form-input" id="fee-hours" 
                 step="0.5" min="0.5" placeholder="0" value="1">
          <small class="text-muted" id="hours-total" style="display: block; margin-top: var(--spacing-xs);">Total: R$ 0,00</small>
        </div>
        <div class="form-group">
          <label class="form-label">Descrição</label>
          <input type="text" class="form-input" id="fee-description" 
                 placeholder="Ex: Diária técnica padrão" required>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" onclick="this.closest('.modal-backdrop').remove()">
            Cancelar
          </button>
          <button type="submit" class="btn btn-success">Salvar</button>
        </div>
      </form>
    `);

    document.body.appendChild(modal);
    modal.classList.add('active');

    // Carrega valores das configurações
    this._loadFeeSettings(modal);

    // Mostra/esconde campos baseado no tipo
    const feeTypeInputs = modal.querySelectorAll('input[name="fee-type"]');
    feeTypeInputs.forEach(input => {
      input.addEventListener('change', () => {
        const type = input.value;
        const hoursGroup = modal.querySelector('#hours-group');
        if (type === 'hora_extra') {
          hoursGroup.style.display = 'block';
          modal.querySelector('#fee-hours').required = true;
          this._updateHoursTotal(modal);
        } else {
          hoursGroup.style.display = 'none';
          modal.querySelector('#fee-hours').required = false;
        }
      });
    });

    // Atualiza total quando horas mudam
    const hoursInput = modal.querySelector('#fee-hours');
    if (hoursInput) {
      hoursInput.addEventListener('input', () => {
        this._updateHoursTotal(modal);
      });
    }

    document.getElementById('form-add-fee').addEventListener('submit', async (e) => {
      e.preventDefault();
      const result = await this.saveFee(modal);
      if (result !== false) {
        modal.remove();
      }
    });
  }

  async _loadFeeSettings(modal) {
    try {
      const settings = await this.settingsRepository.find();
      if (settings) {
        const diariaValue = modal.querySelector('#diaria-value');
        const horaExtraInfo = modal.querySelector('#hora-extra-info');
        if (diariaValue) {
          diariaValue.textContent = `Valor: ${this.formatCurrency(settings.standardDailyRate || 300.00)}`;
        }
        if (horaExtraInfo) {
          horaExtraInfo.textContent = `Taxa: ${this.formatCurrency(settings.overtimeRate || 75.00)} por hora`;
        }
        // Armazena valores no modal para uso posterior
        modal.dataset.dailyRate = settings.standardDailyRate || 300.00;
        modal.dataset.overtimeRate = settings.overtimeRate || 75.00;
      }
    } catch (error) {
      console.warn('Erro ao carregar configurações:', error);
    }
  }

  _updateHoursTotal(modal) {
    const hoursInput = modal.querySelector('#fee-hours');
    const hoursTotal = modal.querySelector('#hours-total');
    const overtimeRate = parseFloat(modal.dataset.overtimeRate || 75.00);
    
    if (hoursInput && hoursTotal) {
      const hours = parseFloat(hoursInput.value) || 0;
      const total = hours * overtimeRate;
      hoursTotal.textContent = `Total: ${this.formatCurrency(total)}`;
    }
  }

  async saveFee(modal) {
    try {
      const feeType = modal.querySelector('input[name="fee-type"]:checked').value;
      const description = modal.querySelector('#fee-description').value.trim();
      
      if (!description) {
        window.toast?.error('Descrição é obrigatória');
        return false;
      }

      let amount;
      let category;

      if (feeType === 'diaria') {
        const dailyRate = parseFloat(modal.dataset.dailyRate || 300.00);
        amount = dailyRate;
        category = 'diaria';
      } else if (feeType === 'hora_extra') {
        const hours = parseFloat(modal.querySelector('#fee-hours').value);
        if (!hours || hours <= 0) {
          window.toast?.error('Quantidade de horas deve ser maior que zero');
          return false;
        }
        const overtimeRate = parseFloat(modal.dataset.overtimeRate || 75.00);
        amount = hours * overtimeRate;
        category = 'hora_extra';
      } else {
        window.toast?.error('Tipo de honorário inválido');
        return false;
      }

      const result = await this.addTransactionUseCase.execute({
        eventId: this.currentEventId,
        type: 'INCOME',
        description,
        amount,
        category,
        isReimbursement: false
      });

      if (result && result.success) {
        if (window.toast && typeof window.toast.success === 'function') {
          window.toast.success('Honorário adicionado com sucesso!');
        }
        await this.render(this.currentEventId);
        return true;
      } else {
        const errorMsg = (result && result.error) || 'Erro desconhecido ao adicionar honorário';
        console.error('Erro ao adicionar honorário:', errorMsg);
        if (window.toast && typeof window.toast.error === 'function') {
          window.toast.error(errorMsg);
        }
        return false;
      }
    } catch (error) {
      const errorMsg = `Erro ao adicionar honorário: ${error?.message || 'Erro desconhecido'}`;
      console.error('Erro em saveFee:', error);
      if (window.toast && typeof window.toast.error === 'function') {
        window.toast.error(errorMsg);
      }
      return false;
    }
  }

  showAddKmTravelModal() {
    const modal = this.createModal('Adicionar KM / Viagem', `
      <form id="form-add-km-travel">
        <div class="form-group">
          <label class="form-label">Tipo</label>
          <select class="form-input" id="km-travel-type" required>
            <option value="">Selecione...</option>
            <option value="km">KM Rodado</option>
            <option value="tempo_viagem">Tempo de Viagem</option>
          </select>
        </div>
        <div class="form-group" id="km-group" style="display: none;">
          <label class="form-label">Distância (KM)</label>
          <input type="number" class="form-input" id="km-distance" 
                 step="0.1" min="0.1" placeholder="0">
        </div>
        <div class="form-group" id="hours-group" style="display: none;">
          <label class="form-label">Horas de Viagem</label>
          <input type="number" class="form-input" id="travel-hours" 
                 step="0.1" min="0.1" placeholder="0">
        </div>
        <div class="form-group">
          <label class="form-label">Descrição</label>
          <input type="text" class="form-input" id="km-travel-description" 
                 placeholder="Ex: Deslocamento até o evento" required>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" onclick="this.closest('.modal-backdrop').remove()">
            Cancelar
          </button>
          <button type="submit" class="btn btn-primary">Salvar</button>
        </div>
      </form>
    `);

    document.body.appendChild(modal);
    modal.classList.add('active');

    // Mostra/esconde campos baseado no tipo
    document.getElementById('km-travel-type').addEventListener('change', (e) => {
      const type = e.target.value;
      document.getElementById('km-group').style.display = type === 'km' ? 'block' : 'none';
      document.getElementById('hours-group').style.display = type === 'tempo_viagem' ? 'block' : 'none';
    });

    document.getElementById('form-add-km-travel').addEventListener('submit', async (e) => {
      e.preventDefault();
      const result = await this.saveKmTravel();
      // Só remove o modal se saveKmTravel retornou sucesso (sem erro)
      if (result !== false) {
      modal.remove();
      }
    });
  }

  async saveExpense() {
    try {
      const description = document.getElementById('expense-description').value;
      const amount = parseFloat(document.getElementById('expense-amount').value);
      const hasReceipt = document.getElementById('expense-has-receipt').checked;

      const result = await this.addTransactionUseCase.execute({
        eventId: this.currentEventId,
        type: 'EXPENSE',
        description,
        amount,
        hasReceipt
      });

      if (result && result.success) {
        if (window.toast && typeof window.toast.success === 'function') {
          window.toast.success('Despesa adicionada com sucesso!');
        } else {
          console.log('✅ Despesa adicionada com sucesso!');
        }
        await this.render(this.currentEventId);
        return true; // Retorna true para indicar sucesso
      } else {
        const errorMsg = (result && result.error) || 'Erro desconhecido ao adicionar despesa';
        console.error('Erro ao adicionar despesa:', errorMsg);
        
        // GARANTE que nunca vai gerar um alert nativo
        if (window.toast && typeof window.toast.error === 'function') {
          window.toast.error(errorMsg);
        } else {
          console.error('Toast não disponível. Erro:', errorMsg);
          // Aguarda um pouco e tenta novamente
          setTimeout(() => {
            if (window.toast && typeof window.toast.error === 'function') {
              window.toast.error(errorMsg);
            }
          }, 500);
        }
        return false; // Retorna false para indicar erro
      }
    } catch (error) {
      const errorMsg = `Erro ao adicionar despesa: ${error?.message || 'Erro desconhecido'}`;
      console.error('Erro em saveExpense:', error);
      
      // GARANTE que nunca vai gerar um alert nativo
      if (window.toast && typeof window.toast.error === 'function') {
        window.toast.error(errorMsg);
      } else {
        console.error('Toast não disponível. Erro:', errorMsg);
        // Aguarda um pouco e tenta novamente
        setTimeout(() => {
          if (window.toast && typeof window.toast.error === 'function') {
            window.toast.error(errorMsg);
          }
        }, 500);
      }
      return false; // Retorna false para indicar erro
    }
  }

  async saveKmTravel() {
    try {
      const type = document.getElementById('km-travel-type').value;
      const description = document.getElementById('km-travel-description').value;
      
      let input = {
        eventId: this.currentEventId,
        type: 'INCOME',
        description,
        category: type,
        isReimbursement: true
      };

      if (type === 'km') {
        input.distance = parseFloat(document.getElementById('km-distance').value);
      } else if (type === 'tempo_viagem') {
        input.hours = parseFloat(document.getElementById('travel-hours').value);
      }

      const result = await this.addTransactionUseCase.execute(input);

      if (result && result.success) {
        if (window.toast && typeof window.toast.success === 'function') {
          window.toast.success('Transação adicionada com sucesso!');
        } else {
          console.log('✅ Transação adicionada com sucesso!');
        }
        await this.render(this.currentEventId);
        return true; // Retorna true para indicar sucesso
      } else {
        const errorMsg = (result && result.error) || 'Erro desconhecido ao adicionar transação';
        console.error('Erro ao adicionar transação:', errorMsg);
        
        // GARANTE que nunca vai gerar um alert nativo
        if (window.toast && typeof window.toast.error === 'function') {
          window.toast.error(errorMsg);
        } else {
          console.error('Toast não disponível. Erro:', errorMsg);
          // Aguarda um pouco e tenta novamente
          setTimeout(() => {
            if (window.toast && typeof window.toast.error === 'function') {
              window.toast.error(errorMsg);
            }
          }, 500);
        }
        return false; // Retorna false para indicar erro
      }
    } catch (error) {
      const errorMsg = `Erro ao adicionar transação: ${error?.message || 'Erro desconhecido'}`;
      console.error('Erro em saveKmTravel:', error);
      
      // GARANTE que nunca vai gerar um alert nativo
      if (window.toast && typeof window.toast.error === 'function') {
        window.toast.error(errorMsg);
      } else {
        console.error('Toast não disponível. Erro:', errorMsg);
        // Aguarda um pouco e tenta novamente
        setTimeout(() => {
          if (window.toast && typeof window.toast.error === 'function') {
            window.toast.error(errorMsg);
          }
        }, 500);
      }
      return false; // Retorna false para indicar erro
    }
  }

  async markReceiptAsIssued(transactionId) {
    try {
    const transaction = await this.transactionRepository.findById(transactionId);
    if (transaction) {
      transaction.markReceiptAsIssued();
      await this.transactionRepository.save(transaction);
        window.toast.success('Nota fiscal marcada como emitida!');
        await this.render(this.currentEventId);
      } else {
        window.toast.error('Transação não encontrada');
      }
    } catch (error) {
      window.toast.error(`Erro ao marcar nota fiscal: ${error.message}`);
    }
  }

  async deleteTransaction(transactionId) {
    if (!this.deleteTransactionUseCase) {
      window.toast.error('Funcionalidade de exclusão não disponível');
      return;
    }

    // Confirmação antes de excluir
    const confirmed = window.confirm('Tem certeza que deseja excluir esta transação?');
    if (!confirmed) {
      return;
    }

    try {
      const result = await this.deleteTransactionUseCase.execute(transactionId);
      
      if (result.success) {
        window.toast.success('Transação excluída com sucesso!');
        // Recarrega os dados da tela para refletir a remoção
      await this.render(this.currentEventId);
      } else {
        window.toast.error(`Erro ao excluir transação: ${result.error}`);
      }
    } catch (error) {
      console.error('Erro ao excluir transação:', error);
      window.toast.error(`Erro ao excluir transação: ${error.message}`);
    }
  }

  /**
   * Exibe modal para editar evento
   */
  async showEditEventModal(event) {
    // Formata a data para o input type="date" (YYYY-MM-DD)
    const eventDate = event.date instanceof Date 
      ? event.date.toISOString().split('T')[0]
      : event.date.split('T')[0];

    const modal = this.createModal('Editar Evento', `
      <form id="form-edit-event">
        <div class="form-group">
          <label class="form-label">Nome do Evento *</label>
          <input type="text" class="form-input" id="edit-event-name" 
                 value="${this.escapeHtml(event.name)}" required 
                 placeholder="Ex: Evento Corporativo - Empresa XYZ">
        </div>
        <div class="form-group">
          <label class="form-label">Data do Evento *</label>
          <input type="date" class="form-input" id="edit-event-date" 
                 value="${eventDate}" required>
        </div>
        <div class="form-group">
          <label class="form-label">Descrição (opcional)</label>
          <textarea class="form-input" id="edit-event-description" rows="3" 
                    placeholder="Detalhes sobre o evento...">${this.escapeHtml(event.description || '')}</textarea>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" onclick="this.closest('.modal-backdrop').remove()">
            Cancelar
          </button>
          <button type="submit" class="btn btn-primary">Salvar Alterações</button>
        </div>
      </form>
    `);

    document.body.appendChild(modal);
    modal.classList.add('active');

    document.getElementById('form-edit-event').addEventListener('submit', async (e) => {
      e.preventDefault();
      const result = await this.saveEventEdit();
      if (result !== false) {
        modal.remove();
      }
    });
  }

  /**
   * Salva as alterações do evento
   */
  async saveEventEdit() {
    try {
      if (!this.updateEventUseCase) {
        if (window.toast) {
          window.toast.error('Use case de edição não disponível');
        }
        return false;
      }

      const name = document.getElementById('edit-event-name').value.trim();
      const date = document.getElementById('edit-event-date').value;
      const description = document.getElementById('edit-event-description').value.trim();

      if (!name || !date) {
        if (window.toast) {
          window.toast.error('Nome e data são obrigatórios');
        }
        return false;
      }

      const result = await this.updateEventUseCase.execute(this.currentEventId, {
        name,
        date,
        description: description || ''
      });

      if (result.success) {
        if (window.toast) {
          window.toast.success('Evento atualizado com sucesso!');
        }
        // Re-renderiza a view para mostrar as alterações
        await this.render(this.currentEventId);
        return true;
      } else {
        if (window.toast) {
          window.toast.error(result.error || 'Erro ao atualizar evento');
        }
        return false;
      }
    } catch (error) {
      console.error('Erro ao salvar edição do evento:', error);
      if (window.toast) {
        window.toast.error('Erro ao salvar alterações: ' + (error.message || 'Erro desconhecido'));
      }
      return false;
    }
  }

  createModal(title, content) {
    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';
    backdrop.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title">${title}</h3>
          <button class="modal-close" onclick="this.closest('.modal-backdrop').remove()">×</button>
        </div>
        ${content}
      </div>
    `;
    return backdrop;
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
      month: 'long',
      year: 'numeric'
    }).format(date);
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Retorna configuração visual do status
   * @private
   */
  _getStatusConfig(status) {
    const configs = {
      'PLANNED': {
        label: 'Planejado',
        borderColor: '#6b7280', // Cinza
        bgColor: 'rgba(107, 114, 128, 0.05)',
        badgeColor: '#6b7280',
        badgeTextColor: '#fff'
      },
      'DONE': {
        label: 'Realizado',
        borderColor: '#3b82f6', // Azul
        bgColor: 'rgba(59, 130, 246, 0.05)',
        badgeColor: '#3b82f6',
        badgeTextColor: '#fff'
      },
      'COMPLETED': {
        label: 'Realizado',
        borderColor: '#3b82f6', // Azul (compatibilidade)
        bgColor: 'rgba(59, 130, 246, 0.05)',
        badgeColor: '#3b82f6',
        badgeTextColor: '#fff'
      },
      'REPORT_SENT': {
        label: 'Relatório/NF Enviada',
        borderColor: '#f97316', // Laranja
        bgColor: 'rgba(249, 115, 22, 0.05)',
        badgeColor: '#f97316',
        badgeTextColor: '#fff'
      },
      'PAID': {
        label: 'Finalizado/Pago',
        borderColor: '#22c55e', // Verde
        bgColor: 'rgba(34, 197, 94, 0.05)',
        badgeColor: '#22c55e',
        badgeTextColor: '#fff'
      }
    };

    return configs[status] || configs['PLANNED'];
  }

  /**
   * Atualiza o status do evento
   */
  async updateStatus(newStatus) {
    if (!this.updateEventStatusUseCase) {
      window.toast?.error('Funcionalidade de atualização de status não disponível');
      return;
    }

    try {
      const result = await this.updateEventStatusUseCase.execute(this.currentEventId, newStatus);

      if (result.success) {
        // Mensagem especial para REPORT_SENT
        if (newStatus === 'REPORT_SENT' && result.expectedPaymentDate) {
          const paymentDate = this.formatDate(result.expectedPaymentDate);
          window.toast?.success(`Data de pagamento prevista atualizada para ${paymentDate}!`);
        } else {
          const statusLabel = this._getStatusConfig(newStatus).label;
          window.toast?.success(`Status atualizado para: ${statusLabel}`);
        }
        
        // Recarrega a view para refletir as mudanças
        await this.render(this.currentEventId);
      } else {
        window.toast?.error(`Erro ao atualizar status: ${result.error}`);
      }
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      window.toast?.error(`Erro ao atualizar status: ${error.message}`);
    }
  }

  /**
   * Gera e exibe o relatório de fechamento do evento
   */
  async generateReport() {
    if (!this.generateEventReportUseCase) {
      window.toast?.error('Funcionalidade de relatório não disponível');
      return;
    }

    if (!this.currentEventId) {
      window.toast?.error('Evento não encontrado');
      return;
    }

    try {
      // Mostra feedback de carregamento
      const btn = document.getElementById('btn-generate-report');
      const originalText = btn?.textContent || '📄 Gerar Relatório';
      if (btn) {
        btn.disabled = true;
        btn.textContent = '⏳ Gerando...';
      }

      // Gera o relatório
      const result = await this.generateEventReportUseCase.execute(this.currentEventId);

      if (result.success) {
        // Renderiza o relatório
        const reportView = new ReportView();
        reportView.render(result);
        
        window.toast?.success('Relatório gerado com sucesso!');
      } else {
        window.toast?.error(`Erro ao gerar relatório: ${result.error}`);
      }

      // Restaura o botão
      if (btn) {
        btn.disabled = false;
        btn.textContent = originalText;
      }
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      window.toast?.error(`Erro ao gerar relatório: ${error.message}`);
      
      // Restaura o botão em caso de erro
      const btn = document.getElementById('btn-generate-report');
      if (btn) {
        btn.disabled = false;
        btn.textContent = '📄 Gerar Relatório';
      }
    }
  }
}

// Export para uso em módulos ES6
export { EventDetailView };

