/**
 * Caso de Uso: Gerar Relatório de Fechamento
 * Gera dados estruturados para relatório de prestação de contas do evento
 * 
 * Separa as transações conforme exigências do contrato:
 * - Serviços (honorários): Diárias e Horas Extras
 * - Insumos (despesas reembolsáveis): Todas as despesas
 * - Deslocamento: KM e Tempo de Viagem
 */
class GenerateEventReport {
  constructor(eventRepository, transactionRepository) {
    if (!eventRepository) {
      throw new Error('EventRepository é obrigatório');
    }
    if (!transactionRepository) {
      throw new Error('TransactionRepository é obrigatório');
    }
    
    this.eventRepository = eventRepository;
    this.transactionRepository = transactionRepository;
  }

  /**
   * Executa o caso de uso
   * @param {string} eventId - ID do evento
   * @returns {Promise<Object>} - Dados estruturados do relatório
   */
  async execute(eventId) {
    try {
      // Validação de entrada
      if (!eventId || typeof eventId !== 'string' || eventId.trim() === '') {
        throw new Error('ID do evento é obrigatório');
      }

      // Busca o evento
      const event = await this.eventRepository.findById(eventId);
      if (!event) {
        throw new Error('Evento não encontrado');
      }

      // Busca todas as transações do evento
      const transactions = await this.transactionRepository.findByEventId(eventId);

      // Separa as transações conforme o contrato
      const services = this._extractServices(transactions);
      const expenses = this._extractExpenses(transactions);
      const travel = this._extractTravel(transactions);

      // Calcula totais
      const totalServices = services.reduce((sum, s) => sum + s.amount, 0);
      const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
      const totalTravel = travel.reduce((sum, t) => sum + t.amount, 0);
      const grandTotal = totalServices + totalExpenses + totalTravel;

      return {
        success: true,
        data: {
          header: {
            eventId: event.id,
            eventName: event.name,
            eventDate: event.date,
            eventDescription: event.description || '',
            generatedAt: new Date().toISOString()
          },
          services: {
            items: services,
            total: totalServices
          },
          expenses: {
            items: expenses,
            total: totalExpenses
          },
          travel: {
            items: travel,
            total: totalTravel
          },
          summary: {
            totalServices,
            totalExpenses,
            totalTravel,
            grandTotal
          }
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Extrai serviços (honorários): Diárias e Horas Extras
   * @private
   */
  _extractServices(transactions) {
    return transactions
      .filter(t => 
        t.type === 'INCOME' && 
        (t.metadata.category === 'diaria' || t.metadata.category === 'hora_extra')
      )
      .map(t => ({
        id: t.id,
        description: t.description,
        category: t.metadata.category === 'diaria' ? 'Diária' : 'Hora Extra',
        amount: t.amount,
        createdAt: t.createdAt
      }))
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  }

  /**
   * Extrai despesas reembolsáveis (Insumos)
   * @private
   */
  _extractExpenses(transactions) {
    return transactions
      .filter(t => t.type === 'EXPENSE')
      .map(t => ({
        id: t.id,
        description: t.description,
        amount: t.amount,
        hasReceipt: t.metadata.hasReceipt || false,
        createdAt: t.createdAt
      }))
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  }

  /**
   * Extrai deslocamentos: KM e Tempo de Viagem
   * @private
   */
  _extractTravel(transactions) {
    return transactions
      .filter(t => 
        t.type === 'INCOME' && 
        (t.metadata.category === 'km' || t.metadata.category === 'tempo_viagem')
      )
      .map(t => ({
        id: t.id,
        description: t.description,
        category: t.metadata.category === 'km' ? 'KM Rodado' : 'Tempo de Viagem',
        amount: t.amount,
        createdAt: t.createdAt
      }))
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  }
}

// Export para uso em módulos ES6
export { GenerateEventReport };
