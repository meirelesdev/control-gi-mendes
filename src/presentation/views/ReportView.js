/**
 * View: Relatório de Fechamento
 * Renderiza um relatório HTML formatado para impressão
 */
class ReportView {
  constructor() {
    // Esta view não precisa de dependências, apenas renderiza dados
  }

  /**
   * Renderiza o relatório em uma nova janela para impressão
   * @param {Object} reportData - Dados do relatório gerados pelo Use Case
   */
  render(reportData) {
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
    printWindow.document.write(this._generateHTML(data));
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
   * @private
   */
  _generateHTML(data) {
    const formatCurrency = (value) => {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(value);
    };

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

    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Relatório de Prestação de Contas - ${this._escapeHtml(data.header.eventName)}</title>
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
            }

            table {
                page-break-inside: auto;
            }

            tr {
                page-break-inside: avoid;
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
        <div class="event-name">${this._escapeHtml(data.header.eventName)}</div>
        <div class="event-date">Data do Evento: ${formatDate(data.header.eventDate)}</div>
        <div class="generated-at">Relatório gerado em: ${formatDateTime(data.header.generatedAt)}</div>
    </div>

    ${data.header.eventDescription ? `
    <div class="section">
        <div style="font-size: 11pt; color: #333; line-height: 1.8;">
            <strong>Descrição do Evento:</strong><br>
            ${this._escapeHtml(data.header.eventDescription)}
        </div>
    </div>
    ` : ''}

    <div class="section">
        <div class="section-title">1. Serviços Prestados (Honorários)</div>
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
                    <td>${this._escapeHtml(item.description)}</td>
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
        <div class="section-title">2. Insumos (Despesas Reembolsáveis)</div>
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
                    <td>${this._escapeHtml(item.description)}</td>
                    <td>${item.hasReceipt ? '✓ Sim' : '✗ Não'}</td>
                    <td>${formatCurrency(item.amount)}</td>
                </tr>
                `).join('')}
                <tr class="total-row">
                    <td colspan="2"><strong>Total de Insumos</strong></td>
                    <td><strong>${formatCurrency(data.expenses.total)}</strong></td>
                </tr>
            </tbody>
        </table>
        ` : `
        <div class="no-data">Nenhuma despesa registrada</div>
        `}
    </div>

    <div class="section">
        <div class="section-title">3. Deslocamento</div>
        ${data.travel.items.length > 0 ? `
        <table>
            <thead>
                <tr>
                    <th style="width: 50%;">Descrição</th>
                    <th style="width: 25%;">Tipo</th>
                    <th style="width: 25%;">Valor (R$)</th>
                </tr>
            </thead>
            <tbody>
                ${data.travel.items.map(item => `
                <tr>
                    <td>${this._escapeHtml(item.description)}</td>
                    <td>${this._escapeHtml(item.category)}</td>
                    <td>${formatCurrency(item.amount)}</td>
                </tr>
                `).join('')}
                <tr class="total-row">
                    <td colspan="2"><strong>Total de Deslocamento</strong></td>
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
            <span>Total de Insumos:</span>
            <span><strong>${formatCurrency(data.summary.totalExpenses)}</strong></span>
        </div>
        <div class="summary-row">
            <span>Total de Deslocamento:</span>
            <span><strong>${formatCurrency(data.summary.totalTravel)}</strong></span>
        </div>
        <div class="summary-row total">
            <span>TOTAL GERAL:</span>
            <span>${formatCurrency(data.summary.grandTotal)}</span>
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
