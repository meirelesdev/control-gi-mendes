/**
 * View Principal da Aplicação
 */
class AppView {
  constructor() {
    this.currentView = 'dashboard';
  }

  init() {
    this.render();
    this.setupNavigation();
  }

  setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const view = e.target.getAttribute('data-view');
        this.navigateTo(view);
      });
    });
  }

  navigateTo(view) {
    this.currentView = view;
    this.render();
    
    // Atualizar navegação ativa
    document.querySelectorAll('.nav-link').forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('data-view') === view) {
        link.classList.add('active');
      }
    });
  }

  render() {
    const container = document.getElementById('app-content');
    if (!container) return;

    switch (this.currentView) {
      case 'dashboard':
        this.renderDashboard(container);
        break;
      case 'eventos':
        this.renderEventos(container);
        break;
      case 'despesas':
        this.renderDespesas(container);
        break;
      case 'receitas':
        this.renderReceitas(container);
        break;
      case 'configuracoes':
        this.renderConfiguracoes(container);
        break;
      default:
        this.renderDashboard(container);
    }
  }

  renderDashboard(container) {
    container.innerHTML = '<div id="dashboard-content">Carregando...</div>';
    // Será preenchido pelo DashboardView
  }

  renderEventos(container) {
    container.innerHTML = '<div id="eventos-content">Carregando...</div>';
    // Será preenchido pelo EventosView
  }

  renderDespesas(container) {
    container.innerHTML = '<div id="despesas-content">Carregando...</div>';
    // Será preenchido pelo DespesasView
  }

  renderReceitas(container) {
    container.innerHTML = '<div id="receitas-content">Carregando...</div>';
    // Será preenchido pelo ReceitasView
  }

  renderConfiguracoes(container) {
    container.innerHTML = '<div id="configuracoes-content">Carregando...</div>';
    // Será preenchido pelo ConfiguracoesView
  }
}

