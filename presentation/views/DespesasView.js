/**
 * View de Despesas
 */
class DespesasView {
  constructor(despesaController, eventoController) {
    this.despesaController = despesaController;
    this.eventoController = eventoController;
    this.editingId = null;
    this.eventos = [];
  }

  async render() {
    const container = document.getElementById('despesas-content');
    if (!container) return;

    const eventosResult = await this.eventoController.listar();
    this.eventos = eventosResult.success ? eventosResult.data : [];

    container.innerHTML = `
      <div class="view-header">
        <h2>Despesas (Reembolsos)</h2>
        <button class="btn btn-primary" id="btn-nova-despesa">Nova Despesa</button>
      </div>

      <div id="form-despesa" class="form-container" style="display: none;">
        <h3 id="form-titulo-despesa">Nova Despesa</h3>
        <form id="despesa-form">
          <input type="hidden" id="despesa-id" />
          <div class="form-group">
            <label for="despesa-evento">Evento *</label>
            <select id="despesa-evento" class="form-control" required>
              <option value="">Selecione um evento</option>
              ${this.eventos.map(e => `<option value="${e.id}">${this.escapeHtml(e.nome)}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label for="despesa-descricao">Descrição *</label>
            <input type="text" id="despesa-descricao" class="form-control" required />
          </div>
          <div class="form-group">
            <label for="despesa-valor">Valor (R$) *</label>
            <input type="number" id="despesa-valor" class="form-control" step="0.01" min="0.01" required />
          </div>
          <div class="form-group">
            <label>
              <input type="checkbox" id="despesa-nota-fiscal" />
              Nota Fiscal já emitida/arquivada
            </label>
          </div>
          <div class="form-actions">
            <button type="submit" class="btn btn-primary">Salvar</button>
            <button type="button" class="btn btn-secondary" id="btn-cancelar-despesa">Cancelar</button>
          </div>
        </form>
      </div>

      <div id="lista-despesas" class="lista-container"></div>
    `;

    this.setupEventListeners();
    await this.carregarLista();
  }

  setupEventListeners() {
    document.getElementById('btn-nova-despesa').addEventListener('click', () => {
      this.abrirFormulario();
    });

    document.getElementById('btn-cancelar-despesa').addEventListener('click', () => {
      this.fecharFormulario();
    });

    document.getElementById('despesa-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.salvar();
    });
  }

  abrirFormulario(despesa = null) {
    const form = document.getElementById('form-despesa');
    const titulo = document.getElementById('form-titulo-despesa');
    const formElement = document.getElementById('despesa-form');

    this.editingId = despesa ? despesa.id : null;

    if (despesa) {
      titulo.textContent = 'Editar Despesa';
      document.getElementById('despesa-id').value = despesa.id;
      document.getElementById('despesa-evento').value = despesa.eventoId;
      document.getElementById('despesa-descricao').value = despesa.descricao;
      document.getElementById('despesa-valor').value = despesa.valor;
      document.getElementById('despesa-nota-fiscal').checked = despesa.notaFiscalEmitida;
    } else {
      titulo.textContent = 'Nova Despesa';
      formElement.reset();
      document.getElementById('despesa-id').value = '';
    }

    form.style.display = 'block';
    form.scrollIntoView({ behavior: 'smooth' });
  }

  fecharFormulario() {
    document.getElementById('form-despesa').style.display = 'none';
    this.editingId = null;
  }

  async salvar() {
    const id = document.getElementById('despesa-id').value;
    const eventoId = document.getElementById('despesa-evento').value;
    const descricao = document.getElementById('despesa-descricao').value;
    const valor = document.getElementById('despesa-valor').value;
    const notaFiscalEmitida = document.getElementById('despesa-nota-fiscal').checked;

    let result;
    if (id) {
      result = await this.despesaController.atualizar(id, descricao, valor, notaFiscalEmitida);
    } else {
      result = await this.despesaController.criar(eventoId, descricao, valor, notaFiscalEmitida);
    }

    if (result.success) {
      this.fecharFormulario();
      await this.carregarLista();
      this.mostrarMensagem('Despesa salva com sucesso!', 'success');
    } else {
      this.mostrarMensagem(`Erro: ${result.error}`, 'error');
    }
  }

  async carregarLista() {
    const container = document.getElementById('lista-despesas');
    const result = await this.despesaController.listar();

    if (!result.success) {
      container.innerHTML = `<div class="alert alert-danger">Erro: ${result.error}</div>`;
      return;
    }

    const despesas = result.data;
    this.despesas = despesas; // Armazenar para uso nos event listeners

    if (despesas.length === 0) {
      container.innerHTML = '<p class="text-muted">Nenhuma despesa cadastrada ainda.</p>';
      return;
    }

    // Agrupar por evento
    const despesasPorEvento = {};
    despesas.forEach(despesa => {
      const evento = this.eventos.find(e => e.id === despesa.eventoId);
      const eventoNome = evento ? evento.nome : 'Evento não encontrado';
      if (!despesasPorEvento[eventoNome]) {
        despesasPorEvento[eventoNome] = [];
      }
      despesasPorEvento[eventoNome].push(despesa);
    });

    container.innerHTML = Object.keys(despesasPorEvento).map(eventoNome => `
      <div class="evento-group">
        <h4>${this.escapeHtml(eventoNome)}</h4>
        ${despesasPorEvento[eventoNome].map(despesa => `
          <div class="card despesa-card ${despesa.notaFiscalEmitida ? 'nota-emitida' : 'nota-pendente'}" data-despesa-id="${despesa.id}">
            <div class="card-body">
              <div class="card-header-row">
                <div>
                  <h5>${this.escapeHtml(despesa.descricao)}</h5>
                  <span class="badge ${despesa.notaFiscalEmitida ? 'badge-success' : 'badge-warning'}">
                    ${despesa.notaFiscalEmitida ? 'NF Emitida' : 'NF Pendente'}
                  </span>
                </div>
                <div class="card-actions">
                  <span class="valor">R$ ${this.formatarMoeda(despesa.valor)}</span>
                  ${!despesa.notaFiscalEmitida ? `
                    <button class="btn btn-sm btn-success btn-marcar-nf" data-despesa-id="${despesa.id}">Marcar NF</button>
                  ` : ''}
                  <button class="btn btn-sm btn-secondary btn-editar-despesa" data-despesa-id="${despesa.id}">Editar</button>
                  <button class="btn btn-sm btn-danger btn-remover-despesa" data-despesa-id="${despesa.id}">Remover</button>
                </div>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `).join('');

    // Adicionar event listeners
    container.querySelectorAll('.btn-marcar-nf').forEach(btn => {
      btn.addEventListener('click', async () => {
        const despesaId = btn.getAttribute('data-despesa-id');
        await this.marcarNotaFiscal(despesaId);
      });
    });

    container.querySelectorAll('.btn-editar-despesa').forEach(btn => {
      btn.addEventListener('click', async () => {
        const despesaId = btn.getAttribute('data-despesa-id');
        const despesa = despesas.find(d => d.id === despesaId);
        if (despesa) {
          this.abrirFormulario(despesa);
        }
      });
    });

    container.querySelectorAll('.btn-remover-despesa').forEach(btn => {
      btn.addEventListener('click', async () => {
        const despesaId = btn.getAttribute('data-despesa-id');
        await this.remover(despesaId);
      });
    });
  }

  async marcarNotaFiscal(id) {
    const result = await this.despesaController.marcarNotaFiscalEmitida(id);
    if (result.success) {
      await this.carregarLista();
      this.mostrarMensagem('Nota fiscal marcada como emitida!', 'success');
    } else {
      this.mostrarMensagem(`Erro: ${result.error}`, 'error');
    }
  }

  async remover(id) {
    if (!confirm('Tem certeza que deseja remover esta despesa?')) {
      return;
    }

    const result = await this.despesaController.remover(id);
    if (result.success) {
      await this.carregarLista();
      this.mostrarMensagem('Despesa removida com sucesso!', 'success');
    } else {
      this.mostrarMensagem(`Erro: ${result.error}`, 'error');
    }
  }

  formatarMoeda(valor) {
    return parseFloat(valor).toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
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
    document.getElementById('despesas-content').insertBefore(mensagemDiv, document.getElementById('despesas-content').firstChild);
    setTimeout(() => mensagemDiv.remove(), 5000);
  }
}

