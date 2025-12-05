/**
 * Caso de Uso: Adicionar Transação
 * Adiciona uma transação (gasto ou ganho) a um evento
 * 
 * Para transações de KM ou Tempo de Viagem, calcula automaticamente
 * o valor monetário usando as configurações atuais (Settings)
 * 
 * NOTA: Usa import dinâmico para evitar problemas de cache do navegador
 */

class AddTransaction {
  constructor(transactionRepository, eventRepository, settingsRepository) {
    if (!transactionRepository) {
      throw new Error('TransactionRepository é obrigatório');
    }
    if (!eventRepository) {
      throw new Error('EventRepository é obrigatório');
    }
    if (!settingsRepository) {
      throw new Error('SettingsRepository é obrigatório');
    }

    this.transactionRepository = transactionRepository;
    this.eventRepository = eventRepository;
    this.settingsRepository = settingsRepository;
  }

  /**
   * Executa o caso de uso
   * @param {Object} input - Dados de entrada
   * @param {string} input.eventId - ID do evento
   * @param {string} input.type - Tipo da transação ('EXPENSE' ou 'INCOME')
   * @param {string} input.description - Descrição da transação
   * @param {number} [input.amount] - Valor monetário (obrigatório para EXPENSE e INCOME, exceto KM/Tempo)
   * @param {boolean} [input.hasReceipt] - Se tem nota fiscal (apenas para EXPENSE)
   * @param {boolean} [input.isReimbursement] - Se é reembolso (apenas para INCOME)
   * @param {string} [input.category] - Categoria (apenas para INCOME: 'diaria', 'hora_extra', 'km', 'tempo_viagem')
   * @param {number} [input.distance] - Distância em KM (apenas para category='km')
   * @param {number} [input.hours] - Horas de viagem (apenas para category='tempo_viagem')
   * @returns {Promise<Object>} - Resultado com transação criada ou erro
   */
  async execute(input) {
    try {
      // Validação de entrada
      this._validateInput(input);

      // Verifica se o evento existe
      const event = await this.eventRepository.findById(input.eventId);
      if (!event) {
        throw new Error('Evento não encontrado');
      }

      // Regra de negócio: Não pode adicionar transações em eventos finalizados/pagos
      if (event.status === 'PAID') {
        throw new Error(
          'Não é possível adicionar transações em eventos finalizados/pagos. ' +
          'Eventos com status "Finalizado/Pago" não podem ser alterados.'
        );
      }

      // Importa Transaction dinamicamente para garantir que está disponível
      // Usa cache global para evitar recarregamentos desnecessários
      let TransactionClass;
      
      // Verifica se já temos Transaction em cache global
      if (window._TransactionCache) {
        console.log('✅ Usando Transaction do cache global');
        TransactionClass = window._TransactionCache;
      } else {
        const modulePath = '../../domain/entities/Transaction.js';
        
        console.log('🔄 Tentando carregar Transaction pela primeira vez...');
        
        try {
          // Primeira tentativa: import normal
          console.log('📦 Importando Transaction (tentativa 1)...');
          const TransactionModule = await import(modulePath);
          TransactionClass = TransactionModule?.Transaction;
          
          console.log('📦 Resultado do import:', {
            hasTransaction: !!TransactionClass,
            moduleKeys: Object.keys(TransactionModule || {}),
            moduleType: typeof TransactionModule
          });
          
          // Se não encontrou, tenta novamente após um pequeno delay
          if (!TransactionClass) {
            console.warn('⚠️ Transaction não encontrado na primeira tentativa, tentando novamente...');
            await new Promise(resolve => setTimeout(resolve, 100));
            console.log('📦 Importando Transaction (tentativa 2)...');
            const TransactionModule2 = await import(modulePath);
            TransactionClass = TransactionModule2?.Transaction;
            console.log('📦 Resultado do import (tentativa 2):', {
              hasTransaction: !!TransactionClass,
              moduleKeys: Object.keys(TransactionModule2 || {})
            });
          }
          
          // Valida se TransactionClass está correto
          if (!TransactionClass) {
            const moduleKeys = Object.keys(TransactionModule || {});
            console.error('❌ Transaction não encontrado. Chaves do módulo:', moduleKeys);
            console.error('❌ Módulo completo:', TransactionModule);
            throw new Error(`Transaction não foi exportado corretamente. Chaves disponíveis no módulo: ${moduleKeys.join(', ')}`);
          }
          
          // Valida se os métodos necessários existem
          if (typeof TransactionClass.createExpense !== 'function') {
            const methods = Object.getOwnPropertyNames(TransactionClass).filter(
              name => typeof TransactionClass[name] === 'function'
            );
            console.error('❌ Transaction.createExpense não é função. Métodos disponíveis:', methods);
            console.error('❌ TransactionClass completo:', TransactionClass);
            throw new Error(`Transaction.createExpense não é uma função. Métodos disponíveis: ${methods.join(', ')}`);
          }
          
          // Salva no cache global para próximas vezes
          window._TransactionCache = TransactionClass;
          
          console.log('✅ Transaction carregado e cacheado com sucesso:', {
            hasCreateExpense: typeof TransactionClass.createExpense === 'function',
            hasCreateIncome: typeof TransactionClass.createIncome === 'function',
            hasCreateKmIncome: typeof TransactionClass.createKmIncome === 'function',
            constructor: TransactionClass.name || 'Anonymous'
          });
        } catch (importError) {
          console.error('❌ Erro ao importar Transaction:', importError);
          console.error('📋 Detalhes completos do erro:', {
            message: importError.message,
            stack: importError.stack,
            name: importError.name,
            modulePath: modulePath,
            error: importError,
            errorType: typeof importError
          });
          
          // Mensagem de erro mais útil
          let errorMsg = `Erro ao carregar Transaction: ${importError.message}`;
          if (importError.message.includes('Failed to fetch') || importError.message.includes('404')) {
            errorMsg += '\n\nO arquivo Transaction.js pode não estar acessível. Verifique se o arquivo existe em: src/domain/entities/Transaction.js';
          } else if (importError.message.includes('Unexpected token')) {
            errorMsg += '\n\nPode haver um erro de sintaxe no arquivo Transaction.js. Verifique o console para mais detalhes.';
          } else {
            errorMsg += '\n\nTente limpar o cache do navegador (Ctrl+Shift+Delete) e recarregar a página (F5).';
          }
          
          throw new Error(errorMsg);
        }
      }

      let transaction;

      if (input.type === 'EXPENSE') {
        // Cria transação do tipo EXPENSE
        transaction = TransactionClass.createExpense(
          input.eventId,
          input.description,
          input.amount,
          input.hasReceipt || false
        );
      } else if (input.type === 'INCOME') {
        // Para INCOME, verifica se precisa calcular valor automaticamente
        if (input.category === 'km') {
          // Transação de KM - calcula valor automaticamente
          if (!input.distance && input.distance !== 0) {
            throw new Error('Distância é obrigatória para transações de KM');
          }
          const settings = await this._getSettings();
          transaction = TransactionClass.createKmIncome(
            input.eventId,
            input.description,
            input.distance,
            settings.rateKm,
            input.isReimbursement !== undefined ? input.isReimbursement : true
          );
        } else if (input.category === 'tempo_viagem') {
          // Transação de Tempo de Viagem - calcula valor automaticamente
          if (!input.hours && input.hours !== 0) {
            throw new Error('Horas de viagem são obrigatórias para transações de tempo de viagem');
          }
          const settings = await this._getSettings();
          transaction = TransactionClass.createTravelTimeIncome(
            input.eventId,
            input.description,
            input.hours,
            settings.rateTravelTime,
            input.isReimbursement !== undefined ? input.isReimbursement : true
          );
        } else {
          // Outras receitas (diária, hora extra) - valor deve ser informado
          if (!input.amount && input.amount !== 0) {
            throw new Error('Valor é obrigatório para este tipo de transação');
          }
          transaction = TransactionClass.createIncome(
            input.eventId,
            input.description,
            input.amount,
            input.isReimbursement !== undefined ? input.isReimbursement : false,
            input.category || null
          );
        }
      }

      // Salva a transação
      const savedTransaction = await this.transactionRepository.save(transaction);

      return {
        success: true,
        data: savedTransaction
      };
    } catch (error) {
      // Log detalhado do erro para debug
      console.error('Erro em AddTransaction.execute:', {
        message: error.message,
        stack: error.stack,
        input: input,
        errorType: typeof error,
        errorName: error.name
      });
      
      // Mensagem de erro mais amigável
      let errorMessage = error.message || 'Erro desconhecido ao processar transação';
      
      // Tratamento específico para erros relacionados a Transaction
      if (error.message && (
        error.message.includes('Transaction') || 
        error.message.includes('transaction') ||
        error.name === 'ReferenceError' && error.message.includes('Transaction')
      )) {
        errorMessage = 'Erro ao processar transação. Por favor, recarregue a página (F5) e tente novamente. Se o problema persistir, limpe o cache do navegador (Ctrl+Shift+Delete).';
        
        // Log adicional para debug
        console.error('🔍 Erro relacionado a Transaction detectado:', {
          message: error.message,
          name: error.name,
          stack: error.stack
        });
      }
      
      // GARANTE que nunca vai gerar um alert nativo
      // O erro já está sendo tratado e retornado como objeto de resultado
      // O código que chama este método deve tratar o resultado, não lançar exceção
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Obtém as configurações atuais (cria padrão se não existir)
   * @private
   */
  async _getSettings() {
    let settings = await this.settingsRepository.find();
    if (!settings) {
      // Se não existir, cria com valores padrão
      // Importa Settings dinamicamente para evitar problemas de cache
      try {
        const modulePath = '../../domain/entities/Settings.js';
        const SettingsModule = await import(modulePath);
        let SettingsClass = SettingsModule?.Settings;
        
        // Se não encontrou, tenta novamente após um pequeno delay
        if (!SettingsClass) {
          await new Promise(resolve => setTimeout(resolve, 100));
          const SettingsModule2 = await import(modulePath);
          SettingsClass = SettingsModule2?.Settings;
        }
        
        if (!SettingsClass || typeof SettingsClass.createDefault !== 'function') {
          const moduleKeys = Object.keys(SettingsModule || {});
          throw new Error(`Settings não pôde ser carregado corretamente. Chaves disponíveis: ${moduleKeys.join(', ')}`);
        }
        
        settings = SettingsClass.createDefault();
        await this.settingsRepository.save(settings);
      } catch (importError) {
        console.error('Erro ao importar Settings:', importError);
        throw new Error(`Erro ao carregar configurações: ${importError.message}`);
      }
    }
    return settings;
  }

  /**
   * Valida os dados de entrada
   * @private
   */
  _validateInput(input) {
    if (!input) {
      throw new Error('Dados de entrada são obrigatórios');
    }
    if (!input.eventId) {
      throw new Error('ID do evento é obrigatório');
    }
    if (!input.type || !['EXPENSE', 'INCOME'].includes(input.type)) {
      throw new Error('Tipo da transação deve ser EXPENSE ou INCOME');
    }
    if (!input.description || typeof input.description !== 'string' || input.description.trim() === '') {
      throw new Error('Descrição da transação é obrigatória');
    }

    // Validações específicas por tipo
    if (input.type === 'EXPENSE') {
      if (input.amount === undefined || input.amount === null) {
        throw new Error('Valor é obrigatório para transações do tipo EXPENSE');
      }
    }

    if (input.type === 'INCOME') {
      // Para KM e Tempo de Viagem, não precisa validar amount aqui
      // pois será calculado automaticamente
      if (input.category && !['diaria', 'hora_extra', 'km', 'tempo_viagem'].includes(input.category)) {
        throw new Error('Categoria inválida. Deve ser: diaria, hora_extra, km ou tempo_viagem');
      }
    }
  }
}

// Export para uso em módulos ES6
export { AddTransaction };

