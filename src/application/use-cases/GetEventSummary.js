/**
 * Caso de Uso: Obter Resumo do Evento
 * Retorna o resumo financeiro completo de um evento
 */
import { Settings } from '../../domain/entities/Settings.js';

class GetEventSummary {
  constructor(eventRepository, transactionRepository, settingsRepository) {
    if (!eventRepository) {
      throw new Error('EventRepository é obrigatório');
    }
    if (!transactionRepository) {
      throw new Error('TransactionRepository é obrigatório');
    }
    if (!settingsRepository) {
      throw new Error('SettingsRepository é obrigatório');
    }

    this.eventRepository = eventRepository;
    this.transactionRepository = transactionRepository;
    this.settingsRepository = settingsRepository;
  }

  /**
   * Executa o caso de uso
   * @param {Object} input - Dados de entrada
   * @param {string} input.eventId - ID do evento
   * @returns {Promise<Object>} - Resultado com resumo financeiro ou erro
   */
  async execute(input) {
    try {
      // Validação de entrada
      if (!input || !input.eventId) {
        throw new Error('ID do evento é obrigatório');
      }

      // Busca o evento
      const event = await this.eventRepository.findById(input.eventId);
      if (!event) {
        throw new Error('Evento não encontrado');
      }

      // Busca todas as transações do evento
      const transactions = await this.transactionRepository.findByEventId(input.eventId);

      // Busca configurações para calcular data prevista de recebimento
      const settings = await this._getSettings();

      // Calcula os totais
      const totals = this._calculateTotals(transactions);

      // Calcula data prevista de recebimento
      const expectedReceiptDate = settings.calculateExpectedReimbursementDate(event.date);

      // Calcula os novos totalizadores financeiros
      // 1. Investimento Inicial (Saiu do Bolso): EXPENSE + KM (gasolina paga hoje)
      const upfrontCost = totals.totalExpenses + totals.totalKmCost;
      
      // 2. Valor de Reembolso: EXPENSE + KM (tudo que volta como reembolso)
      // Tempo de Viagem NÃO é reembolso, é honorário (lucro)
      const reimbursementValue = totals.totalExpenses + totals.totalKmCost;
      
      // 3. Lucro Líquido Real: Diárias + Horas Extras + Tempo de Viagem (dinheiro realmente ganho)
      const netProfit = totals.totalFees; // Já inclui tempo_viagem
      
      // 4. Total a Receber: Reembolso + Lucro
      // = (Despesas + KM) + (Diárias + Horas Extras + Tempo Viagem)
      const totalToReceive = reimbursementValue + netProfit;

      // Separa transações por tipo para as views
      const expenses = transactions.filter(t => t.type === 'EXPENSE');
      const incomes = transactions.filter(t => t.type === 'INCOME');
      // Reembolsos: Apenas KM (combustível) - tempo_viagem não é reembolso, é honorário
      const reimbursements = incomes.filter(i => 
        i.metadata.category === 'km'
      );
      // Honorários: Diárias, Horas Extras e Tempo de Viagem (todos são lucro)
      // tempo_viagem sempre aparece em honorários, independente de isReimbursement
      const fees = incomes.filter(i => {
        const category = i.metadata.category;
        if (category === 'tempo_viagem') {
          return true; // tempo_viagem sempre é honorário
        }
        if (category === 'diaria' || category === 'hora_extra') {
          return i.metadata.isReimbursement !== true;
        }
        return false;
      });
      const kmTransactions = reimbursements.filter(r => r.metadata.category === 'km');

      // Monta o resumo
      const summary = {
        event: {
          id: event.id,
          name: event.name,
          date: event.date,
          status: event.status,
          description: event.description,
          expectedPaymentDate: event.expectedPaymentDate,
          isEditable: event.isEditable,
          client: event.client || '',
          city: event.city || '',
          startDate: event.startDate || null,
          endDate: event.endDate || null
        },
        totals: {
          // Investimento Inicial (o que ela pagou do próprio bolso)
          upfrontCost: upfrontCost,
          // Valor de Reembolso (o que vai voltar: despesas + KM + tempo viagem)
          reimbursementValue: reimbursementValue,
          // Lucro Líquido Real (apenas honorários - único dinheiro realmente ganho)
          netProfit: netProfit,
          // Total a Receber (Reembolso + Lucro)
          totalToReceive: totalToReceive,
          // Totais individuais
          totalExpenses: totals.totalExpenses,
          totalKmCost: totals.totalKmCost,
          totalTravelTimeCost: totals.totalTravelTimeCost,
          totalReimbursements: totals.totalReimbursements,
          totalFees: totals.totalFees,
          totalIncomes: totals.totalIncome,
          // Mantém campos antigos para compatibilidade
          totalSpent: totals.totalExpenses,
          netBalance: totals.totalIncome - totals.totalExpenses
        },
          transactions: {
            all: transactions,
            expenses: expenses,
            incomes: incomes,
            reimbursements: reimbursements,
            fees: fees,
            kmTransactions: kmTransactions
          },
        breakdown: {
          expenses: totals.expenses,
          income: totals.income,
          reimbursements: totals.reimbursements,
          fees: totals.fees
        },
        receiptStatus: {
          withReceipt: totals.expensesWithReceipt,
          withoutReceipt: totals.expensesWithoutReceipt
        },
        expectedReceiptDate: expectedReceiptDate,
        transactionCount: {
          total: transactions.length,
          expenses: totals.expenseCount,
          income: totals.incomeCount
        }
      };

      return {
        success: true,
        data: summary
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Calcula todos os totais das transações
   * @private
   */
  _calculateTotals(transactions) {
    let totalExpenses = 0;
    let totalIncome = 0;
    let totalReimbursements = 0; // Receitas marcadas como reembolso
    let totalFees = 0; // Receitas marcadas como honorário
    let totalKmCost = 0; // Custo de KM (gasolina paga hoje)
    let totalTravelTimeCost = 0; // Custo de tempo de viagem
    let expensesWithReceipt = 0;
    let expensesWithoutReceipt = 0;
    let expenseCount = 0;
    let incomeCount = 0;

    const expenses = [];
    const income = [];
    const reimbursements = [];
    const fees = [];

    transactions.forEach(transaction => {
      if (transaction.type === 'EXPENSE') {
        totalExpenses += transaction.amount;
        expenseCount++;
        expenses.push({
          id: transaction.id,
          description: transaction.description,
          amount: transaction.amount,
          hasReceipt: transaction.metadata.hasReceipt
        });

        if (transaction.metadata.hasReceipt) {
          expensesWithReceipt++;
        } else {
          expensesWithoutReceipt++;
        }
      } else if (transaction.type === 'INCOME') {
        totalIncome += transaction.amount;
        incomeCount++;
        income.push({
          id: transaction.id,
          description: transaction.description,
          amount: transaction.amount,
          category: transaction.metadata.category,
          isReimbursement: transaction.metadata.isReimbursement
        });

        const category = transaction.metadata.category;
        
        // Separa KM para cálculo de custo inicial
        if (category === 'km') {
          totalKmCost += transaction.amount; // Gasolina paga hoje
        }

        // Separa tempo de viagem para cálculo de reembolso (mas visualmente é honorário)
        if (category === 'tempo_viagem') {
          totalTravelTimeCost += transaction.amount;
        }

        if (category === 'km') {
          // Apenas KM é considerado reembolso
          totalReimbursements += transaction.amount;
          reimbursements.push({
            id: transaction.id,
            description: transaction.description,
            amount: transaction.amount,
            category: transaction.metadata.category
          });
        } else if (category === 'diaria' || category === 'hora_extra' || category === 'tempo_viagem') {
          // Honorários: Diárias, Horas Extras e Tempo de Viagem
          totalFees += transaction.amount;
          fees.push({
            id: transaction.id,
            description: transaction.description,
            amount: transaction.amount,
            category: transaction.metadata.category,
            metadata: transaction.metadata // Inclui metadata completo para acesso a hours, etc
          });
        } else if (transaction.metadata.isReimbursement === true) {
          // Outros reembolsos (caso existam outros tipos no futuro)
          totalReimbursements += transaction.amount;
          reimbursements.push({
            id: transaction.id,
            description: transaction.description,
            amount: transaction.amount,
            category: transaction.metadata.category
          });
        }
      }
    });

    return {
      totalExpenses,
      totalIncome,
      totalReimbursements,
      totalFees,
      totalKmCost, // Custo de KM (gasolina)
      totalTravelTimeCost, // Custo de tempo de viagem
      expensesWithReceipt,
      expensesWithoutReceipt,
      expenseCount,
      incomeCount,
      expenses,
      income,
      reimbursements,
      fees
    };
  }

  /**
   * Obtém as configurações atuais (cria padrão se não existir)
   * @private
   */
  async _getSettings() {
    let settings = await this.settingsRepository.find();
    if (!settings) {
      settings = Settings.createDefault();
      await this.settingsRepository.save(settings);
    }
    return settings;
  }
}

// Export para uso em módulos ES6
export { GetEventSummary };

