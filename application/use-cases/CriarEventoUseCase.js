/**
 * Caso de Uso: Criar Evento
 */
class CriarEventoUseCase {
  constructor(eventoRepository) {
    this.eventoRepository = eventoRepository;
  }

  async executar(nome, data, descricao = '') {
    if (!nome || !nome.trim()) {
      throw new Error('Nome do evento é obrigatório');
    }
    if (!data) {
      throw new Error('Data do evento é obrigatória');
    }

    const evento = Evento.criar(nome.trim(), data, descricao.trim());
    await this.eventoRepository.salvar(evento);
    return evento;
  }
}

