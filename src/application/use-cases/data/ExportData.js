/**
 * Use Case: Export Data
 * Exporta todos os dados do sistema para um arquivo JSON de backup
 */
export class ExportData {
  constructor(eventRepository, transactionRepository, settingsRepository) {
    this.eventRepository = eventRepository;
    this.transactionRepository = transactionRepository;
    this.settingsRepository = settingsRepository;
  }

  /**
   * Executa a exportação de dados
   * @returns {Promise<Object>} Objeto com todos os dados do sistema
   */
  /**
   * Converte entidade para objeto simples (para serialização JSON)
   * @param {Object} entity - Instância de entidade
   * @returns {Object} Objeto simples
   * @private
   */
  _entityToPlainObject(entity) {
    if (!entity) return null;
    // Cria um objeto simples com todas as propriedades da entidade
    return { ...entity };
  }

  async execute() {
    try {
      // Busca todos os dados
      const events = await this.eventRepository.findAll();
      const transactions = await this.transactionRepository.findAll();
      const settings = await this.settingsRepository.find();

      // Converte entidades para objetos simples (garante serialização correta)
      const eventsData = (events || []).map(event => this._entityToPlainObject(event));
      const transactionsData = (transactions || []).map(transaction => this._entityToPlainObject(transaction));
      const settingsData = settings ? this._entityToPlainObject(settings) : {};

      // Estrutura do backup
      const backupData = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        events: eventsData,
        transactions: transactionsData,
        settings: settingsData
      };

      return backupData;
    } catch (error) {
      throw new Error(`Erro ao exportar dados: ${error.message}`);
    }
  }
}

