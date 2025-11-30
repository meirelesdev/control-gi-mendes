/**
 * Implementação do Repositório de Despesas usando localStorage
 */
class LocalStorageDespesaRepository extends IDespesaRepository {
  constructor() {
    super();
    this.storageKey = 'gi_financas_despesas';
  }

  async salvar(despesa) {
    const despesas = await this.listarTodas();
    const index = despesas.findIndex(d => d.id === despesa.id);
    
    if (index >= 0) {
      despesas[index] = despesa;
    } else {
      despesas.push(despesa);
    }
    
    localStorage.setItem(this.storageKey, JSON.stringify(despesas));
    return despesa;
  }

  async buscarPorId(id) {
    const despesas = await this.listarTodas();
    return despesas.find(d => d.id === id) || null;
  }

  async listarPorEvento(eventoId) {
    const despesas = await this.listarTodas();
    return despesas.filter(d => d.eventoId === eventoId);
  }

  async listarTodas() {
    const data = localStorage.getItem(this.storageKey);
    if (!data) {
      return [];
    }
    return JSON.parse(data);
  }

  async remover(id) {
    const despesas = await this.listarTodas();
    const filtradas = despesas.filter(d => d.id !== id);
    localStorage.setItem(this.storageKey, JSON.stringify(filtradas));
  }
}

