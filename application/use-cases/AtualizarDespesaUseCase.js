/**
 * Caso de Uso: Atualizar Despesa
 */
class AtualizarDespesaUseCase {
  constructor(despesaRepository) {
    this.despesaRepository = despesaRepository;
  }

  async executar(id, descricao, valor, notaFiscalEmitida) {
    if (!descricao || !descricao.trim()) {
      throw new Error('Descrição da despesa é obrigatória');
    }
    if (!valor || valor <= 0) {
      throw new Error('Valor da despesa deve ser maior que zero');
    }

    const despesa = await this.despesaRepository.buscarPorId(id);
    if (!despesa) {
      throw new Error('Despesa não encontrada');
    }

    despesa.atualizar(descricao.trim(), parseFloat(valor), notaFiscalEmitida);
    await this.despesaRepository.salvar(despesa);
    return despesa;
  }
}

