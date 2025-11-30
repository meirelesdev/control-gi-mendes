/**
 * Caso de Uso: Obter Configuração
 */
class ObterConfiguracaoUseCase {
  constructor(configuracaoRepository) {
    this.configuracaoRepository = configuracaoRepository;
  }

  async executar() {
    let config = await this.configuracaoRepository.buscar();
    if (!config) {
      config = Configuracao.criar();
      await this.configuracaoRepository.salvar(config);
    }
    return config;
  }
}

