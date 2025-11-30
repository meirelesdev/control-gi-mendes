/**
 * View: Configurações
 * Permite alterar valores de KM e Hora de Viagem
 */
import { Settings } from '../../domain/entities/Settings.js';

class SettingsView {
  constructor(settingsRepository, updateSettingsUseCase) {
    this.settingsRepository = settingsRepository;
    this.updateSettingsUseCase = updateSettingsUseCase;
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

            <div class="modal-footer" style="margin-top: var(--spacing-xl);">
              <button type="submit" class="btn btn-primary btn-lg" style="width: 100%;">
                Salvar Configurações
              </button>
            </div>
          </form>
        </div>
      `;

      document.getElementById('form-settings').addEventListener('submit', async (e) => {
        e.preventDefault();
        await this.saveSettings();
      });
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

    const result = await this.updateSettingsUseCase.execute({
      rateKm,
      rateTravelTime,
      defaultReimbursementDays
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
}

// Export para uso em módulos ES6
export { SettingsView };

