/**
 * Caso de Uso: Remover Receita
 */
class RemoverReceitaUseCase {
  constructor(receitaRepository) {
    this.receitaRepository = receitaRepository;
  }

  async executar(id) {
    const receita = await this.receitaRepository.buscarPorId(id);
    if (!receita) {
      throw new Error('Receita não encontrada');
    }

    await this.receitaRepository.remover(id);
  }
}

