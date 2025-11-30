/**
 * Caso de Uso: Marcar Nota Fiscal como Emitida
 */
class MarcarNotaFiscalEmitidaUseCase {
  constructor(despesaRepository) {
    this.despesaRepository = despesaRepository;
  }

  async executar(id) {
    const despesa = await this.despesaRepository.buscarPorId(id);
    if (!despesa) {
      throw new Error('Despesa não encontrada');
    }

    despesa.marcarNotaFiscalEmitida();
    await this.despesaRepository.salvar(despesa);
    return despesa;
  }
}

