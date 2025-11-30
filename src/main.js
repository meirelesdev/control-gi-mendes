/**
 * Ponto de Entrada Principal - Gi Finanças
 * Inicializa a aplicação com todas as dependências
 */

// Importações serão feitas quando tivermos módulos ES6 configurados
// Por enquanto, vamos usar script tags no HTML

// Aguarda o DOM estar pronto
document.addEventListener('DOMContentLoaded', async () => {
  // Por enquanto, vamos manter compatibilidade com a estrutura antiga
  // até implementarmos os repositórios da nova arquitetura
  
  console.log('Gi Finanças - Carregando...');
  
  // TODO: Inicializar repositórios e use cases da nova arquitetura
  // Por enquanto, mostra mensagem de que está em desenvolvimento
  document.getElementById('dashboard-content').innerHTML = `
    <div class="card">
      <h2>Bem-vindo ao Gi Finanças!</h2>
      <p>O sistema está sendo migrado para a nova arquitetura.</p>
      <p class="text-muted">Em breve todas as funcionalidades estarão disponíveis.</p>
    </div>
  `;
});

