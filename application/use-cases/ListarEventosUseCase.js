/**
 * Caso de Uso: Listar Eventos
 */
class ListarEventosUseCase {
  constructor(eventoRepository) {
    this.eventoRepository = eventoRepository;
  }

  async executar() {
    const eventos = await this.eventoRepository.listarTodos();
    return eventos.sort((a, b) => new Date(b.data) - new Date(a.data));
  }
}

