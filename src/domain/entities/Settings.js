/**
 * Entidade de Domínio: Settings
 * Singleton que contém as configurações do sistema
 */
import { DEFAULT_VALUES } from '../constants/DefaultValues.js';

class Settings {
  constructor(rateKm = DEFAULT_VALUES.KM_RATE, rateTravelTime = DEFAULT_VALUES.TRAVEL_TIME_RATE, defaultReimbursementDays = DEFAULT_VALUES.DEFAULT_REIMBURSEMENT_DAYS, maxHotelRate = DEFAULT_VALUES.MAX_HOTEL_RATE, standardDailyRate = DEFAULT_VALUES.DAILY_RATE, overtimeRate = DEFAULT_VALUES.OVERTIME_RATE) {
    this._validateRateKm(rateKm);
    this._validateRateTravelTime(rateTravelTime);
    this._validateDefaultReimbursementDays(defaultReimbursementDays);
    this._validateMaxHotelRate(maxHotelRate);
    this._validateStandardDailyRate(standardDailyRate);
    this._validateOvertimeRate(overtimeRate);

    this.rateKm = rateKm;
    this.rateTravelTime = rateTravelTime;
    this.defaultReimbursementDays = defaultReimbursementDays;
    this.maxHotelRate = maxHotelRate;
    this.standardDailyRate = standardDailyRate;
    this.overtimeRate = overtimeRate;
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
   * Valida o valor padrão da diária técnica
   * @private
   */
  _validateStandardDailyRate(standardDailyRate) {
    if (standardDailyRate === null || standardDailyRate === undefined) {
      throw new Error('Valor padrão da diária é obrigatório');
    }
    if (typeof standardDailyRate !== 'number' || isNaN(standardDailyRate)) {
      throw new Error('Valor padrão da diária deve ser um número');
    }
    if (standardDailyRate < 0) {
      throw new Error('Valor padrão da diária não pode ser negativo');
    }
    if (standardDailyRate > 10000) {
      throw new Error('Valor padrão da diária não pode ser superior a R$ 10.000,00');
    }
  }

  /**
   * Valida o valor da hora extra
   * @private
   */
  _validateOvertimeRate(overtimeRate) {
    if (overtimeRate === null || overtimeRate === undefined) {
      throw new Error('Valor da hora extra é obrigatório');
    }
    if (typeof overtimeRate !== 'number' || isNaN(overtimeRate)) {
      throw new Error('Valor da hora extra deve ser um número');
    }
    if (overtimeRate < 0) {
      throw new Error('Valor da hora extra não pode ser negativo');
    }
    if (overtimeRate > 10000) {
      throw new Error('Valor da hora extra não pode ser superior a R$ 10.000,00');
    }
  }

  /**
   * Atualiza as configurações
   */
  update(rateKm, rateTravelTime, defaultReimbursementDays, maxHotelRate, standardDailyRate, overtimeRate) {
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
    if (standardDailyRate !== undefined && standardDailyRate !== null) {
      this._validateStandardDailyRate(standardDailyRate);
      this.standardDailyRate = standardDailyRate;
    }
    if (overtimeRate !== undefined && overtimeRate !== null) {
      this._validateOvertimeRate(overtimeRate);
      this.overtimeRate = overtimeRate;
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
   * - rateTravelTime: R$ 75,00 por hora (Tempo de Viagem)
   * - defaultReimbursementDays: 21 dias após NF
   * - maxHotelRate: R$ 280,00 teto para hospedagem
   * - standardDailyRate: R$ 300,00 diária técnica padrão
   * - overtimeRate: R$ 75,00 por hora extra
   */
  static createDefault() {
    return new Settings(
      DEFAULT_VALUES.KM_RATE,
      DEFAULT_VALUES.TRAVEL_TIME_RATE,
      DEFAULT_VALUES.DEFAULT_REIMBURSEMENT_DAYS,
      DEFAULT_VALUES.MAX_HOTEL_RATE,
      DEFAULT_VALUES.DAILY_RATE,
      DEFAULT_VALUES.OVERTIME_RATE
    );
  }

  /**
   * Restaura uma instância a partir de dados serializados
   * Usa valores padrão para campos que não existirem nos dados antigos
   */
  static restore(data) {
    if (!data) {
      return Settings.createDefault();
    }
    return new Settings(
      data.rateKm !== undefined ? data.rateKm : DEFAULT_VALUES.KM_RATE,
      data.rateTravelTime !== undefined ? data.rateTravelTime : DEFAULT_VALUES.TRAVEL_TIME_RATE,
      data.defaultReimbursementDays !== undefined ? data.defaultReimbursementDays : DEFAULT_VALUES.DEFAULT_REIMBURSEMENT_DAYS,
      data.maxHotelRate !== undefined ? data.maxHotelRate : DEFAULT_VALUES.MAX_HOTEL_RATE,
      data.standardDailyRate !== undefined ? data.standardDailyRate : DEFAULT_VALUES.DAILY_RATE,
      data.overtimeRate !== undefined ? data.overtimeRate : DEFAULT_VALUES.OVERTIME_RATE
    );
  }
}

// Export para uso em módulos ES6
export { Settings };

