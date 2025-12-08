/**
 * Componente Modal: Adicionar Honorário
 * Encapsula a lógica do modal de adicionar horas de trabalho
 */
import { DEFAULT_VALUES } from '../../../domain/constants/DefaultValues.js';
import { Formatters } from '../../utils/Formatters.js';

class FeeModal {
  constructor(addTransactionUseCase, eventRepository, settingsRepository, currentEventId, onSuccess) {
    this.addTransactionUseCase = addTransactionUseCase;
    this.eventRepository = eventRepository;
    this.settingsRepository = settingsRepository;
    this.currentEventId = currentEventId;
    this.onSuccess = onSuccess;
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

    // Busca valores das configurações
    let overtimeRate = DEFAULT_VALUES.OVERTIME_RATE;
    try {
      const settings = await this.settingsRepository.find();
      if (settings) {
        overtimeRate = settings.overtimeRate || DEFAULT_VALUES.OVERTIME_RATE;
      }
    } catch (error) {
      // Usa valores padrão em caso de erro
    }

    const modal = this._createModal('Adicionar Honorário', `
      <form id="form-add-fee">
        <div class="form-group">
          <label class="form-label">Horas de Trabalho</label>
          <div style="padding: var(--spacing-md); background: var(--color-surface); border-radius: var(--radius-md); margin-top: var(--spacing-xs); margin-bottom: var(--spacing-sm);">
            <div style="font-size: var(--font-size-sm); color: var(--color-text-secondary); margin-bottom: var(--spacing-xs);">
              Taxa: ${Formatters.currency(overtimeRate)} por hora
            </div>
          </div>
          <input type="number" class="form-input" id="fee-hours" 
                 step="0.5" min="0.5" placeholder="0" value="1" required>
          <small class="text-muted" id="hours-total" style="display: block; margin-top: var(--spacing-xs); font-weight: var(--font-weight-bold); color: var(--color-success);">Total: R$ 0,00</small>
        </div>
        <div class="form-group">
          <label class="form-label">Descrição</label>
          <input type="text" class="form-input" id="fee-description" 
                 placeholder="Ex: Horas de trabalho do evento" required>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" id="btn-cancel-fee">
            Cancelar
          </button>
          <button type="submit" class="btn btn-success">Salvar</button>
        </div>
      </form>
    `);

    document.body.appendChild(modal);
    modal.classList.add('active');
    this._addModalOpenClass();

    // Armazena valores no modal
    modal.dataset.overtimeRate = overtimeRate;

    // Event listeners
    const form = modal.querySelector('#form-add-fee');
    const cancelBtn = modal.querySelector('#btn-cancel-fee');
    const hoursInput = modal.querySelector('#fee-hours');
    
    cancelBtn.addEventListener('click', () => {
      this._closeModal(modal);
    });

    // Atualiza total quando horas mudam
    if (hoursInput) {
      // Atualiza total inicial
      this._updateHoursTotal(modal);
      
      hoursInput.addEventListener('input', () => {
        this._updateHoursTotal(modal);
      });
      
      hoursInput.addEventListener('change', () => {
        this._updateHoursTotal(modal);
      });
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const result = await this._saveFee(modal);
      if (result !== false) {
        this._closeModal(modal);
      }
    });

    return modal;
  }

  /**
   * Atualiza o total de horas
   * @private
   */
  _updateHoursTotal(modal) {
    const hoursInput = modal.querySelector('#fee-hours');
    const hoursTotal = modal.querySelector('#hours-total');
    const overtimeRate = parseFloat(modal.dataset.overtimeRate || DEFAULT_VALUES.OVERTIME_RATE);
    
    if (hoursInput && hoursTotal) {
      const hours = parseFloat(hoursInput.value) || 0;
      const total = hours * overtimeRate;
      hoursTotal.textContent = `Total: ${Formatters.currency(total)}`;
    }
  }

  /**
   * Salva o honorário (horas de trabalho)
   * @private
   */
  async _saveFee(modal) {
    try {
      const description = modal.querySelector('#fee-description').value.trim();
      const hours = parseFloat(modal.querySelector('#fee-hours').value);
      
      if (!description) {
        window.toast?.error('Descrição é obrigatória');
        return false;
      }

      if (!hours || hours <= 0) {
        window.toast?.error('Quantidade de horas deve ser maior que zero');
        return false;
      }

      const overtimeRate = parseFloat(modal.dataset.overtimeRate || DEFAULT_VALUES.OVERTIME_RATE);
      const amount = hours * overtimeRate;
      const category = 'hora_extra'; // Mantém categoria interna como hora_extra para compatibilidade

      const result = await this.addTransactionUseCase.execute({
        eventId: this.currentEventId,
        type: 'INCOME',
        description,
        amount,
        category,
        isReimbursement: false,
        hours: hours // Adiciona hours no input para ser salvo no metadata
      });

      if (result && result.success) {
        if (window.toast && typeof window.toast.success === 'function') {
          window.toast.success('Honorário adicionado com sucesso!');
        }
        if (this.onSuccess) {
          await this.onSuccess();
        }
        return true;
      } else {
        const errorMsg = (result && result.error) || 'Erro desconhecido ao adicionar honorário';
        console.error('Erro ao adicionar honorário:', errorMsg);
        if (window.toast && typeof window.toast.error === 'function') {
          window.toast.error(errorMsg);
        }
        return false;
      }
    } catch (error) {
      const errorMsg = `Erro ao adicionar honorário: ${error?.message || 'Erro desconhecido'}`;
      console.error('Erro em saveFee:', error);
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

export { FeeModal };

