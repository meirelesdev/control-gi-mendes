/**
 * Utilitários de Formatação - Chef Finance
 * Centraliza todas as funções de formatação para evitar duplicação (DRY)
 */
class Formatters {
  /**
   * Formata um valor numérico como moeda brasileira (BRL)
   * @param {number} value - Valor a ser formatado
   * @returns {string} - Valor formatado (ex: "R$ 1.234,56")
   */
  static currency(value) {
    if (value === null || value === undefined || isNaN(value)) {
      return 'R$ 0,00';
    }
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  }

  /**
   * Formata uma data para formato brasileiro longo
   * @param {string|Date} dateString - Data a ser formatada
   * @returns {string} - Data formatada (ex: "15 de dezembro de 2024")
   */
  static dateLong(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    }).format(date);
  }

  /**
   * Formata uma data para formato brasileiro curto
   * @param {string|Date} dateString - Data a ser formatada
   * @returns {string} - Data formatada (ex: "15 de dez de 2024")
   */
  static dateShort(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(date);
  }

  /**
   * Escapa HTML para prevenir XSS
   * @param {string} text - Texto a ser escapado
   * @returns {string} - Texto escapado
   */
  static escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Export para uso em módulos ES6
export { Formatters };

