/**
 * Controller de Receitas
 */
class ReceitaController {
  constructor(
    criarReceitaUseCase,
    listarReceitasUseCase,
    atualizarReceitaUseCase,
    removerReceitaUseCase
  ) {
    this.criarReceitaUseCase = criarReceitaUseCase;
    this.listarReceitasUseCase = listarReceitasUseCase;
    this.atualizarReceitaUseCase = atualizarReceitaUseCase;
    this.removerReceitaUseCase = removerReceitaUseCase;
  }

  async criar(eventoId, tipo, descricao, quantidade, valorUnitario) {
    try {
      const receita = await this.criarReceitaUseCase.executar(eventoId, tipo, descricao, quantidade, valorUnitario);
      return { success: true, data: receita };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async listar(eventoId = null) {
    try {
      const receitas = await this.listarReceitasUseCase.executar(eventoId);
      return { success: true, data: receitas };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async atualizar(id, tipo, descricao, quantidade, valorUnitario) {
    try {
      const receita = await this.atualizarReceitaUseCase.executar(id, tipo, descricao, quantidade, valorUnitario);
      return { success: true, data: receita };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async remover(id) {
    try {
      await this.removerReceitaUseCase.executar(id);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

