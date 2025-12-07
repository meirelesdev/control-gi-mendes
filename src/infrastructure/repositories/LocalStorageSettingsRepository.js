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
        defaultReimbursementDays: settings.defaultReimbursementDays,
        maxHotelRate: settings.maxHotelRate,
        standardDailyRate: settings.standardDailyRate,
        overtimeRate: settings.overtimeRate,
        contractorName: settings.contractorName,
        contractorCNPJ: settings.contractorCNPJ,
        contractorAddress: settings.contractorAddress,
        contractorRepresentative: settings.contractorRepresentative,
        contractorCPF: settings.contractorCPF,
        contractorPixKey: settings.contractorPixKey,
        contractorEmails: settings.contractorEmails,
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
      // Se for erro de sintaxe JSON (dados corrompidos), faz backup e retorna null
      if (error instanceof SyntaxError) {
        const backupKey = `${this.storageKey}_corrupted_bkp_${Date.now()}`;
        try {
          const corruptedData = window.localStorage.getItem(this.storageKey);
          window.localStorage.setItem(backupKey, corruptedData);
          window.localStorage.removeItem(this.storageKey);
          console.error('⚠️ DADOS CORROMPIDOS DETECTADOS:', {
            storageKey: this.storageKey,
            backupKey: backupKey,
            error: error.message,
            message: 'As configurações foram movidas para backup. O sistema usará valores padrão.'
          });
          // Notifica o usuário via console (em produção, poderia usar toast)
          if (window.toast) {
            window.toast.warning('Configurações corrompidas detectadas. Backup criado. Usando valores padrão.');
          }
        } catch (backupError) {
          console.error('Erro ao criar backup de dados corrompidos:', backupError);
        }
        return null;
      }
      // Para outros erros, lança exceção
      throw new Error(`Erro ao ler configurações do localStorage: ${error.message}`);
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

