/**
 * Ponto de Entrada Principal - Chef Finance
 * Inicializa a aplicação com todas as dependências usando Injeção de Dependência
 */

// ============================================
// 1. IMPORTS
// ============================================
// NOTA: Handlers globais de erro estão registrados no index.html ANTES deste script

// Domain Entities (necessárias para os repositórios usarem métodos estáticos)
import { Settings } from './domain/entities/Settings.js';
import { Event } from './domain/entities/Event.js';
import { Transaction } from './domain/entities/Transaction.js';

// Verifica se Transaction foi carregado corretamente
if (!Transaction) {
  console.error('⚠️ Transaction não foi importado corretamente');
}

// Domain Repository Interfaces (necessárias para os repositórios estenderem)
import { SettingsRepository } from './domain/repositories/SettingsRepository.js';
import { EventRepository } from './domain/repositories/EventRepository.js';
import { TransactionRepository } from './domain/repositories/TransactionRepository.js';

// Infrastructure Repositories
import { 
  LocalStorageSettingsRepository,
  LocalStorageEventRepository,
  LocalStorageTransactionRepository
} from './infrastructure/index.js';

// Application Use Cases
import { CreateEvent } from './application/use-cases/CreateEvent.js';
import { AddTransaction } from './application/use-cases/AddTransaction.js';
import { DeleteTransaction } from './application/use-cases/DeleteTransaction.js';
import { GetEventSummary } from './application/use-cases/GetEventSummary.js';
import { UpdateSettings } from './application/use-cases/UpdateSettings.js';
import { GenerateEventReport } from './application/use-cases/GenerateEventReport.js';
import { GenerateMonthlyReport } from './application/use-cases/GenerateMonthlyReport.js';
import { UpdateEventStatus } from './application/use-cases/UpdateEventStatus.js';
import { UpdateEvent } from './application/use-cases/UpdateEvent.js';
import { UpdateTransaction } from './application/use-cases/UpdateTransaction.js';
import { DeleteEvent } from './application/use-cases/DeleteEvent.js';
import { ExportData } from './application/use-cases/data/ExportData.js';
import { ImportData } from './application/use-cases/data/ImportData.js';
import { ExportTransactionsToCSV } from './application/use-cases/data/ExportTransactionsToCSV.js';

// Presentation Layer
import { App } from './presentation/App.js';
import { toast } from './presentation/utils/Toast.js';

// ============================================
// 2. INSTÂNCIA DOS REPOSITÓRIOS
// ============================================

// Criar repositório de transações primeiro (não tem dependências)
const transactionRepository = new LocalStorageTransactionRepository();

// Criar repositório de eventos (injeta transactionRepository para cálculos)
const eventRepository = new LocalStorageEventRepository(transactionRepository);

// Criar repositório de configurações (não tem dependências)
const settingsRepository = new LocalStorageSettingsRepository();

// ============================================
// 3. INSTÂNCIA DOS USE CASES
// ============================================

// Use Case: Adicionar Transação (precisa ser criado antes para ser usado no CreateEvent)
const addTransaction = new AddTransaction(
  transactionRepository,
  eventRepository,
  settingsRepository
);

// Use Case: Criar Evento (recebe addTransaction e settingsRepository para criar diária automática)
const createEvent = new CreateEvent(eventRepository, addTransaction, settingsRepository);

// addTransaction já foi criado acima para ser usado no CreateEvent

// Use Case: Excluir Transação
const deleteTransaction = new DeleteTransaction(transactionRepository, eventRepository);

// Use Case: Obter Resumo do Evento
const getEventSummary = new GetEventSummary(
  eventRepository,
  transactionRepository,
  settingsRepository
);

// Use Case: Atualizar Configurações
const updateSettings = new UpdateSettings(settingsRepository);

// Use Case: Gerar Relatório de Fechamento
const generateEventReport = new GenerateEventReport(
  eventRepository,
  transactionRepository,
  settingsRepository
);

// Use Case: Gerar Relatório Mensal
const generateMonthlyReport = new GenerateMonthlyReport(
  eventRepository,
  transactionRepository,
  settingsRepository
);

// Use Case: Atualizar Status do Evento
const updateEventStatus = new UpdateEventStatus(
  eventRepository,
  settingsRepository,
  transactionRepository
);

// Use Case: Atualizar Evento (editar detalhes)
const updateEvent = new UpdateEvent(eventRepository);

// Use Case: Atualizar Transação (editar lançamentos)
const updateTransaction = new UpdateTransaction(
  transactionRepository,
  eventRepository,
  settingsRepository
);

// Use Case: Excluir Evento
const deleteEvent = new DeleteEvent(eventRepository, transactionRepository);

// Use Case: Exportar Dados (Backup)
const exportData = new ExportData(eventRepository, transactionRepository, settingsRepository);

// Use Case: Importar Dados (Restaurar Backup)
const importData = new ImportData(eventRepository, transactionRepository, settingsRepository);

// Use Case: Exportar Transações para CSV
const exportTransactionsToCSV = new ExportTransactionsToCSV(eventRepository, transactionRepository);

// ============================================
// 4. INICIALIZAÇÃO DA UI
// ============================================

// Aguarda o DOM estar pronto
document.addEventListener('DOMContentLoaded', () => {
  try {
    // Objeto com todas as dependências para a App
    const dependencies = {
      // Repositórios
      eventRepository,
      transactionRepository,
      settingsRepository,
      
      // Use Cases
      createEvent,
      addTransaction,
      deleteTransaction,
      getEventSummary,
      updateSettings,
      generateEventReport,
      generateMonthlyReport,
      updateEventStatus,
      updateEvent,
      updateTransaction,
      deleteEvent,
      exportData,
      importData,
      exportTransactionsToCSV
    };

    // Inicializar a aplicação
    const app = new App(dependencies);
    
    // Torna toast disponível globalmente
    window.toast = toast;
    
    // Registrar Service Worker para PWA
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        // Detecta o caminho base (para funcionar tanto localmente quanto no GitHub Pages)
        const basePath = window.location.pathname.includes('/control-gi-mendes/') 
          ? '/control-gi-mendes/sw.js' 
          : '/sw.js';
        
        navigator.serviceWorker.register(basePath, { scope: '/control-gi-mendes/' })
          .then((registration) => {
            // Verifica atualizações do service worker
            registration.addEventListener('updatefound', () => {
              const newWorker = registration.installing;
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // Novo service worker disponível
                }
              });
            });
          })
          .catch((error) => {
            // Service Worker não pôde ser registrado (não crítico)
          });
      });
    }
  } catch (error) {
    console.error('❌ Erro ao inicializar Chef Finance:', error);
    
    // Mostra mensagem de erro na tela
    const dashboardContent = document.getElementById('dashboard-content');
    if (dashboardContent) {
      dashboardContent.innerHTML = `
        <div class="card" style="border-left-color: var(--color-danger);">
          <h2 style="color: var(--color-danger);">Erro ao Inicializar</h2>
          <p>Ocorreu um erro ao carregar a aplicação.</p>
          <p class="text-muted">${error.message}</p>
          <p class="text-muted">Verifique o console do navegador para mais detalhes.</p>
        </div>
      `;
    }
  }
});
