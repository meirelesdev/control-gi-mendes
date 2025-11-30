/**
 * Caso de Uso: Criar Evento
 * Cria um novo evento no sistema
 */
import { Event } from '../../domain/entities/Event.js';

class CreateEvent {
  constructor(eventRepository) {
    if (!eventRepository) {
      throw new Error('EventRepository é obrigatório');
    }
    this.eventRepository = eventRepository;
  }

  /**
   * Executa o caso de uso
   * @param {Object} input - Dados de entrada
   * @param {string} input.name - Nome do evento
   * @param {string} input.date - Data do evento (formato ISO ou YYYY-MM-DD)
   * @param {string} [input.description] - Descrição opcional do evento
   * @param {string} [input.status] - Status inicial (padrão: 'PLANNED')
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
        input.description || ''
      );

      // Se foi informado um status, atualiza
      if (input.status) {
        event.updateStatus(input.status);
      }

      // Salva no repositório
      const savedEvent = await this.eventRepository.save(event);

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
    // A validação completa será feita pela entidade Event
  }
}

// Export para uso em módulos ES6
export { CreateEvent };

