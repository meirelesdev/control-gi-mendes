/**
 * Interface do Repositório de Eventos
 * Define os contratos para persistência e consultas de eventos
 */
class EventRepository {
  /**
   * Salva um evento (cria ou atualiza)
   * @param {Event} event - Instância do evento
   * @returns {Promise<Event>} - Evento salvo
   */
  async save(event) {
    throw new Error('Método save deve ser implementado');
  }

  /**
   * Busca um evento por ID
   * @param {string} id - ID do evento
   * @returns {Promise<Event|null>} - Evento encontrado ou null
   */
  async findById(id) {
    throw new Error('Método findById deve ser implementado');
  }

  /**
   * Lista todos os eventos
   * @param {Object} options - Opções de filtro e ordenação
   * @param {string} options.status - Filtrar por status
   * @param {string} options.orderBy - Campo para ordenação ('date', 'name', 'createdAt')
   * @param {string} options.order - Direção da ordenação ('asc', 'desc')
   * @returns {Promise<Event[]>} - Lista de eventos
   */
  async findAll(options = {}) {
    throw new Error('Método findAll deve ser implementado');
  }

  /**
   * Remove um evento por ID
   * @param {string} id - ID do evento
   * @returns {Promise<void>}
   */
  async delete(id) {
    throw new Error('Método delete deve ser implementado');
  }

  /**
   * Verifica se um evento existe
   * @param {string} id - ID do evento
   * @returns {Promise<boolean>} - True se existe, false caso contrário
   */
  async exists(id) {
    throw new Error('Método exists deve ser implementado');
  }

  /**
   * Calcula o total de despesas de um evento
   * @param {string} eventId - ID do evento
   * @returns {Promise<number>} - Total de despesas
   */
  async calculateTotalExpenses(eventId) {
    throw new Error('Método calculateTotalExpenses deve ser implementado');
  }

  /**
   * Calcula o total de receitas de um evento
   * @param {string} eventId - ID do evento
   * @returns {Promise<number>} - Total de receitas
   */
  async calculateTotalIncome(eventId) {
    throw new Error('Método calculateTotalIncome deve ser implementado');
  }

  /**
   * Calcula o total de reembolsos de um evento
   * @param {string} eventId - ID do evento
   * @returns {Promise<number>} - Total de reembolsos (despesas + receitas marcadas como reembolso)
   */
  async calculateTotalReimbursements(eventId) {
    throw new Error('Método calculateTotalReimbursements deve ser implementado');
  }

  /**
   * Calcula o total de honorários de um evento
   * @param {string} eventId - ID do evento
   * @returns {Promise<number>} - Total de honorários (receitas não marcadas como reembolso)
   */
  async calculateTotalFees(eventId) {
    throw new Error('Método calculateTotalFees deve ser implementado');
  }

  /**
   * Calcula o saldo líquido de um evento (receitas - despesas)
   * @param {string} eventId - ID do evento
   * @returns {Promise<number>} - Saldo líquido
   */
  async calculateNetBalance(eventId) {
    throw new Error('Método calculateNetBalance deve ser implementado');
  }

  /**
   * Calcula o lucro líquido de um evento (honorários - despesas)
   * @param {string} eventId - ID do evento
   * @returns {Promise<number>} - Lucro líquido (sem contar reembolsos)
   */
  async calculateNetProfit(eventId) {
    throw new Error('Método calculateNetProfit deve ser implementado');
  }

  /**
   * Obtém o resumo financeiro completo de um evento
   * @param {string} eventId - ID do evento
   * @returns {Promise<Object>} - Objeto com todos os totais calculados
   */
  async getFinancialSummary(eventId) {
    throw new Error('Método getFinancialSummary deve ser implementado');
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
export { EventRepository };

