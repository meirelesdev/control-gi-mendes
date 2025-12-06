/**
 * View: Detalhe do Evento
 * Exibe detalhes do evento, botões de ação e lista de insumos
 */
import { ReportView } from './ReportView.js';

class EventDetailView {
  constructor(eventRepository, transactionRepository, settingsRepository, addTransactionUseCase, deleteTransactionUseCase = null, generateEventReportUseCase = null, updateEventStatusUseCase = null, updateEventUseCase = null, updateTransactionUseCase = null, deleteEventUseCase = null) {
    this.eventRepository = eventRepository;
    this.transactionRepository = transactionRepository;
    this.settingsRepository = settingsRepository;
    this.addTransactionUseCase = addTransactionUseCase;
    this.deleteTransactionUseCase = deleteTransactionUseCase;
    this.generateEventReportUseCase = generateEventReportUseCase;
    this.updateEventStatusUseCase = updateEventStatusUseCase;
    this.updateEventUseCase = updateEventUseCase;
    this.updateTransactionUseCase = updateTransactionUseCase;
    this.deleteEventUseCase = deleteEventUseCase;
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
      
      // Separa KM do restante dos reembolsos para cálculo de investimento inicial
      const kmTransactions = reimbursements.filter(r => r.metadata.category === 'km');
      const travelTimeTransactions = reimbursements.filter(r => r.metadata.category === 'tempo_viagem');
      
      // Calcula totais
      const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
      const totalKmCost = kmTransactions.reduce((sum, k) => sum + k.amount, 0); // Gasolina paga hoje
      const totalTravelTimeCost = travelTimeTransactions.reduce((sum, t) => sum + t.amount, 0);
      const totalReimbursements = reimbursements.reduce((sum, r) => sum + r.amount, 0);
      const totalFees = fees.reduce((sum, f) => sum + f.amount, 0);
      const totalIncomes = incomes.reduce((sum, i) => sum + i.amount, 0);
      
      // Calcula os novos totalizadores financeiros
      const upfrontCost = totalExpenses + totalKmCost; // Investimento inicial (despesas + gasolina)
      const reimbursementValue = totalExpenses + totalKmCost + totalTravelTimeCost; // Valor de reembolso
      const netProfit = totalFees; // Lucro líquido (apenas honorários)
      const totalToReceive = reimbursementValue + netProfit; // Total a receber

      // Define cores e labels por status
      const statusConfig = this._getStatusConfig(event.status);
      const statusBorderColor = statusConfig.borderColor;
      const statusBgColor = statusConfig.bgColor;

      container.innerHTML = `
        <div class="card" style="border-left: 4px solid ${statusBorderColor}; background-color: ${statusBgColor};">
          <!-- Título do Evento -->
          <div style="margin-bottom: var(--spacing-md);">
            <h2 style="margin: 0 0 var(--spacing-sm) 0; word-wrap: break-word; hyphens: auto;">${this.escapeHtml(event.name)}</h2>
          </div>
          
          <!-- Barra de Ações - Responsiva -->
          <div style="display: flex; flex-wrap: wrap; gap: var(--spacing-md); align-items: center; justify-content: space-between; margin-bottom: var(--spacing-md);">
            <!-- Grupo Esquerdo: Botões de Ação + Badge -->
            <div style="display: flex; flex-wrap: wrap; align-items: center; gap: var(--spacing-sm); flex: 1; min-width: 0;">
              <!-- Grupo de Botões de Ação (Editar/Deletar) -->
              <div style="display: flex; align-items: center; gap: var(--spacing-sm); flex-shrink: 0;">
                ${event.isEditable && this.updateEventUseCase ? `
                  <button class="btn btn-sm" id="btn-edit-event" 
                          style="background: transparent; color: ${statusBgColor === 'var(--color-surface)' ? 'var(--color-primary)' : 'white'}; padding: 6px 10px; border-radius: var(--radius-full); border: 1px solid ${statusBgColor === 'var(--color-surface)' ? 'var(--color-border)' : 'rgba(255,255,255,0.3)'}; font-size: 18px; line-height: 1; min-width: 36px; flex-shrink: 0;"
                          title="Editar Evento">
                    ✏️
                  </button>
                ` : !event.isEditable ? `
                  <button class="btn btn-sm" disabled
                          style="background: transparent; color: var(--color-text-secondary); padding: 6px 10px; border-radius: var(--radius-full); border: 1px solid var(--color-border); opacity: 0.6; cursor: not-allowed; font-size: 18px; line-height: 1; min-width: 36px; flex-shrink: 0;"
                          title="Evento não pode ser editado (Finalizado/Pago)">
                    🔒
                  </button>
                ` : ''}
                ${this.deleteEventUseCase && event.status === 'PLANNED' ? `
                  <button class="btn btn-sm" id="btn-delete-event" 
                          style="background: transparent; color: ${statusBgColor === 'var(--color-surface)' ? 'var(--color-danger)' : 'white'}; padding: 6px 10px; border-radius: var(--radius-full); border: 1px solid ${statusBgColor === 'var(--color-surface)' ? 'var(--color-border)' : 'rgba(255,255,255,0.3)'}; font-size: 18px; line-height: 1; min-width: 36px; flex-shrink: 0;"
                          title="Excluir Evento">
                    🗑️
                  </button>
                ` : ''}
              </div>
              
              <!-- Badge de Status -->
              <span class="badge" style="background-color: ${statusConfig.badgeColor}; color: ${statusConfig.badgeTextColor}; font-size: 11px; padding: 4px 12px; white-space: nowrap; flex-shrink: 0;">
                ${statusConfig.label}
              </span>
            </div>
            
            <!-- Grupo Direito: Botão Relatório -->
            ${this.generateEventReportUseCase ? `
              <div style="flex-shrink: 0;">
                <button class="btn btn-sm btn-success" id="btn-generate-report" 
                        style="padding: 8px 12px; border-radius: var(--radius-full); font-size: 14px; white-space: nowrap;"
                        title="Gerar Relatório">
                  📄 Relatório
                </button>
              </div>
            ` : ''}
          </div>
          
          <!-- Informações do Evento -->
          <div style="margin-bottom: var(--spacing-md);">
            <p class="text-muted" style="margin: 0 0 var(--spacing-sm) 0;">${this.formatDate(event.date)}</p>
            ${event.description ? `<p style="margin: 0 0 var(--spacing-sm) 0; word-wrap: break-word;">${this.escapeHtml(event.description)}</p>` : ''}
            ${event.expectedPaymentDate ? `
              <p style="margin: var(--spacing-sm) 0 0 0;">
                <strong>💰 Pagamento previsto:</strong> ${this.formatDate(event.expectedPaymentDate)}
              </p>
            ` : ''}
          </div>
          
          ${this.updateEventStatusUseCase ? `
          <div style="margin-top: var(--spacing-md); padding-top: var(--spacing-md); border-top: 1px solid var(--color-border);">
            <label class="form-label" style="margin-bottom: var(--spacing-sm); display: block;">
              <strong>Status do Evento:</strong>
            </label>
            <select class="form-input" id="event-status-select" style="max-width: 300px;" ${event.status === 'PAID' ? 'disabled' : ''}>
              <option value="PLANNED" ${event.status === 'PLANNED' ? 'selected' : ''} ${event.status !== 'PLANNED' && (event.status === 'DONE' || event.status === 'COMPLETED' || event.status === 'REPORT_SENT' || event.status === 'PAID') ? 'disabled' : ''}>Planejando</option>
              <option value="DONE" ${event.status === 'DONE' || event.status === 'COMPLETED' ? 'selected' : ''} ${event.status === 'PAID' ? 'disabled' : ''}>Realizado</option>
              <option value="REPORT_SENT" ${event.status === 'REPORT_SENT' ? 'selected' : ''} ${event.status === 'PAID' ? 'disabled' : ''}>Relatório Enviado</option>
              <option value="PAID" ${event.status === 'PAID' ? 'selected' : ''}>Finalizado/Pago</option>
            </select>
            ${event.status === 'PAID' ? `
              <p style="margin-top: var(--spacing-sm); font-size: var(--font-size-sm); color: var(--color-text-secondary);">
                ⚠️ Evento finalizado não pode ter seu status alterado.
              </p>
            ` : ''}
          </div>
          ` : ''}
        </div>

        <!-- Card de Resumo Financeiro Detalhado -->
        <div class="card" style="background: linear-gradient(135deg, #F4F7F6 0%, #FFFFFF 100%); border: 2px solid var(--color-border-light);">
          <h3 style="margin-bottom: var(--spacing-lg); color: var(--color-text); font-size: var(--font-size-lg);">
            💰 Resumo Financeiro
          </h3>
          
          <!-- Linha 1: Investimento Realizado (Vermelho/Laranja) -->
          <div style="display: flex; justify-content: space-between; align-items: center; padding: var(--spacing-md); background: linear-gradient(135deg, #FFEBEE 0%, #FFF3E0 100%); border-radius: var(--radius-md); margin-bottom: var(--spacing-md); border-left: 4px solid #EF5350;">
            <div>
              <div style="font-size: var(--font-size-sm); color: #C62828; font-weight: var(--font-weight-semibold); margin-bottom: var(--spacing-xs);">
                💸 Investimento Realizado
              </div>
              <div style="font-size: var(--font-size-xs); color: #757575;">
                Valor que você pagou do próprio bolso (Custos de Insumos + Gasolina)
              </div>
            </div>
            <div style="font-size: var(--font-size-xl); font-weight: var(--font-weight-bold); color: #C62828;">
              ${this.formatCurrency(upfrontCost)}
            </div>
          </div>

          <!-- Linha 2: Total a Receber (Azul) -->
          <div style="display: flex; justify-content: space-between; align-items: center; padding: var(--spacing-md); background: linear-gradient(135deg, #E3F2FD 0%, #E1F5FE 100%); border-radius: var(--radius-md); margin-bottom: var(--spacing-md); border-left: 4px solid #2196F3;">
            <div>
              <div style="font-size: var(--font-size-sm); color: #1565C0; font-weight: var(--font-weight-semibold); margin-bottom: var(--spacing-xs);">
                📥 Total a Receber
              </div>
              <div style="font-size: var(--font-size-xs); color: #757575;">
                Reembolsos (Insumos + Deslocamentos) + Lucro (Honorários)
              </div>
            </div>
            <div style="font-size: var(--font-size-xl); font-weight: var(--font-weight-bold); color: #1565C0;">
              ${this.formatCurrency(totalToReceive)}
            </div>
          </div>

          <!-- Destaque Principal: Lucro Líquido (Verde) -->
          <div style="display: flex; justify-content: space-between; align-items: center; padding: var(--spacing-lg); background: linear-gradient(135deg, #E0F2F1 0%, #C8E6C9 100%); border-radius: var(--radius-lg); border: 2px solid #26A69A; box-shadow: 0 4px 12px rgba(38, 166, 154, 0.2);">
            <div>
              <div style="font-size: var(--font-size-base); color: #00897B; font-weight: var(--font-weight-bold); margin-bottom: var(--spacing-xs);">
                ✨ Seu Lucro Líquido
              </div>
              <div style="font-size: var(--font-size-xs); color: #00695C;">
                Apenas Diárias + Horas Extras (dinheiro realmente ganho)
              </div>
            </div>
            <div style="font-size: var(--font-size-2xl); font-weight: var(--font-weight-bold); color: #00897B;">
              ${this.formatCurrency(netProfit)}
            </div>
          </div>
        </div>

        ${event.status !== 'PAID' ? `
        <div class="card">
          <h3 style="margin-bottom: var(--spacing-md);">Ações Rápidas</h3>
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--spacing-sm);">
            <button class="btn btn-primary" id="btn-add-expense" 
                    style="padding: var(--spacing-md); border-radius: var(--radius-lg); font-size: 24px; line-height: 1; display: flex; flex-direction: column; align-items: center; gap: 2px;"
                    title="Adicionar Insumo (Reembolso)">
              <span>📦</span>
              <span style="font-size: 11px; font-weight: var(--font-weight-medium);">Insumo</span>
              <span style="font-size: 9px; color: var(--color-text-secondary);">(Reembolso)</span>
            </button>
            <button class="btn btn-success" id="btn-add-fee" 
                    style="padding: var(--spacing-md); border-radius: var(--radius-lg); font-size: 24px; line-height: 1; display: flex; flex-direction: column; align-items: center; gap: 2px;"
                    title="Adicionar Honorário (Lucro)">
              <span>💰</span>
              <span style="font-size: 11px; font-weight: var(--font-weight-medium);">Honorário</span>
              <span style="font-size: 9px; color: var(--color-success);">(Lucro)</span>
            </button>
            <button class="btn btn-secondary" id="btn-add-km-travel" 
                    style="padding: var(--spacing-md); border-radius: var(--radius-lg); font-size: 24px; line-height: 1; display: flex; flex-direction: column; align-items: center; gap: 2px;"
                    title="Adicionar Deslocamento (Reembolso)">
              <span>🚗</span>
              <span style="font-size: 11px; font-weight: var(--font-weight-medium);">Deslocamento</span>
              <span style="font-size: 9px; color: var(--color-text-secondary);">(Reembolso)</span>
            </button>
          </div>
        </div>
        ` : ''}

        <div class="card">
          <div class="card-header">
            <h3 class="card-title">📦 Insumos (Reembolso)</h3>
            <div style="display: flex; align-items: center; gap: var(--spacing-sm); flex-wrap: wrap;">
              ${expensesWithoutReceipt.length > 0 ? `
                <span class="badge badge-warning">${expensesWithoutReceipt.length} sem NF</span>
              ` : ''}
              ${expenses.length > 0 ? `
                <span class="badge badge-info">Total: ${this.formatCurrency(totalExpenses)}</span>
              ` : ''}
              ${event.status !== 'PAID' ? `
                <button class="btn btn-sm btn-primary" id="btn-add-expense-header" 
                        style="padding: 6px 12px; border-radius: var(--radius-full); font-size: 18px; line-height: 1; min-width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;"
                        title="Adicionar Insumo">
                  ➕
                </button>
              ` : ''}
            </div>
          </div>
          ${expenses.length === 0 ? `
            <div class="empty-state">
              <p class="text-muted">Nenhum insumo cadastrado ainda.</p>
            </div>
          ` : `
            <div class="expense-list">
              ${expenses.map(expense => this.renderExpenseItem(expense, event.status)).join('')}
            </div>
          `}
        </div>

        <div class="card">
          <div class="card-header">
            <h3 class="card-title">💰 Honorários (Lucro)</h3>
            <div style="display: flex; align-items: center; gap: var(--spacing-sm); flex-wrap: wrap;">
              ${fees.length > 0 ? `
                <span class="badge badge-success">Total: ${this.formatCurrency(totalFees)}</span>
              ` : ''}
              ${event.status !== 'PAID' ? `
                <button class="btn btn-sm btn-success" id="btn-add-fee-header" 
                        style="padding: 6px 12px; border-radius: var(--radius-full); font-size: 18px; line-height: 1; min-width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;"
                        title="Adicionar Honorário">
                  ➕
                </button>
              ` : ''}
            </div>
          </div>
          ${fees.length === 0 ? `
            <div class="empty-state">
              <p class="text-muted">Nenhum honorário cadastrado ainda.</p>
            </div>
          ` : `
            <div class="expense-list">
              ${fees.map(fee => this.renderFeeItem(fee, event.status)).join('')}
            </div>
          `}
        </div>

        <div class="card">
          <div class="card-header">
            <h3 class="card-title">🚗 Deslocamentos (Reembolso)</h3>
            <div style="display: flex; align-items: center; gap: var(--spacing-sm); flex-wrap: wrap;">
              ${reimbursements.length > 0 ? `
                <span class="badge badge-info">Total: ${this.formatCurrency(totalReimbursements)}</span>
              ` : ''}
              ${event.status !== 'PAID' ? `
                <button class="btn btn-sm btn-secondary" id="btn-add-km-travel-header" 
                        style="padding: 6px 12px; border-radius: var(--radius-full); font-size: 18px; line-height: 1; min-width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;"
                        title="Adicionar Deslocamento">
                  ➕
                </button>
              ` : ''}
            </div>
          </div>
          ${reimbursements.length === 0 ? `
            <div class="empty-state">
              <p class="text-muted">Nenhum deslocamento cadastrado ainda.</p>
            </div>
          ` : `
            <div class="expense-list">
              ${reimbursements.map(reimbursement => this.renderIncomeItem(reimbursement, event.status)).join('')}
            </div>
          `}
        </div>
      `;

      // Event listeners (apenas se o evento não estiver finalizado)
      if (event.status !== 'PAID') {
        // Botões da seção "Ações Rápidas"
        const btnAddExpense = document.getElementById('btn-add-expense');
        if (btnAddExpense) {
          btnAddExpense.addEventListener('click', () => {
            this.showAddExpenseModal();
          });
        }

        const btnAddFee = document.getElementById('btn-add-fee');
        if (btnAddFee) {
          btnAddFee.addEventListener('click', () => {
            this.showAddFeeModal();
          });
        }

        const btnAddKmTravel = document.getElementById('btn-add-km-travel');
        if (btnAddKmTravel) {
          btnAddKmTravel.addEventListener('click', () => {
            this.showAddKmTravelModal();
          });
        }

        // Botões nos headers das seções
        const btnAddExpenseHeader = document.getElementById('btn-add-expense-header');
        if (btnAddExpenseHeader) {
          btnAddExpenseHeader.addEventListener('click', () => {
            this.showAddExpenseModal();
          });
        }

        const btnAddFeeHeader = document.getElementById('btn-add-fee-header');
        if (btnAddFeeHeader) {
          btnAddFeeHeader.addEventListener('click', () => {
            this.showAddFeeModal();
          });
        }

        const btnAddKmTravelHeader = document.getElementById('btn-add-km-travel-header');
        if (btnAddKmTravelHeader) {
          btnAddKmTravelHeader.addEventListener('click', () => {
            this.showAddKmTravelModal();
          });
        }
      }

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
          // Salva o status atual para prevenir mudanças inválidas
          const currentStatus = event.status;
          
          // Previne qualquer tentativa de mudança se o select estiver desabilitado
          if (statusSelect.disabled) {
            // Adiciona um listener que sempre restaura o valor se alguém tentar mudar
            statusSelect.addEventListener('change', (e) => {
              e.preventDefault();
              e.target.value = currentStatus;
            });
            return; // Não adiciona mais listeners se estiver desabilitado
          }
          
          statusSelect.addEventListener('change', async (e) => {
            const newStatus = e.target.value;
            const selectedOption = e.target.options[e.target.selectedIndex];
            
            // Previne seleção de opções desabilitadas
            if (selectedOption && selectedOption.disabled) {
              // Restaura o valor anterior
              e.target.value = currentStatus;
              window.toast?.error('Esta transição de status não é permitida.');
              return;
            }
            
            // Valida se a mudança é permitida antes de processar
            if (newStatus === currentStatus) {
              return; // Não faz nada se não mudou
            }
            
            await this.updateStatus(newStatus);
          });
          
          // Previne mudança via teclado em opções desabilitadas
          statusSelect.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
              const currentIndex = e.target.selectedIndex;
              const options = Array.from(e.target.options);
              let nextIndex = e.key === 'ArrowDown' ? currentIndex + 1 : currentIndex - 1;
              
              // Pula opções desabilitadas
              while (nextIndex >= 0 && nextIndex < options.length) {
                if (!options[nextIndex].disabled) {
                  break; // Encontrou uma opção válida
                }
                nextIndex = e.key === 'ArrowDown' ? nextIndex + 1 : nextIndex - 1;
              }
              
              if (nextIndex < 0 || nextIndex >= options.length || options[nextIndex].disabled) {
                e.preventDefault();
              }
            }
          });
          
          // Previne mudança via mouse em opções desabilitadas
          statusSelect.addEventListener('mousedown', (e) => {
            if (statusSelect.disabled) {
              e.preventDefault();
              return;
            }
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

      // Event listener para excluir evento
      if (this.deleteEventUseCase) {
        const btnDeleteEvent = document.getElementById('btn-delete-event');
        if (btnDeleteEvent) {
          btnDeleteEvent.addEventListener('click', async () => {
            await this.deleteEvent();
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

      // Event listeners para editar transações
      if (this.updateTransactionUseCase) {
        container.querySelectorAll('.btn-edit-transaction').forEach(btn => {
          btn.addEventListener('click', async (e) => {
            const transactionId = e.target.dataset.transactionId;
            const transactionType = e.target.dataset.transactionType;
            const transactionCategory = e.target.dataset.transactionCategory;
            await this.showEditTransactionModal(transactionId, transactionType, transactionCategory);
          });
        });
      }
    } catch (error) {
      container.innerHTML = `
        <div class="card" style="border-left-color: var(--color-danger);">
          <p style="color: var(--color-danger);">Erro ao carregar evento: ${error.message}</p>
        </div>
      `;
    }
  }

  renderExpenseItem(expense, eventStatus) {
    const hasReceipt = expense.metadata.hasReceipt;
    
    return `
      <div class="expense-item ${hasReceipt ? '' : 'no-receipt'}" style="border-left-color: var(--color-danger);">
        <div class="expense-item-info">
          <div class="expense-item-description">
            📦 ${this.escapeHtml(expense.description)}
            <span class="badge badge-secondary" style="margin-left: var(--spacing-xs); font-size: 10px;">Reembolso</span>
          </div>
          <div class="expense-item-value" style="color: var(--color-danger);">${this.formatCurrency(expense.amount)}</div>
        </div>
        <div class="expense-item-actions">
        ${!hasReceipt && eventStatus !== 'PAID' ? `
          <div class="expense-item-receipt">
            <span>⚠️</span>
            <button class="btn btn-sm btn-success btn-mark-receipt" data-transaction-id="${expense.id}">
              Marcar NF
            </button>
          </div>
        ` : hasReceipt ? `
          <span class="badge badge-success">NF OK</span>
        ` : ''}
          ${this.updateTransactionUseCase && eventStatus !== 'PAID' ? `
            <button class="btn btn-sm btn-edit-transaction" 
                    data-transaction-id="${expense.id}"
                    data-transaction-type="expense"
                    title="Editar insumo"
                    style="background: transparent; color: var(--color-primary); padding: 4px 8px; border-radius: var(--radius-full); border: 1px solid var(--color-border); margin-right: var(--spacing-xs);">
              ✏️
            </button>
          ` : ''}
          ${eventStatus !== 'PAID' ? `
          <button class="btn btn-sm btn-delete-transaction" 
                  data-transaction-id="${expense.id}"
                  title="Excluir insumo">
            🗑️
          </button>
          ` : ''}
        </div>
      </div>
    `;
  }

  renderIncomeItem(income, eventStatus) {
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
            🚗 ${this.escapeHtml(income.description)}
            <span class="badge badge-info" style="margin-left: var(--spacing-sm);">${categoryLabel}</span>
            <span class="badge badge-secondary" style="margin-left: var(--spacing-xs);">Reembolso</span>
          </div>
          <div class="expense-item-value" style="color: var(--color-success);">${this.formatCurrency(income.amount)}</div>
        </div>
        <div class="expense-item-actions">
          ${this.updateTransactionUseCase && eventStatus !== 'PAID' ? `
            <button class="btn btn-sm btn-edit-transaction" 
                    data-transaction-id="${income.id}"
                    data-transaction-type="income"
                    data-transaction-category="${category}"
                    title="Editar receita"
                    style="background: transparent; color: var(--color-primary); padding: 4px 8px; border-radius: var(--radius-full); border: 1px solid var(--color-border); margin-right: var(--spacing-xs);">
              ✏️
            </button>
          ` : ''}
          ${eventStatus !== 'PAID' ? `
          <button class="btn btn-sm btn-delete-transaction" 
                  data-transaction-id="${income.id}"
                  title="Excluir receita">
            🗑️
          </button>
          ` : ''}
        </div>
      </div>
    `;
  }

  renderFeeItem(fee, eventStatus) {
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
            💰 ${this.escapeHtml(fee.description)}
            <span class="badge badge-success" style="margin-left: var(--spacing-sm);">${categoryLabel}</span>
            <span class="badge badge-success" style="margin-left: var(--spacing-xs); font-weight: bold;">Lucro</span>
          </div>
          <div class="expense-item-value" style="color: var(--color-success); font-weight: bold;">${this.formatCurrency(fee.amount)}</div>
        </div>
        <div class="expense-item-actions">
          ${this.updateTransactionUseCase && eventStatus !== 'PAID' ? `
            <button class="btn btn-sm btn-edit-transaction" 
                    data-transaction-id="${fee.id}"
                    data-transaction-type="fee"
                    data-transaction-category="${category}"
                    title="Editar honorário"
                    style="background: transparent; color: var(--color-primary); padding: 4px 8px; border-radius: var(--radius-full); border: 1px solid var(--color-border); margin-right: var(--spacing-xs);">
              ✏️
            </button>
          ` : ''}
          ${eventStatus !== 'PAID' ? `
          <button class="btn btn-sm btn-delete-transaction" 
                  data-transaction-id="${fee.id}"
                  title="Excluir honorário">
            🗑️
          </button>
          ` : ''}
        </div>
      </div>
    `;
  }

  async showAddExpenseModal() {
    // Valida se o evento não está finalizado
    if (this.currentEventId) {
      const event = await this.eventRepository.findById(this.currentEventId);
      if (event && event.status === 'PAID') {
        window.toast?.error('Não é possível adicionar transações em eventos finalizados/pagos.');
        return;
      }
    }

    const modal = this.createModal('Adicionar Insumo', `
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
    this._addModalOpenClass();

    document.getElementById('form-add-expense').addEventListener('submit', async (e) => {
      e.preventDefault();
      const result = await this.saveExpense();
      // Só remove o modal se saveExpense retornou sucesso (sem erro)
      if (result !== false) {
        this._removeModalOpenClass();
        modal.remove();
      }
    });
  }

  async showAddFeeModal() {
    // Valida se o evento não está finalizado
    if (this.currentEventId) {
      const event = await this.eventRepository.findById(this.currentEventId);
      if (event && event.status === 'PAID') {
        window.toast?.error('Não é possível adicionar transações em eventos finalizados/pagos.');
        return;
      }
    }

    // Busca valores das configurações antes de criar o modal
    let dailyRate = 300.00;
    let overtimeRate = 75.00;
    try {
      const settings = await this.settingsRepository.find();
      if (settings) {
        dailyRate = settings.standardDailyRate || 300.00;
        overtimeRate = settings.overtimeRate || 75.00;
      }
    } catch (error) {
      console.warn('Erro ao buscar configurações, usando valores padrão:', error);
    }

    const modal = this.createModal('Adicionar Honorário', `
      <form id="form-add-fee">
        <div class="form-group">
          <label class="form-label">Tipo de Honorário</label>
          <div style="display: flex; flex-direction: column; gap: var(--spacing-sm); margin-top: var(--spacing-xs);">
            <label style="display: flex; align-items: center; gap: var(--spacing-sm); cursor: pointer; padding: var(--spacing-sm); border: 1px solid var(--color-border); border-radius: var(--radius-md);">
              <input type="radio" name="fee-type" value="diaria" id="fee-type-diaria" checked style="cursor: pointer;">
              <div style="flex: 1;">
                <strong>Diária Adicional</strong>
                <div class="text-muted" style="font-size: 0.9em;" id="diaria-value">Valor: ${this.formatCurrency(dailyRate)}</div>
              </div>
            </label>
            <label style="display: flex; align-items: center; gap: var(--spacing-sm); cursor: pointer; padding: var(--spacing-sm); border: 1px solid var(--color-border); border-radius: var(--radius-md);">
              <input type="radio" name="fee-type" value="hora_extra" id="fee-type-hora" style="cursor: pointer;">
              <div style="flex: 1;">
                <strong>Hora Extra</strong>
                <div class="text-muted" style="font-size: 0.9em;" id="hora-extra-info">Taxa: ${this.formatCurrency(overtimeRate)} por hora</div>
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
        this._removeModalOpenClass();
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
    const modal = this.createModal('Adicionar Deslocamento', `
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
        <div class="form-group" id="km-origin-group" style="display: none;">
          <label class="form-label">Origem (Cidade/Local)</label>
          <input type="text" class="form-input" id="km-origin" 
                 placeholder="Ex: Florianópolis">
          <small class="text-muted">Cidade ou local de partida</small>
        </div>
        <div class="form-group" id="km-destination-group" style="display: none;">
          <label class="form-label">Destino (Cidade/Local)</label>
          <input type="text" class="form-input" id="km-destination" 
                 placeholder="Ex: Tupandi">
          <small class="text-muted">Cidade ou local de chegada</small>
        </div>
        <div class="form-group" id="hours-group" style="display: none;">
          <label class="form-label">Horas de Viagem</label>
          <input type="number" class="form-input" id="travel-hours" 
                 step="0.1" min="0.1" placeholder="0">
        </div>
        <div class="form-group" id="description-group">
          <label class="form-label">Descrição</label>
          <input type="text" class="form-input" id="km-travel-description" 
                 placeholder="Ex: Deslocamento até o evento" required>
          <small class="text-muted" id="description-hint" style="display: none;">
            A descrição será gerada automaticamente como "Deslocamento: Origem → Destino"
          </small>
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
    this._addModalOpenClass();

    // Mostra/esconde campos baseado no tipo
    const typeSelect = document.getElementById('km-travel-type');
    const kmGroup = document.getElementById('km-group');
    const kmOriginGroup = document.getElementById('km-origin-group');
    const kmDestinationGroup = document.getElementById('km-destination-group');
    const hoursGroup = document.getElementById('hours-group');
    const descriptionGroup = document.getElementById('description-group');
    const descriptionInput = document.getElementById('km-travel-description');
    const descriptionHint = document.getElementById('description-hint');
    
    typeSelect.addEventListener('change', (e) => {
      const type = e.target.value;
      
      if (type === 'km') {
        kmGroup.style.display = 'block';
        kmOriginGroup.style.display = 'block';
        kmDestinationGroup.style.display = 'block';
        hoursGroup.style.display = 'none';
        descriptionGroup.style.display = 'block';
        descriptionHint.style.display = 'block';
        descriptionInput.required = false; // Não obrigatório se origem/destino forem preenchidos
      } else if (type === 'tempo_viagem') {
        kmGroup.style.display = 'none';
        kmOriginGroup.style.display = 'none';
        kmDestinationGroup.style.display = 'none';
        hoursGroup.style.display = 'block';
        descriptionGroup.style.display = 'block';
        descriptionHint.style.display = 'none';
        descriptionInput.required = true;
      } else {
        kmGroup.style.display = 'none';
        kmOriginGroup.style.display = 'none';
        kmDestinationGroup.style.display = 'none';
        hoursGroup.style.display = 'none';
        descriptionGroup.style.display = 'block';
        descriptionHint.style.display = 'none';
        descriptionInput.required = true;
      }
    });

    document.getElementById('form-add-km-travel').addEventListener('submit', async (e) => {
      e.preventDefault();
      const result = await this.saveKmTravel();
      // Só remove o modal se saveKmTravel retornou sucesso (sem erro)
      if (result !== false) {
        this._removeModalOpenClass();
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
          window.toast.success('Insumo adicionado com sucesso!');
        } else {
          console.log('✅ Insumo adicionado com sucesso!');
        }
        await this.render(this.currentEventId);
        return true; // Retorna true para indicar sucesso
      } else {
        const errorMsg = (result && result.error) || 'Erro desconhecido ao adicionar insumo';
        console.error('Erro ao adicionar insumo:', errorMsg);
        
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
      const errorMsg = `Erro ao adicionar insumo: ${error?.message || 'Erro desconhecido'}`;
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
        const distance = parseFloat(document.getElementById('km-distance').value);
        const origin = document.getElementById('km-origin')?.value.trim() || '';
        const destination = document.getElementById('km-destination')?.value.trim() || '';
        
        if (!distance || distance <= 0) {
          window.toast?.error('Distância é obrigatória e deve ser maior que zero');
          return false;
        }
        
        input.distance = distance;
        
        // Se origem e destino forem fornecidos, passa para o use case
        if (origin && destination) {
          input.origin = origin;
          input.destination = destination;
          // Descrição será gerada automaticamente pelo use case
          input.description = description || ''; // Mantém descrição adicional se houver
        } else if (!description || description.trim() === '') {
          // Se não tem origem/destino E não tem descrição, exige descrição
          window.toast?.error('Preencha Origem e Destino ou informe uma Descrição');
          return false;
        }
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
      // Valida se o evento não está finalizado
      if (this.currentEventId) {
        const event = await this.eventRepository.findById(this.currentEventId);
        if (event && event.status === 'PAID') {
          window.toast?.error('Não é possível alterar transações de eventos finalizados/pagos.');
          return;
        }
      }

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

    // Valida se o evento não está finalizado
    if (this.currentEventId) {
      const event = await this.eventRepository.findById(this.currentEventId);
      if (event && event.status === 'PAID') {
        window.toast?.error('Não é possível excluir transações de eventos finalizados/pagos.');
        return;
      }
    }

    // Confirmação antes de excluir usando modal amigável
    const confirmed = await this.showConfirmModal(
      'Excluir Transação',
      'Tem certeza que deseja excluir esta transação? Esta ação não pode ser desfeita.',
      'Excluir',
      'Cancelar',
      '🗑️'
    );
    
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
          <button type="submit" class="btn btn-primary">Salvar</button>
        </div>
      </form>
    `);

    document.body.appendChild(modal);
    modal.classList.add('active');
    this._addModalOpenClass();

    document.getElementById('form-edit-event').addEventListener('submit', async (e) => {
      e.preventDefault();
      const result = await this.saveEventEdit();
      if (result !== false) {
        this._removeModalOpenClass();
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

  /**
   * Exibe modal para editar transação
   */
  async showEditTransactionModal(transactionId, transactionType, transactionCategory = null) {
    // Valida se o evento não está finalizado
    if (this.currentEventId) {
      const event = await this.eventRepository.findById(this.currentEventId);
      if (event && event.status === 'PAID') {
        window.toast?.error('Não é possível editar transações de eventos finalizados/pagos.');
        return;
      }
    }
    try {
      const transaction = await this.transactionRepository.findById(transactionId);
      if (!transaction) {
        if (window.toast) {
          window.toast.error('Transação não encontrada');
        }
        return;
      }

      let modalContent = '';

      if (transactionType === 'expense' || transaction.type === 'EXPENSE') {
        // Modal para editar insumo
        modalContent = `
          <form id="form-edit-expense">
            <div class="form-group">
              <label class="form-label">Descrição *</label>
              <input type="text" class="form-input" id="edit-expense-description" 
                     value="${this.escapeHtml(transaction.description)}" required 
                     placeholder="Ex: Compra de ingredientes">
            </div>
            <div class="form-group">
              <label class="form-label">Valor (R$) *</label>
              <input type="number" class="form-input" id="edit-expense-amount" 
                     value="${transaction.amount}" step="0.01" min="0.01" required>
            </div>
            <div class="form-group">
              <label style="display: flex; align-items: center; gap: var(--spacing-sm);">
                <input type="checkbox" id="edit-expense-has-receipt" ${transaction.metadata.hasReceipt ? 'checked' : ''}>
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
        `;
      } else if (transactionType === 'income' || transaction.type === 'INCOME') {
        // Modal para editar receita (KM/Viagem)
        const isKm = transactionCategory === 'km' || transaction.metadata.category === 'km';
        const isTravelTime = transactionCategory === 'tempo_viagem' || transaction.metadata.category === 'tempo_viagem';
        
        if (isKm) {
          // Editar KM Rodado
          const distance = transaction.metadata.distance || (transaction.amount / (await this.settingsRepository.find())?.rateKm || 0.90);
          const origin = transaction.metadata.origin || '';
          const destination = transaction.metadata.destination || '';
          modalContent = `
            <form id="form-edit-km">
              <div class="form-group">
                <label class="form-label">Origem (Cidade/Local)</label>
                <input type="text" class="form-input" id="edit-km-origin" 
                       value="${this.escapeHtml(origin)}" 
                       placeholder="Ex: Florianópolis">
                <small class="text-muted">Cidade ou local de partida</small>
              </div>
              <div class="form-group">
                <label class="form-label">Destino (Cidade/Local)</label>
                <input type="text" class="form-input" id="edit-km-destination" 
                       value="${this.escapeHtml(destination)}" 
                       placeholder="Ex: Tupandi">
                <small class="text-muted">Cidade ou local de chegada</small>
              </div>
              <div class="form-group">
                <label class="form-label">Distância (KM) *</label>
                <input type="number" class="form-input" id="edit-km-distance" 
                       value="${distance.toFixed(1)}" step="0.1" min="0.1" required>
              </div>
              <div class="form-group">
                <label class="form-label">Descrição Adicional (opcional)</label>
                <input type="text" class="form-input" id="edit-km-description" 
                       value="${this.escapeHtml(transaction.description)}" 
                       placeholder="Informações adicionais">
                <small class="text-muted">A descrição será gerada automaticamente como "Deslocamento: Origem → Destino"</small>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" onclick="this.closest('.modal-backdrop').remove()">
                  Cancelar
                </button>
                <button type="submit" class="btn btn-primary">Salvar</button>
              </div>
            </form>
          `;
        } else if (isTravelTime) {
          // Editar Tempo de Viagem
          const hours = transaction.metadata.hours || (transaction.amount / (await this.settingsRepository.find())?.rateTravelTime || 75.00);
          modalContent = `
            <form id="form-edit-travel-time">
              <div class="form-group">
                <label class="form-label">Descrição *</label>
                <input type="text" class="form-input" id="edit-travel-description" 
                       value="${this.escapeHtml(transaction.description)}" required>
              </div>
              <div class="form-group">
                <label class="form-label">Horas de Viagem *</label>
                <input type="number" class="form-input" id="edit-travel-hours" 
                       value="${hours.toFixed(2)}" step="0.25" min="0.25" required>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" onclick="this.closest('.modal-backdrop').remove()">
                  Cancelar
                </button>
                <button type="submit" class="btn btn-primary">Salvar</button>
              </div>
            </form>
          `;
        } else {
          // Receita genérica (editar descrição e valor)
          modalContent = `
            <form id="form-edit-income">
              <div class="form-group">
                <label class="form-label">Descrição *</label>
                <input type="text" class="form-input" id="edit-income-description" 
                       value="${this.escapeHtml(transaction.description)}" required>
              </div>
              <div class="form-group">
                <label class="form-label">Valor (R$) *</label>
                <input type="number" class="form-input" id="edit-income-amount" 
                       value="${transaction.amount}" step="0.01" min="0.01" required>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" onclick="this.closest('.modal-backdrop').remove()">
                  Cancelar
                </button>
                <button type="submit" class="btn btn-primary">Salvar</button>
              </div>
            </form>
          `;
        }
      } else if (transactionType === 'fee' || (transaction.type === 'INCOME' && transaction.metadata.category === 'diaria' || transaction.metadata.category === 'hora_extra')) {
        // Modal para editar honorário
        const isDiaria = transactionCategory === 'diaria' || transaction.metadata.category === 'diaria';
        const isHoraExtra = transactionCategory === 'hora_extra' || transaction.metadata.category === 'hora_extra';
        
        if (isHoraExtra) {
          // Editar Hora Extra
          const hours = transaction.metadata.hours || (transaction.amount / (await this.settingsRepository.find())?.overtimeRate || 75.00);
          modalContent = `
            <form id="form-edit-hour-extra">
              <div class="form-group">
                <label class="form-label">Descrição *</label>
                <input type="text" class="form-input" id="edit-hour-extra-description" 
                       value="${this.escapeHtml(transaction.description)}" required>
              </div>
              <div class="form-group">
                <label class="form-label">Horas *</label>
                <input type="number" class="form-input" id="edit-hour-extra-hours" 
                       value="${hours.toFixed(2)}" step="0.25" min="0.25" required>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" onclick="this.closest('.modal-backdrop').remove()">
                  Cancelar
                </button>
                <button type="submit" class="btn btn-primary">Salvar</button>
              </div>
            </form>
          `;
        } else {
          // Editar Diária (valor fixo, só descrição)
          modalContent = `
            <form id="form-edit-daily">
              <div class="form-group">
                <label class="form-label">Descrição *</label>
                <input type="text" class="form-input" id="edit-daily-description" 
                       value="${this.escapeHtml(transaction.description)}" required>
              </div>
              <div class="form-group">
                <label class="form-label">Valor (R$) *</label>
                <input type="number" class="form-input" id="edit-daily-amount" 
                       value="${transaction.amount}" step="0.01" min="0.01" required>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" onclick="this.closest('.modal-backdrop').remove()">
                  Cancelar
                </button>
                <button type="submit" class="btn btn-primary">Salvar</button>
              </div>
            </form>
          `;
        }
      }

      const modal = this.createModal('Editar Transação', modalContent);
      document.body.appendChild(modal);
      modal.classList.add('active');
      this._addModalOpenClass();

      // Event listener para salvar
      const formId = modal.querySelector('form').id;
      modal.querySelector(`#${formId}`).addEventListener('submit', async (e) => {
        e.preventDefault();
        const result = await this.saveTransactionEdit(transactionId, transactionType, transactionCategory);
        if (result !== false) {
          this._removeModalOpenClass();
          modal.remove();
        }
      });
    } catch (error) {
      console.error('Erro ao abrir modal de edição:', error);
      if (window.toast) {
        window.toast.error('Erro ao carregar dados da transação: ' + (error.message || 'Erro desconhecido'));
      }
    }
  }

  /**
   * Salva as alterações da transação
   */
  async saveTransactionEdit(transactionId, transactionType, transactionCategory = null) {
    try {
      if (!this.updateTransactionUseCase) {
        if (window.toast) {
          window.toast.error('Use case de edição não disponível');
        }
        return false;
      }

      const transaction = await this.transactionRepository.findById(transactionId);
      if (!transaction) {
        if (window.toast) {
          window.toast.error('Transação não encontrada');
        }
        return false;
      }

      let updateData = {};

      if (transactionType === 'expense' || transaction.type === 'EXPENSE') {
        // Editar insumo
        const description = document.getElementById('edit-expense-description').value.trim();
        const amount = parseFloat(document.getElementById('edit-expense-amount').value);
        const hasReceipt = document.getElementById('edit-expense-has-receipt').checked;

        if (!description || !amount || amount <= 0) {
          if (window.toast) {
            window.toast.error('Descrição e valor são obrigatórios');
          }
          return false;
        }

        updateData = {
          description,
          amount,
          metadata: {
            ...transaction.metadata,
            hasReceipt
          }
        };
      } else if (transactionType === 'income' || transaction.type === 'INCOME') {
        const isKm = transactionCategory === 'km' || transaction.metadata.category === 'km';
        const isTravelTime = transactionCategory === 'tempo_viagem' || transaction.metadata.category === 'tempo_viagem';

        if (isKm) {
          // Editar KM Rodado
          const origin = document.getElementById('edit-km-origin')?.value.trim() || '';
          const destination = document.getElementById('edit-km-destination')?.value.trim() || '';
          const description = document.getElementById('edit-km-description')?.value.trim() || '';
          const distance = parseFloat(document.getElementById('edit-km-distance').value);
          const settings = await this.settingsRepository.find();
          const rateKm = settings?.rateKm || 0.90;
          const amount = distance * rateKm;

          if (!distance || distance <= 0) {
            if (window.toast) {
              window.toast.error('Distância é obrigatória e deve ser maior que zero');
            }
            return false;
          }

          // Gera descrição automaticamente se origem e destino forem fornecidos
          let finalDescription = description;
          if (origin && destination) {
            finalDescription = `Deslocamento: ${origin} → ${destination}`;
            if (description && description.trim() !== '') {
              finalDescription += ` - ${description}`;
            }
          } else if (!description || description.trim() === '') {
            if (window.toast) {
              window.toast.error('Preencha Origem e Destino ou informe uma Descrição');
            }
            return false;
          }

          updateData = {
            description: finalDescription,
            amount,
            metadata: {
              ...transaction.metadata,
              category: 'km',
              distance,
              isReimbursement: true,
              origin: origin || null,
              destination: destination || null
            }
          };
        } else if (isTravelTime) {
          // Editar Tempo de Viagem
          const description = document.getElementById('edit-travel-description').value.trim();
          const hours = parseFloat(document.getElementById('edit-travel-hours').value);
          const settings = await this.settingsRepository.find();
          const rateTravelTime = settings?.rateTravelTime || 75.00;
          const amount = hours * rateTravelTime;

          if (!description || !hours || hours <= 0) {
            if (window.toast) {
              window.toast.error('Descrição e horas são obrigatórios');
            }
            return false;
          }

          updateData = {
            description,
            amount,
            metadata: {
              ...transaction.metadata,
              category: 'tempo_viagem',
              hours,
              isReimbursement: true
            }
          };
        } else {
          // Receita genérica
          const description = document.getElementById('edit-income-description').value.trim();
          const amount = parseFloat(document.getElementById('edit-income-amount').value);

          if (!description || !amount || amount <= 0) {
            if (window.toast) {
              window.toast.error('Descrição e valor são obrigatórios');
            }
            return false;
          }

          updateData = {
            description,
            amount
          };
        }
      } else if (transactionType === 'fee' || transaction.metadata.category === 'diaria' || transaction.metadata.category === 'hora_extra') {
        const isHoraExtra = transactionCategory === 'hora_extra' || transaction.metadata.category === 'hora_extra';

        if (isHoraExtra) {
          // Editar Hora Extra
          const description = document.getElementById('edit-hour-extra-description').value.trim();
          const hours = parseFloat(document.getElementById('edit-hour-extra-hours').value);
          const settings = await this.settingsRepository.find();
          const overtimeRate = settings?.overtimeRate || 75.00;
          const amount = hours * overtimeRate;

          if (!description || !hours || hours <= 0) {
            if (window.toast) {
              window.toast.error('Descrição e horas são obrigatórios');
            }
            return false;
          }

          updateData = {
            description,
            amount,
            metadata: {
              ...transaction.metadata,
              category: 'hora_extra',
              hours,
              isReimbursement: false
            }
          };
        } else {
          // Editar Diária
          const description = document.getElementById('edit-daily-description').value.trim();
          const amount = parseFloat(document.getElementById('edit-daily-amount').value);

          if (!description || !amount || amount <= 0) {
            if (window.toast) {
              window.toast.error('Descrição e valor são obrigatórios');
            }
            return false;
          }

          updateData = {
            description,
            amount,
            metadata: {
              ...transaction.metadata,
              category: 'diaria',
              isReimbursement: false
            }
          };
        }
      }

      const result = await this.updateTransactionUseCase.execute(transactionId, updateData);

      if (result.success) {
        if (window.toast) {
          window.toast.success('Transação atualizada com sucesso!');
        }
        // Re-renderiza a view para mostrar as alterações
        await this.render(this.currentEventId);
        return true;
      } else {
        if (window.toast) {
          window.toast.error(result.error || 'Erro ao atualizar transação');
        }
        return false;
      }
    } catch (error) {
      console.error('Erro ao salvar edição da transação:', error);
      if (window.toast) {
        window.toast.error('Erro ao salvar alterações: ' + (error.message || 'Erro desconhecido'));
      }
      return false;
    }
  }

  /**
   * Exibe um modal de confirmação amigável
   * @param {string} title - Título do modal
   * @param {string} message - Mensagem de confirmação
   * @param {string} [confirmText='Confirmar'] - Texto do botão de confirmação
   * @param {string} [cancelText='Cancelar'] - Texto do botão de cancelamento
   * @param {string} [icon='⚠️'] - Ícone do modal
   * @returns {Promise<boolean>} - true se confirmado, false se cancelado
   */
  showConfirmModal(title, message, confirmText = 'Confirmar', cancelText = 'Cancelar', icon = '⚠️') {
    return new Promise((resolve) => {
      const modal = document.createElement('div');
      modal.className = 'modal-backdrop active';
      modal.innerHTML = `
        <div class="modal" style="max-width: 400px; border-radius: var(--radius-xl);">
          <div class="modal-header" style="text-align: center; padding: var(--spacing-xl) var(--spacing-lg) var(--spacing-md); border-bottom: none;">
            <div style="font-size: 56px; margin-bottom: var(--spacing-md); line-height: 1;">${icon}</div>
            <h3 class="modal-title" style="margin: 0; font-size: var(--font-size-xl); color: var(--color-text); font-weight: var(--font-weight-bold);">
              ${title}
            </h3>
          </div>
          <div class="modal-body" style="text-align: center; padding: var(--spacing-lg) var(--spacing-xl);">
            <p style="color: var(--color-text-secondary); line-height: 1.6; margin: 0; font-size: var(--font-size-base);">
              ${message}
            </p>
          </div>
          <div class="modal-footer" style="display: flex; gap: var(--spacing-sm); margin-top: var(--spacing-md); padding: var(--spacing-lg) var(--spacing-xl); padding-top: 0;">
            <button type="button" class="btn btn-secondary" id="confirm-cancel" style="flex: 1; border-radius: var(--radius-full); padding: var(--spacing-md) var(--spacing-lg); font-weight: var(--font-weight-semibold);">
              ${cancelText}
            </button>
            <button type="button" class="btn" id="confirm-ok" style="flex: 1; border-radius: var(--radius-full); padding: var(--spacing-md) var(--spacing-lg); font-weight: var(--font-weight-semibold); background: var(--color-danger); color: white; box-shadow: 0 4px 12px rgba(239, 83, 80, 0.3);">
              ${confirmText}
            </button>
          </div>
        </div>
      `;

      document.body.appendChild(modal);
      this._addModalOpenClass();

      // Event listeners
      const handleCancel = () => {
        this._removeModalOpenClass();
        if (document.body.contains(modal)) {
          document.body.removeChild(modal);
        }
        resolve(false);
      };

      const handleConfirm = () => {
        this._removeModalOpenClass();
        if (document.body.contains(modal)) {
          document.body.removeChild(modal);
        }
        resolve(true);
      };

      modal.querySelector('#confirm-cancel').addEventListener('click', handleCancel);
      modal.querySelector('#confirm-ok').addEventListener('click', handleConfirm);

      // Fecha ao clicar no backdrop
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          handleCancel();
        }
      });
      
      // Garante remoção da classe ao remover o modal de qualquer forma
      const observer = new MutationObserver(() => {
        if (!document.body.contains(modal)) {
          this._removeModalOpenClass();
          observer.disconnect();
        }
      });
      observer.observe(document.body, { childList: true });

      // Previne fechamento ao clicar dentro do modal
      const modalContent = modal.querySelector('.modal');
      if (modalContent) {
        modalContent.addEventListener('click', (e) => {
          e.stopPropagation();
        });
      }

      // Fecha com ESC
      const handleEsc = (e) => {
        if (e.key === 'Escape') {
          handleCancel();
          document.removeEventListener('keydown', handleEsc);
        }
      };
      document.addEventListener('keydown', handleEsc);
    });
  }

  /**
   * Adiciona classe para bloquear scroll do body quando modal está aberto
   */
  _addModalOpenClass() {
    document.body.classList.add('modal-open');
    document.documentElement.classList.add('modal-open');
  }

  /**
   * Remove classe para permitir scroll do body quando modal é fechado
   */
  _removeModalOpenClass() {
    document.body.classList.remove('modal-open');
    document.documentElement.classList.remove('modal-open');
  }

  createModal(title, content) {
    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';
    backdrop.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title">${title}</h3>
          <button class="modal-close">×</button>
        </div>
        ${content}
      </div>
    `;
    
    // Adiciona listener para fechar modal
    const closeBtn = backdrop.querySelector('.modal-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        this._removeModalOpenClass();
        if (document.body.contains(backdrop)) {
          backdrop.remove();
        }
      });
    }
    
    // Adiciona listeners para todos os botões de cancelar com onclick
    const cancelButtons = backdrop.querySelectorAll('button[onclick*="closest"]');
    cancelButtons.forEach(btn => {
      const originalOnclick = btn.getAttribute('onclick');
      btn.removeAttribute('onclick');
      btn.addEventListener('click', () => {
        this._removeModalOpenClass();
        if (originalOnclick) {
          // Executa o código original se necessário
          const modalBackdrop = btn.closest('.modal-backdrop');
          if (modalBackdrop) {
            modalBackdrop.remove();
          }
        }
      });
    });
    
    // Adiciona classe quando modal é adicionado ao DOM
    setTimeout(() => {
      this._addModalOpenClass();
    }, 0);
    
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
        label: 'Planejando',
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
        label: 'Relatório Enviado',
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
      // Busca o evento atual para validar antes de tentar atualizar
      const event = await this.eventRepository.findById(this.currentEventId);
      if (!event) {
        window.toast?.error('Evento não encontrado');
        return;
      }

      // Validação no frontend: não permite voltar de PAID
      if (event.status === 'PAID') {
        window.toast?.error('Evento finalizado/pago não pode ter seu status alterado.');
        // Recarrega para restaurar o select
        await this.render(this.currentEventId);
        return;
      }

      // Validação no frontend: não permite voltar para PLANNED se já passou
      if (newStatus === 'PLANNED' && event.status !== 'PLANNED') {
        window.toast?.error('Não é possível voltar o status para "Planejando" após o evento ter sido realizado.');
        // Recarrega para restaurar o select
        await this.render(this.currentEventId);
        return;
      }

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
        // Recarrega para restaurar o select em caso de erro
        await this.render(this.currentEventId);
      }
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      window.toast?.error(`Erro ao atualizar status: ${error.message}`);
      // Recarrega para restaurar o select em caso de erro
      await this.render(this.currentEventId);
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
      const originalText = btn?.textContent || '📄 Relatório';
      if (btn) {
        btn.disabled = true;
        btn.textContent = '⏳...';
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
        btn.textContent = '📄 Relatório';
      }
    }
  }

  /**
   * Exclui o evento atual
   */
  async deleteEvent() {
    if (!this.deleteEventUseCase) {
      if (window.toast) {
        window.toast.error('Funcionalidade de exclusão não disponível');
      }
      return;
    }

    // Confirmação antes de excluir usando modal amigável
    const confirmed = await this.showConfirmModal(
      'Excluir Evento',
      'Tem certeza que deseja excluir este evento? Esta ação não pode ser desfeita e excluirá todas as transações associadas.',
      'Excluir',
      'Cancelar',
      '🗑️'
    );
    
    if (!confirmed) {
      return;
    }

    try {
      const result = await this.deleteEventUseCase.execute(this.currentEventId);
      
      if (result.success) {
        if (window.toast) {
          window.toast.success('Evento excluído com sucesso!');
        }
        
        // Limpa o ID do evento atual
        this.currentEventId = null;
        
        // Pequeno delay para garantir que o toast seja exibido antes da navegação
        setTimeout(() => {
          // Navega de volta para o dashboard
          window.dispatchEvent(new CustomEvent('navigate', { 
            detail: { view: 'dashboard' } 
          }));
        }, 300);
      } else {
        if (window.toast) {
          window.toast.error(`Erro ao excluir evento: ${result.error || 'Erro desconhecido'}`);
        }
      }
    } catch (error) {
      console.error('Erro ao excluir evento:', error);
      if (window.toast) {
        window.toast.error(`Erro ao excluir evento: ${error.message || 'Erro desconhecido'}`);
      }
    }
  }
}

// Export para uso em módulos ES6
export { EventDetailView };

