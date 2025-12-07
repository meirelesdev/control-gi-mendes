/**
 * View: Configurações
 * Permite alterar valores de KM e Hora de Viagem
 */
import { Settings } from '../../domain/entities/Settings.js';
import { DEFAULT_VALUES } from '../../domain/constants/DefaultValues.js';

class SettingsView {
  constructor(settingsRepository, updateSettingsUseCase, exportDataUseCase = null, importDataUseCase = null, exportTransactionsToCSVUseCase = null, eventRepository = null, transactionRepository = null) {
    this.settingsRepository = settingsRepository;
    this.updateSettingsUseCase = updateSettingsUseCase;
    this.exportDataUseCase = exportDataUseCase;
    this.importDataUseCase = importDataUseCase;
    this.exportTransactionsToCSVUseCase = exportTransactionsToCSVUseCase;
    this.eventRepository = eventRepository;
    this.transactionRepository = transactionRepository;
  }

  async render() {
    const container = document.getElementById('settings-content');
    if (!container) return;

    container.innerHTML = '<div class="loading">Carregando...</div>';

    try {
      let settings = await this.settingsRepository.find();
      if (!settings) {
        settings = Settings.createDefault();
        await this.settingsRepository.save(settings);
      }

      container.innerHTML = `
        <div class="card">
          <h2>Configurações</h2>
          <p class="text-muted">Configure os valores padrão do sistema</p>
        </div>

        <div class="card">
          <form id="form-settings">
            <div class="form-group">
              <label class="form-label">Preço por KM (R$)</label>
              <input type="number" class="form-input" id="settings-rate-km" 
                     step="0.01" min="0" value="${settings.rateKm}" required>
              <small class="text-muted">Valor usado para calcular receitas de KM rodado</small>
            </div>

            <div class="form-group">
              <label class="form-label">Preço por Hora de Viagem (R$)</label>
              <input type="number" class="form-input" id="settings-rate-travel-time" 
                     step="0.01" min="0" value="${settings.rateTravelTime}" required>
              <small class="text-muted">Valor usado para calcular receitas de tempo de viagem</small>
            </div>

            <div class="form-group">
              <label class="form-label">Dias Padrão para Reembolso</label>
              <input type="number" class="form-input" id="settings-reimbursement-days" 
                     step="1" min="1" max="365" value="${settings.defaultReimbursementDays}" required>
              <small class="text-muted">Número de dias após o evento para calcular data prevista de recebimento</small>
            </div>

            <div class="form-group">
              <label class="form-label">Teto de Hospedagem (R$)</label>
              <input type="number" class="form-input" id="settings-max-hotel-rate" 
                     step="0.01" min="0" value="${settings.maxHotelRate || DEFAULT_VALUES.MAX_HOTEL_RATE}" required>
              <small class="text-muted">Valor máximo permitido para despesas de hospedagem conforme contrato</small>
            </div>

            <div class="form-group">
              <label class="form-label">Diária Técnica Padrão (R$)</label>
              <input type="number" class="form-input" id="settings-standard-daily-rate" 
                     step="0.01" min="0" value="${settings.standardDailyRate || DEFAULT_VALUES.DAILY_RATE}" required>
              <small class="text-muted">Valor padrão da diária técnica lançada automaticamente ao criar evento</small>
            </div>

            <div class="form-group">
              <label class="form-label">Taxa de Hora Extra (R$)</label>
              <input type="number" class="form-input" id="settings-overtime-rate" 
                     step="0.01" min="0" value="${settings.overtimeRate || DEFAULT_VALUES.OVERTIME_RATE}" required>
              <small class="text-muted">Valor por hora extra trabalhada</small>
            </div>

            <div class="modal-footer" style="margin-top: var(--spacing-xl);">
              <button type="submit" class="btn btn-primary btn-lg" style="width: 100%;">
                Salvar Configurações
              </button>
            </div>
          </form>
        </div>

        ${this.exportDataUseCase ? `
        <div class="card" style="margin-top: var(--spacing-lg); border-left: 4px solid var(--color-primary);">
          <h3 style="margin-bottom: var(--spacing-md); color: var(--color-text);">
            🔐 Gestão de Dados
          </h3>
          <p class="text-muted" style="margin-bottom: var(--spacing-lg);">
            Faça backup dos seus dados para evitar perda de informações. Essencial ao trocar de dispositivo ou limpar o cache.
          </p>

          <div style="display: flex; flex-direction: column; gap: var(--spacing-md);">
            <button class="btn btn-primary" id="btn-export-backup" style="width: 100%;">
              ⬇️ Fazer Backup Completo
            </button>

            <label class="btn btn-secondary" style="width: 100%; cursor: pointer; text-align: center; display: flex; align-items: center; justify-content: center;">
              <input type="file" id="input-restore-backup" accept=".json" style="display: none;">
              ⬆️ Restaurar Backup
            </label>

            ${this.exportTransactionsToCSVUseCase ? `
            <button class="btn btn-info" id="btn-export-csv" style="width: 100%;">
              📊 Baixar Planilha (.csv)
            </button>
            ` : ''}
          </div>
        </div>

        <div class="card" style="margin-top: var(--spacing-lg); border-left: 4px solid var(--color-danger); background: linear-gradient(135deg, #FFEBEE 0%, #FFF3E0 100%);">
          <h3 style="margin-bottom: var(--spacing-md); color: var(--color-danger);">
            ⚠️ Zona de Perigo
          </h3>
          <p class="text-muted" style="margin-bottom: var(--spacing-md);">
            Esta ação apagará <strong>todos</strong> os dados do sistema (eventos, transações e configurações). 
            Esta ação não pode ser desfeita. Certifique-se de ter feito um backup antes.
          </p>
          <button class="btn btn-danger" id="btn-reset-all" style="width: 100%;">
            🗑️ Apagar Tudo
          </button>
        </div>
        ` : ''}
      `;

      document.getElementById('form-settings').addEventListener('submit', async (e) => {
        e.preventDefault();
        await this.saveSettings();
      });

      // Event listeners para gestão de dados
      if (this.exportDataUseCase) {
        this._setupDataManagementListeners();
      }
    } catch (error) {
      container.innerHTML = `
        <div class="card" style="border-left-color: var(--color-danger);">
          <p style="color: var(--color-danger);">Erro ao carregar configurações: ${error.message}</p>
        </div>
      `;
    }
  }

  async saveSettings() {
    const rateKm = parseFloat(document.getElementById('settings-rate-km').value);
    const rateTravelTime = parseFloat(document.getElementById('settings-rate-travel-time').value);
    const defaultReimbursementDays = parseInt(document.getElementById('settings-reimbursement-days').value);
    const maxHotelRate = parseFloat(document.getElementById('settings-max-hotel-rate').value);
    const standardDailyRate = parseFloat(document.getElementById('settings-standard-daily-rate').value);
    const overtimeRate = parseFloat(document.getElementById('settings-overtime-rate').value);

    const result = await this.updateSettingsUseCase.execute({
      rateKm,
      rateTravelTime,
      defaultReimbursementDays,
      maxHotelRate,
      standardDailyRate,
      overtimeRate
    });

    if (result.success) {
      window.toast.success('Configurações salvas com sucesso!');
      // Mostra feedback visual
      const btn = document.querySelector('#form-settings button[type="submit"]');
      const originalText = btn.textContent;
      btn.textContent = '✓ Salvo!';
      btn.style.background = 'var(--color-success)';
      
      setTimeout(() => {
        btn.textContent = originalText;
        btn.style.background = '';
      }, 2000);
    } else {
      window.toast.error(`Erro: ${result.error}`);
    }
  }

  /**
   * Configura os event listeners para gestão de dados
   * @private
   */
  _setupDataManagementListeners() {
    // Exportar Backup
    const btnExportBackup = document.getElementById('btn-export-backup');
    if (btnExportBackup) {
      btnExportBackup.addEventListener('click', () => this.exportBackup());
    }

    // Restaurar Backup
    const inputRestoreBackup = document.getElementById('input-restore-backup');
    if (inputRestoreBackup) {
      inputRestoreBackup.addEventListener('change', (e) => this.restoreBackup(e));
    }

    // Exportar CSV
    const btnExportCSV = document.getElementById('btn-export-csv');
    if (btnExportCSV) {
      btnExportCSV.addEventListener('click', () => this.exportCSV());
    }

    // Reset de Fábrica
    const btnResetAll = document.getElementById('btn-reset-all');
    if (btnResetAll) {
      btnResetAll.addEventListener('click', () => this.resetAll());
    }
  }

  /**
   * Exporta backup completo em JSON
   */
  async exportBackup() {
    try {
      if (!this.exportDataUseCase) {
        window.toast.error('Funcionalidade de exportação não disponível');
        return;
      }

      const btn = document.getElementById('btn-export-backup');
      const originalText = btn.textContent;
      btn.disabled = true;
      btn.textContent = '⏳ Exportando...';

      const backupData = await this.exportDataUseCase.execute();

      // Gera nome do arquivo com data
      const date = new Date();
      const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
      const filename = `backup_gi_financas_${dateStr}.json`;

      // Cria blob e faz download
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      window.toast.success(`Backup exportado com sucesso! (${backupData.events.length} eventos, ${backupData.transactions.length} transações)`);
      
      btn.disabled = false;
      btn.textContent = originalText;
    } catch (error) {
      window.toast.error(`Erro ao exportar backup: ${error.message}`);
      const btn = document.getElementById('btn-export-backup');
      if (btn) {
        btn.disabled = false;
        btn.textContent = '⬇️ Fazer Backup Completo';
      }
    }
  }

  /**
   * Restaura backup de arquivo JSON
   * @param {Event} event - Evento do input file
   */
  async restoreBackup(event) {
    try {
      if (!this.importDataUseCase) {
        window.toast.error('Funcionalidade de importação não disponível');
        return;
      }

      const file = event.target.files[0];
      if (!file) {
        return;
      }

      // Confirmação
      const confirmed = window.confirm(
        '⚠️ ATENÇÃO: Esta ação substituirá TODOS os dados atuais pelos dados do backup.\n\n' +
        'Certifique-se de que este é o arquivo correto.\n\n' +
        'Deseja continuar?'
      );

      if (!confirmed) {
        event.target.value = ''; // Limpa o input
        return;
      }

      // Lê o arquivo
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const backupData = e.target.result;
          const result = await this.importDataUseCase.execute(backupData);

          window.toast.success(
            `Backup restaurado com sucesso! ` +
            `(${result.eventsCount} eventos, ${result.transactionsCount} transações restaurados)`
          );

          // Recarrega a página para aplicar os dados novos
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        } catch (error) {
          window.toast.error(`Erro ao restaurar backup: ${error.message}`);
          event.target.value = ''; // Limpa o input em caso de erro
        }
      };

      reader.onerror = () => {
        window.toast.error('Erro ao ler arquivo de backup');
        event.target.value = '';
      };

      reader.readAsText(file);
    } catch (error) {
      window.toast.error(`Erro ao processar backup: ${error.message}`);
      event.target.value = '';
    }
  }

  /**
   * Exporta transações para CSV
   */
  async exportCSV() {
    try {
      if (!this.exportTransactionsToCSVUseCase) {
        window.toast.error('Funcionalidade de exportação CSV não disponível');
        return;
      }

      const btn = document.getElementById('btn-export-csv');
      const originalText = btn.textContent;
      btn.disabled = true;
      btn.textContent = '⏳ Gerando...';

      const csvContent = await this.exportTransactionsToCSVUseCase.execute();

      // Gera nome do arquivo com data
      const date = new Date();
      const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
      const filename = `transacoes_gi_financas_${dateStr}.csv`;

      // Cria blob e faz download
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' }); // BOM para Excel
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      window.toast.success('Planilha CSV exportada com sucesso!');
      
      btn.disabled = false;
      btn.textContent = originalText;
    } catch (error) {
      window.toast.error(`Erro ao exportar CSV: ${error.message}`);
      const btn = document.getElementById('btn-export-csv');
      if (btn) {
        btn.disabled = false;
        btn.textContent = '📊 Baixar Planilha (.csv)';
      }
    }
  }

  /**
   * Reset de fábrica - Apaga todos os dados
   */
  async resetAll() {
    try {
      // Primeira confirmação
      const firstConfirm = window.prompt(
        '⚠️ ATENÇÃO CRÍTICA ⚠️\n\n' +
        'Esta ação apagará PERMANENTEMENTE:\n' +
        '• Todos os eventos\n' +
        '• Todas as transações\n' +
        '• Todas as configurações\n\n' +
        'Esta ação NÃO PODE SER DESFEITA!\n\n' +
        'Digite "DELETAR" (em maiúsculas) para confirmar:'
      );

      if (firstConfirm !== 'DELETAR') {
        window.toast.info('Operação cancelada');
        return;
      }

      // Segunda confirmação
      const secondConfirm = window.confirm(
        '⚠️ ÚLTIMA CONFIRMAÇÃO ⚠️\n\n' +
        'Você tem CERTEZA ABSOLUTA que deseja apagar TODOS os dados?\n\n' +
        'Certifique-se de ter feito um backup antes de continuar.\n\n' +
        'Esta ação é IRREVERSÍVEL!'
      );

      if (!secondConfirm) {
        window.toast.info('Operação cancelada');
        return;
      }

      const btn = document.getElementById('btn-reset-all');
      const originalText = btn.textContent;
      btn.disabled = true;
      btn.textContent = '⏳ Apagando...';

      // Apaga todos os eventos
      if (this.eventRepository) {
        const events = await this.eventRepository.findAll();
        for (const event of events) {
          await this.eventRepository.delete(event.id);
        }
      }

      // Apaga todas as transações
      if (this.transactionRepository) {
        const transactions = await this.transactionRepository.findAll();
        for (const transaction of transactions) {
          await this.transactionRepository.delete(transaction.id);
        }
      }

      // Restaura configurações padrão
      if (this.settingsRepository) {
        const defaultSettings = Settings.createDefault();
        await this.settingsRepository.save(defaultSettings);
      }

      window.toast.success('Todos os dados foram apagados. A página será recarregada...');

      // Recarrega a página
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      window.toast.error(`Erro ao apagar dados: ${error.message}`);
      const btn = document.getElementById('btn-reset-all');
      if (btn) {
        btn.disabled = false;
        btn.textContent = '🗑️ Apagar Tudo';
      }
    }
  }
}

// Export para uso em módulos ES6
export { SettingsView };

