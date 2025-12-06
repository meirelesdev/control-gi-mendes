/**
 * Use Case: Import Data
 * Restaura dados de um backup JSON
 */
import { Event } from '../../../domain/entities/Event.js';
import { Transaction } from '../../../domain/entities/Transaction.js';
import { Settings } from '../../../domain/entities/Settings.js';

export class ImportData {
  constructor(eventRepository, transactionRepository, settingsRepository) {
    this.eventRepository = eventRepository;
    this.transactionRepository = transactionRepository;
    this.settingsRepository = settingsRepository;
  }

  /**
   * Valida a estrutura do backup
   * @param {Object} data - Dados do backup
   * @throws {Error} Se a estrutura for inválida
   */
  _validateBackupStructure(data) {
    if (!data || typeof data !== 'object') {
      throw new Error('Arquivo de backup inválido: estrutura não reconhecida');
    }

    if (!data.version) {
      throw new Error('Arquivo de backup inválido: versão não encontrada');
    }

    if (!Array.isArray(data.events)) {
      throw new Error('Arquivo de backup inválido: eventos não encontrados');
    }

    if (!Array.isArray(data.transactions)) {
      throw new Error('Arquivo de backup inválido: transações não encontradas');
    }

    if (!data.settings || typeof data.settings !== 'object') {
      throw new Error('Arquivo de backup inválido: configurações não encontradas');
    }
  }

  /**
   * Executa a importação de dados
   * @param {string|Object} backupData - String JSON ou objeto com os dados do backup
   * @returns {Promise<void>}
   */
  async execute(backupData) {
    try {
      // Parse se for string
      let data;
      if (typeof backupData === 'string') {
        data = JSON.parse(backupData);
      } else {
        data = backupData;
      }

      // Valida estrutura
      this._validateBackupStructure(data);

      // Limpa dados atuais e restaura backup
      // Importante: Substitui completamente os dados atuais
      
      // Limpa eventos
      const currentEvents = await this.eventRepository.findAll();
      for (const event of currentEvents) {
        await this.eventRepository.delete(event.id);
      }

      // Limpa transações
      const currentTransactions = await this.transactionRepository.findAll();
      for (const transaction of currentTransactions) {
        await this.transactionRepository.delete(transaction.id);
      }

      // Restaura eventos (usa restore para criar instâncias de entidades)
      for (const eventData of data.events) {
        const event = Event.restore(eventData);
        await this.eventRepository.save(event);
      }

      // Restaura transações (usa restore para criar instâncias de entidades)
      for (const transactionData of data.transactions) {
        const transaction = Transaction.restore(transactionData);
        await this.transactionRepository.save(transaction);
      }

      // Restaura configurações (usa restore para criar instância de Settings)
      const settings = Settings.restore(data.settings);
      await this.settingsRepository.save(settings);

      return {
        eventsCount: data.events.length,
        transactionsCount: data.transactions.length,
        exportDate: data.exportDate
      };
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error('Arquivo de backup inválido: formato JSON incorreto');
      }
      throw new Error(`Erro ao importar dados: ${error.message}`);
    }
  }
}

