/**
 * Implementação do Repositório de Transações usando localStorage
 */
import { TransactionRepository } from '../../domain/repositories/TransactionRepository.js';
import { Transaction } from '../../domain/entities/Transaction.js';

class LocalStorageTransactionRepository extends TransactionRepository {
  constructor() {
    super();
    this.storageKey = 'gi_financas_transactions';
  }

  /**
   * Salva uma transação no localStorage
   * @param {Transaction} transaction - Instância da transação
   * @returns {Promise<Transaction>} - Transação salva
   */
  async save(transaction) {
    try {
      const transactions = await this._getAll();
      const index = transactions.findIndex(t => t.id === transaction.id);

      const data = {
        id: transaction.id,
        eventId: transaction.eventId,
        type: transaction.type,
        description: transaction.description,
        amount: transaction.amount,
        metadata: transaction.metadata,
        createdAt: transaction.createdAt,
        updatedAt: transaction.updatedAt
      };

      if (index >= 0) {
        transactions[index] = data;
      } else {
        transactions.push(data);
      }

      window.localStorage.setItem(this.storageKey, JSON.stringify(transactions));
      return transaction;
    } catch (error) {
      throw new Error(`Erro ao salvar transação: ${error.message}`);
    }
  }

  /**
   * Busca uma transação por ID
   * @param {string} id - ID da transação
   * @returns {Promise<Transaction|null>} - Transação encontrada ou null
   */
  async findById(id) {
    try {
      const transactions = await this._getAll();
      const data = transactions.find(t => t.id === id);
      if (!data) {
        return null;
      }
      return Transaction.restore(data);
    } catch (error) {
      console.error('Erro ao buscar transação:', error);
      return null;
    }
  }

  /**
   * Lista todas as transações de um evento
   * @param {string} eventId - ID do evento
   * @returns {Promise<Transaction[]>} - Lista de transações
   */
  async findByEventId(eventId) {
    try {
      const transactions = await this._getAll();
      const filtered = transactions.filter(t => t.eventId === eventId);
      return filtered.map(data => Transaction.restore(data));
    } catch (error) {
      console.error('Erro ao buscar transações do evento:', error);
      return [];
    }
  }

  /**
   * Lista todas as transações com filtros opcionais
   * @param {Object} options - Opções de filtro
   * @param {string} options.eventId - Filtrar por evento
   * @param {string} options.type - Filtrar por tipo ('EXPENSE' ou 'INCOME')
   * @returns {Promise<Transaction[]>} - Lista de transações
   */
  async findAll(options = {}) {
    try {
      let transactions = await this._getAll();

      if (options.eventId) {
        transactions = transactions.filter(t => t.eventId === options.eventId);
      }

      if (options.type) {
        transactions = transactions.filter(t => t.type === options.type);
      }

      return transactions.map(data => Transaction.restore(data));
    } catch (error) {
      console.error('Erro ao listar transações:', error);
      return [];
    }
  }

  /**
   * Remove uma transação por ID
   * @param {string} id - ID da transação
   * @returns {Promise<void>}
   */
  async delete(id) {
    try {
      const transactions = await this._getAll();
      const filtered = transactions.filter(t => t.id !== id);
      window.localStorage.setItem(this.storageKey, JSON.stringify(filtered));
    } catch (error) {
      throw new Error(`Erro ao remover transação: ${error.message}`);
    }
  }

  /**
   * Remove todas as transações de um evento
   * @param {string} eventId - ID do evento
   * @returns {Promise<void>}
   */
  async deleteByEventId(eventId) {
    try {
      const transactions = await this._getAll();
      const filtered = transactions.filter(t => t.eventId !== eventId);
      window.localStorage.setItem(this.storageKey, JSON.stringify(filtered));
    } catch (error) {
      throw new Error(`Erro ao remover transações do evento: ${error.message}`);
    }
  }

  /**
   * Calcula o total de transações do tipo EXPENSE de um evento
   * @param {string} eventId - ID do evento
   * @returns {Promise<number>} - Total de despesas
   */
  async calculateTotalExpenses(eventId) {
    try {
      const transactions = await this.findByEventId(eventId);
      return transactions
        .filter(t => t.type === 'EXPENSE')
        .reduce((total, t) => total + t.amount, 0);
    } catch (error) {
      console.error('Erro ao calcular total de despesas:', error);
      return 0;
    }
  }

  /**
   * Calcula o total de transações do tipo INCOME de um evento
   * @param {string} eventId - ID do evento
   * @returns {Promise<number>} - Total de receitas
   */
  async calculateTotalIncome(eventId) {
    try {
      const transactions = await this.findByEventId(eventId);
      return transactions
        .filter(t => t.type === 'INCOME')
        .reduce((total, t) => total + t.amount, 0);
    } catch (error) {
      console.error('Erro ao calcular total de receitas:', error);
      return 0;
    }
  }

  /**
   * Calcula o total de receitas marcadas como reembolso
   * @param {string} eventId - ID do evento
   * @returns {Promise<number>} - Total de reembolsos
   */
  async calculateTotalReimbursements(eventId) {
    try {
      const transactions = await this.findByEventId(eventId);
      return transactions
        .filter(t => t.type === 'INCOME' && t.metadata.isReimbursement === true)
        .reduce((total, t) => total + t.amount, 0);
    } catch (error) {
      console.error('Erro ao calcular total de reembolsos:', error);
      return 0;
    }
  }

  /**
   * Calcula o total de receitas marcadas como honorário
   * @param {string} eventId - ID do evento
   * @returns {Promise<number>} - Total de honorários
   */
  async calculateTotalFees(eventId) {
    try {
      const transactions = await this.findByEventId(eventId);
      return transactions
        .filter(t => t.type === 'INCOME' && t.metadata.isReimbursement === false)
        .reduce((total, t) => total + t.amount, 0);
    } catch (error) {
      console.error('Erro ao calcular total de honorários:', error);
      return 0;
    }
  }

  /**
   * Conta quantas despesas têm nota fiscal emitida
   * @param {string} eventId - ID do evento
   * @returns {Promise<number>} - Quantidade de despesas com nota fiscal
   */
  async countExpensesWithReceipt(eventId) {
    try {
      const transactions = await this.findByEventId(eventId);
      return transactions.filter(
        t => t.type === 'EXPENSE' && t.metadata.hasReceipt === true
      ).length;
    } catch (error) {
      console.error('Erro ao contar despesas com nota fiscal:', error);
      return 0;
    }
  }

  /**
   * Conta quantas despesas não têm nota fiscal emitida
   * @param {string} eventId - ID do evento
   * @returns {Promise<number>} - Quantidade de despesas sem nota fiscal
   */
  async countExpensesWithoutReceipt(eventId) {
    try {
      const transactions = await this.findByEventId(eventId);
      return transactions.filter(
        t => t.type === 'EXPENSE' && t.metadata.hasReceipt !== true
      ).length;
    } catch (error) {
      console.error('Erro ao contar despesas sem nota fiscal:', error);
      return 0;
    }
  }

  /**
   * Obtém todas as transações do localStorage
   * @private
   * @returns {Promise<Array>} - Array de objetos de transações
   */
  async _getAll() {
    try {
      const data = window.localStorage.getItem(this.storageKey);
      if (!data) {
        return [];
      }
      return JSON.parse(data);
    } catch (error) {
      // Se for erro de sintaxe JSON (dados corrompidos), faz backup e retorna vazio
      if (error instanceof SyntaxError) {
        const backupKey = `${this.storageKey}_corrupted_bkp_${Date.now()}`;
        try {
          const corruptedData = window.localStorage.getItem(this.storageKey);
          window.localStorage.setItem(backupKey, corruptedData);
          window.localStorage.removeItem(this.storageKey);
          console.error('⚠️ DADOS CORROMPIDOS DETECTADOS:', {
            storageKey: this.storageKey,
            backupKey: backupKey,
            error: error.message,
            message: 'Os dados foram movidos para backup. O sistema iniciará com dados vazios.'
          });
          // Notifica o usuário via console (em produção, poderia usar toast)
          if (window.toast) {
            window.toast.error('Dados corrompidos detectados. Backup criado. Sistema iniciado com dados vazios.');
          }
        } catch (backupError) {
          console.error('Erro ao criar backup de dados corrompidos:', backupError);
        }
        return [];
      }
      // Para outros erros, lança exceção
      throw new Error(`Erro ao ler transações do localStorage: ${error.message}`);
    }
  }
}

// Export para uso em módulos ES6
export { LocalStorageTransactionRepository };

