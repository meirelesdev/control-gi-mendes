/**
 * Componente Modal: Adicionar Deslocamento (KM/Tempo de Viagem)
 * Encapsula a lógica do modal de adicionar deslocamento
 */
class KmTravelModal {
  constructor(addTransactionUseCase, eventRepository, currentEventId, onSuccess) {
    this.addTransactionUseCase = addTransactionUseCase;
    this.eventRepository = eventRepository;
    this.currentEventId = currentEventId;
    this.onSuccess = onSuccess;
  }

  /**
   * Exibe o modal
   */
  show() {
    const modal = this._createModal('Adicionar Deslocamento', `
      <form id="form-add-km-travel">
        <div class="form-group">
          <label class="form-label">Tipo</label>
          <select class="form-input" id="km-travel-type" required>
            <option value="">Selecione...</option>
            <option value="km">KM Rodado</option>
            <option value="tempo_viagem">Tempo de Viagem</option>
          </select>
        </div>
        <div class="form-group" id="km-group" style="display: none;">
          <label class="form-label">Distância (KM)</label>
          <input type="number" class="form-input" id="km-distance" 
                 step="0.1" min="0.1" placeholder="0">
        </div>
        <div class="form-group" id="km-origin-group" style="display: none;">
          <label class="form-label">Origem (Cidade/Local)</label>
          <input type="text" class="form-input" id="km-origin" 
                 placeholder="Ex: Florianópolis">
          <small class="text-muted">Cidade ou local de partida</small>
        </div>
        <div class="form-group" id="km-destination-group" style="display: none;">
          <label class="form-label">Destino (Cidade/Local)</label>
          <input type="text" class="form-input" id="km-destination" 
                 placeholder="Ex: Tupandi">
          <small class="text-muted">Cidade ou local de chegada</small>
        </div>
        <div class="form-group" id="hours-group" style="display: none;">
          <label class="form-label">Horas de Viagem</label>
          <input type="number" class="form-input" id="travel-hours" 
                 step="0.1" min="0.1" placeholder="0">
        </div>
        <div class="form-group" id="description-group">
          <label class="form-label">Descrição</label>
          <input type="text" class="form-input" id="km-travel-description" 
                 placeholder="Ex: Deslocamento até o evento" required>
          <small class="text-muted" id="description-hint" style="display: none;">
            A descrição será gerada automaticamente como "Deslocamento: Origem → Destino"
          </small>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" id="btn-cancel-km-travel">
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
    const form = modal.querySelector('#form-add-km-travel');
    const cancelBtn = modal.querySelector('#btn-cancel-km-travel');
    const typeSelect = modal.querySelector('#km-travel-type');
    const kmGroup = modal.querySelector('#km-group');
    const kmOriginGroup = modal.querySelector('#km-origin-group');
    const kmDestinationGroup = modal.querySelector('#km-destination-group');
    const hoursGroup = modal.querySelector('#hours-group');
    const descriptionGroup = modal.querySelector('#description-group');
    const descriptionInput = modal.querySelector('#km-travel-description');
    const descriptionHint = modal.querySelector('#description-hint');
    
    cancelBtn.addEventListener('click', () => {
      this._closeModal(modal);
    });

    // Mostra/esconde campos baseado no tipo
    typeSelect.addEventListener('change', (e) => {
      const type = e.target.value;
      
      if (type === 'km') {
        kmGroup.style.display = 'block';
        kmOriginGroup.style.display = 'block';
        kmDestinationGroup.style.display = 'block';
        hoursGroup.style.display = 'none';
        descriptionGroup.style.display = 'block';
        descriptionHint.style.display = 'block';
        descriptionInput.required = false;
      } else if (type === 'tempo_viagem') {
        kmGroup.style.display = 'none';
        kmOriginGroup.style.display = 'none';
        kmDestinationGroup.style.display = 'none';
        hoursGroup.style.display = 'block';
        descriptionGroup.style.display = 'block';
        descriptionHint.style.display = 'none';
        descriptionInput.required = true;
      } else {
        kmGroup.style.display = 'none';
        kmOriginGroup.style.display = 'none';
        kmDestinationGroup.style.display = 'none';
        hoursGroup.style.display = 'none';
        descriptionGroup.style.display = 'block';
        descriptionHint.style.display = 'none';
        descriptionInput.required = true;
      }
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const result = await this._saveKmTravel(modal);
      if (result !== false) {
        this._closeModal(modal);
      }
    });

    return modal;
  }

  /**
   * Salva o deslocamento
   * @private
   */
  async _saveKmTravel(modal) {
    try {
      const type = modal.querySelector('#km-travel-type').value;
      const description = modal.querySelector('#km-travel-description').value;
      
      let input = {
        eventId: this.currentEventId,
        type: 'INCOME',
        description,
        category: type,
        isReimbursement: true
      };

      if (type === 'km') {
        const distance = parseFloat(modal.querySelector('#km-distance').value);
        const origin = modal.querySelector('#km-origin')?.value.trim() || '';
        const destination = modal.querySelector('#km-destination')?.value.trim() || '';
        
        if (!distance || distance <= 0) {
          window.toast?.error('Distância é obrigatória e deve ser maior que zero');
          return false;
        }
        
        input.distance = distance;
        
        if (origin && destination) {
          input.origin = origin;
          input.destination = destination;
          input.description = description || '';
        } else if (!description || description.trim() === '') {
          window.toast?.error('Preencha Origem e Destino ou informe uma Descrição');
          return false;
        }
      } else if (type === 'tempo_viagem') {
        input.hours = parseFloat(modal.querySelector('#travel-hours').value);
      }

      const result = await this.addTransactionUseCase.execute(input);

      if (result && result.success) {
        if (window.toast && typeof window.toast.success === 'function') {
          window.toast.success('Transação adicionada com sucesso!');
        }
        if (this.onSuccess) {
          await this.onSuccess();
        }
        return true;
      } else {
        const errorMsg = (result && result.error) || 'Erro desconhecido ao adicionar transação';
        console.error('Erro ao adicionar transação:', errorMsg);
        if (window.toast && typeof window.toast.error === 'function') {
          window.toast.error(errorMsg);
        }
        return false;
      }
    } catch (error) {
      const errorMsg = `Erro ao adicionar transação: ${error?.message || 'Erro desconhecido'}`;
      console.error('Erro em saveKmTravel:', error);
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

export { KmTravelModal };

