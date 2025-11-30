/**
 * Implementação do Repositório de Configurações usando localStorage
 */
class LocalStorageConfiguracaoRepository extends IConfiguracaoRepository {
  constructor() {
    super();
    this.storageKey = 'gi_financas_configuracao';
  }

  async salvar(configuracao) {
    localStorage.setItem(this.storageKey, JSON.stringify(configuracao));
    return configuracao;
  }

  async buscar() {
    const data = localStorage.getItem(this.storageKey);
    if (!data) {
      return null;
    }
    const config = JSON.parse(data);
    // Restaurar métodos do objeto
    const configuracao = Object.assign(new Configuracao(), config);
    return configuracao;
  }
}

