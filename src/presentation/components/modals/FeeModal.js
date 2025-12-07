/**
 * Componente Modal: Adicionar Honorário
 * Encapsula a lógica do modal de adicionar honorário (diária/hora extra)
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
    let dailyRate = DEFAULT_VALUES.DAILY_RATE;
    let overtimeRate = DEFAULT_VALUES.OVERTIME_RATE;
    try {
      const settings = await this.settingsRepository.find();
      if (settings) {
        dailyRate = settings.standardDailyRate || DEFAULT_VALUES.DAILY_RATE;
        overtimeRate = settings.overtimeRate || DEFAULT_VALUES.OVERTIME_RATE;
      }
    } catch (error) {
      // Usa valores padrão em caso de erro
    }

    const modal = this._createModal('Adicionar Honorário', `
      <form id="form-add-fee">
        <div class="form-group">
          <label class="form-label">Tipo de Honorário</label>
          <div style="display: flex; flex-direction: column; gap: var(--spacing-sm); margin-top: var(--spacing-xs);">
            <label style="display: flex; align-items: center; gap: var(--spacing-sm); cursor: pointer; padding: var(--spacing-sm); border: 1px solid var(--color-border); border-radius: var(--radius-md);">
              <input type="radio" name="fee-type" value="diaria" id="fee-type-diaria" checked style="cursor: pointer;">
              <div style="flex: 1;">
                <strong>Diária Adicional</strong>
                <div class="text-muted" style="font-size: 0.9em;" id="diaria-value">Valor: ${Formatters.currency(dailyRate)}</div>
              </div>
            </label>
            <label style="display: flex; align-items: center; gap: var(--spacing-sm); cursor: pointer; padding: var(--spacing-sm); border: 1px solid var(--color-border); border-radius: var(--radius-md);">
              <input type="radio" name="fee-type" value="hora_extra" id="fee-type-hora" style="cursor: pointer;">
              <div style="flex: 1;">
                <strong>Hora Extra</strong>
                <div class="text-muted" style="font-size: 0.9em;" id="hora-extra-info">Taxa: ${Formatters.currency(overtimeRate)} por hora</div>
              </div>
            </label>
          </div>
        </div>
        <div class="form-group" id="hours-group" style="display: none;">
          <label class="form-label">Quantidade de Horas</label>
          <input type="number" class="form-input" id="fee-hours" 
                 step="0.5" min="0.5" placeholder="0" value="1">
          <small class="text-muted" id="hours-total" style="display: block; margin-top: var(--spacing-xs);">Total: R$ 0,00</small>
        </div>
        <div class="form-group">
          <label class="form-label">Descrição</label>
          <input type="text" class="form-input" id="fee-description" 
                 placeholder="Ex: Diária técnica padrão" required>
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
    modal.dataset.dailyRate = dailyRate;
    modal.dataset.overtimeRate = overtimeRate;

    // Event listeners
    const form = modal.querySelector('#form-add-fee');
    const cancelBtn = modal.querySelector('#btn-cancel-fee');
    const feeTypeInputs = modal.querySelectorAll('input[name="fee-type"]');
    const hoursInput = modal.querySelector('#fee-hours');
    
    cancelBtn.addEventListener('click', () => {
      this._closeModal(modal);
    });

    // Mostra/esconde campos baseado no tipo
    feeTypeInputs.forEach(input => {
      input.addEventListener('change', () => {
        const type = input.value;
        const hoursGroup = modal.querySelector('#hours-group');
        if (type === 'hora_extra') {
          hoursGroup.style.display = 'block';
          modal.querySelector('#fee-hours').required = true;
          this._updateHoursTotal(modal);
        } else {
          hoursGroup.style.display = 'none';
          modal.querySelector('#fee-hours').required = false;
        }
      });
    });

    // Atualiza total quando horas mudam
    if (hoursInput) {
      hoursInput.addEventListener('input', () => {
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
   * Salva o honorário
   * @private
   */
  async _saveFee(modal) {
    try {
      const feeType = modal.querySelector('input[name="fee-type"]:checked').value;
      const description = modal.querySelector('#fee-description').value.trim();
      
      if (!description) {
        window.toast?.error('Descrição é obrigatória');
        return false;
      }

      let amount;
      let category;

      if (feeType === 'diaria') {
        const dailyRate = parseFloat(modal.dataset.dailyRate || DEFAULT_VALUES.DAILY_RATE);
        amount = dailyRate;
        category = 'diaria';
      } else if (feeType === 'hora_extra') {
        const hours = parseFloat(modal.querySelector('#fee-hours').value);
        if (!hours || hours <= 0) {
          window.toast?.error('Quantidade de horas deve ser maior que zero');
          return false;
        }
        const overtimeRate = parseFloat(modal.dataset.overtimeRate || DEFAULT_VALUES.OVERTIME_RATE);
        amount = hours * overtimeRate;
        category = 'hora_extra';
      } else {
        window.toast?.error('Tipo de honorário inválido');
        return false;
      }

      const result = await this.addTransactionUseCase.execute({
        eventId: this.currentEventId,
        type: 'INCOME',
        description,
        amount,
        category,
        isReimbursement: false
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

