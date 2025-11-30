/**
 * Controller de Configurações
 */
class ConfiguracaoController {
  constructor(
    obterConfiguracaoUseCase,
    atualizarConfiguracaoUseCase
  ) {
    this.obterConfiguracaoUseCase = obterConfiguracaoUseCase;
    this.atualizarConfiguracaoUseCase = atualizarConfiguracaoUseCase;
  }

  async obter() {
    try {
      const config = await this.obterConfiguracaoUseCase.executar();
      return { success: true, data: config };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async atualizar(precoKm, precoHoraViagem) {
    try {
      const config = await this.atualizarConfiguracaoUseCase.executar(precoKm, precoHoraViagem);
      return { success: true, data: config };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

