/**
 * Controller de Despesas
 */
class DespesaController {
  constructor(
    criarDespesaUseCase,
    listarDespesasUseCase,
    atualizarDespesaUseCase,
    marcarNotaFiscalEmitidaUseCase,
    removerDespesaUseCase
  ) {
    this.criarDespesaUseCase = criarDespesaUseCase;
    this.listarDespesasUseCase = listarDespesasUseCase;
    this.atualizarDespesaUseCase = atualizarDespesaUseCase;
    this.marcarNotaFiscalEmitidaUseCase = marcarNotaFiscalEmitidaUseCase;
    this.removerDespesaUseCase = removerDespesaUseCase;
  }

  async criar(eventoId, descricao, valor, notaFiscalEmitida) {
    try {
      const despesa = await this.criarDespesaUseCase.executar(eventoId, descricao, valor, notaFiscalEmitida);
      return { success: true, data: despesa };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async listar(eventoId = null) {
    try {
      const despesas = await this.listarDespesasUseCase.executar(eventoId);
      return { success: true, data: despesas };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async atualizar(id, descricao, valor, notaFiscalEmitida) {
    try {
      const despesa = await this.atualizarDespesaUseCase.executar(id, descricao, valor, notaFiscalEmitida);
      return { success: true, data: despesa };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async marcarNotaFiscalEmitida(id) {
    try {
      const despesa = await this.marcarNotaFiscalEmitidaUseCase.executar(id);
      return { success: true, data: despesa };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async remover(id) {
    try {
      await this.removerDespesaUseCase.executar(id);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

