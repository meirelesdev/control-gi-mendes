/**
 * Componente Modal: Adicionar Hospedagem
 * Encapsula a lógica do modal de adicionar despesa de hospedagem
 */
import { Formatters } from '../../utils/Formatters.js';

class AccommodationModal {
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
    
    // Obtém a data do evento para pré-preencher as datas
    let eventDate = new Date();
    if (this.currentEventId) {
      const event = await this.eventRepository.findById(this.currentEventId);
      if (event) {
        eventDate = new Date(event.date);
      }
    }
    const checkInDate = eventDate.toISOString().split('T')[0];
    
    // Check-out padrão: data do evento + 1 dia
    const checkOutDate = new Date(eventDate);
    checkOutDate.setDate(checkOutDate.getDate() + 1);
    const checkOutDateStr = checkOutDate.toISOString().split('T')[0];
    
    const modal = this._createModal('Adicionar Hospedagem', `
        <form id="form-add-accommodation">
          <div class="form-group">
            <label class="form-label">Valor Total (R$)</label>
            <input type="number" class="form-input" id="accommodation-amount" 
                   step="0.01" min="0.01" placeholder="0,00" required>
            <small class="text-muted">Sem limite de valor</small>
          </div>
          <div class="form-group">
            <label class="form-label">Data Check-in</label>
            <input type="date" class="form-input" id="accommodation-checkin" 
                   value="${checkInDate}" required>
          </div>
          <div class="form-group">
            <label class="form-label">Data Check-out</label>
            <input type="date" class="form-input" id="accommodation-checkout" 
                   value="${checkOutDateStr}" required>
          </div>
          <div class="form-group">
            <label class="form-label">Descrição</label>
            <input type="text" class="form-input" id="accommodation-description" 
                   value="Hospedagem" placeholder="Ex: Hospedagem">
            <small class="text-muted">Será formatada automaticamente com as datas se deixar "Hospedagem"</small>
          </div>
          <div class="form-group">
            <label style="display: flex; align-items: center; gap: var(--spacing-sm);">
              <input type="checkbox" id="accommodation-has-receipt" checked>
              <span>Nota fiscal já emitida/arquivada</span>
            </label>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" id="btn-cancel-accommodation">
              Cancelar
            </button>
            <button type="submit" class="btn btn-primary">Salvar</button>
          </div>
        </form>
      `);

    document.body.appendChild(modal);
    modal.classList.add('active');
    this._addModalOpenClass();

    // Validação de datas: check-out não pode ser anterior ao check-in
    const checkInInput = modal.querySelector('#accommodation-checkin');
    const checkOutInput = modal.querySelector('#accommodation-checkout');
    
    const validateDates = () => {
      const checkIn = new Date(checkInInput.value);
      const checkOut = new Date(checkOutInput.value);
      
      if (checkIn && checkOut && checkOut < checkIn) {
        checkOutInput.setCustomValidity('Data de check-out não pode ser anterior à data de check-in');
        checkOutInput.reportValidity();
      } else {
        checkOutInput.setCustomValidity('');
      }
    };
    
    checkInInput.addEventListener('change', validateDates);
    checkOutInput.addEventListener('change', validateDates);

    // Event listeners
    const form = modal.querySelector('#form-add-accommodation');
    const cancelBtn = modal.querySelector('#btn-cancel-accommodation');
    
    cancelBtn.addEventListener('click', () => {
      this._closeModal(modal);
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const result = await this._saveAccommodation(modal);
      if (result !== false) {
        this._closeModal(modal);
      }
    });

    return modal;
  }

  /**
   * Salva a hospedagem
   * @private
   */
  async _saveAccommodation(modal) {
    try {
      const description = modal.querySelector('#accommodation-description').value.trim() || 'Hospedagem';
      const amount = parseFloat(modal.querySelector('#accommodation-amount').value);
      const hasReceipt = modal.querySelector('#accommodation-has-receipt').checked;
      const checkIn = modal.querySelector('#accommodation-checkin').value;
      const checkOut = modal.querySelector('#accommodation-checkout').value;

      // Validação de datas
      if (checkIn && checkOut) {
        const checkInDate = new Date(checkIn);
        const checkOutDate = new Date(checkOut);
        
        if (checkOutDate < checkInDate) {
          if (window.toast && typeof window.toast.error === 'function') {
            window.toast.error('Data de check-out não pode ser anterior à data de check-in');
          }
          return false;
        }
      }

      const result = await this.addTransactionUseCase.execute({
        eventId: this.currentEventId,
        type: 'EXPENSE',
        description,
        amount,
        hasReceipt,
        category: 'accommodation',
        checkIn,
        checkOut
      });

      if (result && result.success) {
        if (window.toast && typeof window.toast.success === 'function') {
          window.toast.success('Hospedagem adicionada com sucesso!');
        }
        if (this.onSuccess) {
          await this.onSuccess();
        }
        return true;
      } else {
        const errorMsg = (result && result.error) || 'Erro desconhecido ao adicionar hospedagem';
        console.error('Erro ao adicionar hospedagem:', errorMsg);
        if (window.toast && typeof window.toast.error === 'function') {
          window.toast.error(errorMsg);
        }
        return false;
      }
    } catch (error) {
      const errorMsg = `Erro ao adicionar hospedagem: ${error?.message || 'Erro desconhecido'}`;
      console.error('Erro em saveAccommodation:', error);
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

export { AccommodationModal };

