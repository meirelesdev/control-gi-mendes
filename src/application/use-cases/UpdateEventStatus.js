/**
 * Caso de Uso: Atualizar Status do Evento
 * Atualiza o status do evento e calcula data prevista de pagamento quando necessário
 */
class UpdateEventStatus {
  constructor(eventRepository, settingsRepository) {
    if (!eventRepository) {
      throw new Error('EventRepository é obrigatório');
    }
    if (!settingsRepository) {
      throw new Error('SettingsRepository é obrigatório');
    }
    
    this.eventRepository = eventRepository;
    this.settingsRepository = settingsRepository;
  }

  /**
   * Executa o caso de uso
   * @param {string} eventId - ID do evento
   * @param {string} newStatus - Novo status (PLANNED, DONE, REPORT_SENT, PAID)
   * @param {Date|string} [reportSentDate] - Data de envio do relatório (opcional, apenas para REPORT_SENT)
   * @returns {Promise<Object>} - Resultado com evento atualizado ou erro
   */
  async execute(eventId, newStatus, reportSentDate = null) {
    try {
      // Validação de entrada
      if (!eventId || typeof eventId !== 'string' || eventId.trim() === '') {
        throw new Error('ID do evento é obrigatório');
      }

      const validStatuses = ['PLANNED', 'DONE', 'REPORT_SENT', 'PAID'];
      if (!newStatus || !validStatuses.includes(newStatus)) {
        throw new Error(`Status inválido. Deve ser um dos: ${validStatuses.join(', ')}`);
      }

      // Busca o evento
      const event = await this.eventRepository.findById(eventId);
      if (!event) {
        throw new Error('Evento não encontrado');
      }

      // Se o novo status for REPORT_SENT, calcula a data prevista de pagamento
      if (newStatus === 'REPORT_SENT') {
        const settings = await this.settingsRepository.find();
        const reimbursementDays = settings?.defaultReimbursementDays || 21;
        const sentDate = reportSentDate || new Date();
        
        event.markAsReportSent(sentDate, reimbursementDays);
      } else {
        // Para outros status, apenas atualiza
        event.updateStatus(newStatus);
        
        // Se mudar para PAID, limpa a data prevista (já foi pago)
        if (newStatus === 'PAID') {
          event.expectedPaymentDate = null;
        }
      }

      // Salva o evento atualizado
      const savedEvent = await this.eventRepository.save(event);

      return {
        success: true,
        data: savedEvent,
        expectedPaymentDate: savedEvent.expectedPaymentDate || null
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
export { UpdateEventStatus };
