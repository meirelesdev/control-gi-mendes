/**
 * Ponto de Entrada Principal - Gi Finanças
 * Inicializa a aplicação com todas as dependências usando Injeção de Dependência
 */

// ============================================
// 1. IMPORTS
// ============================================

// Domain Entities (necessárias para os repositórios usarem métodos estáticos)
import { Settings } from './domain/entities/Settings.js';
import { Event } from './domain/entities/Event.js';
import { Transaction } from './domain/entities/Transaction.js';

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
import { GetEventSummary } from './application/use-cases/GetEventSummary.js';
import { UpdateSettings } from './application/use-cases/UpdateSettings.js';

// Presentation Layer
import { App } from './presentation/App.js';

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

// Use Case: Criar Evento
const createEvent = new CreateEvent(eventRepository);

// Use Case: Adicionar Transação
const addTransaction = new AddTransaction(
  transactionRepository,
  eventRepository,
  settingsRepository
);

// Use Case: Obter Resumo do Evento
const getEventSummary = new GetEventSummary(
  eventRepository,
  transactionRepository,
  settingsRepository
);

// Use Case: Atualizar Configurações
const updateSettings = new UpdateSettings(settingsRepository);

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
      getEventSummary,
      updateSettings
    };

    // Inicializar a aplicação
    const app = new App(dependencies);
    
    console.log('✅ Gi Finanças inicializado com sucesso!');
    
    // Registrar Service Worker para PWA
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then((registration) => {
            console.log('✅ Service Worker registrado com sucesso:', registration.scope);
            
            // Verifica atualizações do service worker
            registration.addEventListener('updatefound', () => {
              const newWorker = registration.installing;
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // Novo service worker disponível
                  console.log('🔄 Nova versão disponível! Recarregue a página.');
                }
              });
            });
          })
          .catch((error) => {
            console.warn('⚠️ Service Worker não pôde ser registrado:', error);
          });
      });
    }
  } catch (error) {
    console.error('❌ Erro ao inicializar Gi Finanças:', error);
    
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
