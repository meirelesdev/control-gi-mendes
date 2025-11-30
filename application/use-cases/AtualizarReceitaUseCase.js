/**
 * Caso de Uso: Atualizar Receita
 */
class AtualizarReceitaUseCase {
  constructor(receitaRepository, configuracaoRepository) {
    this.receitaRepository = receitaRepository;
    this.configuracaoRepository = configuracaoRepository;
  }

  async executar(id, tipo, descricao, quantidade, valorUnitario = null) {
    if (!tipo || !['diaria', 'hora_extra', 'km', 'tempo_viagem'].includes(tipo)) {
      throw new Error('Tipo de receita inválido');
    }
    if (!descricao || !descricao.trim()) {
      throw new Error('Descrição da receita é obrigatória');
    }
    if (!quantidade || quantidade <= 0) {
      throw new Error('Quantidade deve ser maior que zero');
    }

    const receita = await this.receitaRepository.buscarPorId(id);
    if (!receita) {
      throw new Error('Receita não encontrada');
    }

    // Se não informou valor unitário, buscar da configuração
    let valorFinal = valorUnitario;
    if (!valorFinal) {
      const config = await this.configuracaoRepository.buscar();
      if (tipo === 'km') {
        valorFinal = config.precoKm;
      } else if (tipo === 'tempo_viagem') {
        valorFinal = config.precoHoraViagem;
      } else {
        throw new Error('Valor unitário é obrigatório para este tipo de receita');
      }
    }

    receita.atualizar(tipo, descricao.trim(), parseFloat(quantidade), parseFloat(valorFinal));
    await this.receitaRepository.salvar(receita);
    return receita;
  }
}

