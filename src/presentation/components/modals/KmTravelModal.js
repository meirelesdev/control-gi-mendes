/**
 * Componente Modal: Adicionar Deslocamento (KM Rodado)
 * Simplificado para apenas KM rodado (gasolina/combustível)
 * Nota: Tempo de viagem deve ser lançado como Hora Extra nos Honorários
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
    const modal = this._createModal('Adicionar KM Rodado', `
      <form id="form-add-km">
        <div class="form-group">
          <label class="form-label">Distância (KM) *</label>
          <input type="number" class="form-input" id="km-distance" 
                 step="0.1" min="0.1" placeholder="0" required>
          <small class="text-muted">Quilometragem percorrida para o evento</small>
        </div>
        <div class="form-group">
          <label class="form-label">Origem (Cidade/Local)</label>
          <input type="text" class="form-input" id="km-origin" 
                 placeholder="Ex: Florianópolis">
          <small class="text-muted">Cidade ou local de partida</small>
        </div>
        <div class="form-group">
          <label class="form-label">Destino (Cidade/Local)</label>
          <input type="text" class="form-input" id="km-destination" 
                 placeholder="Ex: Tupandi">
          <small class="text-muted">Cidade ou local de chegada</small>
        </div>
        <div class="form-group">
          <label class="form-label">Descrição (opcional)</label>
          <input type="text" class="form-input" id="km-description" 
                 placeholder="Ex: Ida e volta do evento">
          <small class="text-muted">Se Origem e Destino forem preenchidos, será gerado: "Deslocamento: Origem → Destino"</small>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" id="btn-cancel-km">
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
    const form = modal.querySelector('#form-add-km');
    const cancelBtn = modal.querySelector('#btn-cancel-km');
    
    cancelBtn.addEventListener('click', () => {
      this._closeModal(modal);
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const result = await this._saveKm(modal);
      if (result !== false) {
        this._closeModal(modal);
      }
    });

    return modal;
  }

  /**
   * Salva o KM rodado
   * @private
   */
  async _saveKm(modal) {
    try {
      const distance = parseFloat(modal.querySelector('#km-distance').value);
      const origin = modal.querySelector('#km-origin')?.value.trim() || '';
      const destination = modal.querySelector('#km-destination')?.value.trim() || '';
      const description = modal.querySelector('#km-description')?.value.trim() || '';
      
      if (!distance || distance <= 0) {
        window.toast?.error('Distância é obrigatória e deve ser maior que zero');
        return false;
      }
      
      const input = {
        eventId: this.currentEventId,
        type: 'INCOME',
        description: description,
        category: 'km',
        isReimbursement: true,
        distance: distance
      };
      
      // Adiciona origem e destino se fornecidos
      if (origin) {
        input.origin = origin;
      }
      if (destination) {
        input.destination = destination;
      }
      
      // Valida: se não tem origem/destino, precisa ter descrição
      if (!origin && !destination && (!description || description === '')) {
        window.toast?.error('Preencha Origem e Destino ou informe uma Descrição');
        return false;
      }

      const result = await this.addTransactionUseCase.execute(input);

      if (result && result.success) {
        if (window.toast && typeof window.toast.success === 'function') {
          window.toast.success('KM rodado adicionado com sucesso!');
        }
        if (this.onSuccess) {
          await this.onSuccess();
        }
        return true;
      } else {
        const errorMsg = (result && result.error) || 'Erro desconhecido ao adicionar KM';
        console.error('Erro ao adicionar KM:', errorMsg);
        if (window.toast && typeof window.toast.error === 'function') {
          window.toast.error(errorMsg);
        }
        return false;
      }
    } catch (error) {
      const errorMsg = `Erro ao adicionar KM: ${error?.message || 'Erro desconhecido'}`;
      console.error('Erro em saveKm:', error);
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

