/**
 * Caso de Uso: Gerar Relatório de Fechamento
 * Gera dados estruturados para relatório de prestação de contas do evento
 * 
 * Separa as transações conforme exigências do contrato:
 * - Serviços Prestados (honorários): Diárias e Horas Extras
 * - Compras: Todas as despesas reembolsáveis (insumos + hospedagem)
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

      // Busca configurações para obter dados da CONTRATADA e calcular horas
      let settings = await this.settingsRepository.find();
      if (!settings) {
        settings = Settings.createDefault();
      }

      // Separa as transações conforme o contrato
      const services = this._extractServices(transactions, settings);
      const expenses = this._extractExpenses(transactions);
      const travel = this._extractTravel(transactions);

      // Calcula totais básicos
      const totalServices = services.reduce((sum, s) => sum + s.amount, 0);
      const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
      const totalTravel = travel.reduce((sum, t) => sum + t.amount, 0);
      
      // TOTAL A RECEBER = Tudo que será pago/reembolsado:
      // - Despesas (Compras + Hotel) - serão reembolsadas
      // - Honorários (Horas de Trabalho + Tempo de Viagem) - serão pagos
      // - KM Rodado - será reembolsado
      // Total = Despesas + Honorários + KM + Tempo Viagem
      // Mas Services já inclui apenas horas de trabalho (não inclui tempo_viagem)
      // E Travel inclui KM + tempo_viagem
      // Então: Total = Despesas + Services + Travel = R$ 1.425,70 + R$ 750,00 + R$ 684,60 = R$ 2.860,30
      const grandTotal = totalExpenses + totalServices + totalTravel;

      // Horas de deslocamento (tempo_viagem) - precisa ser calculado antes para usar no totalDailyValue
      const tempoViagemTransactions = transactions.filter(t => 
        t.type === 'INCOME' && t.metadata.category === 'tempo_viagem'
      );
      
      const totalTravelHours = tempoViagemTransactions.reduce((sum, t) => {
        if (t.metadata.hours) {
          return sum + t.metadata.hours;
        }
        return sum;
      }, 0);

      // Calcula horas de trabalho a partir dos serviços já extraídos
      const totalWorkHours = services.reduce((sum, s) => sum + (s.hours || 0), 0);

      // Calcula totais específicos para o resumo executivo
      // Valor total da diária (Honorários) = Horas de Trabalho + Horas de Deslocamento
      const totalDailyValue = services.reduce((sum, s) => sum + s.amount, 0) + // Diárias + Horas Extras
        tempoViagemTransactions.reduce((sum, t) => sum + t.amount, 0); // Tempo de Viagem
      const totalFuel = travel.filter(t => t.category === 'km').reduce((sum, t) => sum + t.amount, 0); // KM Rodado (apenas KM, não tempo_viagem)
      const totalPurchases = expenses
        .filter(e => e.category !== 'accommodation')
        .reduce((sum, e) => sum + e.amount, 0); // Compras (despesas que não são hospedagem)
      const totalHotel = expenses
        .filter(e => e.category === 'accommodation')
        .reduce((sum, e) => sum + e.amount, 0); // Hospedagem

      // Total de horas
      const totalHours = totalWorkHours + totalTravelHours;

      return {
        success: true,
        data: {
          header: {
            eventId: event.id,
            eventName: event.name,
            eventDate: event.date,
            startDate: event.startDate || event.date,
            endDate: event.endDate || event.date,
            eventDescription: event.description || '',
            client: event.client || '',
            city: event.city || '',
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
            total: totalServices,
            totalHours: totalWorkHours
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
            grandTotal,
            // Resumo executivo
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
   * Extrai serviços (honorários): Diárias e Horas Extras
   * @private
   */
  _extractServices(transactions, settings) {
    return transactions
      .filter(t => 
        t.type === 'INCOME' && 
        (t.metadata.category === 'diaria' || t.metadata.category === 'hora_extra')
      )
      .map(t => {
        const service = {
          id: t.id,
          description: t.description,
          category: t.metadata.category === 'diaria' ? 'Diária' : 'Hora Extra',
          amount: t.amount,
          createdAt: t.createdAt
        };
        
        // Para diárias: usa horas do metadata se disponível, senão usa 4 horas padrão
        if (t.metadata.category === 'diaria') {
          service.hours = t.metadata.hours || 4;
        }
        // Para horas extras: tenta extrair do metadata, senão calcula baseado no valor
        else if (t.metadata.category === 'hora_extra') {
          if (t.metadata.hours) {
            service.hours = t.metadata.hours;
          } else {
            // Calcula baseado no valor e taxa de hora extra
            service.hours = t.amount / (settings?.overtimeRate || DEFAULT_VALUES.OVERTIME_RATE);
          }
        }
        
        return service;
      })
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  }

  /**
   * Extrai despesas reembolsáveis (Compras)
   * @private
   */
  _extractExpenses(transactions) {
    return transactions
      .filter(t => t.type === 'EXPENSE')
      .map(t => {
        const expense = {
          id: t.id,
          description: t.description,
          amount: t.amount,
          hasReceipt: t.metadata.hasReceipt || false,
          createdAt: t.createdAt
        };
        
        // Se for hospedagem, adiciona informações de check-in/check-out
        if (t.metadata.category === 'accommodation') {
          expense.category = 'accommodation';
          expense.checkIn = t.metadata.checkIn || null;
          expense.checkOut = t.metadata.checkOut || null;
          
          // Formata as datas para exibição no relatório
          if (expense.checkIn && expense.checkOut) {
            const formatDate = (dateString) => {
              const date = new Date(dateString);
              if (isNaN(date.getTime())) return dateString;
              const day = String(date.getDate()).padStart(2, '0');
              const month = String(date.getMonth() + 1).padStart(2, '0');
              const year = date.getFullYear();
              return `${day}/${month}/${year}`;
            };
            
            expense.dateRange = `${formatDate(expense.checkIn)} a ${formatDate(expense.checkOut)}`;
          }
        }
        
        return expense;
      })
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  }

  /**
   * Extrai deslocamentos: KM Rodado (combustível) e Tempo de Viagem
   * Conforme contrato: "Relatório de custos de deslocamentos"
   * @private
   */
  _extractTravel(transactions) {
    return transactions
      .filter(t => 
        t.type === 'INCOME' && 
        (t.metadata.category === 'km' || t.metadata.category === 'tempo_viagem')
      )
      .map(t => {
        const travel = {
          id: t.id,
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
export { GenerateEventReport };
