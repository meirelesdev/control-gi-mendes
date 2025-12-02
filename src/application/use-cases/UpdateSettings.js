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
   * @param {number} [input.rateTravelTime] - Nova taxa por hora de viagem
   * @param {number} [input.defaultReimbursementDays] - Novos dias padrão para reembolso
   * @param {number} [input.maxHotelRate] - Novo teto de hospedagem
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
        input.rateTravelTime,
        input.defaultReimbursementDays,
        input.maxHotelRate
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
        input.rateTravelTime === undefined && 
        input.defaultReimbursementDays === undefined &&
        input.maxHotelRate === undefined) {
      throw new Error('Pelo menos um campo deve ser informado para atualização');
    }

    // As validações específicas serão feitas pela entidade Settings
    // quando chamar o método update()
  }
}

// Export para uso em módulos ES6
export { UpdateSettings };

