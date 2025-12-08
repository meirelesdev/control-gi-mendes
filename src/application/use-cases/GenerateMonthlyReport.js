/**
 * Caso de Uso: Gerar Relatório Mensal
 * Gera dados estruturados para relatório de prestação de contas mensal
 * 
 * Conforme contrato, a entrega dos relatórios deve ser MENSAL.
 * Agrupa todos os eventos do mês em um único relatório.
 */
import { DEFAULT_VALUES } from '../../domain/constants/DefaultValues.js';
import { Settings } from '../../domain/entities/Settings.js';

class GenerateMonthlyReport {
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

      // Busca configurações para obter dados da CONTRATADA e calcular horas
      let settings = await this.settingsRepository.find();
      if (!settings) {
        settings = Settings.createDefault();
      }

      // Agrupa todas as transações de todos os eventos do mês
      let allServices = [];
      let allExpenses = [];
      let allTravel = [];

      for (const event of monthEvents) {
        const transactions = await this.transactionRepository.findByEventId(event.id);
        
        // Extrai serviços, despesas e deslocamentos
        const services = this._extractServices(transactions, event, settings);
        const expenses = this._extractExpenses(transactions, event);
        const travel = this._extractTravel(transactions, event);
        
        allServices = allServices.concat(services);
        allExpenses = allExpenses.concat(expenses);
        allTravel = allTravel.concat(travel);
      }

      // Calcula totais básicos
      const totalServices = allServices.reduce((sum, s) => sum + s.amount, 0);
      const totalExpenses = allExpenses.reduce((sum, e) => sum + e.amount, 0);
      const totalTravel = allTravel.reduce((sum, t) => sum + t.amount, 0);
      const grandTotal = totalServices + totalExpenses + totalTravel;

      // Calcula horas de trabalho a partir dos serviços
      const totalWorkHours = allServices.reduce((sum, s) => sum + (s.hours || 0), 0);

      // Horas de deslocamento (tempo_viagem)
      const tempoViagemItems = allTravel.filter(t => t.category === 'tempo_viagem');
      const totalTravelHours = tempoViagemItems.reduce((sum, t) => sum + (t.hours || 0), 0);

      // Calcula totais específicos para o resumo executivo (mesmo padrão do relatório de eventos)
      // Valor total da diária (Honorários) = Horas de Trabalho + Horas de Deslocamento
      const totalDailyValue = allServices.reduce((sum, s) => sum + s.amount, 0) + // Honorários (horas de trabalho)
        tempoViagemItems.reduce((sum, t) => sum + t.amount, 0); // Tempo de Viagem
      const totalFuel = allTravel.filter(t => t.category === 'km').reduce((sum, t) => sum + t.amount, 0); // KM Rodado (apenas KM, não tempo_viagem)
      const totalPurchases = allExpenses.filter(e => e.category !== 'accommodation').reduce((sum, e) => sum + e.amount, 0); // Compras
      const totalHotel = allExpenses.filter(e => e.category === 'accommodation').reduce((sum, e) => sum + e.amount, 0); // Hospedagem

      // Total de horas
      const totalHours = totalWorkHours + totalTravelHours;

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
          events: await Promise.all(monthEvents.map(async event => {
            // Calcula horas totais do evento (horas de trabalho + horas de deslocamento)
            const eventTransactions = await this.transactionRepository.findByEventId(event.id);
            const eventServices = this._extractServices(eventTransactions, event, settings);
            const eventTravel = this._extractTravel(eventTransactions, event);
            
            // Horas de trabalho (diárias + hora_extra)
            const workHours = eventServices
              .filter(s => s.category === 'Diária' || s.category === 'Horas de Trabalho')
              .reduce((sum, s) => sum + (s.hours || 0), 0);
            
            // Horas de deslocamento (tempo_viagem)
            const travelHours = eventTravel
              .filter(t => t.category === 'tempo_viagem')
              .reduce((sum, t) => sum + (t.hours || 0), 0);
            
            const totalHours = workHours + travelHours;
            
            return {
              id: event.id,
              name: event.name,
              date: event.date,
              status: event.status,
              city: event.city || '',
              totalHours: totalHours
            };
          })),
          services: {
            items: allServices,
            total: totalServices,
            totalHours: totalWorkHours
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
            grandTotal,
            // Resumo executivo (mesmo padrão do relatório de eventos)
            totalWorkHours,
            totalTravelHours,
            totalHours,
            totalDailyValue,
            totalFuel,
            totalPurchases,
            totalHotel
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
   * Extrai serviços (honorários): Horas de Trabalho e Tempo de Viagem
   * @private
   */
  _extractServices(transactions, event, settings) {
    return transactions
      .filter(t => 
        t.type === 'INCOME' && 
        (t.metadata.category === 'diaria' || t.metadata.category === 'hora_extra')
        // tempo_viagem NÃO é incluído aqui, vai para _extractTravel
      )
      .map(t => {
        const category = t.metadata.category;
        let hours = 0;
        let categoryLabel = 'Honorário';
        
        if (category === 'hora_extra') {
          hours = t.metadata.hours || (t.amount / (settings?.overtimeRate || DEFAULT_VALUES.OVERTIME_RATE));
          categoryLabel = 'Horas de Trabalho';
        } else if (category === 'diaria') {
          // Diária: usa horas do metadata se disponível, senão usa 4 horas padrão
          hours = t.metadata.hours || 4;
          categoryLabel = 'Diária';
        }
        
        return {
          id: t.id,
          eventId: event.id,
          eventName: event.name,
          eventDate: event.date,
          description: t.description,
          category: categoryLabel,
          hours: hours,
          amount: t.amount,
          createdAt: t.createdAt
        };
      })
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  }

  /**
   * Extrai despesas reembolsáveis (Compras e Hospedagem)
   * @private
   */
  _extractExpenses(transactions, event) {
    return transactions
      .filter(t => t.type === 'EXPENSE')
      .map(t => {
        const expense = {
          id: t.id,
          eventId: event.id,
          eventName: event.name,
          eventDate: event.date,
          description: t.description,
          amount: t.amount,
          hasReceipt: t.metadata.hasReceipt || false,
          createdAt: t.createdAt
        };
        
        // Adiciona categoria e informações de hospedagem se aplicável
        if (t.metadata.category === 'accommodation') {
          expense.category = 'accommodation';
          expense.checkIn = t.metadata.checkIn || null;
          expense.checkOut = t.metadata.checkOut || null;
          
          // Formata range de datas para exibição
          if (expense.checkIn && expense.checkOut) {
            const formatDateRange = (checkIn, checkOut) => {
              const parseDate = (dateStr) => {
                if (!dateStr) return null;
                const parts = dateStr.split('-');
                if (parts.length === 3) {
                  return `${parts[2]}/${parts[1]}`;
                }
                return dateStr;
              };
              const inDate = parseDate(checkIn);
              const outDate = parseDate(checkOut);
              return inDate && outDate ? `${inDate} a ${outDate}` : null;
            };
            expense.dateRange = formatDateRange(expense.checkIn, expense.checkOut);
          }
        }
        
        return expense;
      })
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  }

  /**
   * Extrai deslocamentos: KM Rodado (combustível) e Tempo de Viagem
   * @private
   */
  _extractTravel(transactions, event) {
    return transactions
      .filter(t => 
        t.type === 'INCOME' && 
        (t.metadata.category === 'km' || t.metadata.category === 'tempo_viagem')
      )
      .map(t => {
        const travel = {
          id: t.id,
          eventId: event.id,
          eventName: event.name,
          eventDate: event.date,
          description: t.description,
          amount: t.amount,
          createdAt: t.createdAt,
          category: t.metadata.category
        };
        
        if (t.metadata.category === 'km') {
          travel.distance = t.metadata.distance || 0;
          travel.origin = t.metadata.origin || null;
          travel.destination = t.metadata.destination || null;
        } else if (t.metadata.category === 'tempo_viagem') {
          travel.hours = t.metadata.hours || 0;
        }
        
        return travel;
      })
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  }
}

// Export para uso em módulos ES6
export { GenerateMonthlyReport };

