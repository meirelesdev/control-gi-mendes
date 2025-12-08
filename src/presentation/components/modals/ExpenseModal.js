/**
 * Componente Modal: Adicionar Compra (Despesa)
 * Encapsula a lógica do modal de adicionar despesa
 */
import { Formatters } from '../../utils/Formatters.js';

class ExpenseModal {
  constructor(addTransactionUseCase, eventRepository, currentEventId, onSuccess) {
    this.addTransactionUseCase = addTransactionUseCase;
    this.eventRepository = eventRepository;
    this.currentEventId = currentEventId;
    this.onSuccess = onSuccess; // Callback chamado após sucesso
  }

  /**
   * Exibe o modal
   */
  async show() {
    // Valida se o evento não está finalizado
    if (this.currentEventId) {
      const event = await this.eventRepository.findById(this.currentEventId);
      if (event && event.status === 'PAID') {
        window.toast?.error('Não é possível adicionar transações em eventos finalizados/pagos.');
        return null;
      }
    }

    const modal = this._createModal('Adicionar Compra', `
      <form id="form-add-expense">
        <div class="form-group">
          <label class="form-label">Descrição</label>
          <input type="text" class="form-input" id="expense-description" 
                     placeholder="Ex: Compra de ingredientes, materiais, etc." required>
        </div>
        <div class="form-group">
          <label class="form-label">Valor (R$)</label>
          <input type="number" class="form-input" id="expense-amount" 
                 step="0.01" min="0.01" placeholder="0,00" required>
        </div>
        <div class="form-group">
          <label style="display: flex; align-items: center; gap: var(--spacing-sm);">
            <input type="checkbox" id="expense-has-receipt">
            <span>Nota fiscal já emitida/arquivada</span>
          </label>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" id="btn-cancel-expense">
            Cancelar
          </button>
          <button type="submit" class="btn btn-primary">Salvar</button>
        </div>
      </form>
    `);

    document.body.appendChild(modal);
    modal.classList.add('active');
    this._addModalOpenClass();

    // Event listeners
    const form = modal.querySelector('#form-add-expense');
    const cancelBtn = modal.querySelector('#btn-cancel-expense');
    
    cancelBtn.addEventListener('click', () => {
      this._closeModal(modal);
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const result = await this._saveExpense(modal);
      if (result !== false) {
        this._closeModal(modal);
      }
    });

    return modal;
  }

  /**
   * Salva a despesa
   * @private
   */
  async _saveExpense(modal) {
    try {
      const description = modal.querySelector('#expense-description').value;
      const amount = parseFloat(modal.querySelector('#expense-amount').value);
      const hasReceipt = modal.querySelector('#expense-has-receipt').checked;

      const result = await this.addTransactionUseCase.execute({
        eventId: this.currentEventId,
        type: 'EXPENSE',
        description,
        amount,
        hasReceipt
      });

      if (result && result.success) {
        if (window.toast && typeof window.toast.success === 'function') {
          window.toast.success('Compra adicionada com sucesso!');
        }
        if (this.onSuccess) {
          await this.onSuccess();
        }
        return true;
      } else {
        const errorMsg = (result && result.error) || 'Erro desconhecido ao adicionar compra';
        console.error('Erro ao adicionar compra:', errorMsg);
        if (window.toast && typeof window.toast.error === 'function') {
          window.toast.error(errorMsg);
        }
        return false;
      }
    } catch (error) {
      const errorMsg = `Erro ao adicionar compra: ${error?.message || 'Erro desconhecido'}`;
      console.error('Erro em saveExpense:', error);
      if (window.toast && typeof window.toast.error === 'function') {
        window.toast.error(errorMsg);
      }
      return false;
    }
  }

  /**
   * Cria a estrutura do modal
   * @private
   */
  _createModal(title, content) {
    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';
    backdrop.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title">${title}</h3>
          <button class="modal-close">×</button>
        </div>
        ${content}
      </div>
    `;
    
    const closeBtn = backdrop.querySelector('.modal-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        this._closeModal(backdrop);
      });
    }
    
    // Fecha ao clicar no backdrop
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) {
        this._closeModal(backdrop);
      }
    });
    
    return backdrop;
  }

  /**
   * Fecha o modal
   * @private
   */
  _closeModal(modal) {
    this._removeModalOpenClass();
    if (document.body.contains(modal)) {
      modal.remove();
    }
  }

  /**
   * Adiciona classe para bloquear scroll
   * @private
   */
  _addModalOpenClass() {
    document.body.classList.add('modal-open');
    document.documentElement.classList.add('modal-open');
  }

  /**
   * Remove classe de bloqueio de scroll
   * @private
   */
  _removeModalOpenClass() {
    document.body.classList.remove('modal-open');
    document.documentElement.classList.remove('modal-open');
  }
}

export { ExpenseModal };

