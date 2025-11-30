/**
 * Caso de Uso: Remover Despesa
 */
class RemoverDespesaUseCase {
  constructor(despesaRepository) {
    this.despesaRepository = despesaRepository;
  }

  async executar(id) {
    const despesa = await this.despesaRepository.buscarPorId(id);
    if (!despesa) {
      throw new Error('Despesa não encontrada');
    }

    await this.despesaRepository.remover(id);
  }
}

