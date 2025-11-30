/**
 * Entidade de Domínio: Receita
 * Representa uma receita (lucro) relacionada a um evento
 * Tipos: diaria, hora_extra, km, tempo_viagem
 */
class Receita {
  constructor(id, eventoId, tipo, descricao, quantidade, valorUnitario, valorTotal) {
    this.id = id;
    this.eventoId = eventoId;
    this.tipo = tipo; // 'diaria', 'hora_extra', 'km', 'tempo_viagem'
    this.descricao = descricao;
    this.quantidade = quantidade;
    this.valorUnitario = valorUnitario;
    this.valorTotal = valorTotal;
    this.createdAt = new Date().toISOString();
  }

  static criar(eventoId, tipo, descricao, quantidade, valorUnitario) {
    const id = `receita_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const valorTotal = quantidade * valorUnitario;
    return new Receita(id, eventoId, tipo, descricao, quantidade, valorUnitario, valorTotal);
  }

  atualizar(tipo, descricao, quantidade, valorUnitario) {
    this.tipo = tipo;
    this.descricao = descricao;
    this.quantidade = quantidade;
    this.valorUnitario = valorUnitario;
    this.valorTotal = quantidade * valorUnitario;
  }

  recalcular() {
    this.valorTotal = this.quantidade * this.valorUnitario;
  }
}

