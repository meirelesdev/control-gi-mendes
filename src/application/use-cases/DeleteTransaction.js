/**
 * Caso de Uso: Excluir Transação
 * Remove uma transação do sistema
 */
class DeleteTransaction {
  constructor(transactionRepository, eventRepository = null) {
    if (!transactionRepository) {
      throw new Error('TransactionRepository é obrigatório');
    }
    this.transactionRepository = transactionRepository;
    this.eventRepository = eventRepository;
  }

  /**
   * Executa o caso de uso
   * @param {string} transactionId - ID da transação a ser excluída
   * @returns {Promise<Object>} - Resultado da operação
   */
  async execute(transactionId) {
    try {
      // Validação de entrada
      if (!transactionId || typeof transactionId !== 'string' || transactionId.trim() === '') {
        throw new Error('ID da transação é obrigatório');
      }

      // Verifica se a transação existe
      const transaction = await this.transactionRepository.findById(transactionId);
      if (!transaction) {
        throw new Error('Transação não encontrada');
      }

      // Regra de negócio: Não pode excluir transações de eventos finalizados/pagos
      if (this.eventRepository) {
        const event = await this.eventRepository.findById(transaction.eventId);
        if (event && event.status === 'PAID') {
          throw new Error(
            'Não é possível excluir transações de eventos finalizados/pagos. ' +
            'Eventos com status "Finalizado/Pago" não podem ser alterados.'
          );
        }
      }

      // Remove a transação
      await this.transactionRepository.delete(transactionId);

      return {
        success: true,
        message: 'Transação excluída com sucesso'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Export para uso em módulos ES6
export { DeleteTransaction };
