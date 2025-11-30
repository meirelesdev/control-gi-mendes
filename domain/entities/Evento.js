/**
 * Entidade de Domínio: Evento
 * Representa um evento culinário realizado pela Gi
 */
class Evento {
  constructor(id, nome, data, descricao = '') {
    this.id = id;
    this.nome = nome;
    this.data = data;
    this.descricao = descricao;
    this.createdAt = new Date().toISOString();
  }

  static criar(nome, data, descricao = '') {
    const id = `evento_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return new Evento(id, nome, data, descricao);
  }

  atualizar(nome, data, descricao) {
    this.nome = nome;
    this.data = data;
    this.descricao = descricao;
  }
}

