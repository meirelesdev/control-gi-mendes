/**
 * Caso de Uso: Criar Despesa
 */
class CriarDespesaUseCase {
  constructor(despesaRepository, eventoRepository) {
    this.despesaRepository = despesaRepository;
    this.eventoRepository = eventoRepository;
  }

  async executar(eventoId, descricao, valor, notaFiscalEmitida = false) {
    if (!eventoId) {
      throw new Error('Evento é obrigatório');
    }
    if (!descricao || !descricao.trim()) {
      throw new Error('Descrição da despesa é obrigatória');
    }
    if (!valor || valor <= 0) {
      throw new Error('Valor da despesa deve ser maior que zero');
    }

    const evento = await this.eventoRepository.buscarPorId(eventoId);
    if (!evento) {
      throw new Error('Evento não encontrado');
    }

    const despesa = Despesa.criar(eventoId, descricao.trim(), parseFloat(valor), notaFiscalEmitida);
    await this.despesaRepository.salvar(despesa);
    return despesa;
  }
}

