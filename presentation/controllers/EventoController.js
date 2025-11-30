/**
 * Controller de Eventos
 */
class EventoController {
  constructor(
    criarEventoUseCase,
    listarEventosUseCase,
    atualizarEventoUseCase,
    removerEventoUseCase
  ) {
    this.criarEventoUseCase = criarEventoUseCase;
    this.listarEventosUseCase = listarEventosUseCase;
    this.atualizarEventoUseCase = atualizarEventoUseCase;
    this.removerEventoUseCase = removerEventoUseCase;
  }

  async criar(nome, data, descricao) {
    try {
      const evento = await this.criarEventoUseCase.executar(nome, data, descricao);
      return { success: true, data: evento };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async listar() {
    try {
      const eventos = await this.listarEventosUseCase.executar();
      return { success: true, data: eventos };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async atualizar(id, nome, data, descricao) {
    try {
      const evento = await this.atualizarEventoUseCase.executar(id, nome, data, descricao);
      return { success: true, data: evento };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async remover(id) {
    try {
      await this.removerEventoUseCase.executar(id);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

