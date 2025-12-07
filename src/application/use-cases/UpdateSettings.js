/**
 * Caso de Uso: Atualizar Configurações
 * Atualiza os valores padrão do sistema (taxas e dias de reembolso)
 */
import { Settings } from '../../domain/entities/Settings.js';

class UpdateSettings {
  constructor(settingsRepository) {
    if (!settingsRepository) {
      throw new Error('SettingsRepository é obrigatório');
    }
    this.settingsRepository = settingsRepository;
  }

  /**
   * Executa o caso de uso
   * @param {Object} input - Dados de entrada
   * @param {number} [input.rateKm] - Nova taxa por KM
   * @param {number} [input.defaultReimbursementDays] - Novos dias padrão para reembolso
   * @param {number} [input.maxHotelRate] - Novo teto de hospedagem
   * @param {number} [input.standardDailyRate] - Nova diária técnica padrão
   * @param {number} [input.overtimeRate] - Nova taxa de hora extra
   * @param {string} [input.contractorName] - Razão Social da CONTRATADA
   * @param {string} [input.contractorCNPJ] - CNPJ da CONTRATADA
   * @param {string} [input.contractorAddress] - Endereço da CONTRATADA
   * @param {string} [input.contractorRepresentative] - Nome do representante da CONTRATADA
   * @param {string} [input.contractorCPF] - CPF do representante da CONTRATADA
   * @param {string} [input.contractorPixKey] - Chave PIX da CONTRATADA
   * @param {string} [input.contractorEmails] - E-mails para envio de NF
   * @returns {Promise<Object>} - Resultado com configurações atualizadas ou erro
   */
  async execute(input) {
    try {
      // Validação de entrada
      this._validateInput(input);

      // Busca configurações existentes ou cria padrão
      let settings = await this.settingsRepository.find();
      if (!settings) {
        settings = Settings.createDefault();
      }

      // Atualiza apenas os campos informados
      settings.update(
        input.rateKm,
        input.defaultReimbursementDays,
        input.maxHotelRate,
        input.standardDailyRate,
        input.overtimeRate,
        input.contractorName,
        input.contractorCNPJ,
        input.contractorAddress,
        input.contractorRepresentative,
        input.contractorCPF,
        input.contractorPixKey,
        input.contractorEmails
      );

      // Salva as configurações atualizadas
      const savedSettings = await this.settingsRepository.save(settings);

      return {
        success: true,
        data: savedSettings
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Valida os dados de entrada
   * @private
   */
  _validateInput(input) {
    if (!input) {
      throw new Error('Dados de entrada são obrigatórios');
    }

    // Verifica se pelo menos um campo foi informado
    if (input.rateKm === undefined && 
        input.defaultReimbursementDays === undefined &&
        input.maxHotelRate === undefined &&
        input.standardDailyRate === undefined &&
        input.overtimeRate === undefined &&
        input.contractorName === undefined &&
        input.contractorCNPJ === undefined &&
        input.contractorAddress === undefined &&
        input.contractorRepresentative === undefined &&
        input.contractorCPF === undefined &&
        input.contractorPixKey === undefined &&
        input.contractorEmails === undefined) {
      throw new Error('Pelo menos um campo deve ser informado para atualização');
    }

    // As validações específicas serão feitas pela entidade Settings
    // quando chamar o método update()
  }
}

// Export para uso em módulos ES6
export { UpdateSettings };

