/**
 * Interface do Repositório de Eventos
 */
class IEventoRepository {
  async salvar(evento) {
    throw new Error('Método salvar deve ser implementado');
  }

  async buscarPorId(id) {
    throw new Error('Método buscarPorId deve ser implementado');
  }

  async listarTodos() {
    throw new Error('Método listarTodos deve ser implementado');
  }

  async remover(id) {
    throw new Error('Método remover deve ser implementado');
  }
}

