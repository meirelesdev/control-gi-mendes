/**
 * View: Detalhe do Evento
 * Exibe detalhes do evento, botões de ação e lista de despesas
 */
class EventDetailView {
  constructor(eventRepository, transactionRepository, settingsRepository, addTransactionUseCase) {
    this.eventRepository = eventRepository;
    this.transactionRepository = transactionRepository;
    this.settingsRepository = settingsRepository;
    this.addTransactionUseCase = addTransactionUseCase;
    this.currentEventId = null;
  }

  async render(eventId) {
    const container = document.getElementById('event-detail-content');
    if (!container) return;

    this.currentEventId = eventId;

    container.innerHTML = '<div class="loading">Carregando...</div>';

    try {
      const event = await this.eventRepository.findById(eventId);
      if (!event) {
        container.innerHTML = '<div class="empty-state"><p>Evento não encontrado.</p></div>';
        return;
      }

      const transactions = await this.transactionRepository.findByEventId(eventId);
      const expenses = transactions.filter(t => t.type === 'EXPENSE');
      const expensesWithoutReceipt = expenses.filter(e => !e.metadata.hasReceipt);
      const incomes = transactions.filter(t => t.type === 'INCOME');
      
      // Calcula totais
      const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
      const totalIncomes = incomes.reduce((sum, i) => sum + i.amount, 0);

      container.innerHTML = `
        <div class="card">
          <h2>${this.escapeHtml(event.name)}</h2>
          <p class="text-muted">${this.formatDate(event.date)}</p>
          ${event.description ? `<p>${this.escapeHtml(event.description)}</p>` : ''}
        </div>

        <div class="card">
          <h3 style="margin-bottom: var(--spacing-md);">Ações Rápidas</h3>
          <div style="display: flex; flex-direction: column; gap: var(--spacing-md);">
            <button class="btn btn-primary btn-lg" id="btn-add-expense">
              ➕ Adicionar Despesa Rápida
            </button>
            <button class="btn btn-secondary btn-lg" id="btn-add-km-travel">
              🚗 Adicionar KM / Viagem
            </button>
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <h3 class="card-title">Despesas</h3>
            ${expensesWithoutReceipt.length > 0 ? `
              <span class="badge badge-warning">${expensesWithoutReceipt.length} sem NF</span>
            ` : ''}
            ${expenses.length > 0 ? `
              <span class="badge badge-info">Total: ${this.formatCurrency(totalExpenses)}</span>
            ` : ''}
          </div>
          ${expenses.length === 0 ? `
            <div class="empty-state">
              <p class="text-muted">Nenhuma despesa cadastrada ainda.</p>
            </div>
          ` : `
            <div class="expense-list">
              ${expenses.map(expense => this.renderExpenseItem(expense)).join('')}
            </div>
          `}
        </div>

        <div class="card">
          <div class="card-header">
            <h3 class="card-title">KM / Viagens</h3>
            ${incomes.length > 0 ? `
              <span class="badge badge-success">Total: ${this.formatCurrency(totalIncomes)}</span>
            ` : ''}
          </div>
          ${incomes.length === 0 ? `
            <div class="empty-state">
              <p class="text-muted">Nenhuma KM/Viagem cadastrada ainda.</p>
            </div>
          ` : `
            <div class="expense-list">
              ${incomes.map(income => this.renderIncomeItem(income)).join('')}
            </div>
          `}
        </div>
      `;

      // Event listeners
      document.getElementById('btn-add-expense').addEventListener('click', () => {
        this.showAddExpenseModal();
      });

      document.getElementById('btn-add-km-travel').addEventListener('click', () => {
        this.showAddKmTravelModal();
      });

      // Event listeners para marcar nota fiscal
      container.querySelectorAll('.btn-mark-receipt').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          const transactionId = e.target.dataset.transactionId;
          await this.markReceiptAsIssued(transactionId);
        });
      });
    } catch (error) {
      container.innerHTML = `
        <div class="card" style="border-left-color: var(--color-danger);">
          <p style="color: var(--color-danger);">Erro ao carregar evento: ${error.message}</p>
        </div>
      `;
    }
  }

  renderExpenseItem(expense) {
    const hasReceipt = expense.metadata.hasReceipt;
    
    return `
      <div class="expense-item ${hasReceipt ? '' : 'no-receipt'}">
        <div class="expense-item-info">
          <div class="expense-item-description">${this.escapeHtml(expense.description)}</div>
          <div class="expense-item-value">${this.formatCurrency(expense.amount)}</div>
        </div>
        ${!hasReceipt ? `
          <div class="expense-item-receipt">
            <span>⚠️</span>
            <button class="btn btn-sm btn-success btn-mark-receipt" data-transaction-id="${expense.id}">
              Marcar NF
            </button>
          </div>
        ` : `
          <span class="badge badge-success">NF OK</span>
        `}
      </div>
    `;
  }

  renderIncomeItem(income) {
    const category = income.metadata.category || '';
    const categoryLabels = {
      'km': 'KM Rodado',
      'tempo_viagem': 'Tempo de Viagem',
      'diaria': 'Diária',
      'hora_extra': 'Hora Extra'
    };
    const categoryLabel = categoryLabels[category] || category || 'Receita';
    const isReimbursement = income.metadata.isReimbursement !== false;
    
    return `
      <div class="expense-item">
        <div class="expense-item-info">
          <div class="expense-item-description">
            ${this.escapeHtml(income.description)}
            <span class="badge badge-info" style="margin-left: var(--spacing-sm);">${categoryLabel}</span>
            ${isReimbursement ? '<span class="badge badge-secondary" style="margin-left: var(--spacing-xs);">Reembolso</span>' : ''}
          </div>
          <div class="expense-item-value" style="color: var(--color-success);">${this.formatCurrency(income.amount)}</div>
        </div>
      </div>
    `;
  }

  showAddExpenseModal() {
    const modal = this.createModal('Adicionar Despesa Rápida', `
      <form id="form-add-expense">
        <div class="form-group">
          <label class="form-label">Descrição</label>
          <input type="text" class="form-input" id="expense-description" 
                 placeholder="Ex: Compra de ingredientes" required>
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
          <button type="button" class="btn btn-secondary" onclick="this.closest('.modal-backdrop').remove()">
            Cancelar
          </button>
          <button type="submit" class="btn btn-primary">Salvar</button>
        </div>
      </form>
    `);

    document.body.appendChild(modal);
    modal.classList.add('active');

    document.getElementById('form-add-expense').addEventListener('submit', async (e) => {
      e.preventDefault();
      const result = await this.saveExpense();
      // Só remove o modal se saveExpense retornou sucesso (sem erro)
      if (result !== false) {
        modal.remove();
      }
    });
  }

  showAddKmTravelModal() {
    const modal = this.createModal('Adicionar KM / Viagem', `
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
        <div class="form-group" id="hours-group" style="display: none;">
          <label class="form-label">Horas de Viagem</label>
          <input type="number" class="form-input" id="travel-hours" 
                 step="0.1" min="0.1" placeholder="0">
        </div>
        <div class="form-group">
          <label class="form-label">Descrição</label>
          <input type="text" class="form-input" id="km-travel-description" 
                 placeholder="Ex: Deslocamento até o evento" required>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" onclick="this.closest('.modal-backdrop').remove()">
            Cancelar
          </button>
          <button type="submit" class="btn btn-primary">Salvar</button>
        </div>
      </form>
    `);

    document.body.appendChild(modal);
    modal.classList.add('active');

    // Mostra/esconde campos baseado no tipo
    document.getElementById('km-travel-type').addEventListener('change', (e) => {
      const type = e.target.value;
      document.getElementById('km-group').style.display = type === 'km' ? 'block' : 'none';
      document.getElementById('hours-group').style.display = type === 'tempo_viagem' ? 'block' : 'none';
    });

    document.getElementById('form-add-km-travel').addEventListener('submit', async (e) => {
      e.preventDefault();
      const result = await this.saveKmTravel();
      // Só remove o modal se saveKmTravel retornou sucesso (sem erro)
      if (result !== false) {
        modal.remove();
      }
    });
  }

  async saveExpense() {
    try {
      const description = document.getElementById('expense-description').value;
      const amount = parseFloat(document.getElementById('expense-amount').value);
      const hasReceipt = document.getElementById('expense-has-receipt').checked;

      const result = await this.addTransactionUseCase.execute({
        eventId: this.currentEventId,
        type: 'EXPENSE',
        description,
        amount,
        hasReceipt
      });

      if (result.success) {
        if (window.toast) {
          window.toast.success('Despesa adicionada com sucesso!');
        } else {
          console.log('✅ Despesa adicionada com sucesso!');
        }
        await this.render(this.currentEventId);
        return true; // Retorna true para indicar sucesso
      } else {
        const errorMsg = result.error || 'Erro desconhecido ao adicionar despesa';
        console.error('Erro ao adicionar despesa:', errorMsg);
        if (window.toast) {
          window.toast.error(errorMsg);
        } else {
          console.error('Toast não disponível. Erro:', errorMsg);
        }
        return false; // Retorna false para indicar erro
      }
    } catch (error) {
      const errorMsg = `Erro ao adicionar despesa: ${error.message}`;
      console.error('Erro em saveExpense:', error);
      
      if (window.toast) {
        window.toast.error(errorMsg);
      } else {
        console.error('Toast não disponível. Erro:', errorMsg);
      }
      return false; // Retorna false para indicar erro
    }
  }

  async saveKmTravel() {
    try {
      const type = document.getElementById('km-travel-type').value;
      const description = document.getElementById('km-travel-description').value;
      
      let input = {
        eventId: this.currentEventId,
        type: 'INCOME',
        description,
        category: type,
        isReimbursement: true
      };

      if (type === 'km') {
        input.distance = parseFloat(document.getElementById('km-distance').value);
      } else if (type === 'tempo_viagem') {
        input.hours = parseFloat(document.getElementById('travel-hours').value);
      }

      const result = await this.addTransactionUseCase.execute(input);

      if (result.success) {
        if (window.toast) {
          window.toast.success('Transação adicionada com sucesso!');
        } else {
          console.log('✅ Transação adicionada com sucesso!');
        }
        await this.render(this.currentEventId);
        return true; // Retorna true para indicar sucesso
      } else {
        const errorMsg = result.error || 'Erro desconhecido ao adicionar transação';
        console.error('Erro ao adicionar transação:', errorMsg);
        if (window.toast) {
          window.toast.error(errorMsg);
        } else {
          console.error('Toast não disponível. Erro:', errorMsg);
        }
        return false; // Retorna false para indicar erro
      }
    } catch (error) {
      const errorMsg = `Erro ao adicionar transação: ${error.message}`;
      console.error('Erro em saveKmTravel:', error);
      
      if (window.toast) {
        window.toast.error(errorMsg);
      } else {
        console.error('Toast não disponível. Erro:', errorMsg);
      }
      return false; // Retorna false para indicar erro
    }
  }

  async markReceiptAsIssued(transactionId) {
    try {
      const transaction = await this.transactionRepository.findById(transactionId);
      if (transaction) {
        transaction.markReceiptAsIssued();
        await this.transactionRepository.save(transaction);
        window.toast.success('Nota fiscal marcada como emitida!');
        await this.render(this.currentEventId);
      } else {
        window.toast.error('Transação não encontrada');
      }
    } catch (error) {
      window.toast.error(`Erro ao marcar nota fiscal: ${error.message}`);
    }
  }

  createModal(title, content) {
    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';
    backdrop.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title">${title}</h3>
          <button class="modal-close" onclick="this.closest('.modal-backdrop').remove()">×</button>
        </div>
        ${content}
      </div>
    `;
    return backdrop;
  }

  formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  }

  formatDate(dateString) {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    }).format(date);
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Export para uso em módulos ES6
export { EventDetailView };

