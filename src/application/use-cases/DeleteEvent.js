/**
 * Caso de Uso: Excluir Evento
 * Remove um evento e todas as suas transações associadas
 */
class DeleteEvent {
  constructor(eventRepository, transactionRepository) {
    if (!eventRepository) {
      throw new Error('EventRepository é obrigatório');
    }
    if (!transactionRepository) {
      throw new Error('TransactionRepository é obrigatório');
    }
    this.eventRepository = eventRepository;
    this.transactionRepository = transactionRepository;
  }

  /**
   * Executa o caso de uso
   * @param {string} eventId - ID do evento a ser excluído
   * @returns {Promise<Object>} - Resultado da exclusão ou erro
   */
  async execute(eventId) {
    try {
      // Validação de entrada
      if (!eventId || typeof eventId !== 'string' || eventId.trim() === '') {
        throw new Error('ID do evento é obrigatório');
      }

      // Verifica se o evento existe
      const event = await this.eventRepository.findById(eventId);
      if (!event) {
        return {
          success: false,
          error: 'Evento não encontrado'
        };
      }

      // Regra de negócio: Evento só pode ser excluído quando está em status PLANNED
      if (event.status !== 'PLANNED') {
        return {
          success: false,
          error: `Evento não pode ser excluído. Apenas eventos com status "Planejando" podem ser excluídos. Status atual: ${this._getStatusLabel(event.status)}`
        };
      }

      // Busca todas as transações do evento para excluí-las também
      const transactions = await this.transactionRepository.findByEventId(eventId);
      
      // Exclui todas as transações do evento
      for (const transaction of transactions) {
        try {
          await this.transactionRepository.delete(transaction.id);
        } catch (error) {
          // Continua mesmo se houver erro ao excluir uma transação
        }
      }

      // Exclui o evento
      await this.eventRepository.delete(eventId);

      return {
        success: true,
        data: { eventId, deletedTransactions: transactions.length }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Retorna o label do status para mensagens de erro
   * @private
   */
  _getStatusLabel(status) {
    const labels = {
      'PLANNED': 'Planejando',
      'DONE': 'Realizado',
      'COMPLETED': 'Realizado',
      'REPORT_SENT': 'Relatório Enviado',
      'PAID': 'Finalizado/Pago'
    };
    return labels[status] || status;
  }
}

// Export para uso em módulos ES6
export { DeleteEvent };
