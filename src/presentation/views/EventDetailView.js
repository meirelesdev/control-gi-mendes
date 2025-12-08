/**
 * View: Detalhe do Evento
 * Exibe detalhes do evento, botões de ação e lista de compras/despesas
 */
import { ReportView } from './ReportView.js';
import { Formatters } from '../utils/Formatters.js';
import { DEFAULT_VALUES } from '../../domain/constants/DefaultValues.js';
import { ExpenseModal } from '../components/modals/ExpenseModal.js';
import { FeeModal } from '../components/modals/FeeModal.js';
import { KmTravelModal } from '../components/modals/KmTravelModal.js';
import { AccommodationModal } from '../components/modals/AccommodationModal.js';
import { TravelTimeModal } from '../components/modals/TravelTimeModal.js';

class EventDetailView {
  constructor(eventRepository, transactionRepository, settingsRepository, addTransactionUseCase, deleteTransactionUseCase = null, generateEventReportUseCase = null, updateEventStatusUseCase = null, updateEventUseCase = null, updateTransactionUseCase = null, deleteEventUseCase = null, getEventSummaryUseCase = null) {
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
    this.getEventSummaryUseCase = getEventSummaryUseCase;
    this.currentEventId = null;
  }

  async render(eventId) {
    const container = document.getElementById('event-detail-content');
    if (!container) return;

    this.currentEventId = eventId;

    container.innerHTML = '<div class="loading">Carregando...</div>';

    try {
      // Depende EXCLUSIVAMENTE do Use Case GetEventSummary (lógica de negócio centralizada)
      if (!this.getEventSummaryUseCase) {
        container.innerHTML = `
          <div class="card" style="border-left-color: var(--color-danger);">
            <h2 style="color: var(--color-danger);">Erro de Configuração</h2>
            <p>GetEventSummaryUseCase não está disponível. Não é possível exibir os detalhes do evento.</p>
            <p class="text-muted">Por favor, recarregue a página ou entre em contato com o suporte.</p>
          </div>
        `;
        return;
      }

      // Usa GetEventSummary para obter todos os dados calculados (lógica de negócio no Use Case)
      const summaryResult = await this.getEventSummaryUseCase.execute({ eventId });
      if (!summaryResult.success) {
        container.innerHTML = `
          <div class="card" style="border-left-color: var(--color-danger);">
            <h2 style="color: var(--color-danger);">Erro ao Carregar Evento</h2>
            <p>${summaryResult.error || 'Erro desconhecido ao carregar os dados do evento.'}</p>
          </div>
        `;
        return;
      }

      const summary = summaryResult.data;
      const event = summary.event;

      // Extrai dados do summary para facilitar uso no template
      const { upfrontCost, reimbursementValue, netProfit, totalToReceive, totalExpenses, totalReimbursements, totalFees } = summary.totals;
      const expenses = summary.transactions.expenses || [];
      const reimbursements = summary.transactions.reimbursements || [];
      const fees = summary.transactions.fees || [];
      const kmTransactions = summary.transactions.kmTransactions || [];
      const expensesWithoutReceipt = expenses.filter(e => !e.metadata.hasReceipt);

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
            ${event.startDate && event.endDate && event.startDate !== event.endDate ? `
              <p class="text-muted" style="margin: 0 0 var(--spacing-sm) 0;">${this.formatDate(event.startDate)} a ${this.formatDate(event.endDate)}</p>
            ` : `
              <p class="text-muted" style="margin: 0 0 var(--spacing-sm) 0;">${this.formatDate(event.startDate || event.date)}</p>
            `}
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
                Valor que você pagou do próprio bolso (Compras + Gasolina)
              </div>
            </div>
            <div style="font-size: var(--font-size-xl); font-weight: var(--font-weight-bold); color: #C62828;">
              ${this.formatCurrency(upfrontCost)}
            </div>
          </div>

          <!-- Linha 2: Seu Lucro Líquido (Verde) -->
          <div style="display: flex; justify-content: space-between; align-items: center; padding: var(--spacing-md); background: linear-gradient(135deg, #E0F2F1 0%, #C8E6C9 100%); border-radius: var(--radius-md); margin-bottom: var(--spacing-md); border-left: 4px solid #26A69A;">
            <div>
              <div style="font-size: var(--font-size-sm); color: #00897B; font-weight: var(--font-weight-semibold); margin-bottom: var(--spacing-xs);">
                ✨ Seu Lucro Líquido
              </div>
              <div style="font-size: var(--font-size-xs); color: #757575;">
                Apenas Diárias + Horas Extras (dinheiro realmente ganho)
              </div>
            </div>
            <div style="font-size: var(--font-size-xl); font-weight: var(--font-weight-bold); color: #00897B;">
              ${this.formatCurrency(netProfit)}
            </div>
          </div>

          <!-- Linha 3: Total a Receber (Azul) - Último para destaque -->
          <div style="display: flex; justify-content: space-between; align-items: center; padding: var(--spacing-lg); background: linear-gradient(135deg, #E3F2FD 0%, #E1F5FE 100%); border-radius: var(--radius-lg); border: 2px solid #2196F3; box-shadow: 0 4px 12px rgba(33, 150, 243, 0.2);">
            <div>
              <div style="font-size: var(--font-size-base); color: #1565C0; font-weight: var(--font-weight-bold); margin-bottom: var(--spacing-xs);">
                📥 Total a Receber
              </div>
              <div style="font-size: var(--font-size-xs); color: #00695C;">
                Reembolsos (Compras + Deslocamentos) + Lucro (Honorários)
              </div>
            </div>
            <div style="font-size: var(--font-size-2xl); font-weight: var(--font-weight-bold); color: #1565C0;">
              ${this.formatCurrency(totalToReceive)}
            </div>
          </div>
        </div>

        ${event.status !== 'PAID' ? `
        <div class="card">
          <h3 style="margin-bottom: var(--spacing-md);">Ações Rápidas</h3>
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--spacing-sm); margin-bottom: var(--spacing-sm);">
            <button class="btn btn-primary" id="btn-add-expense" 
                    style="padding: var(--spacing-md); border-radius: var(--radius-lg); font-size: 24px; line-height: 1; display: flex; flex-direction: column; align-items: center; gap: 2px;"
                    title="Adicionar Compra (Reembolso)">
              <span>📦</span>
              <span style="font-size: 11px; font-weight: var(--font-weight-medium);">Compra</span>
              <span style="font-size: 9px; color: var(--color-text-secondary);">(Reembolso)</span>
            </button>
            <button class="btn btn-success" id="btn-add-fee" 
                    style="padding: var(--spacing-md); border-radius: var(--radius-lg); font-size: 24px; line-height: 1; display: flex; flex-direction: column; align-items: center; gap: 2px;"
                    title="Adicionar Honorário (Lucro)">
              <span>💰</span>
              <span style="font-size: 11px; font-weight: var(--font-weight-medium);">Honorário</span>
              <span style="font-size: 9px; color: var(--color-success);">(Lucro)</span>
            </button>
          </div>
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--spacing-sm); margin-bottom: var(--spacing-sm);">
            <button class="btn btn-secondary" id="btn-add-km-travel" 
                    style="padding: var(--spacing-md); border-radius: var(--radius-lg); font-size: 24px; line-height: 1; display: flex; flex-direction: column; align-items: center; gap: 2px;"
                    title="Adicionar KM Rodado (Reembolso de Combustível)">
              <span>🚗</span>
              <span style="font-size: 11px; font-weight: var(--font-weight-medium);">KM Rodado</span>
              <span style="font-size: 9px; color: var(--color-text-secondary);">(Combustível)</span>
            </button>
            <button class="btn btn-primary" id="btn-add-accommodation" 
                    style="padding: var(--spacing-md); border-radius: var(--radius-lg); font-size: 24px; line-height: 1; display: flex; flex-direction: column; align-items: center; gap: 2px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border: none;"
                    title="Adicionar Hospedagem (Reembolso)">
              <span>🏨</span>
              <span style="font-size: 11px; font-weight: var(--font-weight-medium);">Hospedagem</span>
              <span style="font-size: 9px; color: rgba(255,255,255,0.8);">(Reembolso)</span>
            </button>
          </div>
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--spacing-sm);">
            <button class="btn btn-info" id="btn-add-travel-time" 
                    style="padding: var(--spacing-md); border-radius: var(--radius-lg); font-size: 24px; line-height: 1; display: flex; flex-direction: column; align-items: center; gap: 2px; background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); border: none; color: white;"
                    title="Adicionar Tempo de Viagem (Horas de Deslocamento)">
              <span>⏱️</span>
              <span style="font-size: 11px; font-weight: var(--font-weight-medium);">Tempo Viagem</span>
              <span style="font-size: 9px; color: rgba(255,255,255,0.8);">(Horas)</span>
            </button>
          </div>
        </div>
        ` : ''}

        <div class="card">
          <div class="card-header">
            <h3 class="card-title">📦 Compras (Reembolso)</h3>
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
                        title="Adicionar Compra">
                  ➕
                </button>
              ` : ''}
            </div>
          </div>
          ${expenses.length === 0 ? `
            <div class="empty-state">
              <p class="text-muted">Nenhuma compra cadastrada ainda.</p>
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
            <h3 class="card-title">🚗 KM Rodado (Reembolso de Combustível)</h3>
            <div style="display: flex; align-items: center; gap: var(--spacing-sm); flex-wrap: wrap;">
              ${kmTransactions.length > 0 ? `
                <span class="badge badge-info">Total: ${this.formatCurrency(kmTransactions.reduce((sum, t) => sum + t.amount, 0))}</span>
              ` : ''}
              ${event.status !== 'PAID' ? `
                <button class="btn btn-sm btn-secondary" id="btn-add-km-travel-header" 
                        style="padding: 6px 12px; border-radius: var(--radius-full); font-size: 18px; line-height: 1; min-width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;"
                        title="Adicionar KM Rodado">
                  ➕
                </button>
              ` : ''}
            </div>
          </div>
          ${kmTransactions.length === 0 ? `
            <div class="empty-state">
              <p class="text-muted">Nenhum KM rodado cadastrado ainda.</p>
            </div>
          ` : `
            <div class="expense-list">
              ${kmTransactions.map(km => this.renderIncomeItem(km, event.status)).join('')}
            </div>
          `}
        </div>
      `;

      // Event listeners (apenas se o evento não estiver finalizado)
      if (event.status !== 'PAID') {
        // Handler comum para recarregar a view após sucesso
        const reloadView = async () => {
          await this.render(this.currentEventId);
        };

        // Botões da seção "Ações Rápidas"
        const btnAddExpense = document.getElementById('btn-add-expense');
        if (btnAddExpense) {
          btnAddExpense.addEventListener('click', () => {
            const modal = new ExpenseModal(
              this.addTransactionUseCase,
              this.eventRepository,
              this.currentEventId,
              reloadView
            );
            modal.show();
          });
        }

        const btnAddFee = document.getElementById('btn-add-fee');
        if (btnAddFee) {
          btnAddFee.addEventListener('click', () => {
            const modal = new FeeModal(
              this.addTransactionUseCase,
              this.eventRepository,
              this.settingsRepository,
              this.currentEventId,
              reloadView
            );
            modal.show();
          });
        }

        const btnAddKmTravel = document.getElementById('btn-add-km-travel');
        if (btnAddKmTravel) {
          btnAddKmTravel.addEventListener('click', () => {
            const modal = new KmTravelModal(
              this.addTransactionUseCase,
              this.eventRepository,
              this.currentEventId,
              reloadView
            );
            modal.show();
          });
        }

        const btnAddAccommodation = document.getElementById('btn-add-accommodation');
        if (btnAddAccommodation) {
          btnAddAccommodation.addEventListener('click', () => {
            const modal = new AccommodationModal(
              this.addTransactionUseCase,
              this.eventRepository,
              this.currentEventId,
              reloadView
            );
            modal.show();
          });
        }

        const btnAddTravelTime = document.getElementById('btn-add-travel-time');
        if (btnAddTravelTime) {
          btnAddTravelTime.addEventListener('click', () => {
            const modal = new TravelTimeModal(
              this.addTransactionUseCase,
              this.eventRepository,
              this.settingsRepository,
              this.currentEventId,
              reloadView
            );
            modal.show();
          });
        }

        // Botões nos headers das seções
        const btnAddExpenseHeader = document.getElementById('btn-add-expense-header');
        if (btnAddExpenseHeader) {
          btnAddExpenseHeader.addEventListener('click', (e) => {
            e.stopPropagation();
            this._showPurchaseTypeMenu(btnAddExpenseHeader, reloadView);
          });
        }

        const btnAddFeeHeader = document.getElementById('btn-add-fee-header');
        if (btnAddFeeHeader) {
          btnAddFeeHeader.addEventListener('click', () => {
            const modal = new FeeModal(
              this.addTransactionUseCase,
              this.eventRepository,
              this.settingsRepository,
              this.currentEventId,
              reloadView
            );
            modal.show();
          });
        }

        const btnAddKmTravelHeader = document.getElementById('btn-add-km-travel-header');
        if (btnAddKmTravelHeader) {
          btnAddKmTravelHeader.addEventListener('click', () => {
            const modal = new KmTravelModal(
              this.addTransactionUseCase,
              this.eventRepository,
              this.currentEventId,
              reloadView
            );
            modal.show();
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
    const isAccommodation = expense.metadata.category === 'accommodation';
    
    // Formata datas de hospedagem para exibição
    let dateInfo = '';
    if (isAccommodation && expense.metadata.checkIn && expense.metadata.checkOut) {
      const formatDate = (dateString) => {
        // Parse direto do formato YYYY-MM-DD sem problemas de timezone
        if (!dateString || typeof dateString !== 'string') return dateString;
        const parts = dateString.split('T')[0].split('-');
        if (parts.length !== 3) return dateString;
        const [, month, day] = parts;
        return `${day}/${month}`;
      };
      dateInfo = `<br><small style="color: var(--color-text-secondary); font-size: 11px;">🏨 ${formatDate(expense.metadata.checkIn)} a ${formatDate(expense.metadata.checkOut)}</small>`;
    }
    
    return `
      <div class="expense-item ${hasReceipt ? '' : 'no-receipt'}" style="border-left-color: var(--color-danger);">
        <div class="expense-item-info">
          <div class="expense-item-description">
            <span>${isAccommodation ? '🏨' : '📦'}</span>
            <span>${this.escapeHtml(expense.description)}</span>
            ${dateInfo}
            <span class="badge badge-secondary">Reembolso</span>
          </div>
          <div class="expense-item-value" style="color: var(--color-danger);">${this.formatCurrency(expense.amount)}</div>
        </div>
        <div class="expense-item-actions">
          ${hasReceipt ? `
            <span class="badge badge-success" style="white-space: nowrap;">✓ NF OK</span>
          ` : `
            <span class="badge badge-warning" style="white-space: nowrap; background-color: #ff9800; color: white;">⚠️ Sem NF</span>
          `}
          ${this.updateTransactionUseCase && eventStatus !== 'PAID' ? `
            <button class="btn btn-sm btn-edit-transaction" 
                    data-transaction-id="${expense.id}"
                    data-transaction-type="expense"
                    data-transaction-category="${isAccommodation ? 'accommodation' : ''}"
                    title="Editar ${isAccommodation ? 'hospedagem' : 'compra'}"
                    style="background: transparent; color: var(--color-primary); padding: 6px 8px; border-radius: var(--radius-full); border: 1px solid var(--color-border); flex-shrink: 0;">
              ✏️
            </button>
          ` : ''}
          ${eventStatus !== 'PAID' ? `
            <button class="btn btn-sm btn-delete-transaction" 
                    data-transaction-id="${expense.id}"
                    title="Excluir compra"
                    style="flex-shrink: 0;">
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
      'diaria': 'Diária',
      'hora_extra': 'Hora Extra'
    };
    const categoryLabel = categoryLabels[category] || category || 'Receita';
    const isReimbursement = income.metadata.isReimbursement !== false;
    
    return `
      <div class="expense-item">
        <div class="expense-item-info">
          <div class="expense-item-description">
            <span>🚗</span>
            <span>${this.escapeHtml(income.description)}</span>
            <span class="badge badge-info">${categoryLabel}</span>
            <span class="badge badge-secondary">Reembolso</span>
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
    // O objeto fee vem do GetEventSummary que já extrai category diretamente
    const category = fee.category || fee.metadata?.category || '';
    const categoryLabels = {
      'diaria': 'Diária',
      'hora_extra': 'Horas de Trabalho',
      'tempo_viagem': 'Tempo de Viagem'
    };
    const categoryLabel = categoryLabels[category] || 'Honorário';
    
    return `
      <div class="expense-item" style="border-left-color: var(--color-success); background-color: rgba(34, 197, 94, 0.05);">
        <div class="expense-item-info">
          <div class="expense-item-description">
            <span>${category === 'tempo_viagem' ? '⏱️' : '💰'}</span>
            <span>${this.escapeHtml(fee.description)}</span>
            ${(category === 'tempo_viagem' || category === 'hora_extra') && fee.metadata?.hours ? `<small style="color: var(--color-text-secondary); margin-left: var(--spacing-xs);">(${fee.metadata.hours}h)</small>` : ''}
            <span class="badge badge-success">${categoryLabel}</span>
            <span class="badge badge-success" style="font-weight: bold;">Lucro</span>
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

  // Métodos de modais foram movidos para componentes separados em /components/modals/

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
    // Formata as datas para o input type="date" (YYYY-MM-DD)
    const formatDateForInput = (dateValue) => {
      if (!dateValue) return '';
      
      // Se já está no formato YYYY-MM-DD, retorna direto
      if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}/.test(dateValue)) {
        return dateValue.split('T')[0];
      }
      
      // Se é um objeto Date, converte
      if (dateValue instanceof Date) {
        return dateValue.toISOString().split('T')[0];
      }
      
      // Tenta criar um Date e converter
      try {
        const date = new Date(dateValue);
        if (!isNaN(date.getTime())) {
          return date.toISOString().split('T')[0];
        }
      } catch (e) {
        // Ignora erros
      }
      
      // Se não conseguiu converter, retorna string vazia
      return '';
    };
    
    // Usa startDate se disponível, senão usa date (compatibilidade com eventos antigos)
    // Garante que sempre tenha uma data de início
    const startDateValue = event.startDate || event.date;
    const startDate = formatDateForInput(startDateValue);
    
    // Para endDate, só usa se existir e for diferente de null/undefined
    // Se não existir, deixa vazio (não usa startDate como fallback)
    const endDateValue = event.endDate && event.endDate !== 'null' && event.endDate !== null ? event.endDate : null;
    const endDate = endDateValue ? formatDateForInput(endDateValue) : '';

    const modal = this.createModal('Editar Evento', `
      <form id="form-edit-event">
        <div class="form-group">
          <label class="form-label">Nome do Evento *</label>
          <input type="text" class="form-input" id="edit-event-name" 
                 value="${this.escapeHtml(event.name)}" required 
                 placeholder="Ex: Evento Corporativo - Empresa XYZ">
        </div>
        <div class="form-group">
          <label class="form-label">Data de Início *</label>
          <input type="date" class="form-input" id="edit-event-start-date" 
                 value="${startDate}" required>
        </div>
        <div class="form-group">
          <label class="form-label">Data de Fim (opcional)</label>
          <input type="date" class="form-input" id="edit-event-end-date" 
                 value="${endDate}">
          <small class="text-muted">Se não informada, usa a data de início</small>
        </div>
        <div class="form-group">
          <label class="form-label">Cliente *</label>
          <input type="text" class="form-input" id="edit-event-client" 
                 value="${this.escapeHtml(event.client || '')}" required 
                 placeholder="Ex: Bom Princípio">
        </div>
        <div class="form-group">
          <label class="form-label">Cidade *</label>
          <input type="text" class="form-input" id="edit-event-city" 
                 value="${this.escapeHtml(event.city || '')}" required 
                 placeholder="Ex: Tupandi - RS">
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

    // Validação: endDate não pode ser anterior a startDate
    const startDateInput = modal.querySelector('#edit-event-start-date');
    const endDateInput = modal.querySelector('#edit-event-end-date');
    
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
        // Não sincroniza automaticamente - deixa o usuário escolher
      };
      
      startDateInput.addEventListener('change', validateDates);
      endDateInput.addEventListener('change', validateDates);
    }

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
      const startDate = document.getElementById('edit-event-start-date')?.value.trim();
      const endDate = document.getElementById('edit-event-end-date')?.value.trim() || null;
      const client = document.getElementById('edit-event-client').value.trim();
      const city = document.getElementById('edit-event-city').value.trim();
      const description = document.getElementById('edit-event-description').value.trim();

      if (!name || !startDate || !client || !city) {
        if (window.toast) {
          window.toast.error('Nome, data de início, cliente e cidade são obrigatórios');
        }
        return false;
      }

      // Validação de datas
      if (endDate && endDate < startDate) {
        if (window.toast) {
          window.toast.error('Data de fim não pode ser anterior à data de início');
        }
        return false;
      }

      const result = await this.updateEventUseCase.execute(this.currentEventId, {
        name,
        date: startDate, // Mantém compatibilidade com o use case
        client,
        city,
        description: description || '',
        startDate: startDate,
        endDate: endDate || null
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
        // Verifica se é hospedagem
        const isAccommodation = transaction.metadata.category === 'accommodation';
        
        if (isAccommodation) {
          // Modal para editar hospedagem
          const checkIn = transaction.metadata.checkIn || '';
          const checkOut = transaction.metadata.checkOut || '';
          
          // Extrai apenas a descrição base (remove o padrão de datas se existir)
          let baseDescription = transaction.description || 'Hospedagem';
          const datePattern = /^Hospedagem\s*\([^)]+\)\s*$/;
          if (datePattern.test(baseDescription)) {
            baseDescription = 'Hospedagem';
          }
          
          modalContent = `
            <form id="form-edit-accommodation">
              <div class="form-group">
                <label class="form-label">Valor Total (R$) *</label>
                <input type="number" class="form-input" id="edit-accommodation-amount" 
                       value="${transaction.amount}" step="0.01" min="0.01" required>
              </div>
              <div class="form-group">
                <label class="form-label">Data Check-in</label>
                <input type="date" class="form-input" id="edit-accommodation-checkin" 
                       value="${checkIn}" required>
              </div>
              <div class="form-group">
                <label class="form-label">Data Check-out</label>
                <input type="date" class="form-input" id="edit-accommodation-checkout" 
                       value="${checkOut}" required>
              </div>
              <div class="form-group">
                <label class="form-label">Descrição</label>
                <input type="text" class="form-input" id="edit-accommodation-description" 
                       value="${this.escapeHtml(baseDescription)}" 
                       placeholder="Ex: Hospedagem">
                <small class="text-muted">Será formatada automaticamente com as datas se deixar "Hospedagem"</small>
              </div>
              <div class="form-group">
                <label style="display: flex; align-items: center; gap: var(--spacing-sm);">
                  <input type="checkbox" id="edit-accommodation-has-receipt" ${transaction.metadata.hasReceipt ? 'checked' : ''}>
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
        } else {
          // Modal para editar compra genérica
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
        }
      } else if (transactionType === 'income' || transaction.type === 'INCOME') {
        // Modal para editar receita (KM)
        const isKm = transactionCategory === 'km' || transaction.metadata.category === 'km';
        
        if (isKm) {
          // Editar KM Rodado
          const distance = transaction.metadata.distance || (transaction.amount / (await this.settingsRepository.find())?.rateKm || DEFAULT_VALUES.KM_RATE);
          const origin = transaction.metadata.origin || '';
          const destination = transaction.metadata.destination || '';
          
          // Extrai apenas a descrição adicional (remove o prefixo "Deslocamento: Origem → Destino")
          let additionalDescription = transaction.description || '';
          
          // Se tem origem e destino salvos, tenta remover o prefixo automático
          if (origin && destination) {
            const autoPrefix = `Deslocamento: ${origin} → ${destination}`;
            if (additionalDescription.startsWith(autoPrefix)) {
              // Remove o prefixo automático
              additionalDescription = additionalDescription.substring(autoPrefix.length).trim();
              // Remove o separador " - " ou " -" se existir
              if (additionalDescription.startsWith('-')) {
                additionalDescription = additionalDescription.substring(1).trim();
              }
            }
          } else if (additionalDescription.startsWith('Deslocamento:')) {
            // Se não tem origem/destino salvos mas a descrição começa com "Deslocamento:",
            // tenta extrair a parte adicional procurando por " - " após o padrão
            const separatorIndex = additionalDescription.indexOf(' - ');
            if (separatorIndex > 0) {
              // Pega tudo após o separador " - "
              additionalDescription = additionalDescription.substring(separatorIndex + 3).trim();
            } else {
              // Se não tem separador, significa que não há descrição adicional
              additionalDescription = '';
            }
          }
          
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
                       value="${this.escapeHtml(additionalDescription)}" 
                       placeholder="Informações adicionais">
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
      } else if (transactionType === 'fee' || (transaction.type === 'INCOME' && (transaction.metadata.category === 'diaria' || transaction.metadata.category === 'hora_extra'))) {
        // Modal para editar honorário (horas de trabalho)
        const settings = await this.settingsRepository.find();
        const overtimeRate = settings?.overtimeRate || DEFAULT_VALUES.OVERTIME_RATE;
        const hours = transaction.metadata.hours || (transaction.amount / overtimeRate);
        const calculatedTotal = hours * overtimeRate;
        
        modalContent = `
          <form id="form-edit-fee">
            <div class="form-group">
              <label class="form-label">Horas de Trabalho</label>
              <div style="padding: var(--spacing-md); background: var(--color-surface); border-radius: var(--radius-md); margin-top: var(--spacing-xs); margin-bottom: var(--spacing-sm);">
                <div style="font-size: var(--font-size-sm); color: var(--color-text-secondary); margin-bottom: var(--spacing-xs);">
                  Taxa: ${Formatters.currency(overtimeRate)} por hora
                </div>
              </div>
              <input type="number" class="form-input" id="edit-fee-hours" 
                     value="${hours.toFixed(2)}" step="0.5" min="0.5" required>
              <small class="text-muted" id="edit-fee-total" style="display: block; margin-top: var(--spacing-xs); font-weight: var(--font-weight-bold); color: var(--color-success);">Total: ${Formatters.currency(calculatedTotal)}</small>
            </div>
            <div class="form-group">
              <label class="form-label">Descrição *</label>
              <input type="text" class="form-input" id="edit-fee-description" 
                     value="${this.escapeHtml(transaction.description)}" required
                     placeholder="Ex: Horas de trabalho do evento">
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" onclick="this.closest('.modal-backdrop').remove()">
                Cancelar
              </button>
              <button type="submit" class="btn btn-success">Salvar</button>
            </div>
          </form>
        `;
        
        // Adiciona event listener para calcular total em tempo real
        setTimeout(() => {
          const hoursInput = modal.querySelector('#edit-fee-hours');
          const totalDisplay = modal.querySelector('#edit-fee-total');
          
          if (hoursInput && totalDisplay) {
            const updateTotal = () => {
              const hoursValue = parseFloat(hoursInput.value) || 0;
              const total = hoursValue * overtimeRate;
              totalDisplay.textContent = `Total: ${Formatters.currency(total)}`;
            };
            
            hoursInput.addEventListener('input', updateTotal);
            hoursInput.addEventListener('change', updateTotal);
          }
        }, 100);
      }

      const modal = this.createModal('Editar Transação', modalContent);
      document.body.appendChild(modal);
      modal.classList.add('active');
      this._addModalOpenClass();

      // Event listener para salvar
      const formId = modal.querySelector('form')?.id;
      const form = modal.querySelector(`#${formId}`);
      
      // Validação de datas para hospedagem
      if (formId === 'form-edit-accommodation') {
        const checkInInput = form.querySelector('#edit-accommodation-checkin');
        const checkOutInput = form.querySelector('#edit-accommodation-checkout');
        
        const validateDates = () => {
          const checkIn = new Date(checkInInput.value);
          const checkOut = new Date(checkOutInput.value);
          
          if (checkIn && checkOut && checkOut < checkIn) {
            checkOutInput.setCustomValidity('Data de check-out não pode ser anterior à data de check-in');
            checkOutInput.reportValidity();
          } else {
            checkOutInput.setCustomValidity('');
          }
        };
        
        checkInInput.addEventListener('change', validateDates);
        checkOutInput.addEventListener('change', validateDates);
      }
      
      form.addEventListener('submit', async (e) => {
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
        // Verifica se é hospedagem
        const isAccommodation = transaction.metadata.category === 'accommodation';
        
        if (isAccommodation) {
          // Editar hospedagem
          const amount = parseFloat(document.getElementById('edit-accommodation-amount').value);
          const checkIn = document.getElementById('edit-accommodation-checkin').value;
          const checkOut = document.getElementById('edit-accommodation-checkout').value;
          let description = document.getElementById('edit-accommodation-description').value.trim() || 'Hospedagem';
          const hasReceipt = document.getElementById('edit-accommodation-has-receipt').checked;

          // Validação de datas
          if (checkIn && checkOut) {
            const checkInDate = new Date(checkIn);
            const checkOutDate = new Date(checkOut);
            
            if (checkOutDate < checkInDate) {
              if (window.toast) {
                window.toast.error('Data de check-out não pode ser anterior à data de check-in');
              }
              return false;
            }
          }

          if (!amount || amount <= 0) {
            if (window.toast) {
              window.toast.error('Valor é obrigatório e deve ser maior que zero');
            }
            return false;
          }

          // Mantém a descrição como informada pelo usuário, sem formatação automática

          updateData = {
            description,
            amount,
            metadata: {
              ...transaction.metadata,
              category: 'accommodation',
              checkIn,
              checkOut,
              hasReceipt
            }
          };
        } else {
          // Editar compra genérica
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
        }
      } else if (transactionType === 'income' || transaction.type === 'INCOME') {
        const isKm = transactionCategory === 'km' || transaction.metadata.category === 'km';

        if (isKm) {
          // Editar KM Rodado
          const origin = document.getElementById('edit-km-origin')?.value.trim() || '';
          const destination = document.getElementById('edit-km-destination')?.value.trim() || '';
          const description = document.getElementById('edit-km-description')?.value.trim() || '';
          const distance = parseFloat(document.getElementById('edit-km-distance').value);
          const settings = await this.settingsRepository.find();
          const rateKm = settings?.rateKm || DEFAULT_VALUES.KM_RATE;
          const amount = distance * rateKm;

          if (!distance || distance <= 0) {
            if (window.toast) {
              window.toast.error('Distância é obrigatória e deve ser maior que zero');
            }
            return false;
          }

          // Gera descrição automaticamente se origem e destino forem fornecidos
          let finalDescription = '';
          if (origin && destination) {
            // Sempre gera a descrição base a partir de origem e destino (sempre limpa)
            finalDescription = `Deslocamento: ${origin} → ${destination}`;
            
            // Processa a descrição adicional para remover qualquer duplicação
            let additionalDesc = (description || '').trim();
            if (additionalDesc !== '') {
              // Remove qualquer ocorrência do padrão "Deslocamento: ..." da descrição adicional
              // Isso previne duplicação mesmo se o campo já contiver o padrão completo
              const autoPrefixPattern = /^Deslocamento:\s*[^→]+→\s*[^-]+/;
              if (autoPrefixPattern.test(additionalDesc)) {
                // Se a descrição adicional começa com o padrão automático, tenta extrair apenas a parte após " - "
                const parts = additionalDesc.split(' - ');
                if (parts.length > 1) {
                  // Pega tudo após o primeiro " - " (pode haver múltiplos se já estava duplicado)
                  additionalDesc = parts.slice(1).join(' - ').trim();
                } else {
                  // Se não tem " - ", significa que é só o padrão automático, então limpa
                  additionalDesc = '';
                }
              }
              
              // Adiciona a descrição adicional limpa se ainda houver algo
              if (additionalDesc !== '') {
                finalDescription += ` - ${additionalDesc}`;
              }
            }
          } else if (!description || description.trim() === '') {
            if (window.toast) {
              window.toast.error('Preencha Origem e Destino ou informe uma Descrição');
            }
            return false;
          } else {
            // Se não tem origem/destino, usa a descrição fornecida diretamente
            finalDescription = description.trim();
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
        // Editar Honorário (Horas de Trabalho)
        const description = document.getElementById('edit-fee-description').value.trim();
        const hours = parseFloat(document.getElementById('edit-fee-hours').value);
        const settings = await this.settingsRepository.find();
        const overtimeRate = settings?.overtimeRate || DEFAULT_VALUES.OVERTIME_RATE;
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
            category: 'hora_extra', // Mantém como hora_extra internamente
            hours,
            isReimbursement: false
          }
        };
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
        month: 'long',
        year: 'numeric'
      }).format(date);
    }
    
    return Formatters.dateLong(dateString);
  }

  escapeHtml(text) {
    return Formatters.escapeHtml(text);
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
        
        // Busca e-mails para mostrar informação
        let emailInfo = '';
        if (this.settingsRepository && result.data && result.data.paymentInfo && result.data.paymentInfo.emails) {
          emailInfo = `\n\n📧 Envie as Notas Fiscais para:\n${result.data.paymentInfo.emails}`;
        }
        
        window.toast?.success(`Relatório gerado com sucesso!${emailInfo}`, 5000);
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

  /**
   * Mostra menu de escolha entre Compra e Hospedagem
   * @private
   */
  _showPurchaseTypeMenu(buttonElement, reloadView) {
    // Remove menu anterior se existir
    const existingMenu = document.getElementById('purchase-type-menu');
    if (existingMenu) {
      existingMenu.remove();
      return;
    }

    // Cria o menu dropdown usando position fixed para garantir visibilidade
    const menu = document.createElement('div');
    menu.id = 'purchase-type-menu';
    
    // Calcula posição do botão na tela
    const rect = buttonElement.getBoundingClientRect();
    
    menu.style.cssText = `
      position: fixed;
      background: white;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      padding: 4px;
      z-index: 10000;
      min-width: 200px;
      border: 1px solid #e0e0e0;
      top: ${rect.bottom + 8}px;
      right: ${window.innerWidth - rect.right}px;
    `;
    
    // Ajusta se o menu sair da tela
    const menuWidth = 200;
    if (rect.right - menuWidth < 10) {
      menu.style.right = '10px';
    }
    if (rect.bottom + 150 > window.innerHeight) {
      menu.style.top = `${rect.top - 150}px`;
    }

    menu.innerHTML = `
      <button class="menu-item-btn" data-type="purchase" style="
        width: 100%;
        padding: var(--spacing-md);
        border: none;
        background: transparent;
        text-align: left;
        cursor: pointer;
        border-radius: var(--radius-sm);
        display: flex;
        align-items: center;
        gap: var(--spacing-sm);
        transition: background-color 0.2s;
      ">
        <span style="font-size: 20px;">📦</span>
        <div>
          <div style="font-weight: var(--font-weight-semibold); font-size: var(--font-size-sm);">Compra</div>
          <div style="font-size: var(--font-size-xs); color: var(--color-text-secondary);">Insumos, materiais</div>
        </div>
      </button>
      <button class="menu-item-btn" data-type="accommodation" style="
        width: 100%;
        padding: var(--spacing-md);
        border: none;
        background: transparent;
        text-align: left;
        cursor: pointer;
        border-radius: var(--radius-sm);
        display: flex;
        align-items: center;
        gap: var(--spacing-sm);
        transition: background-color 0.2s;
      ">
        <span style="font-size: 20px;">🏨</span>
        <div>
          <div style="font-weight: var(--font-weight-semibold); font-size: var(--font-size-sm);">Hospedagem</div>
          <div style="font-size: var(--font-size-xs); color: var(--color-text-secondary);">Hotel, pousada</div>
        </div>
      </button>
    `;

    // Adiciona estilos hover
    const style = document.createElement('style');
    style.textContent = `
      .menu-item-btn:hover {
        background-color: var(--color-surface) !important;
      }
    `;
    document.head.appendChild(style);

    // Adiciona listeners
    menu.querySelectorAll('.menu-item-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const type = btn.dataset.type;
        menu.remove();
        style.remove();

        if (type === 'purchase') {
          const modal = new ExpenseModal(
            this.addTransactionUseCase,
            this.eventRepository,
            this.currentEventId,
            reloadView
          );
          modal.show();
        } else if (type === 'accommodation') {
          const modal = new AccommodationModal(
            this.addTransactionUseCase,
            this.eventRepository,
            this.currentEventId,
            reloadView
          );
          modal.show();
        }
      });
    });

    // Fecha o menu ao clicar fora
    const closeMenu = (e) => {
      if (!menu.contains(e.target) && e.target !== buttonElement && !buttonElement.contains(e.target)) {
        menu.remove();
        style.remove();
        document.removeEventListener('click', closeMenu);
      }
    };

    setTimeout(() => {
      document.addEventListener('click', closeMenu);
    }, 0);

    // Adiciona o menu ao body para garantir que apareça
    document.body.appendChild(menu);
  }
}

// Export para uso em módulos ES6
export { EventDetailView };

