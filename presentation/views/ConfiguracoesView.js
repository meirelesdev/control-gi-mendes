/**
 * View de Configurações
 */
class ConfiguracoesView {
  constructor(configuracaoController) {
    this.configuracaoController = configuracaoController;
  }

  async render() {
    const container = document.getElementById('configuracoes-content');
    if (!container) return;

    const result = await this.configuracaoController.obter();

    if (!result.success) {
      container.innerHTML = `<div class="alert alert-danger">Erro: ${result.error}</div>`;
      return;
    }

    const config = result.data;

    container.innerHTML = `
      <div class="view-header">
        <h2>Configurações</h2>
      </div>

      <div class="form-container">
        <form id="configuracao-form">
          <div class="form-group">
            <label for="config-preco-km">Preço por KM (R$)</label>
            <input type="number" id="config-preco-km" class="form-control" step="0.01" min="0" value="${config.precoKm}" required />
            <small class="form-text text-muted">Valor usado para calcular receitas de KM rodado</small>
          </div>
          <div class="form-group">
            <label for="config-preco-hora-viagem">Preço por Hora de Viagem (R$)</label>
            <input type="number" id="config-preco-hora-viagem" class="form-control" step="0.01" min="0" value="${config.precoHoraViagem}" required />
            <small class="form-text text-muted">Valor usado para calcular receitas de tempo de viagem</small>
          </div>
          <div class="form-actions">
            <button type="submit" class="btn btn-primary">Salvar Configurações</button>
          </div>
        </form>
      </div>

      <div class="info-section">
        <div class="info-card">
          <h4>Como funciona</h4>
          <ul>
            <li>Os valores configurados aqui são usados automaticamente ao criar receitas do tipo "KM Rodado" e "Tempo de Viagem"</li>
            <li>Você pode alterar esses valores a qualquer momento</li>
            <li>As receitas já criadas não são alteradas automaticamente quando você muda a configuração</li>
          </ul>
        </div>
      </div>
    `;

    document.getElementById('configuracao-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.salvar();
    });
  }

  async salvar() {
    const precoKm = document.getElementById('config-preco-km').value;
    const precoHoraViagem = document.getElementById('config-preco-hora-viagem').value;

    const result = await this.configuracaoController.atualizar(precoKm, precoHoraViagem);

    if (result.success) {
      this.mostrarMensagem('Configurações salvas com sucesso!', 'success');
    } else {
      this.mostrarMensagem(`Erro: ${result.error}`, 'error');
    }
  }

  mostrarMensagem(mensagem, tipo) {
    const alertClass = tipo === 'success' ? 'alert-success' : 'alert-danger';
    const mensagemDiv = document.createElement('div');
    mensagemDiv.className = `alert ${alertClass} alert-dismissible`;
    mensagemDiv.innerHTML = `
      ${mensagem}
      <button type="button" class="close" onclick="this.parentElement.remove()">&times;</button>
    `;
    document.getElementById('configuracoes-content').insertBefore(mensagemDiv, document.getElementById('configuracoes-content').firstChild);
    setTimeout(() => mensagemDiv.remove(), 5000);
  }
}

