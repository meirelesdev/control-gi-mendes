/**
 * Interface do Repositório de Configurações
 */
class IConfiguracaoRepository {
  async salvar(configuracao) {
    throw new Error('Método salvar deve ser implementado');
  }

  async buscar() {
    throw new Error('Método buscar deve ser implementado');
  }
}

