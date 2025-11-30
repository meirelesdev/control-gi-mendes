/**
 * View do Dashboard
 */
class DashboardView {
  constructor(resumoController, eventoController) {
    this.resumoController = resumoController;
    this.eventoController = eventoController;
  }

  async render() {
    const container = document.getElementById('dashboard-content');
    if (!container) return;

    const resumo = await this.resumoController.obter();
    const eventos = await this.eventoController.listar();

    if (!resumo.success) {
      container.innerHTML = `<div class="alert alert-danger">Erro: ${resumo.error}</div>`;
      return;
    }

    const resumoData = resumo.data;
    const eventosData = eventos.success ? eventos.data : [];

    container.innerHTML = `
      <div class="dashboard-header">
        <h2>Dashboard Financeiro</h2>
      </div>

      <div class="resumo-cards">
        <div class="card card-reembolso">
          <div class="card-header">
            <h3>Total de Reembolsos</h3>
          </div>
          <div class="card-body">
            <div class="valor">R$ ${this.formatarMoeda(resumoData.totalReembolsos)}</div>
            <div class="subtitle">${resumoData.totalDespesas} despesa(s)</div>
          </div>
        </div>

        <div class="card card-lucro">
          <div class="card-header">
            <h3>Total de Lucros</h3>
          </div>
          <div class="card-body">
            <div class="valor">R$ ${this.formatarMoeda(resumoData.totalLucros)}</div>
            <div class="subtitle">${resumoData.totalReceitas} receita(s)</div>
          </div>
        </div>

        <div class="card card-saldo ${resumoData.saldo >= 0 ? 'saldo-positivo' : 'saldo-negativo'}">
          <div class="card-header">
            <h3>Saldo</h3>
          </div>
          <div class="card-body">
            <div class="valor">R$ ${this.formatarMoeda(resumoData.saldo)}</div>
            <div class="subtitle">Lucros - Reembolsos</div>
          </div>
        </div>
      </div>

      <div class="info-section">
        <div class="info-card">
          <h4>Status das Notas Fiscais</h4>
          <div class="info-item">
            <span class="badge badge-success">${resumoData.despesasComNota} com nota</span>
            <span class="badge badge-warning">${resumoData.despesasSemNota} sem nota</span>
          </div>
        </div>
      </div>

      <div class="eventos-recentes">
        <h3>Eventos Recentes</h3>
        ${eventosData.length === 0 
          ? '<p class="text-muted">Nenhum evento cadastrado ainda.</p>'
          : eventosData.slice(0, 5).map(e => `
            <div class="evento-item">
              <div class="evento-nome">${this.escapeHtml(e.nome)}</div>
              <div class="evento-data">${this.formatarData(e.data)}</div>
            </div>
          `).join('')
        }
      </div>
    `;
  }

  formatarMoeda(valor) {
    return parseFloat(valor).toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
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
}

