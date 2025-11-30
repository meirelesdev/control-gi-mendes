/**
 * Entidade de Domínio: Despesa
 * Representa uma despesa (reembolso) relacionada a um evento
 */
class Despesa {
  constructor(id, eventoId, descricao, valor, notaFiscalEmitida = false) {
    this.id = id;
    this.eventoId = eventoId;
    this.descricao = descricao;
    this.valor = valor;
    this.notaFiscalEmitida = notaFiscalEmitida;
    this.createdAt = new Date().toISOString();
  }

  static criar(eventoId, descricao, valor, notaFiscalEmitida = false) {
    const id = `despesa_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return new Despesa(id, eventoId, descricao, valor, notaFiscalEmitida);
  }

  atualizar(descricao, valor, notaFiscalEmitida) {
    this.descricao = descricao;
    this.valor = valor;
    this.notaFiscalEmitida = notaFiscalEmitida;
  }

  marcarNotaFiscalEmitida() {
    this.notaFiscalEmitida = true;
  }
}

