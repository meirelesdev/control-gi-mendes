/**
 * Caso de Uso: Atualizar Evento
 */
class AtualizarEventoUseCase {
  constructor(eventoRepository) {
    this.eventoRepository = eventoRepository;
  }

  async executar(id, nome, data, descricao = '') {
    if (!nome || !nome.trim()) {
      throw new Error('Nome do evento é obrigatório');
    }
    if (!data) {
      throw new Error('Data do evento é obrigatória');
    }

    const evento = await this.eventoRepository.buscarPorId(id);
    if (!evento) {
      throw new Error('Evento não encontrado');
    }

    evento.atualizar(nome.trim(), data, descricao.trim());
    await this.eventoRepository.salvar(evento);
    return evento;
  }
}

