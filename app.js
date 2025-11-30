/**
 * Inicialização da Aplicação
 * Configura todas as dependências e inicializa a aplicação
 */

// Inicializar repositórios
const eventoRepository = new LocalStorageEventoRepository();
const despesaRepository = new LocalStorageDespesaRepository();
const receitaRepository = new LocalStorageReceitaRepository();
const configuracaoRepository = new LocalStorageConfiguracaoRepository();

// Inicializar casos de uso
const criarEventoUseCase = new CriarEventoUseCase(eventoRepository);
const listarEventosUseCase = new ListarEventosUseCase(eventoRepository);
const atualizarEventoUseCase = new AtualizarEventoUseCase(eventoRepository);
const removerEventoUseCase = new RemoverEventoUseCase(eventoRepository, despesaRepository, receitaRepository);

const criarDespesaUseCase = new CriarDespesaUseCase(despesaRepository, eventoRepository);
const listarDespesasUseCase = new ListarDespesasUseCase(despesaRepository);
const atualizarDespesaUseCase = new AtualizarDespesaUseCase(despesaRepository);
const marcarNotaFiscalEmitidaUseCase = new MarcarNotaFiscalEmitidaUseCase(despesaRepository);
const removerDespesaUseCase = new RemoverDespesaUseCase(despesaRepository);

const criarReceitaUseCase = new CriarReceitaUseCase(receitaRepository, eventoRepository, configuracaoRepository);
const listarReceitasUseCase = new ListarReceitasUseCase(receitaRepository);
const atualizarReceitaUseCase = new AtualizarReceitaUseCase(receitaRepository, configuracaoRepository);
const removerReceitaUseCase = new RemoverReceitaUseCase(receitaRepository);

const obterConfiguracaoUseCase = new ObterConfiguracaoUseCase(configuracaoRepository);
const atualizarConfiguracaoUseCase = new AtualizarConfiguracaoUseCase(configuracaoRepository);

const obterResumoFinanceiroUseCase = new ObterResumoFinanceiroUseCase(despesaRepository, receitaRepository);

// Inicializar controllers
const eventoController = new EventoController(
    criarEventoUseCase,
    listarEventosUseCase,
    atualizarEventoUseCase,
    removerEventoUseCase
);

const despesaController = new DespesaController(
    criarDespesaUseCase,
    listarDespesasUseCase,
    atualizarDespesaUseCase,
    marcarNotaFiscalEmitidaUseCase,
    removerDespesaUseCase
);

const receitaController = new ReceitaController(
    criarReceitaUseCase,
    listarReceitasUseCase,
    atualizarReceitaUseCase,
    removerReceitaUseCase
);

const configuracaoController = new ConfiguracaoController(
    obterConfiguracaoUseCase,
    atualizarConfiguracaoUseCase
);

const resumoController = new ResumoController(obterResumoFinanceiroUseCase);

// Inicializar views
const appView = new AppView();
const dashboardView = new DashboardView(resumoController, eventoController);
const eventosView = new EventosView(eventoController);
const despesasView = new DespesasView(despesaController, eventoController);
const receitasView = new ReceitasView(receitaController, eventoController);
const configuracoesView = new ConfiguracoesView(configuracaoController);

// Views já não precisam mais ser globais, usando event delegation

// Função para renderizar a view atual
async function renderizarViewAtual() {
    const view = appView.currentView;
    appView.render();

    // Aguardar um pouco para garantir que o DOM foi atualizado
    setTimeout(async () => {
        switch (view) {
            case 'dashboard':
                await dashboardView.render();
                break;
            case 'eventos':
                await eventosView.render();
                break;
            case 'despesas':
                await despesasView.render();
                break;
            case 'receitas':
                await receitasView.render();
                break;
            case 'configuracoes':
                await configuracoesView.render();
                break;
        }
    }, 100);
}

// Configurar navegação
appView.navigateTo = function(view) {
    this.currentView = view;
    renderizarViewAtual();
    
    // Atualizar navegação ativa
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('data-view') === view) {
            link.classList.add('active');
        }
    });
};

// Inicializar aplicação quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    appView.init();
    renderizarViewAtual();
});

