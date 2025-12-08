/**
 * Componente Modal: Adicionar Tempo de Viagem
 * Permite adicionar horas de deslocamento que serão calculadas automaticamente
 */
import { Formatters } from '../../utils/Formatters.js';
import { DEFAULT_VALUES } from '../../../domain/constants/DefaultValues.js';

class TravelTimeModal {
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

    // Busca a taxa de hora extra para exibir o valor calculado
    let overtimeRate = DEFAULT_VALUES.OVERTIME_RATE;
    try {
      const settings = await this.settingsRepository.find();
      if (settings) {
        overtimeRate = settings.overtimeRate || DEFAULT_VALUES.OVERTIME_RATE;
      }
    } catch (error) {
      console.error('Erro ao buscar configurações:', error);
    }

    const modal = this._createModal('Adicionar Tempo de Viagem', `
      <form id="form-add-travel-time">
        <div class="form-group">
          <label class="form-label">Horas de Deslocamento *</label>
          <input type="number" class="form-input" id="travel-time-hours" 
                 step="0.5" min="0.5" placeholder="0" required>
          <small class="text-muted">Tempo gasto no deslocamento até o evento</small>
        </div>
        <div class="form-group">
          <label class="form-label">Descrição (opcional)</label>
          <input type="text" class="form-input" id="travel-time-description" 
                 placeholder="Ex: Ida e volta do evento">
          <small class="text-muted">Se não preenchida, será gerada automaticamente</small>
        </div>
        <div class="form-group" id="travel-time-preview" style="padding: var(--spacing-md); background: var(--color-surface); border-radius: var(--radius-md); margin-top: var(--spacing-sm);">
          <div style="font-size: var(--font-size-sm); color: var(--color-text-secondary); margin-bottom: var(--spacing-xs);">
            Valor calculado:
          </div>
          <div id="travel-time-amount" style="font-size: var(--font-size-lg); font-weight: var(--font-weight-bold); color: var(--color-primary);">
            R$ 0,00
          </div>
          <div style="font-size: var(--font-size-xs); color: var(--color-text-secondary); margin-top: var(--spacing-xs);">
            Taxa: ${Formatters.currency(overtimeRate)}/hora
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" id="btn-cancel-travel-time">
            Cancelar
          </button>
          <button type="submit" class="btn btn-primary">Salvar</button>
        </div>
      </form>
    `);

    document.body.appendChild(modal);
    modal.classList.add('active');
    this._addModalOpenClass();

    // Calcula valor em tempo real
    const hoursInput = modal.querySelector('#travel-time-hours');
    const amountPreview = modal.querySelector('#travel-time-amount');
    
    if (hoursInput && amountPreview) {
      const updatePreview = () => {
        const hours = parseFloat(hoursInput.value) || 0;
        if (hours > 0) {
          const amount = hours * overtimeRate;
          amountPreview.textContent = Formatters.currency(amount);
        } else {
          amountPreview.textContent = 'R$ 0,00';
        }
      };
      
      hoursInput.addEventListener('input', updatePreview);
      hoursInput.addEventListener('change', updatePreview);
    }

    // Event listeners
    const form = modal.querySelector('#form-add-travel-time');
    const cancelBtn = modal.querySelector('#btn-cancel-travel-time');
    
    cancelBtn.addEventListener('click', () => {
      this._closeModal(modal);
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const result = await this._saveTravelTime(modal, overtimeRate);
      if (result !== false) {
        this._closeModal(modal);
      }
    });

    return modal;
  }

  /**
   * Salva o tempo de viagem
   * @private
   */
  async _saveTravelTime(modal, overtimeRate) {
    try {
      const hoursInput = modal.querySelector('#travel-time-hours');
      const hoursValue = hoursInput?.value?.trim() || '';
      const hours = parseFloat(hoursValue);
      const description = modal.querySelector('#travel-time-description')?.value.trim() || '';
      
      // Valida e converte horas para número
      if (!hoursValue || hoursValue.trim() === '') {
        window.toast?.error('Horas são obrigatórias');
        hoursInput?.focus();
        return false;
      }
      
      const hoursNumber = parseFloat(hoursValue);
      if (isNaN(hoursNumber) || hoursNumber <= 0) {
        window.toast?.error('Horas devem ser um número maior que zero');
        hoursInput?.focus();
        return false;
      }
      
      // Gera descrição automática se não informada
      const finalDescription = description.trim() || `Tempo de Viagem (${hoursNumber}h)`;
      
      // Garante que a descrição não está vazia
      if (!finalDescription || finalDescription.trim() === '') {
        window.toast?.error('Descrição é obrigatória');
        return false;
      }
      
      const input = {
        eventId: this.currentEventId,
        type: 'INCOME',
        description: finalDescription,
        category: 'tempo_viagem',
        isReimbursement: true,
        hours: hoursNumber
      };
      
      console.log('TravelTimeModal - Input sendo enviado:', input);
      console.log('TravelTimeModal - hoursNumber:', hoursNumber, 'tipo:', typeof hoursNumber, 'isNaN:', isNaN(hoursNumber));

      const result = await this.addTransactionUseCase.execute(input);

      if (result && result.success) {
        if (window.toast && typeof window.toast.success === 'function') {
          window.toast.success('Tempo de viagem adicionado com sucesso!');
        }
        if (this.onSuccess) {
          await this.onSuccess();
        }
        return true;
      } else {
        const errorMsg = (result && result.error) || 'Erro desconhecido ao adicionar tempo de viagem';
        console.error('Erro ao adicionar tempo de viagem:', errorMsg);
        if (window.toast && typeof window.toast.error === 'function') {
          window.toast.error(errorMsg);
        }
        return false;
      }
    } catch (error) {
      const errorMsg = `Erro ao adicionar tempo de viagem: ${error?.message || 'Erro desconhecido'}`;
      console.error('Erro em saveTravelTime:', error);
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

export { TravelTimeModal };

