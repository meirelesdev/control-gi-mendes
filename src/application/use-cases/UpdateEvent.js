/**
 * Caso de Uso: Atualizar Evento
 * Atualiza os detalhes de um evento (nome, data, descrição)
 * Respeita a regra de negócio: apenas eventos com status PLANNED ou DONE podem ser editados
 */
import { Event } from '../../domain/entities/Event.js';

class UpdateEvent {
  constructor(eventRepository) {
    if (!eventRepository) {
      throw new Error('EventRepository é obrigatório');
    }
    this.eventRepository = eventRepository;
  }

  /**
   * Executa o caso de uso
   * @param {string} eventId - ID do evento a ser atualizado
   * @param {Object} input - Dados de entrada
   * @param {string} [input.name] - Novo nome do evento
   * @param {string|Date} [input.date] - Nova data do evento
   * @param {string} [input.description] - Nova descrição do evento
   * @param {string} [input.client] - Novo cliente do evento
   * @param {string} [input.city] - Nova cidade do evento
   * @param {string|Date} [input.startDate] - Nova data de início do evento
   * @param {string|Date} [input.endDate] - Nova data de fim do evento
   * @returns {Promise<Object>} - Resultado com evento atualizado ou erro
   */
  async execute(eventId, input) {
    try {
      // Validação de entrada
      this._validateInput(eventId, input);

      // Busca o evento no repositório
      const event = await this.eventRepository.findById(eventId);
      if (!event) {
        return {
          success: false,
          error: 'Evento não encontrado'
        };
      }

      // Atualiza os detalhes do evento (a entidade valida se é editável)
      event.updateDetails(input);

      // Salva o evento atualizado no repositório
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
  _validateInput(eventId, input) {
    if (!eventId || typeof eventId !== 'string' || eventId.trim() === '') {
      throw new Error('ID do evento é obrigatório');
    }

    if (!input || typeof input !== 'object') {
      throw new Error('Dados de entrada são obrigatórios');
    }

    // Verifica se pelo menos um campo foi informado
    if (input.name === undefined && 
        input.date === undefined && 
        input.description === undefined &&
        input.client === undefined &&
        input.city === undefined &&
        input.startDate === undefined &&
        input.endDate === undefined) {
      throw new Error('Pelo menos um campo deve ser informado para atualização');
    }
  }
}

// Export para uso em módulos ES6
export { UpdateEvent };
