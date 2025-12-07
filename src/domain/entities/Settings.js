/**
 * Entidade de Domínio: Settings
 * Singleton que contém as configurações do sistema
 */
import { DEFAULT_VALUES } from '../constants/DefaultValues.js';

class Settings {
  constructor(
    rateKm = DEFAULT_VALUES.KM_RATE,
    defaultReimbursementDays = DEFAULT_VALUES.DEFAULT_REIMBURSEMENT_DAYS,
    maxHotelRate = DEFAULT_VALUES.MAX_HOTEL_RATE,
    standardDailyRate = DEFAULT_VALUES.DAILY_RATE,
    overtimeRate = DEFAULT_VALUES.OVERTIME_RATE,
    contractorName = DEFAULT_VALUES.CONTRACTOR_NAME,
    contractorCNPJ = DEFAULT_VALUES.CONTRACTOR_CNPJ,
    contractorAddress = DEFAULT_VALUES.CONTRACTOR_ADDRESS,
    contractorRepresentative = DEFAULT_VALUES.CONTRACTOR_REPRESENTATIVE,
    contractorCPF = DEFAULT_VALUES.CONTRACTOR_CPF,
    contractorPixKey = DEFAULT_VALUES.CONTRACTOR_PIX_KEY,
    contractorEmails = DEFAULT_VALUES.CONTRACTOR_EMAILS
  ) {
    this._validateRateKm(rateKm);
    this._validateDefaultReimbursementDays(defaultReimbursementDays);
    this._validateMaxHotelRate(maxHotelRate);
    this._validateStandardDailyRate(standardDailyRate);
    this._validateOvertimeRate(overtimeRate);
    this._validateContractorName(contractorName);
    this._validateContractorCNPJ(contractorCNPJ);
    this._validateContractorAddress(contractorAddress);
    this._validateContractorRepresentative(contractorRepresentative);
    this._validateContractorCPF(contractorCPF);
    this._validateContractorPixKey(contractorPixKey);
    this._validateContractorEmails(contractorEmails);

    this.rateKm = rateKm;
    this.defaultReimbursementDays = defaultReimbursementDays;
    this.maxHotelRate = maxHotelRate;
    this.standardDailyRate = standardDailyRate;
    this.overtimeRate = overtimeRate;
    this.contractorName = contractorName;
    this.contractorCNPJ = contractorCNPJ;
    this.contractorAddress = contractorAddress;
    this.contractorRepresentative = contractorRepresentative;
    this.contractorCPF = contractorCPF;
    this.contractorPixKey = contractorPixKey;
    this.contractorEmails = contractorEmails;
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
   * Valida o nome/razão social da CONTRATADA
   * @private
   */
  _validateContractorName(contractorName) {
    if (!contractorName || typeof contractorName !== 'string' || contractorName.trim() === '') {
      throw new Error('Razão Social da CONTRATADA é obrigatória');
    }
    if (contractorName.length > 200) {
      throw new Error('Razão Social não pode ter mais de 200 caracteres');
    }
  }

  /**
   * Valida o CNPJ da CONTRATADA
   * @private
   */
  _validateContractorCNPJ(contractorCNPJ) {
    if (!contractorCNPJ || typeof contractorCNPJ !== 'string' || contractorCNPJ.trim() === '') {
      throw new Error('CNPJ da CONTRATADA é obrigatório');
    }
    // Validação básica de formato CNPJ (XX.XXX.XXX/XXXX-XX)
    const cnpjRegex = /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/;
    if (!cnpjRegex.test(contractorCNPJ)) {
      throw new Error('CNPJ deve estar no formato XX.XXX.XXX/XXXX-XX');
    }
  }

  /**
   * Valida o endereço da CONTRATADA
   * @private
   */
  _validateContractorAddress(contractorAddress) {
    if (!contractorAddress || typeof contractorAddress !== 'string' || contractorAddress.trim() === '') {
      throw new Error('Endereço da CONTRATADA é obrigatório');
    }
    if (contractorAddress.length > 500) {
      throw new Error('Endereço não pode ter mais de 500 caracteres');
    }
  }

  /**
   * Valida o nome do representante da CONTRATADA
   * @private
   */
  _validateContractorRepresentative(contractorRepresentative) {
    if (!contractorRepresentative || typeof contractorRepresentative !== 'string' || contractorRepresentative.trim() === '') {
      throw new Error('Nome do representante da CONTRATADA é obrigatório');
    }
    if (contractorRepresentative.length > 200) {
      throw new Error('Nome do representante não pode ter mais de 200 caracteres');
    }
  }

  /**
   * Valida o CPF do representante da CONTRATADA
   * @private
   */
  _validateContractorCPF(contractorCPF) {
    if (!contractorCPF || typeof contractorCPF !== 'string' || contractorCPF.trim() === '') {
      throw new Error('CPF do representante da CONTRATADA é obrigatório');
    }
    // Validação básica de formato CPF (XXX.XXX.XXX-XX)
    const cpfRegex = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/;
    if (!cpfRegex.test(contractorCPF)) {
      throw new Error('CPF deve estar no formato XXX.XXX.XXX-XX');
    }
  }

  /**
   * Valida a chave PIX da CONTRATADA
   * @private
   */
  _validateContractorPixKey(contractorPixKey) {
    if (!contractorPixKey || typeof contractorPixKey !== 'string' || contractorPixKey.trim() === '') {
      throw new Error('Chave PIX da CONTRATADA é obrigatória');
    }
    if (contractorPixKey.length > 100) {
      throw new Error('Chave PIX não pode ter mais de 100 caracteres');
    }
  }

  /**
   * Valida os e-mails para envio de NF
   * @private
   */
  _validateContractorEmails(contractorEmails) {
    if (!contractorEmails || typeof contractorEmails !== 'string' || contractorEmails.trim() === '') {
      throw new Error('E-mails para envio de NF são obrigatórios');
    }
    // Validação básica de formato de e-mail (permite múltiplos separados por vírgula)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+(,\s*[^\s@]+@[^\s@]+\.[^\s@]+)*$/;
    if (!emailRegex.test(contractorEmails)) {
      throw new Error('E-mails devem estar em formato válido (separados por vírgula se houver múltiplos)');
    }
  }

  /**
   * Atualiza as configurações
   */
  update(
    rateKm,
    defaultReimbursementDays,
    maxHotelRate,
    standardDailyRate,
    overtimeRate,
    contractorName,
    contractorCNPJ,
    contractorAddress,
    contractorRepresentative,
    contractorCPF,
    contractorPixKey,
    contractorEmails
  ) {
    if (rateKm !== undefined && rateKm !== null) {
      this._validateRateKm(rateKm);
      this.rateKm = rateKm;
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
    if (contractorName !== undefined && contractorName !== null) {
      this._validateContractorName(contractorName);
      this.contractorName = contractorName;
    }
    if (contractorCNPJ !== undefined && contractorCNPJ !== null) {
      this._validateContractorCNPJ(contractorCNPJ);
      this.contractorCNPJ = contractorCNPJ;
    }
    if (contractorAddress !== undefined && contractorAddress !== null) {
      this._validateContractorAddress(contractorAddress);
      this.contractorAddress = contractorAddress;
    }
    if (contractorRepresentative !== undefined && contractorRepresentative !== null) {
      this._validateContractorRepresentative(contractorRepresentative);
      this.contractorRepresentative = contractorRepresentative;
    }
    if (contractorCPF !== undefined && contractorCPF !== null) {
      this._validateContractorCPF(contractorCPF);
      this.contractorCPF = contractorCPF;
    }
    if (contractorPixKey !== undefined && contractorPixKey !== null) {
      this._validateContractorPixKey(contractorPixKey);
      this.contractorPixKey = contractorPixKey;
    }
    if (contractorEmails !== undefined && contractorEmails !== null) {
      this._validateContractorEmails(contractorEmails);
      this.contractorEmails = contractorEmails;
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
   * - rateKm: R$ 0,90 por KM (combustível)
   * - defaultReimbursementDays: 21 dias após NF
   * - maxHotelRate: R$ 280,00 teto para hospedagem
   * - standardDailyRate: R$ 300,00 diária técnica padrão
   * - overtimeRate: R$ 75,00 por hora extra (trabalho + tempo de viagem)
   * - Dados da CONTRATADA conforme contrato
   */
  static createDefault() {
    return new Settings(
      DEFAULT_VALUES.KM_RATE,
      DEFAULT_VALUES.DEFAULT_REIMBURSEMENT_DAYS,
      DEFAULT_VALUES.MAX_HOTEL_RATE,
      DEFAULT_VALUES.DAILY_RATE,
      DEFAULT_VALUES.OVERTIME_RATE,
      DEFAULT_VALUES.CONTRACTOR_NAME,
      DEFAULT_VALUES.CONTRACTOR_CNPJ,
      DEFAULT_VALUES.CONTRACTOR_ADDRESS,
      DEFAULT_VALUES.CONTRACTOR_REPRESENTATIVE,
      DEFAULT_VALUES.CONTRACTOR_CPF,
      DEFAULT_VALUES.CONTRACTOR_PIX_KEY,
      DEFAULT_VALUES.CONTRACTOR_EMAILS
    );
  }

  /**
   * Restaura uma instância a partir de dados serializados
   * Usa valores padrão para campos que não existirem nos dados antigos
   * NOTA: rateTravelTime foi removido (use overtimeRate para hora extra/tempo de viagem)
   */
  static restore(data) {
    if (!data) {
      return Settings.createDefault();
    }
    return new Settings(
      data.rateKm !== undefined ? data.rateKm : DEFAULT_VALUES.KM_RATE,
      data.defaultReimbursementDays !== undefined ? data.defaultReimbursementDays : DEFAULT_VALUES.DEFAULT_REIMBURSEMENT_DAYS,
      data.maxHotelRate !== undefined ? data.maxHotelRate : DEFAULT_VALUES.MAX_HOTEL_RATE,
      data.standardDailyRate !== undefined ? data.standardDailyRate : DEFAULT_VALUES.DAILY_RATE,
      data.overtimeRate !== undefined ? data.overtimeRate : DEFAULT_VALUES.OVERTIME_RATE,
      data.contractorName !== undefined ? data.contractorName : DEFAULT_VALUES.CONTRACTOR_NAME,
      data.contractorCNPJ !== undefined ? data.contractorCNPJ : DEFAULT_VALUES.CONTRACTOR_CNPJ,
      data.contractorAddress !== undefined ? data.contractorAddress : DEFAULT_VALUES.CONTRACTOR_ADDRESS,
      data.contractorRepresentative !== undefined ? data.contractorRepresentative : DEFAULT_VALUES.CONTRACTOR_REPRESENTATIVE,
      data.contractorCPF !== undefined ? data.contractorCPF : DEFAULT_VALUES.CONTRACTOR_CPF,
      data.contractorPixKey !== undefined ? data.contractorPixKey : DEFAULT_VALUES.CONTRACTOR_PIX_KEY,
      data.contractorEmails !== undefined ? data.contractorEmails : DEFAULT_VALUES.CONTRACTOR_EMAILS
    );
  }
}

// Export para uso em módulos ES6
export { Settings };

