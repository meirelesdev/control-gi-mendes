/**
 * Controller de Resumo Financeiro
 */
class ResumoController {
  constructor(obterResumoFinanceiroUseCase) {
    this.obterResumoFinanceiroUseCase = obterResumoFinanceiroUseCase;
  }

  async obter(eventoId = null) {
    try {
      const resumo = await this.obterResumoFinanceiroUseCase.executar(eventoId);
      return { success: true, data: resumo };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

