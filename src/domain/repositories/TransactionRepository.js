/**
 * Interface do Repositório de Transações
 * Define os contratos para persistência e consultas de transações
 */
class TransactionRepository {
  /**
   * Salva uma transação (cria ou atualiza)
   * @param {Transaction} transaction - Instância da transação
   * @returns {Promise<Transaction>} - Transação salva
   */
  async save(transaction) {
    throw new Error('Método save deve ser implementado');
  }

  /**
   * Busca uma transação por ID
   * @param {string} id - ID da transação
   * @returns {Promise<Transaction|null>} - Transação encontrada ou null
   */
  async findById(id) {
    throw new Error('Método findById deve ser implementado');
  }

  /**
   * Lista todas as transações de um evento
   * @param {string} eventId - ID do evento
   * @returns {Promise<Transaction[]>} - Lista de transações
   */
  async findByEventId(eventId) {
    throw new Error('Método findByEventId deve ser implementado');
  }

  /**
   * Lista todas as transações
   * @param {Object} options - Opções de filtro
   * @param {string} options.eventId - Filtrar por evento
   * @param {string} options.type - Filtrar por tipo ('EXPENSE' ou 'INCOME')
   * @returns {Promise<Transaction[]>} - Lista de transações
   */
  async findAll(options = {}) {
    throw new Error('Método findAll deve ser implementado');
  }

  /**
   * Remove uma transação por ID
   * @param {string} id - ID da transação
   * @returns {Promise<void>}
   */
  async delete(id) {
    throw new Error('Método delete deve ser implementado');
  }

  /**
   * Remove todas as transações de um evento
   * @param {string} eventId - ID do evento
   * @returns {Promise<void>}
   */
  async deleteByEventId(eventId) {
    throw new Error('Método deleteByEventId deve ser implementado');
  }

  /**
   * Calcula o total de transações do tipo EXPENSE de um evento
   * @param {string} eventId - ID do evento
   * @returns {Promise<number>} - Total de despesas
   */
  async calculateTotalExpenses(eventId) {
    throw new Error('Método calculateTotalExpenses deve ser implementado');
  }

  /**
   * Calcula o total de transações do tipo INCOME de um evento
   * @param {string} eventId - ID do evento
   * @returns {Promise<number>} - Total de receitas
   */
  async calculateTotalIncome(eventId) {
    throw new Error('Método calculateTotalIncome deve ser implementado');
  }

  /**
   * Calcula o total de receitas marcadas como reembolso
   * @param {string} eventId - ID do evento
   * @returns {Promise<number>} - Total de reembolsos
   */
  async calculateTotalReimbursements(eventId) {
    throw new Error('Método calculateTotalReimbursements deve ser implementado');
  }

  /**
   * Calcula o total de receitas marcadas como honorário
   * @param {string} eventId - ID do evento
   * @returns {Promise<number>} - Total de honorários
   */
  async calculateTotalFees(eventId) {
    throw new Error('Método calculateTotalFees deve ser implementado');
  }

  /**
   * Conta quantas despesas têm nota fiscal emitida
   * @param {string} eventId - ID do evento
   * @returns {Promise<number>} - Quantidade de despesas com nota fiscal
   */
  async countExpensesWithReceipt(eventId) {
    throw new Error('Método countExpensesWithReceipt deve ser implementado');
  }

  /**
   * Conta quantas despesas não têm nota fiscal emitida
   * @param {string} eventId - ID do evento
   * @returns {Promise<number>} - Quantidade de despesas sem nota fiscal
   */
  async countExpensesWithoutReceipt(eventId) {
    throw new Error('Método countExpensesWithoutReceipt deve ser implementado');
  }
}

// Export para uso em módulos ES6
export { TransactionRepository };

