/**
 * Caso de Uso: Obter Resumo do Evento
 * Retorna o resumo financeiro completo de um evento
 */
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

      // Monta o resumo
      const summary = {
        event: {
          id: event.id,
          name: event.name,
          date: event.date,
          status: event.status
        },
        totals: {
          // Total Gasto (Saída do bolso) - todas as despesas
          totalSpent: totals.totalExpenses,
          // Total a Receber (Soma de gastos + honorários)
          // Isso inclui: despesas (que serão reembolsadas) + honorários
          totalToReceive: totals.totalExpenses + totals.totalFees,
          // Lucro Líquido Previsto (Apenas honorários)
          netProfit: totals.totalFees,
          // Total de reembolsos (despesas + receitas marcadas como reembolso)
          totalReimbursements: totals.totalExpenses + totals.totalReimbursements,
          // Total de honorários
          totalFees: totals.totalFees,
          // Saldo líquido (receitas - despesas)
          netBalance: totals.totalIncome - totals.totalExpenses
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

        if (transaction.metadata.isReimbursement) {
          totalReimbursements += transaction.amount;
          reimbursements.push({
            id: transaction.id,
            description: transaction.description,
            amount: transaction.amount,
            category: transaction.metadata.category
          });
        } else {
          totalFees += transaction.amount;
          fees.push({
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
      const { Settings } = await import('../../domain/entities/Settings.js');
      settings = Settings.createDefault();
      await this.settingsRepository.save(settings);
    }
    return settings;
  }
}

// Export para uso em módulos ES6
export { GetEventSummary };

