/**
 * Caso de Uso: Atualizar Configuração
 */
class AtualizarConfiguracaoUseCase {
  constructor(configuracaoRepository) {
    this.configuracaoRepository = configuracaoRepository;
  }

  async executar(precoKm, precoHoraViagem) {
    if (precoKm !== undefined && precoKm !== null && precoKm < 0) {
      throw new Error('Preço por KM deve ser maior ou igual a zero');
    }
    if (precoHoraViagem !== undefined && precoHoraViagem !== null && precoHoraViagem < 0) {
      throw new Error('Preço por hora de viagem deve ser maior ou igual a zero');
    }

    let config = await this.configuracaoRepository.buscar();
    if (!config) {
      config = Configuracao.criar();
    }

    config.atualizar(precoKm, precoHoraViagem);
    await this.configuracaoRepository.salvar(config);
    return config;
  }
}

