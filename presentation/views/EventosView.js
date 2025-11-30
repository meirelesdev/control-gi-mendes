/**
 * View de Eventos
 */
class EventosView {
  constructor(eventoController) {
    this.eventoController = eventoController;
    this.editingId = null;
  }

  async render() {
    const container = document.getElementById('eventos-content');
    if (!container) return;

    container.innerHTML = `
      <div class="view-header">
        <h2>Eventos</h2>
        <button class="btn btn-primary" id="btn-novo-evento">Novo Evento</button>
      </div>

      <div id="form-evento" class="form-container" style="display: none;">
        <h3 id="form-titulo">Novo Evento</h3>
        <form id="evento-form">
          <input type="hidden" id="evento-id" />
          <div class="form-group">
            <label for="evento-nome">Nome do Evento *</label>
            <input type="text" id="evento-nome" class="form-control" required />
          </div>
          <div class="form-group">
            <label for="evento-data">Data *</label>
            <input type="date" id="evento-data" class="form-control" required />
          </div>
          <div class="form-group">
            <label for="evento-descricao">Descrição</label>
            <textarea id="evento-descricao" class="form-control" rows="3"></textarea>
          </div>
          <div class="form-actions">
            <button type="submit" class="btn btn-primary">Salvar</button>
            <button type="button" class="btn btn-secondary" id="btn-cancelar-evento">Cancelar</button>
          </div>
        </form>
      </div>

      <div id="lista-eventos" class="lista-container"></div>
    `;

    this.setupEventListeners();
    await this.carregarLista();
  }

  setupEventListeners() {
    document.getElementById('btn-novo-evento').addEventListener('click', () => {
      this.abrirFormulario();
    });

    document.getElementById('btn-cancelar-evento').addEventListener('click', () => {
      this.fecharFormulario();
    });

    document.getElementById('evento-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.salvar();
    });
  }

  abrirFormulario(evento = null) {
    const form = document.getElementById('form-evento');
    const titulo = document.getElementById('form-titulo');
    const formElement = document.getElementById('evento-form');

    this.editingId = evento ? evento.id : null;

    if (evento) {
      titulo.textContent = 'Editar Evento';
      document.getElementById('evento-id').value = evento.id;
      document.getElementById('evento-nome').value = evento.nome;
      document.getElementById('evento-data').value = evento.data;
      document.getElementById('evento-descricao').value = evento.descricao || '';
    } else {
      titulo.textContent = 'Novo Evento';
      formElement.reset();
      document.getElementById('evento-id').value = '';
    }

    form.style.display = 'block';
    form.scrollIntoView({ behavior: 'smooth' });
  }

  fecharFormulario() {
    document.getElementById('form-evento').style.display = 'none';
    this.editingId = null;
  }

  async salvar() {
    const id = document.getElementById('evento-id').value;
    const nome = document.getElementById('evento-nome').value;
    const data = document.getElementById('evento-data').value;
    const descricao = document.getElementById('evento-descricao').value;

    let result;
    if (id) {
      result = await this.eventoController.atualizar(id, nome, data, descricao);
    } else {
      result = await this.eventoController.criar(nome, data, descricao);
    }

    if (result.success) {
      this.fecharFormulario();
      await this.carregarLista();
      this.mostrarMensagem('Evento salvo com sucesso!', 'success');
    } else {
      this.mostrarMensagem(`Erro: ${result.error}`, 'error');
    }
  }

  async carregarLista() {
    const container = document.getElementById('lista-eventos');
    const result = await this.eventoController.listar();

    if (!result.success) {
      container.innerHTML = `<div class="alert alert-danger">Erro: ${result.error}</div>`;
      return;
    }

    const eventos = result.data;

    if (eventos.length === 0) {
      container.innerHTML = '<p class="text-muted">Nenhum evento cadastrado ainda.</p>';
      return;
    }

    container.innerHTML = eventos.map(evento => `
      <div class="card evento-card" data-evento-id="${evento.id}">
        <div class="card-body">
          <div class="card-header-row">
            <h4>${this.escapeHtml(evento.nome)}</h4>
            <div class="card-actions">
              <button class="btn btn-sm btn-secondary btn-editar-evento" data-evento-id="${evento.id}">Editar</button>
              <button class="btn btn-sm btn-danger btn-remover-evento" data-evento-id="${evento.id}">Remover</button>
            </div>
          </div>
          <p class="text-muted">Data: ${this.formatarData(evento.data)}</p>
          ${evento.descricao ? `<p>${this.escapeHtml(evento.descricao)}</p>` : ''}
        </div>
      </div>
    `).join('');

    // Adicionar event listeners
    container.querySelectorAll('.btn-editar-evento').forEach(btn => {
      btn.addEventListener('click', async () => {
        const eventoId = btn.getAttribute('data-evento-id');
        const evento = eventos.find(e => e.id === eventoId);
        if (evento) {
          this.abrirFormulario(evento);
        }
      });
    });

    container.querySelectorAll('.btn-remover-evento').forEach(btn => {
      btn.addEventListener('click', async () => {
        const eventoId = btn.getAttribute('data-evento-id');
        await this.remover(eventoId);
      });
    });
  }

  async remover(id) {
    if (!confirm('Tem certeza que deseja remover este evento? Todas as despesas e receitas relacionadas também serão removidas.')) {
      return;
    }

    const result = await this.eventoController.remover(id);
    if (result.success) {
      await this.carregarLista();
      this.mostrarMensagem('Evento removido com sucesso!', 'success');
    } else {
      this.mostrarMensagem(`Erro: ${result.error}`, 'error');
    }
  }

  formatarData(data) {
    const date = new Date(data);
    return date.toLocaleDateString('pt-BR');
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  mostrarMensagem(mensagem, tipo) {
    const alertClass = tipo === 'success' ? 'alert-success' : 'alert-danger';
    const mensagemDiv = document.createElement('div');
    mensagemDiv.className = `alert ${alertClass} alert-dismissible`;
    mensagemDiv.innerHTML = `
      ${mensagem}
      <button type="button" class="close" onclick="this.parentElement.remove()">&times;</button>
    `;
    document.getElementById('eventos-content').insertBefore(mensagemDiv, document.getElementById('eventos-content').firstChild);
    setTimeout(() => mensagemDiv.remove(), 5000);
  }
}

