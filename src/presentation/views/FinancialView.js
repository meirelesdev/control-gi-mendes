/**
 * View: Financeiro
 * Exibe resumo financeiro consolidado e fechamento mensal
 */
import { Formatters } from '../utils/Formatters.js';

class FinancialView {
  constructor(eventRepository, transactionRepository, settingsRepository, generateMonthlyReportUseCase = null) {
    this.eventRepository = eventRepository;
    this.transactionRepository = transactionRepository;
    this.settingsRepository = settingsRepository;
    this.generateMonthlyReportUseCase = generateMonthlyReportUseCase;
  }

  async render() {
    const container = document.getElementById('financial-content');
    if (!container) return;

    container.innerHTML = '<div class="loading">Carregando...</div>';

    try {
      // Busca eventos ativos (não cancelados)
      const events = await this.eventRepository.findAll({
        orderBy: 'date',
        order: 'desc'
      });

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
        
        // Reembolsos: KM ou marcados explicitamente como reembolso
        const reimbursements = incomes.filter(t => 
          t.metadata.category === 'km' || 
          t.metadata.isReimbursement === true
        );
        
        // KM (gasolina paga hoje)
        const kmTransactions = reimbursements.filter(r => r.metadata.category === 'km');
        
        // Calcula valores do evento
        const eventExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
        const eventKmCost = kmTransactions.reduce((sum, k) => sum + k.amount, 0);
        const eventFees = fees.reduce((sum, f) => sum + f.amount, 0);
        
        // Acumula totais (mesma lógica do EventDetailView)
        totalUpfrontCost += eventExpenses + eventKmCost; // Investimento: Compras + Gasolina
        totalNetProfit += eventFees; // Lucro: Apenas Honorários
        
        // Valor de reembolso = Compras + KM
        const eventReimbursementValue = eventExpenses + eventKmCost;
        totalReimbursements += eventReimbursementValue;
      }
      
      // Total a receber = Reembolsos + Lucro
      const totalToReceive = totalReimbursements + totalNetProfit;

      // Renderiza
      container.innerHTML = `
        <!-- Card de Resumo Financeiro Detalhado -->
        <div class="card" style="background: linear-gradient(135deg, #F4F7F6 0%, #FFFFFF 100%); border: 2px solid var(--color-border-light); margin-bottom: var(--spacing-md);">
          <h3 style="margin-bottom: var(--spacing-lg); color: var(--color-text); font-size: var(--font-size-lg);">
            💰 Resumo Financeiro Consolidado
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
              ${this.formatCurrency(totalUpfrontCost)}
            </div>
          </div>

          <!-- Linha 2: Reembolsos (Roxo/Violeta) -->
          <div style="display: flex; justify-content: space-between; align-items: center; padding: var(--spacing-md); background: linear-gradient(135deg, #F3E5F5 0%, #E1BEE7 100%); border-radius: var(--radius-md); margin-bottom: var(--spacing-md); border-left: 4px solid #9C27B0;">
            <div>
              <div style="font-size: var(--font-size-sm); color: #7B1FA2; font-weight: var(--font-weight-semibold); margin-bottom: var(--spacing-xs);">
                💳 Reembolsos a Receber
              </div>
              <div style="font-size: var(--font-size-xs); color: #757575;">
                Valor que será devolvido (Compras + Deslocamentos)
              </div>
            </div>
            <div style="font-size: var(--font-size-xl); font-weight: var(--font-weight-bold); color: #7B1FA2;">
              ${this.formatCurrency(totalReimbursements)}
            </div>
          </div>

          <!-- Linha 3: Seu Lucro Líquido (Verde) -->
          <div style="display: flex; justify-content: space-between; align-items: center; padding: var(--spacing-md); background: linear-gradient(135deg, #E0F2F1 0%, #C8E6C9 100%); border-radius: var(--radius-md); margin-bottom: var(--spacing-md); border-left: 4px solid #26A69A;">
            <div>
              <div style="font-size: var(--font-size-sm); color: #00897B; font-weight: var(--font-weight-semibold); margin-bottom: var(--spacing-xs);">
                ✨ Seu Lucro Líquido
              </div>
              <div style="font-size: var(--font-size-xs); color: #757575;">
                Apenas Diárias + Horas Extras (dinheiro realmente ganho, não reembolso)
              </div>
            </div>
            <div style="font-size: var(--font-size-xl); font-weight: var(--font-weight-bold); color: #00897B;">
              ${this.formatCurrency(totalNetProfit)}
            </div>
          </div>

          <!-- Destaque Principal: Total a Receber (Azul) - Último para destaque -->
          <div style="display: flex; justify-content: space-between; align-items: center; padding: var(--spacing-lg); background: linear-gradient(135deg, #E3F2FD 0%, #E1F5FE 100%); border-radius: var(--radius-lg); border: 2px solid #2196F3; box-shadow: 0 4px 12px rgba(33, 150, 243, 0.2);">
            <div>
              <div style="font-size: var(--font-size-base); color: #1565C0; font-weight: var(--font-weight-bold); margin-bottom: var(--spacing-xs);">
                📥 Total a Receber
              </div>
              <div style="font-size: var(--font-size-xs); color: #00695C;">
                Valor total que você receberá de todos os eventos pendentes
              </div>
              <div style="font-size: var(--font-size-xs); color: #1976D2; margin-top: 4px; font-weight: var(--font-weight-medium);">
                = Reembolsos (${this.formatCurrency(totalReimbursements)}) + Lucro (${this.formatCurrency(totalNetProfit)})
              </div>
            </div>
            <div style="font-size: var(--font-size-2xl); font-weight: var(--font-weight-bold); color: #1565C0;">
              ${this.formatCurrency(totalToReceive)}
            </div>
          </div>
          
          <div style="margin-top: var(--spacing-md); padding-top: var(--spacing-md); border-top: 1px solid var(--color-border); text-align: center;">
            <p style="margin: 0; color: var(--color-text-secondary); font-size: var(--font-size-sm);">
              📊 Consolidado de ${eventsForCalculation.length} evento(s) pendente(s)
            </p>
            <p style="margin: var(--spacing-xs) 0 0 0; color: var(--color-text-secondary); font-size: var(--font-size-xs);">
              (Eventos pagos não são incluídos no resumo financeiro)
            </p>
          </div>
        </div>

        ${this.generateMonthlyReportUseCase ? `
        <div class="card" style="margin-bottom: var(--spacing-md); background: linear-gradient(135deg, #FCE4EC 0%, #F8BBD0 100%); border-left: 4px solid var(--color-primary);">
          <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: var(--spacing-md);">
            <div>
              <h3 style="margin: 0 0 var(--spacing-xs) 0; color: var(--color-primary);">📅 Fechamento Mensal</h3>
              <p style="margin: 0; color: var(--color-text-secondary); font-size: var(--font-size-sm);">
                Gere o relatório mensal de prestação de contas conforme contrato
              </p>
            </div>
            <button class="btn btn-primary" id="btn-monthly-report" 
                    style="white-space: nowrap; padding: var(--spacing-md) var(--spacing-lg);">
              Gerar Relatório Mensal
            </button>
          </div>
        </div>
        ` : ''}
      `;

      // Event listener para fechamento mensal
      if (this.generateMonthlyReportUseCase) {
        const btnMonthlyReport = document.getElementById('btn-monthly-report');
        if (btnMonthlyReport) {
          btnMonthlyReport.addEventListener('click', () => {
            window.dispatchEvent(new CustomEvent('navigate', { 
              detail: { view: 'monthly-report' } 
            }));
          });
        }
      }
    } catch (error) {
      container.innerHTML = `
        <div class="card" style="border-left-color: var(--color-danger);">
          <p style="color: var(--color-danger);">Erro ao carregar resumo financeiro: ${error.message}</p>
        </div>
      `;
    }
  }

  formatCurrency(value) {
    return Formatters.currency(value);
  }
}

export { FinancialView };

