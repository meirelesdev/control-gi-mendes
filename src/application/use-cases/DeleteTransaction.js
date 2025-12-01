/**
 * Caso de Uso: Excluir Transação
 * Remove uma transação do sistema
 */
class DeleteTransaction {
  constructor(transactionRepository) {
    if (!transactionRepository) {
      throw new Error('TransactionRepository é obrigatório');
    }
    this.transactionRepository = transactionRepository;
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
