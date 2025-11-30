/**
 * Caso de Uso: Criar Receita
 */
class CriarReceitaUseCase {
  constructor(receitaRepository, eventoRepository, configuracaoRepository) {
    this.receitaRepository = receitaRepository;
    this.eventoRepository = eventoRepository;
    this.configuracaoRepository = configuracaoRepository;
  }

  async executar(eventoId, tipo, descricao, quantidade, valorUnitario = null) {
    if (!eventoId) {
      throw new Error('Evento é obrigatório');
    }
    if (!tipo || !['diaria', 'hora_extra', 'km', 'tempo_viagem'].includes(tipo)) {
      throw new Error('Tipo de receita inválido');
    }
    if (!descricao || !descricao.trim()) {
      throw new Error('Descrição da receita é obrigatória');
    }
    if (!quantidade || quantidade <= 0) {
      throw new Error('Quantidade deve ser maior que zero');
    }

    const evento = await this.eventoRepository.buscarPorId(eventoId);
    if (!evento) {
      throw new Error('Evento não encontrado');
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

    const receita = Receita.criar(
      eventoId,
      tipo,
      descricao.trim(),
      parseFloat(quantidade),
      parseFloat(valorFinal)
    );
    await this.receitaRepository.salvar(receita);
    return receita;
  }
}

