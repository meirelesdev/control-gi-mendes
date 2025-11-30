/**
 * View de Receitas
 */
class ReceitasView {
  constructor(receitaController, eventoController) {
    this.receitaController = receitaController;
    this.eventoController = eventoController;
    this.editingId = null;
    this.eventos = [];
  }

  async render() {
    const container = document.getElementById('receitas-content');
    if (!container) return;

    const eventosResult = await this.eventoController.listar();
    this.eventos = eventosResult.success ? eventosResult.data : [];

    container.innerHTML = `
      <div class="view-header">
        <h2>Receitas (Lucros)</h2>
        <button class="btn btn-primary" id="btn-nova-receita">Nova Receita</button>
      </div>

      <div id="form-receita" class="form-container" style="display: none;">
        <h3 id="form-titulo-receita">Nova Receita</h3>
        <form id="receita-form">
          <input type="hidden" id="receita-id" />
          <div class="form-group">
            <label for="receita-evento">Evento *</label>
            <select id="receita-evento" class="form-control" required>
              <option value="">Selecione um evento</option>
              ${this.eventos.map(e => `<option value="${e.id}">${this.escapeHtml(e.nome)}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label for="receita-tipo">Tipo *</label>
            <select id="receita-tipo" class="form-control" required>
              <option value="">Selecione o tipo</option>
              <option value="diaria">Diária</option>
              <option value="hora_extra">Hora Extra</option>
              <option value="km">KM Rodado</option>
              <option value="tempo_viagem">Tempo de Viagem</option>
            </select>
          </div>
          <div class="form-group">
            <label for="receita-descricao">Descrição *</label>
            <input type="text" id="receita-descricao" class="form-control" required />
          </div>
          <div class="form-group">
            <label for="receita-quantidade">Quantidade *</label>
            <input type="number" id="receita-quantidade" class="form-control" step="0.01" min="0.01" required />
            <small class="form-text text-muted" id="quantidade-help"></small>
          </div>
          <div class="form-group" id="grupo-valor-unitario">
            <label for="receita-valor-unitario">Valor Unitário (R$)</label>
            <input type="number" id="receita-valor-unitario" class="form-control" step="0.01" min="0" />
            <small class="form-text text-muted">Deixe em branco para usar valor da configuração (KM e Tempo de Viagem)</small>
          </div>
          <div class="form-group">
            <label>Valor Total: R$ <span id="receita-valor-total">0,00</span></label>
          </div>
          <div class="form-actions">
            <button type="submit" class="btn btn-primary">Salvar</button>
            <button type="button" class="btn btn-secondary" id="btn-cancelar-receita">Cancelar</button>
          </div>
        </form>
      </div>

      <div id="lista-receitas" class="lista-container"></div>
    `;

    this.setupEventListeners();
    await this.carregarLista();
  }

  setupEventListeners() {
    document.getElementById('btn-nova-receita').addEventListener('click', () => {
      this.abrirFormulario();
    });

    document.getElementById('btn-cancelar-receita').addEventListener('click', () => {
      this.fecharFormulario();
    });

    document.getElementById('receita-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.salvar();
    });

    // Calcular valor total em tempo real
    const quantidadeInput = document.getElementById('receita-quantidade');
    const valorUnitarioInput = document.getElementById('receita-valor-unitario');
    const tipoSelect = document.getElementById('receita-tipo');

    const calcularTotal = () => {
      const quantidade = parseFloat(quantidadeInput.value) || 0;
      const valorUnitario = parseFloat(valorUnitarioInput.value) || 0;
      const total = quantidade * valorUnitario;
      document.getElementById('receita-valor-total').textContent = this.formatarMoeda(total);
    };

    quantidadeInput.addEventListener('input', calcularTotal);
    valorUnitarioInput.addEventListener('input', calcularTotal);

    tipoSelect.addEventListener('change', (e) => {
      const tipo = e.target.value;
      const grupoValorUnitario = document.getElementById('grupo-valor-unitario');
      const quantidadeHelp = document.getElementById('quantidade-help');

      if (tipo === 'km') {
        quantidadeHelp.textContent = 'Informe a distância em quilômetros';
        grupoValorUnitario.style.display = 'none';
      } else if (tipo === 'tempo_viagem') {
        quantidadeHelp.textContent = 'Informe o tempo em horas';
        grupoValorUnitario.style.display = 'none';
      } else {
        quantidadeHelp.textContent = '';
        grupoValorUnitario.style.display = 'block';
      }
      calcularTotal();
    });
  }

  abrirFormulario(receita = null) {
    const form = document.getElementById('form-receita');
    const titulo = document.getElementById('form-titulo-receita');
    const formElement = document.getElementById('receita-form');

    this.editingId = receita ? receita.id : null;

    if (receita) {
      titulo.textContent = 'Editar Receita';
      document.getElementById('receita-id').value = receita.id;
      document.getElementById('receita-evento').value = receita.eventoId;
      document.getElementById('receita-tipo').value = receita.tipo;
      document.getElementById('receita-descricao').value = receita.descricao;
      document.getElementById('receita-quantidade').value = receita.quantidade;
      document.getElementById('receita-valor-unitario').value = receita.valorUnitario;
      document.getElementById('receita-tipo').dispatchEvent(new Event('change'));
    } else {
      titulo.textContent = 'Nova Receita';
      formElement.reset();
      document.getElementById('receita-id').value = '';
      document.getElementById('receita-valor-total').textContent = '0,00';
    }

    form.style.display = 'block';
    form.scrollIntoView({ behavior: 'smooth' });
  }

  fecharFormulario() {
    document.getElementById('form-receita').style.display = 'none';
    this.editingId = null;
  }

  async salvar() {
    const id = document.getElementById('receita-id').value;
    const eventoId = document.getElementById('receita-evento').value;
    const tipo = document.getElementById('receita-tipo').value;
    const descricao = document.getElementById('receita-descricao').value;
    const quantidade = document.getElementById('receita-quantidade').value;
    const valorUnitario = document.getElementById('receita-valor-unitario').value || null;

    let result;
    if (id) {
      result = await this.receitaController.atualizar(id, tipo, descricao, quantidade, valorUnitario);
    } else {
      result = await this.receitaController.criar(eventoId, tipo, descricao, quantidade, valorUnitario);
    }

    if (result.success) {
      this.fecharFormulario();
      await this.carregarLista();
      this.mostrarMensagem('Receita salva com sucesso!', 'success');
    } else {
      this.mostrarMensagem(`Erro: ${result.error}`, 'error');
    }
  }

  async carregarLista() {
    const container = document.getElementById('lista-receitas');
    const result = await this.receitaController.listar();

    if (!result.success) {
      container.innerHTML = `<div class="alert alert-danger">Erro: ${result.error}</div>`;
      return;
    }

    const receitas = result.data;
    this.receitas = receitas; // Armazenar para uso nos event listeners

    if (receitas.length === 0) {
      container.innerHTML = '<p class="text-muted">Nenhuma receita cadastrada ainda.</p>';
      return;
    }

    // Agrupar por evento
    const receitasPorEvento = {};
    receitas.forEach(receita => {
      const evento = this.eventos.find(e => e.id === receita.eventoId);
      const eventoNome = evento ? evento.nome : 'Evento não encontrado';
      if (!receitasPorEvento[eventoNome]) {
        receitasPorEvento[eventoNome] = [];
      }
      receitasPorEvento[eventoNome].push(receita);
    });

    const tipoLabels = {
      diaria: 'Diária',
      hora_extra: 'Hora Extra',
      km: 'KM Rodado',
      tempo_viagem: 'Tempo de Viagem'
    };

    container.innerHTML = Object.keys(receitasPorEvento).map(eventoNome => `
      <div class="evento-group">
        <h4>${this.escapeHtml(eventoNome)}</h4>
        ${receitasPorEvento[eventoNome].map(receita => `
          <div class="card receita-card" data-receita-id="${receita.id}">
            <div class="card-body">
              <div class="card-header-row">
                <div>
                  <h5>${this.escapeHtml(receita.descricao)}</h5>
                  <span class="badge badge-info">${tipoLabels[receita.tipo] || receita.tipo}</span>
                  <span class="text-muted">${receita.quantidade} x R$ ${this.formatarMoeda(receita.valorUnitario)}</span>
                </div>
                <div class="card-actions">
                  <span class="valor">R$ ${this.formatarMoeda(receita.valorTotal)}</span>
                  <button class="btn btn-sm btn-secondary btn-editar-receita" data-receita-id="${receita.id}">Editar</button>
                  <button class="btn btn-sm btn-danger btn-remover-receita" data-receita-id="${receita.id}">Remover</button>
                </div>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `).join('');

    // Adicionar event listeners
    container.querySelectorAll('.btn-editar-receita').forEach(btn => {
      btn.addEventListener('click', async () => {
        const receitaId = btn.getAttribute('data-receita-id');
        const receita = receitas.find(r => r.id === receitaId);
        if (receita) {
          this.abrirFormulario(receita);
        }
      });
    });

    container.querySelectorAll('.btn-remover-receita').forEach(btn => {
      btn.addEventListener('click', async () => {
        const receitaId = btn.getAttribute('data-receita-id');
        await this.remover(receitaId);
      });
    });
  }

  async remover(id) {
    if (!confirm('Tem certeza que deseja remover esta receita?')) {
      return;
    }

    const result = await this.receitaController.remover(id);
    if (result.success) {
      await this.carregarLista();
      this.mostrarMensagem('Receita removida com sucesso!', 'success');
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
    document.getElementById('receitas-content').insertBefore(mensagemDiv, document.getElementById('receitas-content').firstChild);
    setTimeout(() => mensagemDiv.remove(), 5000);
  }
}

