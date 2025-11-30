/**
 * Caso de Uso: Listar Receitas
 */
class ListarReceitasUseCase {
  constructor(receitaRepository) {
    this.receitaRepository = receitaRepository;
  }

  async executar(eventoId = null) {
    if (eventoId) {
      return await this.receitaRepository.listarPorEvento(eventoId);
    }
    return await this.receitaRepository.listarTodas();
  }
}

