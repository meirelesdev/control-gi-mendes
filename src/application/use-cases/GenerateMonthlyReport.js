/**
 * Caso de Uso: Gerar Relatório Mensal
 * Gera dados estruturados para relatório de prestação de contas mensal
 * 
 * Conforme contrato, a entrega dos relatórios deve ser MENSAL.
 * Agrupa todos os eventos do mês em um único relatório.
 */
import { DEFAULT_VALUES } from '../../domain/constants/DefaultValues.js';

class GenerateMonthlyReport {
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
   * @param {number} month - Mês (1-12)
   * @param {number} year - Ano (ex: 2024)
   * @returns {Promise<Object>} - Dados estruturados do relatório mensal
   */
  async execute(month, year) {
    try {
      // Validação de entrada
      if (!month || month < 1 || month > 12) {
        throw new Error('Mês deve ser um número entre 1 e 12');
      }
      if (!year || year < 2000 || year > 2100) {
        throw new Error('Ano inválido');
      }

      // Calcula início e fim do mês
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59, 999); // Último dia do mês

      // Busca todos os eventos do mês (não cancelados)
      const allEvents = await this.eventRepository.findAll({
        orderBy: 'date',
        order: 'asc'
      });

      // Filtra eventos do mês específico e não cancelados
      const monthEvents = allEvents.filter(event => {
        const eventDate = new Date(event.date);
        return eventDate >= startDate && 
               eventDate <= endDate && 
               event.status !== 'CANCELLED';
      });

      // Agrupa todas as transações de todos os eventos do mês
      let allServices = [];
      let allExpenses = [];
      let allTravel = [];

      for (const event of monthEvents) {
        const transactions = await this.transactionRepository.findByEventId(event.id);
        
        // Extrai serviços, despesas e deslocamentos
        const services = this._extractServices(transactions, event);
        const expenses = this._extractExpenses(transactions, event);
        const travel = this._extractTravel(transactions, event);
        
        allServices = allServices.concat(services);
        allExpenses = allExpenses.concat(expenses);
        allTravel = allTravel.concat(travel);
      }

      // Calcula totais
      const totalServices = allServices.reduce((sum, s) => sum + s.amount, 0);
      const totalExpenses = allExpenses.reduce((sum, e) => sum + e.amount, 0);
      const totalTravel = allTravel.reduce((sum, t) => sum + t.amount, 0);
      const grandTotal = totalServices + totalExpenses + totalTravel;

      // Nome do mês em português
      const monthNames = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
      ];

      return {
        success: true,
        data: {
          header: {
            month,
            monthName: monthNames[month - 1],
            year,
            period: `${monthNames[month - 1]} de ${year}`,
            eventsCount: monthEvents.length,
            generatedAt: new Date().toISOString()
          },
          paymentInfo: {
            pixKey: '48988321351',
            beneficiary: 'Gisele Mendes',
            paymentDays: DEFAULT_VALUES.DEFAULT_REIMBURSEMENT_DAYS
          },
          events: monthEvents.map(event => ({
            id: event.id,
            name: event.name,
            date: event.date,
            status: event.status
          })),
          services: {
            items: allServices,
            total: totalServices
          },
          expenses: {
            items: allExpenses,
            total: totalExpenses
          },
          travel: {
            items: allTravel,
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
  _extractServices(transactions, event) {
    return transactions
      .filter(t => 
        t.type === 'INCOME' && 
        (t.metadata.category === 'diaria' || t.metadata.category === 'hora_extra')
      )
      .map(t => ({
        id: t.id,
        eventId: event.id,
        eventName: event.name,
        eventDate: event.date,
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
  _extractExpenses(transactions, event) {
    return transactions
      .filter(t => t.type === 'EXPENSE')
      .map(t => ({
        id: t.id,
        eventId: event.id,
        eventName: event.name,
        eventDate: event.date,
        description: t.description,
        amount: t.amount,
        hasReceipt: t.metadata.hasReceipt || false,
        createdAt: t.createdAt
      }))
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  }

  /**
   * Extrai deslocamentos: KM Rodado (combustível)
   * @private
   */
  _extractTravel(transactions, event) {
    return transactions
      .filter(t => 
        t.type === 'INCOME' && 
        t.metadata.category === 'km'
      )
      .map(t => ({
        id: t.id,
        eventId: event.id,
        eventName: event.name,
        eventDate: event.date,
        description: t.description,
        category: t.metadata.category === 'km' ? 'KM Rodado' : 'Tempo de Viagem',
        amount: t.amount,
        origin: t.metadata.origin || null,
        destination: t.metadata.destination || null,
        createdAt: t.createdAt
      }))
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  }
}

// Export para uso em módulos ES6
export { GenerateMonthlyReport };

