/**
 * Interface do Repositório de Despesas
 */
class IDespesaRepository {
  async salvar(despesa) {
    throw new Error('Método salvar deve ser implementado');
  }

  async buscarPorId(id) {
    throw new Error('Método buscarPorId deve ser implementado');
  }

  async listarPorEvento(eventoId) {
    throw new Error('Método listarPorEvento deve ser implementado');
  }

  async listarTodas() {
    throw new Error('Método listarTodas deve ser implementado');
  }

  async remover(id) {
    throw new Error('Método remover deve ser implementado');
  }
}

