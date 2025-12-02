/**
 * Entidade de Domínio: Transaction
 * Representa uma transação financeira relacionada a um evento
 * Pode ser EXPENSE (despesa) ou INCOME (receita)
 */
class Transaction {
  constructor(id, eventId, type, description, amount, metadata = {}) {
    this._validateId(id);
    this._validateEventId(eventId);
    this._validateType(type);
    this._validateDescription(description);
    this._validateAmount(amount);
    this._validateMetadata(type, metadata);

    this.id = id;
    this.eventId = eventId;
    this.type = type;
    this.description = description.trim();
    this.amount = amount;
    this.metadata = { ...metadata };
    this.createdAt = new Date().toISOString();
    this.updatedAt = this.createdAt;
  }

  /**
   * Valida o ID da transação
   * @private
   */
  _validateId(id) {
    if (!id || typeof id !== 'string' || id.trim() === '') {
      throw new Error('ID da transação é obrigatório');
    }
    if (id.length > 100) {
      throw new Error('ID da transação não pode ter mais de 100 caracteres');
    }
  }

  /**
   * Valida o ID do evento
   * @private
   */
  _validateEventId(eventId) {
    if (!eventId || typeof eventId !== 'string' || eventId.trim() === '') {
      throw new Error('ID do evento é obrigatório');
    }
  }

  /**
   * Valida o tipo da transação
   * @private
   */
  _validateType(type) {
    const validTypes = ['EXPENSE', 'INCOME'];
    if (!validTypes.includes(type)) {
      throw new Error(`Tipo inválido. Deve ser 'EXPENSE' ou 'INCOME'`);
    }
  }

  /**
   * Valida a descrição da transação
   * @private
   */
  _validateDescription(description) {
    if (!description || typeof description !== 'string' || description.trim() === '') {
      throw new Error('Descrição da transação é obrigatória');
    }
    if (description.trim().length < 3) {
      throw new Error('Descrição deve ter pelo menos 3 caracteres');
    }
    if (description.trim().length > 500) {
      throw new Error('Descrição não pode ter mais de 500 caracteres');
    }
  }

  /**
   * Valida o valor da transação
   * @private
   */
  _validateAmount(amount) {
    if (amount === null || amount === undefined) {
      throw new Error('Valor da transação é obrigatório');
    }
    if (typeof amount !== 'number' || isNaN(amount)) {
      throw new Error('Valor da transação deve ser um número');
    }
    if (amount <= 0) {
      throw new Error('Valor da transação deve ser maior que zero');
    }
    if (amount > 10000000) {
      throw new Error('Valor da transação não pode ser superior a R$ 10.000.000,00');
    }
  }

  /**
   * Valida os metadados baseado no tipo da transação
   * @private
   */
  _validateMetadata(type, metadata) {
    if (type === 'EXPENSE') {
      // Para EXPENSE, deve ter hasReceipt (boolean)
      if (metadata.hasReceipt !== undefined && typeof metadata.hasReceipt !== 'boolean') {
        throw new Error('hasReceipt deve ser um boolean');
      }
      // Garante que hasReceipt existe
      if (metadata.hasReceipt === undefined) {
        this.metadata.hasReceipt = false;
      }
    } else if (type === 'INCOME') {
      // Para INCOME, deve ter isReimbursement (boolean) para diferenciar reembolso de honorário
      if (metadata.isReimbursement !== undefined && typeof metadata.isReimbursement !== 'boolean') {
        throw new Error('isReimbursement deve ser um boolean');
      }
      // Garante que isReimbursement existe
      if (metadata.isReimbursement === undefined) {
        this.metadata.isReimbursement = false;
      }
      
      // Para INCOME, pode ter category (diaria, hora_extra, km, tempo_viagem)
      if (metadata.category) {
        const validCategories = ['diaria', 'hora_extra', 'km', 'tempo_viagem'];
        if (!validCategories.includes(metadata.category)) {
          throw new Error(`Categoria inválida. Deve ser uma das: ${validCategories.join(', ')}`);
        }
      }
    }
  }

  /**
   * Verifica se é uma despesa
   */
  isExpense() {
    return this.type === 'EXPENSE';
  }

  /**
   * Verifica se é uma receita
   */
  isIncome() {
    return this.type === 'INCOME';
  }

  /**
   * Verifica se tem nota fiscal (apenas para EXPENSE)
   */
  hasReceipt() {
    if (!this.isExpense()) {
      throw new Error('hasReceipt só é válido para transações do tipo EXPENSE');
    }
    return this.metadata.hasReceipt === true;
  }

  /**
   * Marca a nota fiscal como emitida/arquivada
   */
  markReceiptAsIssued() {
    if (!this.isExpense()) {
      throw new Error('Apenas transações do tipo EXPENSE podem ter nota fiscal');
    }
    this.metadata.hasReceipt = true;
    this.updatedAt = new Date().toISOString();
  }

  /**
   * Verifica se é um reembolso (apenas para INCOME)
   */
  isReimbursement() {
    if (!this.isIncome()) {
      throw new Error('isReimbursement só é válido para transações do tipo INCOME');
    }
    return this.metadata.isReimbursement === true;
  }

  /**
   * Verifica se é um honorário (apenas para INCOME)
   */
  isFee() {
    if (!this.isIncome()) {
      throw new Error('isFee só é válido para transações do tipo INCOME');
    }
    return this.metadata.isReimbursement === false;
  }

  /**
   * Obtém a categoria da receita (apenas para INCOME)
   */
  getCategory() {
    if (!this.isIncome()) {
      return null;
    }
    return this.metadata.category || null;
  }

  /**
   * Atualiza a descrição da transação
   */
  updateDescription(description) {
    this._validateDescription(description);
    this.description = description.trim();
    this.updatedAt = new Date().toISOString();
  }

  /**
   * Atualiza o valor da transação
   */
  updateAmount(amount) {
    this._validateAmount(amount);
    this.amount = amount;
    this.updatedAt = new Date().toISOString();
  }

  /**
   * Atualiza os metadados da transação
   */
  updateMetadata(metadata) {
    this._validateMetadata(this.type, { ...this.metadata, ...metadata });
    this.metadata = { ...this.metadata, ...metadata };
    this.updatedAt = new Date().toISOString();
  }

  /**
   * Atualiza os detalhes da transação (descrição, valor e metadados opcionais)
   * @param {Object} details - Detalhes a serem atualizados
   * @param {string} [details.description] - Nova descrição
   * @param {number} [details.amount] - Novo valor
   * @param {Object} [details.metadata] - Novos metadados (parcial, será mesclado com os existentes)
   */
  updateDetails({ description, amount, metadata }) {
    if (description !== undefined) {
      this.updateDescription(description);
    }
    if (amount !== undefined) {
      this.updateAmount(amount);
    }
    if (metadata !== undefined) {
      this.updateMetadata(metadata);
    }
    // updatedAt já é atualizado pelos métodos individuais
  }

  /**
   * Cria uma transação do tipo EXPENSE
   */
  static createExpense(eventId, description, amount, hasReceipt = false) {
    const id = `expense_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return new Transaction(id, eventId, 'EXPENSE', description, amount, {
      hasReceipt
    });
  }

  /**
   * Cria uma transação do tipo INCOME
   */
  static createIncome(eventId, description, amount, isReimbursement = false, category = null) {
    const id = `income_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const metadata = { isReimbursement };
    if (category) {
      metadata.category = category;
    }
    return new Transaction(id, eventId, 'INCOME', description, amount, metadata);
  }

  /**
   * Cria uma transação de KM (INCOME - geralmente reembolso)
   */
  static createKmIncome(eventId, description, distance, rateKm, isReimbursement = true) {
    const amount = distance * rateKm;
    return Transaction.createIncome(eventId, description, amount, isReimbursement, 'km');
  }

  /**
   * Cria uma transação de tempo de viagem (INCOME - geralmente reembolso)
   */
  static createTravelTimeIncome(eventId, description, hours, rateTravelTime, isReimbursement = true) {
    const amount = hours * rateTravelTime;
    return Transaction.createIncome(eventId, description, amount, isReimbursement, 'tempo_viagem');
  }

  /**
   * Restaura uma transação a partir de dados serializados
   */
  static restore(data) {
    if (!data) {
      throw new Error('Dados da transação são obrigatórios');
    }
    return new Transaction(
      data.id,
      data.eventId,
      data.type,
      data.description,
      data.amount,
      data.metadata || {}
    );
  }
}

// Export para uso em módulos ES6
export { Transaction };

