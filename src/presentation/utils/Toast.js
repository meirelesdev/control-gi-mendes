/**
 * Sistema de Toast - Mensagens Amigáveis
 * Substitui alerts por mensagens elegantes
 */
class Toast {
  constructor() {
    this.container = null;
    this.init();
  }

  init() {
    // Cria container se não existir
    if (!document.getElementById('toast-container')) {
      this.container = document.createElement('div');
      this.container.id = 'toast-container';
      this.container.className = 'toast-container';
      document.body.appendChild(this.container);
    } else {
      this.container = document.getElementById('toast-container');
    }
  }

  /**
   * Mostra uma mensagem de sucesso
   * @param {string} message - Mensagem a exibir
   * @param {number} duration - Duração em milissegundos (padrão: 3000)
   */
  success(message, duration = 3000) {
    this.show(message, 'success', duration);
  }

  /**
   * Mostra uma mensagem de erro
   * @param {string} message - Mensagem a exibir
   * @param {number} duration - Duração em milissegundos (padrão: 4000)
   */
  error(message, duration = 4000) {
    this.show(message, 'error', duration);
  }

  /**
   * Mostra uma mensagem de aviso
   * @param {string} message - Mensagem a exibir
   * @param {number} duration - Duração em milissegundos (padrão: 3000)
   */
  warning(message, duration = 3000) {
    this.show(message, 'warning', duration);
  }

  /**
   * Mostra uma mensagem informativa
   * @param {string} message - Mensagem a exibir
   * @param {number} duration - Duração em milissegundos (padrão: 3000)
   */
  info(message, duration = 3000) {
    this.show(message, 'info', duration);
  }

  /**
   * Mostra o toast
   * @private
   */
  show(message, type = 'info', duration = 3000) {
    if (!this.container) {
      this.init();
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    // Ícone baseado no tipo
    const icons = {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ℹ'
    };

    toast.innerHTML = `
      <div class="toast-content">
        <span class="toast-icon">${icons[type] || 'ℹ'}</span>
        <span class="toast-message">${this.escapeHtml(message)}</span>
        <button class="toast-close" aria-label="Fechar">×</button>
      </div>
    `;

    this.container.appendChild(toast);

    // Anima entrada
    setTimeout(() => {
      toast.classList.add('toast-show');
    }, 10);

    // Event listener para fechar
    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', () => {
      this.remove(toast);
    });

    // Remove automaticamente após duração
    if (duration > 0) {
      setTimeout(() => {
        this.remove(toast);
      }, duration);
    }

    return toast;
  }

  /**
   * Remove o toast
   * @private
   */
  remove(toast) {
    toast.classList.remove('toast-show');
    toast.classList.add('toast-hide');
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }

  /**
   * Escapa HTML para prevenir XSS
   * @private
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Exporta instância singleton
export const toast = new Toast();
