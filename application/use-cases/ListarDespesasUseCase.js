/**
 * Caso de Uso: Listar Despesas
 */
class ListarDespesasUseCase {
  constructor(despesaRepository) {
    this.despesaRepository = despesaRepository;
  }

  async executar(eventoId = null) {
    if (eventoId) {
      return await this.despesaRepository.listarPorEvento(eventoId);
    }
    return await this.despesaRepository.listarTodas();
  }
}

