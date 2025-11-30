/**
 * Implementação do Repositório de Receitas usando localStorage
 */
class LocalStorageReceitaRepository extends IReceitaRepository {
  constructor() {
    super();
    this.storageKey = 'gi_financas_receitas';
  }

  async salvar(receita) {
    const receitas = await this.listarTodas();
    const index = receitas.findIndex(r => r.id === receita.id);
    
    if (index >= 0) {
      receitas[index] = receita;
    } else {
      receitas.push(receita);
    }
    
    localStorage.setItem(this.storageKey, JSON.stringify(receitas));
    return receita;
  }

  async buscarPorId(id) {
    const receitas = await this.listarTodas();
    return receitas.find(r => r.id === id) || null;
  }

  async listarPorEvento(eventoId) {
    const receitas = await this.listarTodas();
    return receitas.filter(r => r.eventoId === eventoId);
  }

  async listarTodas() {
    const data = localStorage.getItem(this.storageKey);
    if (!data) {
      return [];
    }
    return JSON.parse(data);
  }

  async remover(id) {
    const receitas = await this.listarTodas();
    const filtradas = receitas.filter(r => r.id !== id);
    localStorage.setItem(this.storageKey, JSON.stringify(filtradas));
  }
}

