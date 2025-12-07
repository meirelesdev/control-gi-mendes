/**
 * Caso de Uso: Atualizar Status do Evento
 * Atualiza o status do evento e calcula data prevista de pagamento quando necessário
 */
import { DEFAULT_VALUES } from '../../domain/constants/DefaultValues.js';

class UpdateEventStatus {
  constructor(eventRepository, settingsRepository, transactionRepository = null) {
    if (!eventRepository) {
      throw new Error('EventRepository é obrigatório');
    }
    if (!settingsRepository) {
      throw new Error('SettingsRepository é obrigatório');
    }
    
    this.eventRepository = eventRepository;
    this.settingsRepository = settingsRepository;
    this.transactionRepository = transactionRepository;
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

      // Regra de negócio: Evento com status PAID não pode ter seu status alterado
      if (event.status === 'PAID') {
        throw new Error(
          'Evento finalizado/pago não pode ter seu status alterado. ' +
          'Uma vez que o evento foi marcado como "Finalizado/Pago", não é possível alterar seu status.'
        );
      }

      // Regra de negócio: Não pode voltar de DONE (ou superior) para PLANNED
      if (newStatus === 'PLANNED' && event.status !== 'PLANNED') {
        const currentStatusLabel = this._getStatusLabel(event.status);
        throw new Error(
          `Não é possível voltar o status para "Planejando". ` +
          `Uma vez que o evento foi marcado como "${currentStatusLabel}", não é possível retornar ao status anterior.`
        );
      }

      // Regra de negócio: Não pode voltar de PAID para qualquer status anterior
      // (já validado acima, mas mantendo para clareza)
      // Regra de negócio: Não pode voltar de REPORT_SENT para DONE ou PLANNED
      if (event.status === 'REPORT_SENT' && (newStatus === 'DONE' || newStatus === 'PLANNED')) {
        throw new Error(
          'Não é possível voltar o status após "Relatório Enviado". ' +
          'Apenas avanços para "Finalizado/Pago" são permitidos.'
        );
      }

      // Regra de negócio: Não pode mudar de PLANNED para DONE sem ter pelo menos uma transação
      if (event.status === 'PLANNED' && newStatus === 'DONE') {
        if (!this.transactionRepository) {
          throw new Error('TransactionRepository não disponível para validação');
        }
        
        const transactions = await this.transactionRepository.findByEventId(eventId);
        if (!transactions || transactions.length === 0) {
          throw new Error(
            'Não é possível marcar o evento como "Realizado" sem ter pelo menos uma transação cadastrada. ' +
            'Adicione despesas, honorários ou KM/Viagem antes de alterar o status.'
          );
        }
      }

      // Se o novo status for REPORT_SENT, calcula a data prevista de pagamento
      if (newStatus === 'REPORT_SENT') {
        const settings = await this.settingsRepository.find();
        const reimbursementDays = settings?.defaultReimbursementDays || DEFAULT_VALUES.DEFAULT_REIMBURSEMENT_DAYS;
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
export { UpdateEventStatus };
