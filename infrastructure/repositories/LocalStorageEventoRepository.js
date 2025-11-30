/**
 * Implementação do Repositório de Eventos usando localStorage
 */
class LocalStorageEventoRepository extends IEventoRepository {
  constructor() {
    super();
    this.storageKey = 'gi_financas_eventos';
  }

  async salvar(evento) {
    const eventos = await this.listarTodos();
    const index = eventos.findIndex(e => e.id === evento.id);
    
    if (index >= 0) {
      eventos[index] = evento;
    } else {
      eventos.push(evento);
    }
    
    localStorage.setItem(this.storageKey, JSON.stringify(eventos));
    return evento;
  }

  async buscarPorId(id) {
    const eventos = await this.listarTodos();
    return eventos.find(e => e.id === id) || null;
  }

  async listarTodos() {
    const data = localStorage.getItem(this.storageKey);
    if (!data) {
      return [];
    }
    return JSON.parse(data);
  }

  async remover(id) {
    const eventos = await this.listarTodos();
    const filtrados = eventos.filter(e => e.id !== id);
    localStorage.setItem(this.storageKey, JSON.stringify(filtrados));
  }
}

