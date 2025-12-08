/**
 * Use Case: Export Transactions to CSV
 * Exporta todas as transações para um arquivo CSV compatível com Excel Brasil
 */
export class ExportTransactionsToCSV {
  constructor(eventRepository, transactionRepository) {
    this.eventRepository = eventRepository;
    this.transactionRepository = transactionRepository;
  }

  /**
   * Formata uma data para formato brasileiro
   * @param {string} dateString - Data em formato ISO
   * @returns {string} Data formatada DD/MM/YYYY
   */
  _formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date);
  }

  /**
   * Formata valor monetário para formato brasileiro
   * @param {number} value - Valor numérico
   * @returns {string} Valor formatado R$ X.XXX,XX
   */
  _formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  }

  /**
   * Escapa caracteres especiais para CSV
   * @param {string} text - Texto a ser escapado
   * @returns {string} Texto escapado
   */
  _escapeCSV(text) {
    if (text === null || text === undefined) return '';
    const str = String(text);
    // Se contém ponto e vírgula, aspas ou quebra de linha, envolve em aspas
    if (str.includes(';') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }

  /**
   * Obtém o nome do evento pelo ID
   * @param {string} eventId - ID do evento
   * @returns {Promise<string>} Nome do evento
   */
  async _getEventName(eventId) {
    try {
      const event = await this.eventRepository.findById(eventId);
      return event ? event.name : 'Evento não encontrado';
    } catch (error) {
      return 'Evento não encontrado';
    }
  }

  /**
   * Obtém o tipo de transação formatado
   * @param {Object} transaction - Objeto de transação
   * @returns {string} Tipo formatado
   */
  _getTransactionType(transaction) {
    if (transaction.type === 'EXPENSE') {
      return 'Compra (Reembolso)';
    }

    if (transaction.type === 'INCOME') {
      const category = transaction.metadata?.category || '';
      const isReimbursement = transaction.metadata?.isReimbursement;

      if (category === 'km') {
        return 'KM Rodado';
      }
      if (category === 'diaria') {
        return 'Honorário - Diária';
      }
      if (category === 'hora_extra') {
        return 'Honorário - Hora Extra';
      }
      if (isReimbursement) {
        return 'Reembolso';
      }
      return 'Honorário';
    }

    return transaction.type;
  }

  /**
   * Executa a exportação para CSV
   * @returns {Promise<string>} String CSV formatada
   */
  async execute() {
    try {
      // Busca todas as transações
      const transactions = await this.transactionRepository.findAll();

      if (!transactions || transactions.length === 0) {
        return 'Data;Evento;Tipo;Descrição;Valor;Nota Fiscal;Origem;Destino\nNenhuma transação encontrada;;;;;;;';
      }

      // Ordena por data de criação (mais antigas primeiro)
      transactions.sort((a, b) => {
        const dateA = new Date(a.createdAt || 0);
        const dateB = new Date(b.createdAt || 0);
        return dateA - dateB;
      });

      // Cabeçalho CSV (usando ponto e vírgula para Excel Brasil)
      const headers = [
        'Data',
        'Evento',
        'Tipo',
        'Descrição',
        'Valor',
        'Nota Fiscal',
        'Origem',
        'Destino'
      ];

      let csv = headers.join(';') + '\n';

      // Processa cada transação
      for (const transaction of transactions) {
        const eventName = await this._getEventName(transaction.eventId);
        const date = this._formatDate(transaction.createdAt);
        const type = this._getTransactionType(transaction);
        const description = this._escapeCSV(transaction.description || '');
        const value = this._formatCurrency(transaction.amount || 0);

        // Nota Fiscal (apenas para despesas)
        let hasReceipt = '';
        if (transaction.type === 'EXPENSE') {
          hasReceipt = transaction.metadata?.hasReceipt ? 'Sim' : 'Não';
        }

        // Origem e Destino (apenas para KM)
        let origin = '';
        let destination = '';
        if (transaction.metadata?.category === 'km') {
          origin = this._escapeCSV(transaction.metadata.origin || '');
          destination = this._escapeCSV(transaction.metadata.destination || '');
        }

        // Monta linha CSV
        const row = [
          date,
          this._escapeCSV(eventName),
          type,
          description,
          value,
          hasReceipt,
          origin,
          destination
        ];

        csv += row.join(';') + '\n';
      }

      return csv;
    } catch (error) {
      throw new Error(`Erro ao exportar transações para CSV: ${error.message}`);
    }
  }
}

