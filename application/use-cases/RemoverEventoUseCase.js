/**
 * Caso de Uso: Remover Evento
 */
class RemoverEventoUseCase {
  constructor(eventoRepository, despesaRepository, receitaRepository) {
    this.eventoRepository = eventoRepository;
    this.despesaRepository = despesaRepository;
    this.receitaRepository = receitaRepository;
  }

  async executar(id) {
    const evento = await this.eventoRepository.buscarPorId(id);
    if (!evento) {
      throw new Error('Evento não encontrado');
    }

    // Remover despesas e receitas relacionadas
    const despesas = await this.despesaRepository.listarPorEvento(id);
    const receitas = await this.receitaRepository.listarPorEvento(id);

    for (const despesa of despesas) {
      await this.despesaRepository.remover(despesa.id);
    }

    for (const receita of receitas) {
      await this.receitaRepository.remover(receita.id);
    }

    await this.eventoRepository.remover(id);
  }
}

