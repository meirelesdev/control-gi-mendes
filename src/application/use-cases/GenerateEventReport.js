/**
 * Caso de Uso: Gerar Relatório de Fechamento
 * Gera dados estruturados para relatório de prestação de contas do evento
 * 
 * Separa as transações conforme exigências do contrato:
 * - Serviços Prestados (honorários): Diárias e Horas Extras
 * - Custos de Insumos: Todas as despesas reembolsáveis
 * - Deslocamentos: KM Rodados (combustível)
 */
import { DEFAULT_VALUES } from '../../domain/constants/DefaultValues.js';
import { Settings } from '../../domain/entities/Settings.js';

class GenerateEventReport {
  constructor(eventRepository, transactionRepository, settingsRepository) {
    if (!eventRepository) {
      throw new Error('EventRepository é obrigatório');
    }
    if (!transactionRepository) {
      throw new Error('TransactionRepository é obrigatório');
    }
    if (!settingsRepository) {
      throw new Error('SettingsRepository é obrigatório');
    }
    
    this.eventRepository = eventRepository;
    this.transactionRepository = transactionRepository;
    this.settingsRepository = settingsRepository;
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

      // Busca configurações para obter dados da CONTRATADA
      let settings = await this.settingsRepository.find();
      if (!settings) {
        settings = Settings.createDefault();
      }

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
          contractorInfo: {
            name: settings.contractorName,
            cnpj: settings.contractorCNPJ,
            address: settings.contractorAddress,
            representative: settings.contractorRepresentative,
            cpf: settings.contractorCPF
          },
          paymentInfo: {
            pixKey: settings.contractorPixKey,
            beneficiary: settings.contractorRepresentative,
            paymentDays: settings.defaultReimbursementDays,
            emails: settings.contractorEmails
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
   * Extrai deslocamentos: KM Rodado (combustível)
   * Conforme contrato: "Relatório de custos de deslocamentos"
   * @private
   */
  _extractTravel(transactions) {
    return transactions
      .filter(t => 
        t.type === 'INCOME' && 
        t.metadata.category === 'km'
      )
      .map(t => ({
        id: t.id,
        description: t.description,
        distance: t.metadata.distance || 0,
        origin: t.metadata.origin || null,
        destination: t.metadata.destination || null,
        amount: t.amount,
        createdAt: t.createdAt
      }))
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  }
}

// Export para uso em módulos ES6
export { GenerateEventReport };
