/**
 * Implementação do Repositório de Eventos usando localStorage
 * 
 * IMPORTANTE: Os métodos de cálculo financeiro dependem do TransactionRepository
 * que deve ser injetado via construtor ou acessado globalmente
 */
import { EventRepository } from '../../domain/repositories/EventRepository.js';
import { Event } from '../../domain/entities/Event.js';

class LocalStorageEventRepository extends EventRepository {
  constructor(transactionRepository = null) {
    super();
    this.storageKey = 'gi_financas_events';
    this.transactionRepository = transactionRepository;
  }

  /**
   * Salva um evento no localStorage
   * @param {Event} event - Instância do evento
   * @returns {Promise<Event>} - Evento salvo
   */
  async save(event) {
    try {
      const events = await this._getAll();
      const index = events.findIndex(e => e.id === event.id);

      const data = {
        id: event.id,
        name: event.name,
        date: event.date,
        status: event.status,
        description: event.description,
        expectedPaymentDate: event.expectedPaymentDate || null,
        client: event.client || '',
        city: event.city || '',
        startDate: event.startDate || null,
        endDate: event.endDate || null,
        createdAt: event.createdAt,
        updatedAt: event.updatedAt
      };

      if (index >= 0) {
        events[index] = data;
      } else {
        events.push(data);
      }

      window.localStorage.setItem(this.storageKey, JSON.stringify(events));
      return event;
    } catch (error) {
      throw new Error(`Erro ao salvar evento: ${error.message}`);
    }
  }

  /**
   * Busca um evento por ID
   * @param {string} id - ID do evento
   * @returns {Promise<Event|null>} - Evento encontrado ou null
   */
  async findById(id) {
    try {
      const events = await this._getAll();
      const data = events.find(e => e.id === id);
      if (!data) {
        return null;
      }
      return Event.restore(data);
    } catch (error) {
      console.error('Erro ao buscar evento:', error);
      return null;
    }
  }

  /**
   * Lista todos os eventos com filtros e ordenação
   * @param {Object} options - Opções de filtro e ordenação
   * @param {string} options.status - Filtrar por status
   * @param {string} options.orderBy - Campo para ordenação ('date', 'name', 'createdAt')
   * @param {string} options.order - Direção da ordenação ('asc', 'desc')
   * @returns {Promise<Event[]>} - Lista de eventos
   */
  async findAll(options = {}) {
    try {
      let events = await this._getAll();

      // Aplicar filtro por status
      if (options.status) {
        events = events.filter(e => e.status === options.status);
      }

      // Converter para instâncias de Event
      let eventInstances = events.map(data => Event.restore(data));

      // Aplicar ordenação
      const orderBy = options.orderBy || 'date';
      const order = options.order || 'desc';

      eventInstances.sort((a, b) => {
        let aValue, bValue;

        switch (orderBy) {
          case 'name':
            aValue = a.name.toLowerCase();
            bValue = b.name.toLowerCase();
            break;
          case 'createdAt':
            aValue = new Date(a.createdAt).getTime();
            bValue = new Date(b.createdAt).getTime();
            break;
          case 'date':
          default:
            aValue = new Date(a.date).getTime();
            bValue = new Date(b.date).getTime();
            break;
        }

        if (order === 'asc') {
          return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
        } else {
          return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
        }
      });

      return eventInstances;
    } catch (error) {
      console.error('Erro ao listar eventos:', error);
      return [];
    }
  }

  /**
   * Remove um evento por ID
   * @param {string} id - ID do evento
   * @returns {Promise<void>}
   */
  async delete(id) {
    try {
      const events = await this._getAll();
      const filtered = events.filter(e => e.id !== id);
      window.localStorage.setItem(this.storageKey, JSON.stringify(filtered));
    } catch (error) {
      throw new Error(`Erro ao remover evento: ${error.message}`);
    }
  }

  /**
   * Verifica se um evento existe
   * @param {string} id - ID do evento
   * @returns {Promise<boolean>} - True se existe, false caso contrário
   */
  async exists(id) {
    try {
      const event = await this.findById(id);
      return event !== null;
    } catch (error) {
      return false;
    }
  }

  /**
   * Calcula o total de despesas de um evento
   * @param {string} eventId - ID do evento
   * @returns {Promise<number>} - Total de despesas
   */
  async calculateTotalExpenses(eventId) {
    if (!this.transactionRepository) {
      throw new Error('TransactionRepository não foi injetado');
    }
    return await this.transactionRepository.calculateTotalExpenses(eventId);
  }

  /**
   * Calcula o total de receitas de um evento
   * @param {string} eventId - ID do evento
   * @returns {Promise<number>} - Total de receitas
   */
  async calculateTotalIncome(eventId) {
    if (!this.transactionRepository) {
      throw new Error('TransactionRepository não foi injetado');
    }
    return await this.transactionRepository.calculateTotalIncome(eventId);
  }

  /**
   * Calcula o total de reembolsos de um evento
   * @param {string} eventId - ID do evento
   * @returns {Promise<number>} - Total de reembolsos (despesas + receitas marcadas como reembolso)
   */
  async calculateTotalReimbursements(eventId) {
    if (!this.transactionRepository) {
      throw new Error('TransactionRepository não foi injetado');
    }
    const expenses = await this.transactionRepository.calculateTotalExpenses(eventId);
    const incomeReimbursements = await this.transactionRepository.calculateTotalReimbursements(eventId);
    return expenses + incomeReimbursements;
  }

  /**
   * Calcula o total de honorários de um evento
   * @param {string} eventId - ID do evento
   * @returns {Promise<number>} - Total de honorários (receitas não marcadas como reembolso)
   */
  async calculateTotalFees(eventId) {
    if (!this.transactionRepository) {
      throw new Error('TransactionRepository não foi injetado');
    }
    return await this.transactionRepository.calculateTotalFees(eventId);
  }

  /**
   * Calcula o saldo líquido de um evento (receitas - despesas)
   * @param {string} eventId - ID do evento
   * @returns {Promise<number>} - Saldo líquido
   */
  async calculateNetBalance(eventId) {
    if (!this.transactionRepository) {
      throw new Error('TransactionRepository não foi injetado');
    }
    const income = await this.transactionRepository.calculateTotalIncome(eventId);
    const expenses = await this.transactionRepository.calculateTotalExpenses(eventId);
    return income - expenses;
  }

  /**
   * Calcula o lucro líquido de um evento (honorários - despesas)
   * @param {string} eventId - ID do evento
   * @returns {Promise<number>} - Lucro líquido (sem contar reembolsos)
   */
  async calculateNetProfit(eventId) {
    if (!this.transactionRepository) {
      throw new Error('TransactionRepository não foi injetado');
    }
    const fees = await this.transactionRepository.calculateTotalFees(eventId);
    const expenses = await this.transactionRepository.calculateTotalExpenses(eventId);
    return fees - expenses;
  }

  /**
   * Obtém o resumo financeiro completo de um evento
   * @param {string} eventId - ID do evento
   * @returns {Promise<Object>} - Objeto com todos os totais calculados
   */
  async getFinancialSummary(eventId) {
    if (!this.transactionRepository) {
      throw new Error('TransactionRepository não foi injetado');
    }

    const [
      totalExpenses,
      totalIncome,
      totalReimbursements,
      totalFees,
      netBalance,
      netProfit,
      expensesWithReceipt,
      expensesWithoutReceipt
    ] = await Promise.all([
      this.transactionRepository.calculateTotalExpenses(eventId),
      this.transactionRepository.calculateTotalIncome(eventId),
      this.transactionRepository.calculateTotalReimbursements(eventId),
      this.transactionRepository.calculateTotalFees(eventId),
      this.calculateNetBalance(eventId),
      this.calculateNetProfit(eventId),
      this.transactionRepository.countExpensesWithReceipt(eventId),
      this.transactionRepository.countExpensesWithoutReceipt(eventId)
    ]);

    return {
      totalExpenses,
      totalIncome,
      totalReimbursements: totalExpenses + totalReimbursements,
      totalFees,
      netBalance,
      netProfit,
      expensesWithReceipt,
      expensesWithoutReceipt
    };
  }

  /**
   * Conta quantas despesas têm nota fiscal emitida
   * @param {string} eventId - ID do evento
   * @returns {Promise<number>} - Quantidade de despesas com nota fiscal
   */
  async countExpensesWithReceipt(eventId) {
    if (!this.transactionRepository) {
      throw new Error('TransactionRepository não foi injetado');
    }
    return await this.transactionRepository.countExpensesWithReceipt(eventId);
  }

  /**
   * Conta quantas despesas não têm nota fiscal emitida
   * @param {string} eventId - ID do evento
   * @returns {Promise<number>} - Quantidade de despesas sem nota fiscal
   */
  async countExpensesWithoutReceipt(eventId) {
    if (!this.transactionRepository) {
      throw new Error('TransactionRepository não foi injetado');
    }
    return await this.transactionRepository.countExpensesWithoutReceipt(eventId);
  }

  /**
   * Obtém todos os eventos do localStorage
   * @private
   * @returns {Promise<Array>} - Array de objetos de eventos
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
      throw new Error(`Erro ao ler eventos do localStorage: ${error.message}`);
    }
  }
}

// Export para uso em módulos ES6
export { LocalStorageEventRepository };

