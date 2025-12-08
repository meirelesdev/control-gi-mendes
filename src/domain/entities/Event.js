/**
 * Entidade de Domínio: Event
 * Agregado principal que representa um evento culinário
 */
class Event {
  // Constantes de status
  static STATUS_PLANNED = 'PLANNED';
  static STATUS_DONE = 'DONE';
  static STATUS_REPORT_SENT = 'REPORT_SENT';
  static STATUS_PAID = 'PAID';

  constructor(id, name, date, status = 'PLANNED', description = '', expectedPaymentDate = null, client = '', city = '', startDate = null, endDate = null) {
    this._validateId(id);
    this._validateName(name);
    this._validateDate(date);
    this._validateStatus(status);
    this._validateDescription(description);
    this._validateClient(client);
    this._validateCity(city);
    
    // Se startDate não for fornecida, usa date como padrão
    const finalStartDate = startDate || date;
    // Se endDate não for fornecida, mantém null (será validado apenas se ambos existirem)
    const finalEndDate = endDate || null;
    
    // Valida o intervalo apenas se ambas as datas existirem
    if (finalStartDate && finalEndDate) {
      this._validateDateRange(finalStartDate, finalEndDate);
    }

    this.id = id;
    this.name = name.trim();
    this.date = date; // Mantém para compatibilidade
    this.status = status;
    this.description = description.trim();
    this.client = client.trim();
    this.city = city.trim();
    this.startDate = finalStartDate;
    this.endDate = finalEndDate;
    this.expectedPaymentDate = expectedPaymentDate; // Data prevista de pagamento (calculada quando status = REPORT_SENT)
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
    const validStatuses = [
      Event.STATUS_PLANNED,
      Event.STATUS_DONE,
      Event.STATUS_REPORT_SENT,
      Event.STATUS_PAID,
      // Mantém compatibilidade com status antigos
      'IN_PROGRESS',
      'COMPLETED',
      'CANCELLED'
    ];
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
   * Valida o cliente do evento
   * @private
   */
  _validateClient(client) {
    if (!client || typeof client !== 'string' || client.trim() === '') {
      throw new Error('Cliente do evento é obrigatório');
    }
    if (client.trim().length < 3) {
      throw new Error('Cliente deve ter pelo menos 3 caracteres');
    }
    if (client.trim().length > 200) {
      throw new Error('Cliente não pode ter mais de 200 caracteres');
    }
  }

  /**
   * Valida a cidade do evento
   * @private
   */
  _validateCity(city) {
    if (!city || typeof city !== 'string' || city.trim() === '') {
      throw new Error('Cidade do evento é obrigatória');
    }
    if (city.trim().length < 3) {
      throw new Error('Cidade deve ter pelo menos 3 caracteres');
    }
    if (city.trim().length > 200) {
      throw new Error('Cidade não pode ter mais de 200 caracteres');
    }
  }

  /**
   * Valida o intervalo de datas (início e fim)
   * @private
   */
  _validateDateRange(startDate, endDate) {
    if (!startDate || !endDate) {
      return; // Se não foram fornecidas, validação será feita em _validateDate
    }
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isNaN(start.getTime())) {
      throw new Error('Data de início inválida');
    }
    if (isNaN(end.getTime())) {
      throw new Error('Data de fim inválida');
    }
    
    if (end < start) {
      throw new Error('Data de fim não pode ser anterior à data de início');
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
    const oldDate = this.date;
    this.date = date;
    
    // Se startDate ou endDate não existirem ou forem iguais à data antiga, atualiza também
    // Isso mantém a sincronização quando apenas date é alterada
    if (!this.startDate || this.startDate === oldDate) {
      this.startDate = date;
    }
    if (!this.endDate || this.endDate === oldDate) {
      this.endDate = date;
    }
    
    // Valida o intervalo após atualizar
    this._validateDateRange(this.startDate, this.endDate);
    
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
   * Marca o evento como "Relatório Enviado"
   * Calcula automaticamente a data prevista de pagamento baseada nos dias padrão de reembolso
   * @param {Date|string} reportSentDate - Data em que o relatório foi enviado (padrão: hoje)
   * @param {number} reimbursementDays - Número de dias para reembolso (padrão: 21)
   */
  markAsReportSent(reportSentDate = new Date(), reimbursementDays = null) {
    const sentDate = reportSentDate instanceof Date ? reportSentDate : new Date(reportSentDate);
    
    if (isNaN(sentDate.getTime())) {
      throw new Error('Data de envio do relatório inválida');
    }

    if (!Number.isInteger(reimbursementDays) || reimbursementDays < 1) {
      throw new Error('Dias de reembolso deve ser um número inteiro positivo');
    }

    // Calcula data prevista de pagamento: data de envio + dias de reembolso
    const expectedDate = new Date(sentDate);
    expectedDate.setDate(expectedDate.getDate() + reimbursementDays);
    
    this.status = Event.STATUS_REPORT_SENT;
    this.expectedPaymentDate = expectedDate.toISOString().split('T')[0];
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
   * Atualiza o cliente do evento
   */
  updateClient(client) {
    this._validateClient(client);
    this.client = client.trim();
    this.updatedAt = new Date().toISOString();
  }

  /**
   * Atualiza a cidade do evento
   */
  updateCity(city) {
    this._validateCity(city);
    this.city = city.trim();
    this.updatedAt = new Date().toISOString();
  }

  /**
   * Atualiza a data de início do evento
   */
  updateStartDate(startDate) {
    this._validateDate(startDate);
    const endDateToValidate = this.endDate || this.date;
    this._validateDateRange(startDate, endDateToValidate);
    this.startDate = startDate;
    // Se endDate não existe ou é igual à date antiga, mantém date como referência
    // Não atualiza date automaticamente para manter compatibilidade
    this.updatedAt = new Date().toISOString();
  }

  /**
   * Atualiza a data de fim do evento
   */
  updateEndDate(endDate) {
    // Se endDate for null ou vazio, apenas remove (é opcional)
    if (endDate === null || endDate === '') {
      this.endDate = null;
      this.updatedAt = new Date().toISOString();
      return;
    }
    
    this._validateDate(endDate);
    const startDateToValidate = this.startDate || this.date;
    this._validateDateRange(startDateToValidate, endDate);
    this.endDate = endDate;
    this.updatedAt = new Date().toISOString();
  }

  /**
   * Atualiza múltiplos campos do evento
   */
  update(name, date, status, description, client, city, startDate, endDate) {
    if (name !== undefined) this.updateName(name);
    if (date !== undefined) this.updateDate(date);
    if (status !== undefined) this.updateStatus(status);
    if (description !== undefined) this.updateDescription(description);
    if (client !== undefined) this.updateClient(client);
    if (city !== undefined) this.updateCity(city);
    if (startDate !== undefined) this.updateStartDate(startDate);
    if (endDate !== undefined) this.updateEndDate(endDate);
  }

  /**
   * Verifica se o evento está planejado
   */
  isPlanned() {
    return this.status === Event.STATUS_PLANNED || this.status === 'PLANNED';
  }

  /**
   * Verifica se o evento foi realizado
   */
  isDone() {
    return this.status === Event.STATUS_DONE || this.status === 'DONE' || this.status === 'COMPLETED';
  }

  /**
   * Verifica se o relatório foi enviado
   */
  isReportSent() {
    return this.status === Event.STATUS_REPORT_SENT || this.status === 'REPORT_SENT';
  }

  /**
   * Verifica se o evento foi pago/finalizado
   */
  isPaid() {
    return this.status === Event.STATUS_PAID || this.status === 'PAID';
  }

  /**
   * Verifica se o evento está em progresso (compatibilidade)
   */
  isInProgress() {
    return this.status === 'IN_PROGRESS';
  }

  /**
   * Verifica se o evento está completo (compatibilidade)
   */
  isCompleted() {
    return this.status === 'COMPLETED' || this.isDone();
  }

  /**
   * Verifica se o evento foi cancelado
   */
  isCancelled() {
    return this.status === 'CANCELLED';
  }

  /**
   * Verifica se o evento pode ser editado
   * Regra de negócio: Eventos com status PAID não podem ser editados
   * para garantir integridade dos dados financeiros (pagamentos recebidos)
   * Eventos com status REPORT_SENT ainda podem ser editados antes de serem finalizados
   * @returns {boolean} - true se o evento pode ser editado, false caso contrário
   */
  get isEditable() {
    return this.status !== Event.STATUS_PAID &&
           this.status !== 'PAID';
  }

  /**
   * Atualiza os detalhes do evento (nome, data, descrição, client, city, startDate, endDate)
   * Valida se o evento é editável antes de permitir a atualização
   * @param {Object} details - Detalhes a serem atualizados
   * @param {string} [details.name] - Novo nome do evento
   * @param {string|Date} [details.date] - Nova data do evento
   * @param {string} [details.description] - Nova descrição do evento
   * @param {string} [details.client] - Novo cliente do evento
   * @param {string} [details.city] - Nova cidade do evento
   * @param {string|Date} [details.startDate] - Nova data de início do evento
   * @param {string|Date} [details.endDate] - Nova data de fim do evento
   * @throws {Error} - Se o evento não for editável ou se os dados forem inválidos
   */
  updateDetails({ name, date, description, client, city, startDate, endDate }) {
    // Valida se o evento pode ser editado
    if (!this.isEditable) {
      throw new Error(
        `Evento não pode ser editado. Status atual: ${this.status}. ` +
        `Eventos com status "Finalizado/Pago" não podem ser editados.`
      );
    }

    // Atualiza apenas os campos informados
    if (name !== undefined) {
      this.updateName(name);
    }
    if (date !== undefined) {
      this.updateDate(date);
    }
    if (description !== undefined) {
      this.updateDescription(description);
    }
    if (client !== undefined) {
      this.updateClient(client);
    }
    if (city !== undefined) {
      this.updateCity(city);
    }
    if (startDate !== undefined) {
      this.updateStartDate(startDate);
    }
    if (endDate !== undefined) {
      this.updateEndDate(endDate);
    }

    // Atualiza timestamp de modificação
    this.updatedAt = new Date().toISOString();
  }

  /**
   * Cria um novo evento
   * Se startDate não for informada, usa date
   * Se endDate não for informada, mantém como null (não usa startDate como padrão)
   */
  static create(name, date, description = '', client = '', city = '', startDate = null, endDate = null) {
    const id = `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    // Se startDate não foi informada, usa date
    const finalStartDate = startDate || date;
    // Se endDate não foi informada, mantém null (será tratado na validação)
    const finalEndDate = endDate || null;
    return new Event(id, name, date, 'PLANNED', description, null, client, city, finalStartDate, finalEndDate);
  }

  /**
   * Restaura um evento a partir de dados serializados
   * Fornece valores padrão para campos obrigatórios que podem não existir em eventos antigos
   */
  static restore(data) {
    if (!data) {
      throw new Error('Dados do evento são obrigatórios');
    }
    
    // Valores padrão para eventos antigos que não têm client e city
    // Usa valores que passam na validação (mínimo 3 caracteres)
    const defaultClient = 'Cliente não informado';
    const defaultCity = 'Cidade não informada';
    
    const event = new Event(
      data.id,
      data.name,
      data.date,
      data.status || 'PLANNED',
      data.description || '',
      data.expectedPaymentDate || null,
      data.client || defaultClient,
      data.city || defaultCity,
      data.startDate || null,
      data.endDate || null
    );
    return event;
  }
}

// Export para uso em módulos ES6
export { Event };

