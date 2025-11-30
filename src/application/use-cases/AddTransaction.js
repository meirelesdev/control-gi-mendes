/**
 * Caso de Uso: Adicionar Transação
 * Adiciona uma transação (gasto ou ganho) a um evento
 * 
 * Para transações de KM ou Tempo de Viagem, calcula automaticamente
 * o valor monetário usando as configurações atuais (Settings)
 */
class AddTransaction {
  constructor(transactionRepository, eventRepository, settingsRepository) {
    if (!transactionRepository) {
      throw new Error('TransactionRepository é obrigatório');
    }
    if (!eventRepository) {
      throw new Error('EventRepository é obrigatório');
    }
    if (!settingsRepository) {
      throw new Error('SettingsRepository é obrigatório');
    }

    this.transactionRepository = transactionRepository;
    this.eventRepository = eventRepository;
    this.settingsRepository = settingsRepository;
  }

  /**
   * Executa o caso de uso
   * @param {Object} input - Dados de entrada
   * @param {string} input.eventId - ID do evento
   * @param {string} input.type - Tipo da transação ('EXPENSE' ou 'INCOME')
   * @param {string} input.description - Descrição da transação
   * @param {number} [input.amount] - Valor monetário (obrigatório para EXPENSE e INCOME, exceto KM/Tempo)
   * @param {boolean} [input.hasReceipt] - Se tem nota fiscal (apenas para EXPENSE)
   * @param {boolean} [input.isReimbursement] - Se é reembolso (apenas para INCOME)
   * @param {string} [input.category] - Categoria (apenas para INCOME: 'diaria', 'hora_extra', 'km', 'tempo_viagem')
   * @param {number} [input.distance] - Distância em KM (apenas para category='km')
   * @param {number} [input.hours] - Horas de viagem (apenas para category='tempo_viagem')
   * @returns {Promise<Object>} - Resultado com transação criada ou erro
   */
  async execute(input) {
    try {
      // Validação de entrada
      this._validateInput(input);

      // Verifica se o evento existe
      const event = await this.eventRepository.findById(input.eventId);
      if (!event) {
        throw new Error('Evento não encontrado');
      }

      let transaction;

      if (input.type === 'EXPENSE') {
        // Cria transação do tipo EXPENSE
        transaction = Transaction.createExpense(
          input.eventId,
          input.description,
          input.amount,
          input.hasReceipt || false
        );
      } else if (input.type === 'INCOME') {
        // Para INCOME, verifica se precisa calcular valor automaticamente
        if (input.category === 'km') {
          // Transação de KM - calcula valor automaticamente
          if (!input.distance && input.distance !== 0) {
            throw new Error('Distância é obrigatória para transações de KM');
          }
          const settings = await this._getSettings();
          transaction = Transaction.createKmIncome(
            input.eventId,
            input.description,
            input.distance,
            settings.rateKm,
            input.isReimbursement !== undefined ? input.isReimbursement : true
          );
        } else if (input.category === 'tempo_viagem') {
          // Transação de Tempo de Viagem - calcula valor automaticamente
          if (!input.hours && input.hours !== 0) {
            throw new Error('Horas de viagem são obrigatórias para transações de tempo de viagem');
          }
          const settings = await this._getSettings();
          transaction = Transaction.createTravelTimeIncome(
            input.eventId,
            input.description,
            input.hours,
            settings.rateTravelTime,
            input.isReimbursement !== undefined ? input.isReimbursement : true
          );
        } else {
          // Outras receitas (diária, hora extra) - valor deve ser informado
          if (!input.amount && input.amount !== 0) {
            throw new Error('Valor é obrigatório para este tipo de transação');
          }
          transaction = Transaction.createIncome(
            input.eventId,
            input.description,
            input.amount,
            input.isReimbursement !== undefined ? input.isReimbursement : false,
            input.category || null
          );
        }
      }

      // Salva a transação
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
   * Obtém as configurações atuais (cria padrão se não existir)
   * @private
   */
  async _getSettings() {
    let settings = await this.settingsRepository.find();
    if (!settings) {
      // Se não existir, cria com valores padrão
      settings = Settings.createDefault();
      await this.settingsRepository.save(settings);
    }
    return settings;
  }

  /**
   * Valida os dados de entrada
   * @private
   */
  _validateInput(input) {
    if (!input) {
      throw new Error('Dados de entrada são obrigatórios');
    }
    if (!input.eventId) {
      throw new Error('ID do evento é obrigatório');
    }
    if (!input.type || !['EXPENSE', 'INCOME'].includes(input.type)) {
      throw new Error('Tipo da transação deve ser EXPENSE ou INCOME');
    }
    if (!input.description || typeof input.description !== 'string' || input.description.trim() === '') {
      throw new Error('Descrição da transação é obrigatória');
    }

    // Validações específicas por tipo
    if (input.type === 'EXPENSE') {
      if (input.amount === undefined || input.amount === null) {
        throw new Error('Valor é obrigatório para transações do tipo EXPENSE');
      }
    }

    if (input.type === 'INCOME') {
      // Para KM e Tempo de Viagem, não precisa validar amount aqui
      // pois será calculado automaticamente
      if (input.category && !['diaria', 'hora_extra', 'km', 'tempo_viagem'].includes(input.category)) {
        throw new Error('Categoria inválida. Deve ser: diaria, hora_extra, km ou tempo_viagem');
      }
    }
  }
}

// Export para uso em módulos ES6
export { AddTransaction };

