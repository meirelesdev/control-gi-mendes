/**
 * Implementação do Repositório de Configurações usando localStorage
 */
import { SettingsRepository } from '../../domain/repositories/SettingsRepository.js';
import { Settings } from '../../domain/entities/Settings.js';

class LocalStorageSettingsRepository extends SettingsRepository {
  constructor() {
    super();
    this.storageKey = 'gi_financas_settings';
  }

  /**
   * Salva as configurações no localStorage
   * @param {Settings} settings - Instância das configurações
   * @returns {Promise<Settings>} - Configurações salvas
   */
  async save(settings) {
    try {
      const data = {
        rateKm: settings.rateKm,
        rateTravelTime: settings.rateTravelTime,
        defaultReimbursementDays: settings.defaultReimbursementDays,
        maxHotelRate: settings.maxHotelRate,
        updatedAt: settings.updatedAt
      };
      window.localStorage.setItem(this.storageKey, JSON.stringify(data));
      return settings;
    } catch (error) {
      throw new Error(`Erro ao salvar configurações: ${error.message}`);
    }
  }

  /**
   * Busca as configurações do localStorage
   * Se não existir, retorna null (não cria padrão aqui)
   * @returns {Promise<Settings|null>} - Configurações encontradas ou null
   */
  async find() {
    try {
      const data = window.localStorage.getItem(this.storageKey);
      if (!data) {
        return null;
      }

      const parsed = JSON.parse(data);
      // Restaura instância de Settings usando o método restore
      return Settings.restore(parsed);
    } catch (error) {
      // Se houver erro ao ler, retorna null
      console.error('Erro ao ler configurações do localStorage:', error);
      return null;
    }
  }

  /**
   * Verifica se existem configurações salvas
   * @returns {Promise<boolean>} - True se existe, false caso contrário
   */
  async exists() {
    try {
      const data = window.localStorage.getItem(this.storageKey);
      return data !== null && data !== undefined;
    } catch (error) {
      return false;
    }
  }
}

// Export para uso em módulos ES6
export { LocalStorageSettingsRepository };

