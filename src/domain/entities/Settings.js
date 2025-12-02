/**
 * Entidade de Domínio: Settings
 * Singleton que contém as configurações do sistema
 */
class Settings {
  constructor(rateKm = 0.90, rateTravelTime = 75.00, defaultReimbursementDays = 21, maxHotelRate = 280.00) {
    this._validateRateKm(rateKm);
    this._validateRateTravelTime(rateTravelTime);
    this._validateDefaultReimbursementDays(defaultReimbursementDays);
    this._validateMaxHotelRate(maxHotelRate);

    this.rateKm = rateKm;
    this.rateTravelTime = rateTravelTime;
    this.defaultReimbursementDays = defaultReimbursementDays;
    this.maxHotelRate = maxHotelRate;
    this.updatedAt = new Date().toISOString();
  }

  /**
   * Valida o preço por KM
   * @private
   */
  _validateRateKm(rateKm) {
    if (rateKm === null || rateKm === undefined) {
      throw new Error('Taxa por KM é obrigatória');
    }
    if (typeof rateKm !== 'number' || isNaN(rateKm)) {
      throw new Error('Taxa por KM deve ser um número');
    }
    if (rateKm < 0) {
      throw new Error('Taxa por KM não pode ser negativa');
    }
    if (rateKm > 1000) {
      throw new Error('Taxa por KM não pode ser superior a R$ 1.000,00');
    }
  }

  /**
   * Valida o preço por hora de viagem
   * @private
   */
  _validateRateTravelTime(rateTravelTime) {
    if (rateTravelTime === null || rateTravelTime === undefined) {
      throw new Error('Taxa por hora de viagem é obrigatória');
    }
    if (typeof rateTravelTime !== 'number' || isNaN(rateTravelTime)) {
      throw new Error('Taxa por hora de viagem deve ser um número');
    }
    if (rateTravelTime < 0) {
      throw new Error('Taxa por hora de viagem não pode ser negativa');
    }
    if (rateTravelTime > 10000) {
      throw new Error('Taxa por hora de viagem não pode ser superior a R$ 10.000,00');
    }
  }

  /**
   * Valida os dias padrão para reembolso
   * @private
   */
  _validateDefaultReimbursementDays(defaultReimbursementDays) {
    if (defaultReimbursementDays === null || defaultReimbursementDays === undefined) {
      throw new Error('Dias padrão para reembolso é obrigatório');
    }
    if (!Number.isInteger(defaultReimbursementDays)) {
      throw new Error('Dias padrão para reembolso deve ser um número inteiro');
    }
    if (defaultReimbursementDays < 1) {
      throw new Error('Dias padrão para reembolso deve ser pelo menos 1');
    }
    if (defaultReimbursementDays > 365) {
      throw new Error('Dias padrão para reembolso não pode ser superior a 365');
    }
  }

  /**
   * Valida o teto máximo para hospedagem
   * @private
   */
  _validateMaxHotelRate(maxHotelRate) {
    if (maxHotelRate === null || maxHotelRate === undefined) {
      throw new Error('Teto de hospedagem é obrigatório');
    }
    if (typeof maxHotelRate !== 'number' || isNaN(maxHotelRate)) {
      throw new Error('Teto de hospedagem deve ser um número');
    }
    if (maxHotelRate < 0) {
      throw new Error('Teto de hospedagem não pode ser negativo');
    }
    if (maxHotelRate > 10000) {
      throw new Error('Teto de hospedagem não pode ser superior a R$ 10.000,00');
    }
  }

  /**
   * Atualiza as configurações
   */
  update(rateKm, rateTravelTime, defaultReimbursementDays, maxHotelRate) {
    if (rateKm !== undefined && rateKm !== null) {
      this._validateRateKm(rateKm);
      this.rateKm = rateKm;
    }
    if (rateTravelTime !== undefined && rateTravelTime !== null) {
      this._validateRateTravelTime(rateTravelTime);
      this.rateTravelTime = rateTravelTime;
    }
    if (defaultReimbursementDays !== undefined && defaultReimbursementDays !== null) {
      this._validateDefaultReimbursementDays(defaultReimbursementDays);
      this.defaultReimbursementDays = defaultReimbursementDays;
    }
    if (maxHotelRate !== undefined && maxHotelRate !== null) {
      this._validateMaxHotelRate(maxHotelRate);
      this.maxHotelRate = maxHotelRate;
    }
    this.updatedAt = new Date().toISOString();
  }

  /**
   * Calcula o valor de KM rodado
   */
  calculateKmValue(distance) {
    if (!distance || distance < 0) {
      throw new Error('Distância deve ser um número positivo');
    }
    return distance * this.rateKm;
  }

  /**
   * Calcula o valor de tempo de viagem
   */
  calculateTravelTimeValue(hours) {
    if (!hours || hours < 0) {
      throw new Error('Horas de viagem deve ser um número positivo');
    }
    return hours * this.rateTravelTime;
  }

  /**
   * Calcula a data esperada de reembolso baseada na data do evento
   */
  calculateExpectedReimbursementDate(eventDate) {
    if (!eventDate) {
      throw new Error('Data do evento é obrigatória');
    }
    const date = new Date(eventDate);
    if (isNaN(date.getTime())) {
      throw new Error('Data do evento inválida');
    }
    date.setDate(date.getDate() + this.defaultReimbursementDays);
    return date.toISOString().split('T')[0];
  }

  /**
   * Cria uma instância padrão
   * Valores conforme contrato de prestação de serviços:
   * - rateKm: R$ 0,90 por KM
   * - rateTravelTime: R$ 75,00 por hora (Hora Extra)
   * - defaultReimbursementDays: 21 dias após NF
   * - maxHotelRate: R$ 280,00 teto para hospedagem
   */
  static createDefault() {
    return new Settings(0.90, 75.00, 21, 280.00);
  }

  /**
   * Restaura uma instância a partir de dados serializados
   * Se maxHotelRate não existir nos dados antigos, usa o valor padrão (280.00)
   */
  static restore(data) {
    if (!data) {
      return Settings.createDefault();
    }
    return new Settings(
      data.rateKm !== undefined ? data.rateKm : 0.90,
      data.rateTravelTime !== undefined ? data.rateTravelTime : 75.00,
      data.defaultReimbursementDays !== undefined ? data.defaultReimbursementDays : 21,
      data.maxHotelRate !== undefined ? data.maxHotelRate : 280.00 // Valor padrão conforme contrato
    );
  }
}

// Export para uso em módulos ES6
export { Settings };

