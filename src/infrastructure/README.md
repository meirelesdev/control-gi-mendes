# Infrastructure Layer - Chef Finance

Esta camada contém as implementações concretas dos repositórios usando `localStorage` do navegador.

## 📦 Estrutura

```
src/infrastructure/
├── repositories/
│   ├── LocalStorageSettingsRepository.js    # Implementação de SettingsRepository
│   ├── LocalStorageEventRepository.js       # Implementação de EventRepository
│   └── LocalStorageTransactionRepository.js # Implementação de TransactionRepository
├── index.js                                  # Exportações centralizadas
└── README.md                                 # Este arquivo
```

## 🔌 Repositórios Implementados

### LocalStorageSettingsRepository

Implementa `SettingsRepository` usando `localStorage`.

**Chave de armazenamento**: `gi_financas_settings`

**Métodos:**
- `save(settings)` - Salva configurações no localStorage
- `find()` - Busca configurações (retorna `null` se não existir)
- `exists()` - Verifica se existem configurações salvas

**Características:**
- Usa `Settings.restore()` para converter JSON de volta para instância
- Retorna `null` se não houver dados (não cria padrão automaticamente)

### LocalStorageEventRepository

Implementa `EventRepository` usando `localStorage`.

**Chave de armazenamento**: `gi_financas_events`

**Métodos principais:**
- `save(event)` - Salva evento
- `findById(id)` - Busca por ID
- `findAll(options)` - Lista com filtros e ordenação
- `delete(id)` - Remove evento
- `exists(id)` - Verifica existência

**Métodos de cálculo financeiro:**
- `calculateTotalExpenses(eventId)` - Total de despesas
- `calculateTotalIncome(eventId)` - Total de receitas
- `calculateTotalReimbursements(eventId)` - Total de reembolsos
- `calculateTotalFees(eventId)` - Total de honorários
- `calculateNetBalance(eventId)` - Saldo líquido
- `calculateNetProfit(eventId)` - Lucro líquido
- `getFinancialSummary(eventId)` - Resumo completo
- `countExpensesWithReceipt(eventId)` - Conta despesas com NF
- `countExpensesWithoutReceipt(eventId)` - Conta despesas sem NF

**Características:**
- Usa `Event.restore()` para converter JSON de volta para instância
- Métodos de cálculo delegam para `TransactionRepository` (deve ser injetado)
- Suporta ordenação por `date`, `name` ou `createdAt`
- Suporta filtro por `status`

**Dependência:**
- Requer `TransactionRepository` injetado no construtor para métodos de cálculo

### LocalStorageTransactionRepository

Implementa `TransactionRepository` usando `localStorage`.

**Chave de armazenamento**: `gi_financas_transactions`

**Métodos principais:**
- `save(transaction)` - Salva transação
- `findById(id)` - Busca por ID
- `findByEventId(eventId)` - Lista transações de um evento
- `findAll(options)` - Lista com filtros (eventId, type)
- `delete(id)` - Remove transação
- `deleteByEventId(eventId)` - Remove todas as transações de um evento

**Métodos de cálculo:**
- `calculateTotalExpenses(eventId)` - Total de despesas
- `calculateTotalIncome(eventId)` - Total de receitas
- `calculateTotalReimbursements(eventId)` - Total de reembolsos (INCOME com isReimbursement=true)
- `calculateTotalFees(eventId)` - Total de honorários (INCOME com isReimbursement=false)
- `countExpensesWithReceipt(eventId)` - Conta despesas com NF
- `countExpensesWithoutReceipt(eventId)` - Conta despesas sem NF

**Características:**
- Usa `Transaction.restore()` para converter JSON de volta para instância
- Filtra transações por `eventId` e `type` quando solicitado
- Todos os cálculos são feitos localmente (não depende de outros repositórios)

## 💾 Estrutura de Dados no localStorage

### Settings
```json
{
  "rateKm": 0.90,
  "defaultReimbursementDays": 21,
  "maxHotelRate": 280.00,
  "standardDailyRate": 300.00,
  "overtimeRate": 75.00,
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### Events
```json
[
  {
    "id": "event_123",
    "name": "Workshop de Culinária",
    "date": "2024-12-15",
    "status": "PLANNED",
    "description": "...",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

### Transactions
```json
[
  {
    "id": "expense_123",
    "eventId": "event_123",
    "type": "EXPENSE",
    "description": "Compra de ingredientes",
    "amount": 500.00,
    "metadata": {
      "hasReceipt": false
    },
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  {
    "id": "income_123",
    "eventId": "event_123",
    "type": "INCOME",
    "description": "Diária do evento",
    "amount": 1000.00,
    "metadata": {
      "isReimbursement": false,
      "category": "diaria"
    },
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

## 🔧 Uso

### Inicialização

```javascript
// Criar repositórios
const transactionRepository = new LocalStorageTransactionRepository();
const eventRepository = new LocalStorageEventRepository(transactionRepository);
const settingsRepository = new LocalStorageSettingsRepository();

// Usar nos use cases
const createEvent = new CreateEvent(eventRepository);
const addTransaction = new AddTransaction(
  transactionRepository,
  eventRepository,
  settingsRepository
);
```

### Exemplo: Salvar e Buscar

```javascript
// Salvar evento
const event = Event.create('Workshop', '2024-12-15');
await eventRepository.save(event);

// Buscar evento
const found = await eventRepository.findById(event.id);

// Listar eventos ordenados por data
const events = await eventRepository.findAll({
  orderBy: 'date',
  order: 'desc'
});
```

### Exemplo: Cálculos Financeiros

```javascript
// Calcular totais de um evento
const totalExpenses = await eventRepository.calculateTotalExpenses(eventId);
const totalIncome = await eventRepository.calculateTotalIncome(eventId);
const netBalance = await eventRepository.calculateNetBalance(eventId);

// Obter resumo completo
const summary = await eventRepository.getFinancialSummary(eventId);
```

## ⚠️ Observações Importantes

1. **Dependência Circular**: `EventRepository` depende de `TransactionRepository` para cálculos financeiros. Sempre injete `TransactionRepository` no construtor.

2. **Conversão de Instâncias**: Todos os repositórios usam os métodos `restore()` das entidades para converter JSON de volta para instâncias com métodos.

3. **Tratamento de Erros**: Todos os métodos têm tratamento de erro e retornam valores seguros (arrays vazios, null, 0) em caso de falha.

4. **Performance**: Para grandes volumes de dados, considere implementar índices ou usar IndexedDB no futuro.

5. **Compatibilidade**: Usa `window.localStorage` diretamente, garantindo compatibilidade com navegadores modernos.

## 🚀 Próximos Passos

- [ ] Adicionar suporte a migração de dados
- [ ] Implementar backup/restore de dados
- [ ] Adicionar validação de integridade dos dados
- [ ] Considerar migração para IndexedDB para grandes volumes

