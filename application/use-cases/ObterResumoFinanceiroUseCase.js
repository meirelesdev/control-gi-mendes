/**
 * Caso de Uso: Obter Resumo Financeiro
 * Calcula totais de reembolsos e lucros
 */
class ObterResumoFinanceiroUseCase {
  constructor(despesaRepository, receitaRepository) {
    this.despesaRepository = despesaRepository;
    this.receitaRepository = receitaRepository;
  }

  async executar(eventoId = null) {
    const despesas = await this.despesaRepository.listarTodas();
    const receitas = await this.receitaRepository.listarTodas();

    let despesasFiltradas = despesas;
    let receitasFiltradas = receitas;

    if (eventoId) {
      despesasFiltradas = despesas.filter(d => d.eventoId === eventoId);
      receitasFiltradas = receitas.filter(r => r.eventoId === eventoId);
    }

    const totalReembolsos = despesasFiltradas.reduce((sum, d) => sum + d.valor, 0);
    const totalLucros = receitasFiltradas.reduce((sum, r) => sum + r.valorTotal, 0);
    const saldo = totalLucros - totalReembolsos;

    const despesasComNota = despesasFiltradas.filter(d => d.notaFiscalEmitida).length;
    const despesasSemNota = despesasFiltradas.length - despesasComNota;

    return {
      totalReembolsos,
      totalLucros,
      saldo,
      totalDespesas: despesasFiltradas.length,
      despesasComNota,
      despesasSemNota,
      totalReceitas: receitasFiltradas.length
    };
  }
}

