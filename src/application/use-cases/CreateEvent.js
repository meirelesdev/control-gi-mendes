/**
 * Caso de Uso: Criar Evento
 * Cria um novo evento no sistema
 * Pode criar automaticamente uma transação de diária padrão
 */
import { Event } from '../../domain/entities/Event.js';
import { DEFAULT_VALUES } from '../../domain/constants/DefaultValues.js';

class CreateEvent {
  constructor(eventRepository, addTransactionUseCase = null, settingsRepository = null) {
    if (!eventRepository) {
      throw new Error('EventRepository é obrigatório');
    }
    this.eventRepository = eventRepository;
    this.addTransactionUseCase = addTransactionUseCase;
    this.settingsRepository = settingsRepository;
  }

  /**
   * Executa o caso de uso
   * @param {Object} input - Dados de entrada
   * @param {string} input.name - Nome do evento
   * @param {string} input.date - Data do evento (formato ISO ou YYYY-MM-DD)
   * @param {string} input.client - Cliente do evento (obrigatório)
   * @param {string} input.city - Cidade do evento (obrigatório)
   * @param {string} [input.description] - Descrição opcional do evento
   * @param {string} [input.startDate] - Data de início do evento (opcional, usa date se não informado)
   * @param {string} [input.endDate] - Data de fim do evento (opcional, usa date se não informado)
   * @param {string} [input.status] - Status inicial (padrão: 'PLANNED')
   * @param {boolean} [input.autoCreateDaily] - Se true, cria automaticamente uma diária padrão
   * @returns {Promise<Object>} - Resultado com evento criado ou erro
   */
  async execute(input) {
    try {
      // Validação de entrada
      this._validateInput(input);

      // Cria o evento usando a factory method da entidade
      const event = Event.create(
        input.name,
        input.date,
        input.description || '',
        input.client || '',
        input.city || '',
        input.startDate || null,
        input.endDate || null
      );

      // Se foi informado um status, atualiza
      if (input.status) {
        event.updateStatus(input.status);
      }

      // Salva no repositório
      const savedEvent = await this.eventRepository.save(event);

      // Se solicitado, cria automaticamente a diária padrão
      if (input.autoCreateDaily && this.addTransactionUseCase && this.settingsRepository) {
        try {
          const settings = await this.settingsRepository.find();
          const dailyRate = settings?.standardDailyRate || DEFAULT_VALUES.DAILY_RATE;
          
          await this.addTransactionUseCase.execute({
            eventId: savedEvent.id,
            type: 'INCOME',
            description: 'Diária Técnica Padrão',
            amount: dailyRate,
            category: 'diaria',
            isReimbursement: false
          });
        } catch (dailyError) {
          // Erro ao criar diária padrão não falha a criação do evento
        }
      }

      return {
        success: true,
        data: savedEvent
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
  _validateInput(input) {
    if (!input) {
      throw new Error('Dados de entrada são obrigatórios');
    }
    if (!input.name || typeof input.name !== 'string' || input.name.trim() === '') {
      throw new Error('Nome do evento é obrigatório');
    }
    if (!input.date) {
      throw new Error('Data do evento é obrigatória');
    }
    if (!input.client || typeof input.client !== 'string' || input.client.trim() === '') {
      throw new Error('Cliente do evento é obrigatório');
    }
    if (!input.city || typeof input.city !== 'string' || input.city.trim() === '') {
      throw new Error('Cidade do evento é obrigatória');
    }
    // A validação completa será feita pela entidade Event
  }
}

// Export para uso em módulos ES6
export { CreateEvent };

