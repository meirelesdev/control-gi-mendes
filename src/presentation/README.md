# Presentation Layer - Chef Finance

Esta camada contém toda a interface gráfica do sistema, seguindo design mobile-first.

## 📦 Estrutura

```
src/presentation/
├── styles/
│   ├── variables.css      # Variáveis CSS (cores, espaçamentos, etc)
│   ├── base.css           # Reset e estilos globais
│   ├── components.css     # Componentes reutilizáveis
│   └── main.css           # Arquivo principal que importa todos
├── views/
│   ├── DashboardView.js    # View do dashboard
│   ├── EventDetailView.js # View de detalhe do evento
│   └── SettingsView.js    # View de configurações
└── App.js                 # Classe principal que gerencia navegação
```

## 🎨 Design System

### Cores

O sistema usa variáveis CSS para facilitar customização:

- **Primária**: `#667eea` (roxo/azul)
- **Secundária**: `#764ba2` (roxo escuro)
- **Status**: Success, Warning, Danger, Info
- **Neutras**: Background, Surface, Text, Border

### Espaçamentos

Sistema de espaçamento consistente baseado em múltiplos de 4px:
- `--spacing-xs`: 4px
- `--spacing-sm`: 8px
- `--spacing-md`: 16px
- `--spacing-lg`: 24px
- `--spacing-xl`: 32px
- `--spacing-2xl`: 48px

### Componentes

- **Cards**: Containers com sombra e bordas arredondadas
- **Botões**: Estilos primário, secundário, success, warning
- **Formulários**: Inputs e labels estilizados
- **Modais**: Overlays para formulários
- **Badges**: Indicadores de status
- **Listas**: Eventos e despesas

## 📱 Views

### DashboardView

Exibe:
- Card destacado com "Total a Receber em Aberto"
- Lista de eventos ativos
- Navegação para detalhe do evento ao clicar

### EventDetailView

Exibe:
- Informações do evento
- Botão "+" para adicionar despesa rápida
- Botão para adicionar KM/Viagem
- Lista de despesas com indicador visual se falta nota fiscal
- Botão para marcar nota fiscal como emitida

### SettingsView

Exibe:
- Formulário para alterar taxa de KM
- Formulário para alterar taxa de hora de viagem
- Formulário para alterar dias padrão de reembolso

## 🚀 Navegação

A navegação funciona por abas na parte superior:
- **Dashboard**: Tela principal
- **Configurações**: Tela de configurações

Navegação para detalhe do evento acontece via evento customizado:
```javascript
window.dispatchEvent(new CustomEvent('navigate', { 
  detail: { view: 'event-detail', eventId: '...' } 
}));
```

## 📐 Layout Mobile-First

O design é mobile-first, com breakpoints:
- **Mobile**: < 768px (padrão)
- **Tablet**: ≥ 768px
- **Desktop**: ≥ 1024px

## 🎯 Funcionalidades Principais

### Adicionar Despesa Rápida

Modal com:
- Campo de descrição
- Campo de valor
- Checkbox para nota fiscal

### Adicionar KM/Viagem

Modal com:
- Seleção de tipo (KM ou Tempo de Viagem)
- Campo específico baseado no tipo
- Campo de descrição
- Cálculo automático do valor usando Settings

### Marcar Nota Fiscal

Botão rápido para marcar despesa como tendo nota fiscal emitida.

## 🔧 Integração

As views recebem dependências via construtor:
- Repositórios (EventRepository, TransactionRepository, SettingsRepository)
- Use Cases (AddTransaction, UpdateSettings)

A classe `App` gerencia a inicialização e navegação entre views.

