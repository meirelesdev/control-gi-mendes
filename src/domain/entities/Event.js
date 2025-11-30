/**
 * Entidade de Domínio: Event
 * Agregado principal que representa um evento culinário
 */
class Event {
  constructor(id, name, date, status = 'PLANNED', description = '') {
    this._validateId(id);
    this._validateName(name);
    this._validateDate(date);
    this._validateStatus(status);
    this._validateDescription(description);

    this.id = id;
    this.name = name.trim();
    this.date = date;
    this.status = status;
    this.description = description.trim();
    this.createdAt = new Date().toISOString();
    this.updatedAt = this.createdAt;
  }

  /**
   * Valida o ID do evento
   * @private
   */
  _validateId(id) {
    if (!id || typeof id !== 'string' || id.trim() === '') {
      throw new Error('ID do evento é obrigatório');
    }
    if (id.length > 100) {
      throw new Error('ID do evento não pode ter mais de 100 caracteres');
    }
  }

  /**
   * Valida o nome do evento
   * @private
   */
  _validateName(name) {
    if (!name || typeof name !== 'string' || name.trim() === '') {
      throw new Error('Nome do evento é obrigatório');
    }
    if (name.trim().length < 3) {
      throw new Error('Nome do evento deve ter pelo menos 3 caracteres');
    }
    if (name.trim().length > 200) {
      throw new Error('Nome do evento não pode ter mais de 200 caracteres');
    }
  }

  /**
   * Valida a data do evento
   * @private
   */
  _validateDate(date) {
    if (!date) {
      throw new Error('Data do evento é obrigatória');
    }
    
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      throw new Error('Data do evento inválida');
    }

    // Verifica se a data não é muito antiga (mais de 10 anos)
    const tenYearsAgo = new Date();
    tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10);
    if (dateObj < tenYearsAgo) {
      throw new Error('Data do evento não pode ser anterior a 10 anos');
    }

    // Verifica se a data não é muito futura (mais de 5 anos)
    const fiveYearsFromNow = new Date();
    fiveYearsFromNow.setFullYear(fiveYearsFromNow.getFullYear() + 5);
    if (dateObj > fiveYearsFromNow) {
      throw new Error('Data do evento não pode ser posterior a 5 anos');
    }
  }

  /**
   * Valida o status do evento
   * @private
   */
  _validateStatus(status) {
    const validStatuses = ['PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      throw new Error(`Status inválido. Deve ser um dos: ${validStatuses.join(', ')}`);
    }
  }

  /**
   * Valida a descrição do evento
   * @private
   */
  _validateDescription(description) {
    if (description && typeof description !== 'string') {
      throw new Error('Descrição deve ser uma string');
    }
    if (description && description.length > 1000) {
      throw new Error('Descrição não pode ter mais de 1000 caracteres');
    }
  }

  /**
   * Atualiza o nome do evento
   */
  updateName(name) {
    this._validateName(name);
    this.name = name.trim();
    this.updatedAt = new Date().toISOString();
  }

  /**
   * Atualiza a data do evento
   */
  updateDate(date) {
    this._validateDate(date);
    this.date = date;
    this.updatedAt = new Date().toISOString();
  }

  /**
   * Atualiza o status do evento
   */
  updateStatus(status) {
    this._validateStatus(status);
    this.status = status;
    this.updatedAt = new Date().toISOString();
  }

  /**
   * Atualiza a descrição do evento
   */
  updateDescription(description) {
    this._validateDescription(description);
    this.description = description ? description.trim() : '';
    this.updatedAt = new Date().toISOString();
  }

  /**
   * Atualiza múltiplos campos do evento
   */
  update(name, date, status, description) {
    if (name !== undefined) this.updateName(name);
    if (date !== undefined) this.updateDate(date);
    if (status !== undefined) this.updateStatus(status);
    if (description !== undefined) this.updateDescription(description);
  }

  /**
   * Verifica se o evento está planejado
   */
  isPlanned() {
    return this.status === 'PLANNED';
  }

  /**
   * Verifica se o evento está em progresso
   */
  isInProgress() {
    return this.status === 'IN_PROGRESS';
  }

  /**
   * Verifica se o evento está completo
   */
  isCompleted() {
    return this.status === 'COMPLETED';
  }

  /**
   * Verifica se o evento foi cancelado
   */
  isCancelled() {
    return this.status === 'CANCELLED';
  }

  /**
   * Cria um novo evento
   */
  static create(name, date, description = '') {
    const id = `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return new Event(id, name, date, 'PLANNED', description);
  }

  /**
   * Restaura um evento a partir de dados serializados
   */
  static restore(data) {
    if (!data) {
      throw new Error('Dados do evento são obrigatórios');
    }
    return new Event(
      data.id,
      data.name,
      data.date,
      data.status || 'PLANNED',
      data.description || ''
    );
  }
}

