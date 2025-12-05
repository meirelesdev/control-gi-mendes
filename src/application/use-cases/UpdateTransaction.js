/**
 * Caso de Uso: Atualizar Transação
 * Atualiza os detalhes de uma transação (descrição, valor, metadados)
 */
import { Transaction } from '../../domain/entities/Transaction.js';

class UpdateTransaction {
  constructor(transactionRepository, eventRepository = null, settingsRepository = null) {
    if (!transactionRepository) {
      throw new Error('TransactionRepository é obrigatório');
    }
    this.transactionRepository = transactionRepository;
    this.eventRepository = eventRepository;
    this.settingsRepository = settingsRepository;
  }

  /**
   * Executa o caso de uso
   * @param {string} transactionId - ID da transação a ser atualizada
   * @param {Object} input - Dados de entrada
   * @param {string} [input.description] - Nova descrição
   * @param {number} [input.amount] - Novo valor
   * @param {Object} [input.metadata] - Novos metadados (parcial)
   * @returns {Promise<Object>} - Resultado com transação atualizada ou erro
   */
  async execute(transactionId, input) {
    try {
      // Validação de entrada
      this._validateInput(transactionId, input);

      // Busca a transação no repositório
      const transaction = await this.transactionRepository.findById(transactionId);
      if (!transaction) {
        return {
          success: false,
          error: 'Transação não encontrada'
        };
      }

      // Regra de negócio: Não pode editar transações de eventos finalizados/pagos
      if (this.eventRepository) {
        const event = await this.eventRepository.findById(transaction.eventId);
        if (event && event.status === 'PAID') {
          throw new Error(
            'Não é possível editar transações de eventos finalizados/pagos. ' +
            'Eventos com status "Finalizado/Pago" não podem ser alterados.'
          );
        }
      }

      // Atualiza os detalhes da transação
      transaction.updateDetails(input);

      // Salva a transação atualizada no repositório
      const savedTransaction = await this.transactionRepository.save(transaction);

      return {
        success: true,
        data: savedTransaction
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Valida os dados de entrada
   * @private
   */
  _validateInput(transactionId, input) {
    if (!transactionId || typeof transactionId !== 'string' || transactionId.trim() === '') {
      throw new Error('ID da transação é obrigatório');
    }

    if (!input || typeof input !== 'object') {
      throw new Error('Dados de entrada são obrigatórios');
    }

    // Verifica se pelo menos um campo foi informado
    if (input.description === undefined && 
        input.amount === undefined && 
        input.metadata === undefined) {
      throw new Error('Pelo menos um campo deve ser informado para atualização');
    }
  }
}

// Export para uso em módulos ES6
export { UpdateTransaction };
