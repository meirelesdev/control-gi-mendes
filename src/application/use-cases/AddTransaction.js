/**
 * Caso de Uso: Adicionar Transação
 * Adiciona uma transação (gasto ou ganho) a um evento
 * 
 * Para transações de KM ou Tempo de Viagem, calcula automaticamente
 * o valor monetário usando as configurações atuais (Settings)
 */
import { Transaction } from '../../domain/entities/Transaction.js';
import { Settings } from '../../domain/entities/Settings.js';
import { DEFAULT_VALUES } from '../../domain/constants/DefaultValues.js';

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
   * @param {string} [input.category] - Categoria (para EXPENSE: 'accommodation'; para INCOME: 'diaria', 'hora_extra', 'km', 'tempo_viagem')
   * @param {number} [input.distance] - Distância em KM (apenas para category='km')
   * @param {number} [input.hours] - Horas (para category='tempo_viagem' ou category='hora_extra')
   * @param {string} [input.origin] - Origem do deslocamento (opcional, apenas para category='km')
   * @param {string} [input.destination] - Destino do deslocamento (opcional, apenas para category='km')
   * @param {string} [input.checkIn] - Data de check-in (apenas para category='accommodation')
   * @param {string} [input.checkOut] - Data de check-out (apenas para category='accommodation')
   * @returns {Promise<Object>} - Resultado com transação criada ou erro
   */
  async execute(input) {
    try {
      // Debug: log do input recebido
      if (input.category === 'tempo_viagem') {
        console.log('AddTransaction - Input recebido para tempo_viagem:', input);
        console.log('AddTransaction - input.hours:', input.hours, 'tipo:', typeof input.hours);
      }
      
      // Validação de entrada
      this._validateInput(input);

      // Verifica se o evento existe
      const event = await this.eventRepository.findById(input.eventId);
      if (!event) {
        throw new Error('Evento não encontrado');
      }

      // Regra de negócio: Não pode adicionar transações em eventos finalizados/pagos
      if (event.status === 'PAID') {
        throw new Error(
          'Não é possível adicionar transações em eventos finalizados/pagos. ' +
          'Eventos com status "Finalizado/Pago" não podem ser alterados.'
        );
      }

      let transaction;

      if (input.type === 'EXPENSE') {
        // Cria transação do tipo EXPENSE
        let description = input.description;
        let metadata = {
          hasReceipt: input.hasReceipt || false
        };
        
        // Se for hospedagem, adiciona category e datas ao metadata
        if (input.category === 'accommodation') {
          metadata.category = 'accommodation';
          if (input.checkIn) {
            metadata.checkIn = input.checkIn;
          }
          if (input.checkOut) {
            metadata.checkOut = input.checkOut;
          }
          // Mantém a descrição como informada pelo usuário, sem formatação automática
        }
        
        transaction = Transaction.createExpense(
          input.eventId,
          description,
          input.amount,
          metadata.hasReceipt,
          metadata.category ? metadata : undefined
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
            input.description || '',
            input.distance,
            settings.rateKm,
            input.isReimbursement !== undefined ? input.isReimbursement : true,
            input.origin || null,
            input.destination || null
          );
        } else if (input.category === 'tempo_viagem') {
          // Transação de Tempo de Viagem - calcula valor automaticamente baseado nas horas
          console.log('AddTransaction - Processando tempo_viagem');
          console.log('AddTransaction - input.hours:', input.hours, 'tipo:', typeof input.hours, 'isNaN:', isNaN(input.hours));
          
          // Validação mais robusta
          if (input.hours === undefined) {
            console.error('AddTransaction - hours é undefined');
            throw new Error('Horas são obrigatórias para tempo de viagem (undefined)');
          }
          if (input.hours === null) {
            console.error('AddTransaction - hours é null');
            throw new Error('Horas são obrigatórias para tempo de viagem (null)');
          }
          const hoursNum = Number(input.hours);
          if (isNaN(hoursNum)) {
            console.error('AddTransaction - hours não é um número válido:', input.hours);
            throw new Error('Horas devem ser um número válido para tempo de viagem');
          }
          if (hoursNum <= 0) {
            console.error('AddTransaction - hours é menor ou igual a zero:', hoursNum);
            throw new Error('Horas devem ser maiores que zero para tempo de viagem');
          }
          
          const settings = await this._getSettings();
          // Usa a taxa de hora extra para calcular o valor
          const amount = hoursNum * (settings?.overtimeRate || DEFAULT_VALUES.OVERTIME_RATE);
          console.log('AddTransaction - Calculando amount:', hoursNum, '*', (settings?.overtimeRate || DEFAULT_VALUES.OVERTIME_RATE), '=', amount);
          
          // Cria a transação com o metadata completo incluindo hours
          // Isso evita erro na validação que verifica hours quando category é tempo_viagem
          transaction = Transaction.createIncome(
            input.eventId,
            input.description || `Tempo de Viagem (${hoursNum}h)`,
            amount,
            input.isReimbursement !== undefined ? input.isReimbursement : true,
            'tempo_viagem',
            { hours: hoursNum } // Passa hours no metadata desde o início
          );
          console.log('AddTransaction - Transação criada com sucesso');
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
          // Se for hora_extra e tiver hours, adiciona ao metadata
          if (input.category === 'hora_extra' && input.hours) {
            transaction.updateMetadata({ hours: input.hours });
          }
        }
      }

      // Salva a transação
      const savedTransaction = await this.transactionRepository.save(transaction);

      return {
        success: true,
        data: savedTransaction
      };
    } catch (error) {
      // Log detalhado do erro para debug
      console.error('Erro em AddTransaction.execute:', {
        message: error.message,
        stack: error.stack,
        input: input,
        errorType: typeof error,
        errorName: error.name
      });
      
      // Mensagem de erro mais amigável
      let errorMessage = error.message || 'Erro desconhecido ao processar transação';
      
      // Tratamento específico para erros relacionados a Transaction
      if (error.message && (
        error.message.includes('Transaction') || 
        error.message.includes('transaction') ||
        error.name === 'ReferenceError' && error.message.includes('Transaction')
      )) {
        errorMessage = 'Erro ao processar transação. Por favor, recarregue a página (F5) e tente novamente. Se o problema persistir, limpe o cache do navegador (Ctrl+Shift+Delete).';
        
        // Log adicional para debug
        console.error('🔍 Erro relacionado a Transaction detectado:', {
          message: error.message,
          name: error.name,
          stack: error.stack
        });
      }
      
      // GARANTE que nunca vai gerar um alert nativo
      // O erro já está sendo tratado e retornado como objeto de resultado
      // O código que chama este método deve tratar o resultado, não lançar exceção
      
      return {
        success: false,
        error: errorMessage
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
      // Para EXPENSE, pode ter category 'accommodation'
      if (input.category && !['accommodation'].includes(input.category)) {
        throw new Error('Categoria inválida para EXPENSE. Deve ser: accommodation');
      }
    }

    if (input.type === 'INCOME') {
      // Para KM, não precisa validar amount aqui pois será calculado automaticamente
      if (input.category && !['diaria', 'hora_extra', 'km', 'tempo_viagem'].includes(input.category)) {
        throw new Error('Categoria inválida. Deve ser: diaria, hora_extra, km ou tempo_viagem');
      }
    }
  }
}

// Export para uso em módulos ES6
export { AddTransaction };

