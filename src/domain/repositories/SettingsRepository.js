/**
 * Interface do Repositório de Configurações
 * Define os contratos para persistência de configurações
 */
class SettingsRepository {
  /**
   * Salva as configurações (cria ou atualiza)
   * @param {Settings} settings - Instância das configurações
   * @returns {Promise<Settings>} - Configurações salvas
   */
  async save(settings) {
    throw new Error('Método save deve ser implementado');
  }

  /**
   * Busca as configurações atuais
   * @returns {Promise<Settings|null>} - Configurações encontradas ou null
   */
  async find() {
    throw new Error('Método find deve ser implementado');
  }

  /**
   * Verifica se existem configurações salvas
   * @returns {Promise<boolean>} - True se existe, false caso contrário
   */
  async exists() {
    throw new Error('Método exists deve ser implementado');
  }
}

// Export para uso em módulos ES6
export { SettingsRepository };

