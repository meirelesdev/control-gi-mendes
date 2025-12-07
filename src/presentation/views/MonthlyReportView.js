/**
 * View: Relatório Mensal
 * Permite selecionar mês/ano e gerar relatório mensal
 */
import { ReportView } from './ReportView.js';

class MonthlyReportView {
  constructor(generateMonthlyReportUseCase, settingsRepository = null) {
    this.generateMonthlyReportUseCase = generateMonthlyReportUseCase;
    this.settingsRepository = settingsRepository;
    this.currentMonth = new Date().getMonth() + 1; // 1-12
    this.currentYear = new Date().getFullYear();
  }

  async render() {
    const container = document.getElementById('monthly-report-content');
    if (!container) return;

    container.innerHTML = '<div class="loading">Carregando...</div>';

    try {
      // Busca configurações para obter e-mails
      let contractorEmails = '';
      if (this.settingsRepository) {
        const settings = await this.settingsRepository.find();
        if (settings && settings.contractorEmails) {
          contractorEmails = settings.contractorEmails;
        }
      }

      // Renderiza interface de seleção de mês/ano
      container.innerHTML = `
        <div class="card">
          <h2 style="margin-bottom: var(--spacing-md);">📅 Fechamento Mensal</h2>
          <p class="text-muted" style="margin-bottom: var(--spacing-lg);">
            Gere o relatório mensal de prestação de contas conforme exigido no contrato.
            O relatório agrupa todos os eventos do mês selecionado.
          </p>
          ${contractorEmails ? `
          <div style="background-color: #e3f2fd; border-left: 4px solid #2196f3; padding: 12px; margin-top: var(--spacing-md); border-radius: 4px;">
            <div style="font-size: 0.9em; color: #1976d2; font-weight: 500; margin-bottom: 4px;">
              📧 E-mails para envio de Notas Fiscais:
            </div>
            <div style="font-size: 0.85em; color: #424242;">
              ${contractorEmails}
            </div>
          </div>
          ` : ''}
        </div>

        <div class="card">
          <form id="form-monthly-report">
            <div class="form-group">
              <label class="form-label">Mês</label>
              <select class="form-input" id="report-month" required>
                <option value="1" ${this.currentMonth === 1 ? 'selected' : ''}>Janeiro</option>
                <option value="2" ${this.currentMonth === 2 ? 'selected' : ''}>Fevereiro</option>
                <option value="3" ${this.currentMonth === 3 ? 'selected' : ''}>Março</option>
                <option value="4" ${this.currentMonth === 4 ? 'selected' : ''}>Abril</option>
                <option value="5" ${this.currentMonth === 5 ? 'selected' : ''}>Maio</option>
                <option value="6" ${this.currentMonth === 6 ? 'selected' : ''}>Junho</option>
                <option value="7" ${this.currentMonth === 7 ? 'selected' : ''}>Julho</option>
                <option value="8" ${this.currentMonth === 8 ? 'selected' : ''}>Agosto</option>
                <option value="9" ${this.currentMonth === 9 ? 'selected' : ''}>Setembro</option>
                <option value="10" ${this.currentMonth === 10 ? 'selected' : ''}>Outubro</option>
                <option value="11" ${this.currentMonth === 11 ? 'selected' : ''}>Novembro</option>
                <option value="12" ${this.currentMonth === 12 ? 'selected' : ''}>Dezembro</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Ano</label>
              <input type="number" class="form-input" id="report-year" 
                     value="${this.currentYear}" min="2020" max="2100" required>
            </div>

            <div style="display: flex; gap: var(--spacing-md); margin-top: var(--spacing-xl); flex-wrap: wrap;">
              <button type="button" class="btn btn-secondary" id="btn-back-dashboard" style="flex: 1; min-width: 100px;">
                Voltar
              </button>
              <button type="submit" class="btn btn-primary" style="flex: 1; min-width: 140px; white-space: nowrap;">
                📄 Relatório Mensal
              </button>
            </div>
          </form>
        </div>
      `;

      // Event listener para voltar ao dashboard
      const btnBack = document.getElementById('btn-back-dashboard');
      if (btnBack) {
        btnBack.addEventListener('click', () => {
          window.dispatchEvent(new CustomEvent('navigate', { 
            detail: { view: 'dashboard' } 
          }));
        });
      }

      // Event listener para gerar relatório
      const form = document.getElementById('form-monthly-report');
      if (form) {
        form.addEventListener('submit', async (e) => {
          e.preventDefault();
          await this.generateReport();
        });
      }
    } catch (error) {
      container.innerHTML = `
        <div class="card" style="border-left-color: var(--color-danger);">
          <p style="color: var(--color-danger);">Erro ao carregar: ${error.message}</p>
        </div>
      `;
    }
  }

  async generateReport() {
    try {
      const month = parseInt(document.getElementById('report-month').value);
      const year = parseInt(document.getElementById('report-year').value);

      if (!month || month < 1 || month > 12) {
        window.toast?.error('Mês inválido');
        return;
      }

      if (!year || year < 2020 || year > 2100) {
        window.toast?.error('Ano inválido');
        return;
      }

      // Mostra feedback de carregamento
      const submitBtn = document.querySelector('#form-monthly-report button[type="submit"]');
      const originalText = submitBtn?.textContent || '📄 Gerar Relatório Mensal';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = '⏳ Gerando...';
      }

      // Gera o relatório
      const result = await this.generateMonthlyReportUseCase.execute(month, year);

      if (result.success) {
        // Renderiza o relatório
        const reportView = new ReportView();
        reportView.render(result, true); // true = relatório mensal
        
        // Busca e-mails para mostrar informação
        let emailInfo = '';
        if (result.data && result.data.paymentInfo && result.data.paymentInfo.emails) {
          emailInfo = `\n\n📧 Envie as Notas Fiscais para:\n${result.data.paymentInfo.emails}`;
        }
        
        window.toast?.success(`Relatório mensal gerado com sucesso!${emailInfo}`, 5000);
      } else {
        window.toast?.error(`Erro ao gerar relatório: ${result.error}`);
      }

      // Restaura o botão
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
    } catch (error) {
      console.error('Erro ao gerar relatório mensal:', error);
      window.toast?.error(`Erro ao gerar relatório: ${error.message}`);
      
      // Restaura o botão em caso de erro
      const submitBtn = document.querySelector('#form-monthly-report button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = '📄 Gerar Relatório Mensal';
      }
    }
  }
}

// Export para uso em módulos ES6
export { MonthlyReportView };

