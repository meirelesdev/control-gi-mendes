/**
 * View: Relatório de Fechamento
 * Renderiza um relatório HTML formatado para impressão
 */
import { Formatters } from '../utils/Formatters.js';
import { DEFAULT_VALUES } from '../../domain/constants/DefaultValues.js';

class ReportView {
  constructor() {
    // Esta view não precisa de dependências, apenas renderiza dados
  }

  /**
   * Renderiza o relatório em uma nova janela para impressão
   * @param {Object} reportData - Dados do relatório gerados pelo Use Case
   * @param {boolean} isMonthly - Se true, é relatório mensal; se false, é relatório de evento
   */
  render(reportData, isMonthly = false) {
    if (!reportData || !reportData.success || !reportData.data) {
      window.toast?.error('Erro ao gerar relatório: dados inválidos');
      return;
    }

    const data = reportData.data;
    
    // Cria uma nova janela
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) {
      window.toast?.error('Por favor, permita pop-ups para gerar o relatório');
      return;
    }

    // Monta o HTML do relatório
    printWindow.document.write(this._generateHTML(data, isMonthly));
    printWindow.document.close();

    // Aguarda o conteúdo carregar antes de mostrar o botão de impressão
    printWindow.onload = () => {
      // Adiciona event listener para o botão de impressão
      const printBtn = printWindow.document.getElementById('btn-print');
      if (printBtn) {
        printBtn.addEventListener('click', () => {
          printWindow.print();
        });
      }
    };
  }

  /**
   * Gera o HTML do relatório
   * @param {Object} data - Dados do relatório
   * @param {boolean} isMonthly - Se true, é relatório mensal
   * @private
   */
  _generateHTML(data, isMonthly = false) {
    const formatCurrency = (value) => Formatters.currency(value);

    const formatDate = (dateString) => {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      }).format(date);
    };

    const formatDateTime = (dateString) => {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    };

    const title = isMonthly 
      ? `Relatório Mensal de Prestação de Contas - ${data.header.period}`
      : `Relatório de Prestação de Contas - ${this._escapeHtml(data.header.eventName)}`;
    
    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Times New Roman', serif;
            font-size: 12pt;
            line-height: 1.6;
            color: #000;
            background: #fff;
            padding: 20mm;
            max-width: 210mm;
            margin: 0 auto;
        }

        .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #000;
            padding-bottom: 15px;
        }

        .header h1 {
            font-size: 18pt;
            font-weight: bold;
            margin-bottom: 10px;
            text-transform: uppercase;
        }

        .header .event-name {
            font-size: 14pt;
            font-weight: bold;
            margin-top: 10px;
            color: #000;
        }

        .header .event-date {
            font-size: 11pt;
            margin-top: 5px;
        }

        .header .generated-at {
            font-size: 9pt;
            margin-top: 10px;
            color: #666;
        }

        .section {
            margin-bottom: 25px;
            page-break-inside: avoid;
            break-inside: avoid;
        }

        .section-title {
            font-size: 14pt;
            font-weight: bold;
            margin-bottom: 10px;
            border-bottom: 1px solid #000;
            padding-bottom: 5px;
            text-transform: uppercase;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15px;
            font-size: 11pt;
            page-break-inside: avoid;
            break-inside: avoid;
        }

        table th {
            background-color: #f0f0f0;
            border: 1px solid #000;
            padding: 8px;
            text-align: left;
            font-weight: bold;
        }

        table td {
            border: 1px solid #000;
            padding: 6px 8px;
        }

        table td:last-child {
            text-align: right;
        }

        .total-row {
            font-weight: bold;
            background-color: #f5f5f5;
        }

        .summary {
            margin-top: 30px;
            border: 2px solid #000;
            padding: 15px;
            background-color: #fafafa;
            page-break-inside: avoid;
            break-inside: avoid;
        }

        .summary-title {
            font-size: 14pt;
            font-weight: bold;
            margin-bottom: 15px;
            text-align: center;
            text-transform: uppercase;
        }

        .summary-row {
            display: flex;
            justify-content: space-between;
            padding: 5px 0;
            border-bottom: 1px solid #ccc;
        }

        .summary-row:last-child {
            border-bottom: none;
        }

        .summary-row.total {
            font-weight: bold;
            font-size: 13pt;
            margin-top: 10px;
            padding-top: 10px;
            border-top: 2px solid #000;
        }

        .print-button {
            text-align: center;
            margin: 20px 0;
        }

        .btn-print {
            background-color: #667eea;
            color: white;
            border: none;
            padding: 12px 24px;
            font-size: 14pt;
            cursor: pointer;
            border-radius: 4px;
            font-weight: bold;
        }

        .btn-print:hover {
            background-color: #5568d3;
        }

        .no-data {
            text-align: center;
            padding: 20px;
            color: #666;
            font-style: italic;
        }

        /* Estilos para impressão */
        @media print {
            body {
                padding: 15mm;
            }

            .print-button {
                display: none;
            }

            .section {
                page-break-inside: avoid;
                break-inside: avoid;
            }

            table {
                page-break-inside: avoid;
                break-inside: avoid;
            }

            thead {
                display: table-header-group;
            }

            tbody {
                display: table-row-group;
            }

            tr {
                page-break-inside: avoid;
                break-inside: avoid;
                page-break-after: auto;
            }

            .summary {
                page-break-inside: avoid;
                break-inside: avoid;
            }

            /* Evita quebra na seção de pagamento */
            .summary.payment-info {
                page-break-inside: avoid !important;
                break-inside: avoid !important;
                page-break-after: auto;
            }

            .summary:last-of-type {
                page-break-inside: avoid;
                break-inside: avoid;
                page-break-after: auto;
            }
        }

        @page {
            size: A4;
            margin: 15mm;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Relatório de Prestação de Contas</h1>
        ${isMonthly ? `
        <div class="event-name">${data.header.period}</div>
        <div class="event-date">Período: ${data.header.monthName} de ${data.header.year}</div>
        <div class="event-date" style="margin-top: 5px;">Total de Eventos: ${data.header.eventsCount}</div>
        ` : `
        <div class="event-name">${this._escapeHtml(data.header.eventName)}</div>
        <div class="event-date">Data do Evento: ${formatDate(data.header.eventDate)}</div>
        `}
        <div class="generated-at">Relatório gerado em: ${formatDateTime(data.header.generatedAt)}</div>
    </div>

    ${data.contractorInfo ? `
    <div class="section" style="background-color: #f9f9f9; padding: 15px; border: 1px solid #ddd; border-radius: 4px; margin-bottom: 20px;">
        <div class="section-title" style="font-size: 12pt; margin-bottom: 10px;">Identificação da CONTRATADA</div>
        <div style="font-size: 10pt; color: #333; line-height: 1.8;">
            <div style="margin-bottom: 5px;"><strong>Razão Social:</strong> ${this._escapeHtml(data.contractorInfo.name)}</div>
            <div style="margin-bottom: 5px;"><strong>CNPJ:</strong> ${this._escapeHtml(data.contractorInfo.cnpj)}</div>
            <div style="margin-bottom: 5px;"><strong>Endereço:</strong> ${this._escapeHtml(data.contractorInfo.address)}</div>
            <div style="margin-bottom: 5px;"><strong>Representante:</strong> ${this._escapeHtml(data.contractorInfo.representative)}</div>
            <div><strong>CPF:</strong> ${this._escapeHtml(data.contractorInfo.cpf)}</div>
        </div>
    </div>
    ` : ''}

    ${!isMonthly && data.header.eventDescription ? `
    <div class="section">
        <div style="font-size: 11pt; color: #333; line-height: 1.8;">
            <strong>Descrição do Evento:</strong><br>
            ${this._escapeHtml(data.header.eventDescription)}
        </div>
    </div>
    ` : ''}

    ${isMonthly && data.events && data.events.length > 0 ? `
    <div class="section">
        <div class="section-title">Eventos do Mês</div>
        <table>
            <thead>
                <tr>
                    <th style="width: 60%;">Nome do Evento</th>
                    <th style="width: 40%;">Data</th>
                </tr>
            </thead>
            <tbody>
                ${data.events.map(event => `
                <tr>
                    <td>${this._escapeHtml(event.name)}</td>
                    <td>${formatDate(event.date)}</td>
                </tr>
                `).join('')}
            </tbody>
        </table>
    </div>
    ` : ''}

    <div class="section">
        <div class="section-title">1. Serviços Prestados</div>
        ${data.services.items.length > 0 ? `
        <table>
            <thead>
                <tr>
                    <th style="width: 50%;">Descrição</th>
                    <th style="width: 25%;">Categoria</th>
                    <th style="width: 25%;">Valor (R$)</th>
                </tr>
            </thead>
            <tbody>
                ${data.services.items.map(item => `
                <tr>
                    <td>${this._escapeHtml(item.description)}${isMonthly && item.eventName ? ` <small style="color: #666;">(${this._escapeHtml(item.eventName)})</small>` : ''}</td>
                    <td>${this._escapeHtml(item.category)}</td>
                    <td>${formatCurrency(item.amount)}</td>
                </tr>
                `).join('')}
                <tr class="total-row">
                    <td colspan="2"><strong>Total de Serviços</strong></td>
                    <td><strong>${formatCurrency(data.services.total)}</strong></td>
                </tr>
            </tbody>
        </table>
        ` : `
        <div class="no-data">Nenhum serviço registrado</div>
        `}
    </div>

    <div class="section">
        <div class="section-title">2. Custos de Insumos</div>
        ${data.expenses.items.length > 0 ? `
        <table>
            <thead>
                <tr>
                    <th style="width: 50%;">Descrição</th>
                    <th style="width: 25%;">Nota Fiscal</th>
                    <th style="width: 25%;">Valor (R$)</th>
                </tr>
            </thead>
            <tbody>
                ${data.expenses.items.map(item => `
                <tr>
                    <td>${this._escapeHtml(item.description)}${isMonthly && item.eventName ? ` <small style="color: #666;">(${this._escapeHtml(item.eventName)})</small>` : ''}</td>
                    <td>${item.hasReceipt ? '✓ Sim' : '✗ Não'}</td>
                    <td>${formatCurrency(item.amount)}</td>
                </tr>
                `).join('')}
                <tr class="total-row">
                    <td colspan="2"><strong>Total de Custos de Insumos</strong></td>
                    <td><strong>${formatCurrency(data.expenses.total)}</strong></td>
                </tr>
            </tbody>
        </table>
        ` : `
        <div class="no-data">Nenhum insumo registrado</div>
        `}
    </div>

    <div class="section">
        <div class="section-title">3. Deslocamentos (KM Rodados)</div>
        ${data.travel.items.length > 0 ? `
        <table>
            <thead>
                <tr>
                    <th style="width: 50%;">Descrição</th>
                    <th style="width: 25%;">KM Rodados</th>
                    <th style="width: 25%;">Valor (R$)</th>
                </tr>
            </thead>
            <tbody>
                ${data.travel.items.map(item => `
                <tr>
                    <td>${this._escapeHtml(item.description)}${isMonthly && item.eventName ? ` <small style="color: #666;">(${this._escapeHtml(item.eventName)})</small>` : ''}${item.origin && item.destination ? ` <br><small style="color: #666;">${this._escapeHtml(item.origin)} → ${this._escapeHtml(item.destination)}</small>` : ''}</td>
                    <td style="text-align: center;">${item.distance} km</td>
                    <td>${formatCurrency(item.amount)}</td>
                </tr>
                `).join('')}
                <tr class="total-row">
                    <td colspan="2"><strong>Total de Deslocamentos</strong></td>
                    <td><strong>${formatCurrency(data.travel.total)}</strong></td>
                </tr>
            </tbody>
        </table>
        ` : `
        <div class="no-data">Nenhum deslocamento registrado</div>
        `}
    </div>

    <div class="summary">
        <div class="summary-title">Resumo Financeiro</div>
        <div class="summary-row">
            <span>Total de Serviços:</span>
            <span><strong>${formatCurrency(data.summary.totalServices)}</strong></span>
        </div>
        <div class="summary-row">
            <span>Total de Custos de Insumos:</span>
            <span><strong>${formatCurrency(data.summary.totalExpenses)}</strong></span>
        </div>
        <div class="summary-row">
            <span>Total de Deslocamentos:</span>
            <span><strong>${formatCurrency(data.summary.totalTravel)}</strong></span>
        </div>
        <div class="summary-row total">
            <span>TOTAL GERAL:</span>
            <span>${formatCurrency(data.summary.grandTotal)}</span>
        </div>
    </div>

    <div class="summary payment-info" style="margin-top: 30px; border-top: 2px solid #000; padding-top: 20px;">
        <div class="summary-title">Dados para Pagamento</div>
        <div class="summary-row" style="padding: 10px 0;">
            <span><strong>Chave PIX:</strong></span>
            <span><strong>${data.paymentInfo.pixKey || '48988321351'}</strong></span>
        </div>
        <div class="summary-row" style="padding: 5px 0;">
            <span><strong>Favorecido:</strong></span>
            <span><strong>${this._escapeHtml(data.paymentInfo.beneficiary || 'Gisele Mendes')}</strong></span>
        </div>
        <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #ccc; font-size: 10pt; color: #666; text-align: center;">
            <p style="margin: 5px 0;">Pagamento mediante apresentação de Nota Fiscal</p>
            <p style="margin: 5px 0;">Prazo: ${data.paymentInfo.paymentDays || DEFAULT_VALUES.DEFAULT_REIMBURSEMENT_DAYS} dias após apresentação da NF</p>
        </div>
    </div>

    <div class="print-button">
        <button id="btn-print" class="btn-print">🖨️ Imprimir / Salvar PDF</button>
    </div>
</body>
</html>
    `;
  }

  /**
   * Retorna label do status do evento
   * @private
   */
  _getStatusLabel(status) {
    const labels = {
      'PLANNED': 'Planejando',
      'DONE': 'Realizado',
      'COMPLETED': 'Realizado',
      'IN_PROGRESS': 'Em Andamento',
      'REPORT_SENT': 'Relatório Enviado',
      'PAID': 'Finalizado/Pago',
      'CANCELLED': 'Cancelado'
    };
    return labels[status] || status;
  }

  /**
   * Escapa HTML para prevenir XSS
   * @private
   */
  _escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = String(text);
    return div.innerHTML;
  }
}

// Export para uso em módulos ES6
export { ReportView };
