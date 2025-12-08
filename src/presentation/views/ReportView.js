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
      if (!dateString) return '';
      // Parse diretamente YYYY-MM-DD para evitar problemas de timezone
      const parts = dateString.split('-');
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1; // JavaScript months are 0-indexed
        const day = parseInt(parts[2], 10);
        const date = new Date(year, month, day);
        return new Intl.DateTimeFormat('pt-BR', {
          day: '2-digit',
          month: 'long',
          year: 'numeric'
        }).format(date);
      }
      // Fallback para formato antigo se necessário
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
            font-size: 11pt;
            line-height: 1.4;
            color: #000;
            background: #fff;
            padding: 10mm;
            max-width: 210mm;
            margin: 0 auto;
        }

        .header {
            margin-bottom: 12px;
            border-bottom: 2px solid #000;
            padding-bottom: 8px;
        }

        .header h1 {
            font-size: 16pt;
            font-weight: bold;
            margin-bottom: 8px;
            text-transform: uppercase;
            text-align: center;
        }

        .header-info {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            flex-wrap: wrap;
            gap: 15px;
            font-size: 10pt;
        }

        .header-info-left {
            flex: 1;
            min-width: 200px;
        }

        .header-info-right {
            text-align: right;
            color: #666;
            font-size: 9pt;
        }

        .header-info-row {
            margin-bottom: 4px;
            line-height: 1.4;
        }

        .header-info-row strong {
            font-weight: bold;
            margin-right: 5px;
        }

        .header-info-row:last-child {
            margin-bottom: 0;
        }

        .section {
            margin-bottom: 12px;
            page-break-inside: avoid;
            break-inside: avoid;
        }

        .section-title {
            font-size: 12pt;
            font-weight: bold;
            margin-bottom: 6px;
            border-bottom: 1px solid #000;
            padding-bottom: 3px;
            text-transform: uppercase;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 10px;
            font-size: 10pt;
            page-break-inside: avoid;
            break-inside: avoid;
        }

        table th {
            background-color: #f0f0f0;
            border: 1px solid #000;
            padding: 5px;
            text-align: left;
            font-weight: bold;
        }

        table td {
            border: 1px solid #000;
            padding: 4px 5px;
        }

        table td:last-child {
            text-align: right;
        }

        .total-row {
            font-weight: bold;
            background-color: #f5f5f5;
        }

        .summary {
            margin-top: 15px;
            border: 2px solid #000;
            padding: 10px;
            background-color: #fafafa;
            page-break-inside: avoid;
            break-inside: avoid;
        }

        .summary-title {
            font-size: 12pt;
            font-weight: bold;
            margin-bottom: 8px;
            text-align: center;
            text-transform: uppercase;
        }

        .summary-row {
            display: flex;
            justify-content: space-between;
            padding: 3px 0;
            border-bottom: 1px solid #ccc;
        }

        .summary-row:last-child {
            border-bottom: none;
        }

        .summary-row.total {
            font-weight: bold;
            font-size: 12pt;
            margin-top: 6px;
            padding-top: 6px;
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

        .summary-box {
            background-color: #f9f9f9;
            border: 2px solid #000;
            padding: 12px;
            margin-bottom: 12px;
            page-break-inside: avoid;
            break-inside: avoid;
        }

        .summary-box p {
            margin: 4px 0;
            font-size: 10pt;
            line-height: 1.4;
        }

        .summary-box hr {
            border: none;
            border-top: 1px solid #ccc;
            margin: 6px 0;
        }

        .summary-box .total-big {
            font-size: 12pt;
            font-weight: bold;
            margin-top: 8px;
            padding-top: 8px;
            border-top: 2px solid #000;
            text-align: center;
        }

        /* Estilos para impressão */
        @media print {
            body {
                padding: 8mm;
            }

            .print-button {
                display: none;
            }

            .header-info {
                display: flex !important;
            }

            .header-info-left,
            .header-info-right {
                display: block;
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
            margin: 8mm;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Relatório de Prestação de Contas</h1>
        <div class="header-info">
            <div class="header-info-left">
                ${isMonthly ? `
                <div class="header-info-row">
                    <strong>Período:</strong> ${this._escapeHtml(data.header.period)}
                </div>
                <div class="header-info-row">
                    <strong>Total de Eventos:</strong> ${data.header.eventsCount}
                </div>
                ` : `
                <div class="header-info-row">
                    <strong>Evento:</strong> ${this._escapeHtml(data.header.eventName)}
                </div>
                ${data.header.startDate && data.header.endDate && data.header.startDate !== data.header.endDate ? `
                <div class="header-info-row">
                    <strong>Período:</strong> ${formatDate(data.header.startDate)} a ${formatDate(data.header.endDate)}
                </div>
                ` : `
                <div class="header-info-row">
                    <strong>Data:</strong> ${formatDate(data.header.startDate || data.header.eventDate)}
                </div>
                `}
                ${data.header.client ? `
                <div class="header-info-row">
                    <strong>Cliente:</strong> ${this._escapeHtml(data.header.client)}
                </div>
                ` : ''}
                ${data.header.city ? `
                <div class="header-info-row">
                    <strong>Cidade:</strong> ${this._escapeHtml(data.header.city)}
                </div>
                ` : ''}
                `}
            </div>
            <div class="header-info-right">
                <div class="header-info-row">
                    Gerado em: ${formatDateTime(data.header.generatedAt)}
                </div>
            </div>
        </div>
    </div>

    ${data.contractorInfo ? `
    <div class="section" style="background-color: #f9f9f9; padding: 8px; border: 1px solid #ddd; border-radius: 4px; margin-bottom: 12px;">
        <div class="section-title" style="font-size: 11pt; margin-bottom: 6px;">Identificação da CONTRATADA</div>
        <div style="font-size: 9pt; color: #333; line-height: 1.4;">
            <div style="margin-bottom: 3px;"><strong>Razão Social:</strong> ${this._escapeHtml(data.contractorInfo.name)}</div>
            <div style="margin-bottom: 3px;"><strong>CNPJ:</strong> ${this._escapeHtml(data.contractorInfo.cnpj)}</div>
            <div style="margin-bottom: 3px;"><strong>Endereço:</strong> ${this._escapeHtml(data.contractorInfo.address)}</div>
            <div style="margin-bottom: 3px;"><strong>Representante:</strong> ${this._escapeHtml(data.contractorInfo.representative)}</div>
            <div><strong>CPF:</strong> ${this._escapeHtml(data.contractorInfo.cpf)}</div>
        </div>
    </div>
    ` : ''}

    <div class="summary-box">
        <hr>
        <p><strong>Horas de trabalho:</strong> ${data.summary.totalWorkHours ? data.summary.totalWorkHours.toFixed(1) : '0'}h</p>
        <p><strong>Horas de deslocamento:</strong> ${data.summary.totalTravelHours ? data.summary.totalTravelHours.toFixed(1) : '0'}h</p>
        <p><strong>Total de horas:</strong> ${data.summary.totalHours ? data.summary.totalHours.toFixed(1) : '0'}h</p>
        <hr>
        <p><strong>Valor total da diária:</strong> ${formatCurrency(data.summary.totalDailyValue || 0)}</p>
        <p><strong>Combustível (KM):</strong> ${formatCurrency(data.summary.totalFuel || 0)}</p>
        <p><strong>Compras:</strong> ${formatCurrency(data.summary.totalPurchases || 0)}</p>
        <p><strong>Hotel:</strong> ${formatCurrency(data.summary.totalHotel || 0)}</p>
        <p class="total-big"><strong>TOTAL A RECEBER: ${formatCurrency(data.summary.totalToReceive || data.summary.grandTotal || 0)}</strong></p>
    </div>

    ${!isMonthly && data.header.eventDescription ? `
    <div class="section" style="margin-bottom: 12px;">
        <div style="font-size: 10pt; color: #333; line-height: 1.4;">
            <strong>Descrição do Evento:</strong><br>
            ${this._escapeHtml(data.header.eventDescription)}
        </div>
    </div>
    ` : ''}

    ${isMonthly && data.events && data.events.length > 0 ? `
    <div class="section" style="margin-bottom: 12px;">
        <div class="section-title">Eventos do Mês</div>
        <table>
            <thead>
                <tr>
                    <th style="width: 40%;">Nome do Evento</th>
                    <th style="width: 25%;">Cidade</th>
                    <th style="width: 20%;">Data</th>
                    <th style="width: 15%;">Total de Horas</th>
                </tr>
            </thead>
            <tbody>
                ${data.events.map(event => `
                <tr>
                    <td>${this._escapeHtml(event.name)}</td>
                    <td>${this._escapeHtml(event.city || '')}</td>
                    <td>${formatDate(event.date)}</td>
                    <td>${event.totalHours ? event.totalHours.toFixed(1) : '0'}h</td>
                </tr>
                `).join('')}
            </tbody>
        </table>
    </div>
    ` : ''}

    <div class="summary payment-info" style="margin-top: 12px; border-top: 2px solid #000; padding-top: 10px;">
        <div class="summary-title">Dados para Pagamento</div>
        <div class="summary-row" style="padding: 4px 0;">
            <span><strong>Chave PIX:</strong></span>
            <span><strong>${data.paymentInfo.pixKey || '48988321351'}</strong></span>
        </div>
        <div class="summary-row" style="padding: 4px 0;">
            <span><strong>Favorecido:</strong></span>
            <span><strong>${this._escapeHtml(data.paymentInfo.beneficiary || 'Gisele Mendes')}</strong></span>
        </div>
        <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #ccc; font-size: 9pt; color: #666; text-align: center;">
            <p style="margin: 3px 0;">Prazo: ${data.paymentInfo.paymentDays || DEFAULT_VALUES.DEFAULT_REIMBURSEMENT_DAYS} dias após apresentação da NF</p>
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
