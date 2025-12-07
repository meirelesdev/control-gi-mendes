# Domain Layer - Chef Finance

Esta camada contém as entidades de domínio e interfaces de repositórios, seguindo os princípios de Domain-Driven Design (DDD).

## 📦 Estrutura

```
src/domain/
├── entities/
│   ├── Settings.js          # Configurações do sistema (Singleton)
│   ├── Event.js              # Agregado principal - Evento
│   └── Transaction.js        # Transação financeira (EXPENSE ou INCOME)
├── repositories/
│   ├── EventRepository.js    # Interface para persistência de eventos
│   └── TransactionRepository.js  # Interface para persistência de transações
├── index.js                  # Exportações centralizadas
└── README.md                 # Este arquivo
```

## 🏗️ Entidades

### Settings

Singleton que contém as configurações do sistema:

- **rateKm**: Taxa por quilômetro rodado (padrão: 0.90)
- **defaultReimbursementDays**: Dias padrão para reembolso (padrão: 21)
- **maxHotelRate**: Teto de hospedagem (padrão: 280.00)
- **standardDailyRate**: Diária técnica padrão (padrão: 300.00)
- **overtimeRate**: Taxa de hora extra (padrão: 75.00)

**Validações:**
- Taxas não podem ser negativas
- Taxas têm limites máximos
- Dias de reembolso devem estar entre 1 e 365

**Métodos principais:**
- `calculateKmValue(distance)` - Calcula valor de KM rodado
- `calculateExpectedReimbursementDate(eventDate)` - Calcula data esperada de reembolso
- `update(rateKm, defaultReimbursementDays, maxHotelRate, standardDailyRate, overtimeRate)` - Atualiza configurações

### Event

Agregado principal que representa um evento culinário:

- **id**: Identificador único
- **name**: Nome do evento (3-200 caracteres)
- **date**: Data do evento
- **status**: Status do evento ('PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')
- **description**: Descrição opcional (até 1000 caracteres)

**Validações:**
- Nome obrigatório, mínimo 3 caracteres
- Data válida, não muito antiga (máx 10 anos) nem muito futura (máx 5 anos)
- Status deve ser um dos valores válidos

**Métodos principais:**
- `updateName(name)` - Atualiza nome
- `updateDate(date)` - Atualiza data
- `updateStatus(status)` - Atualiza status
- `isPlanned()`, `isInProgress()`, `isCompleted()`, `isCancelled()` - Verificadores de status
- `Event.create(name, date, description)` - Factory method para criar novo evento

### Transaction

Representa uma transação financeira relacionada a um evento:

- **id**: Identificador único
- **eventId**: ID do evento relacionado
- **type**: Tipo da transação ('EXPENSE' ou 'INCOME')
- **description**: Descrição da transação (3-500 caracteres)
- **amount**: Valor da transação (deve ser > 0)
- **metadata**: Metadados específicos por tipo

**Para EXPENSE:**
- `metadata.hasReceipt`: Boolean indicando se tem nota fiscal

**Para INCOME:**
- `metadata.isReimbursement`: Boolean diferenciando reembolso de honorário
- `metadata.category`: Categoria opcional ('diaria', 'hora_extra', 'km')

**Validações:**
- Descrição obrigatória, mínimo 3 caracteres
- Valor obrigatório, maior que zero, máximo R$ 10.000.000,00
- Metadados validados conforme o tipo

**Métodos principais:**
- `isExpense()`, `isIncome()` - Verificadores de tipo
- `hasReceipt()` - Verifica se tem nota fiscal (EXPENSE)
- `markReceiptAsIssued()` - Marca nota fiscal como emitida (EXPENSE)
- `isReimbursement()`, `isFee()` - Verificadores de tipo de receita (INCOME)
- `getCategory()` - Obtém categoria da receita (INCOME)
- `Transaction.createExpense(...)` - Factory para criar despesa
- `Transaction.createIncome(...)` - Factory para criar receita
- `Transaction.createKmIncome(...)` - Factory para criar receita de KM
- `Transaction.createTravelTimeIncome(...)` - Factory para criar receita de tempo de viagem

## 🔌 Repositórios (Interfaces)

### EventRepository

Define contratos para persistência e consultas de eventos:

- `save(event)` - Salva evento
- `findById(id)` - Busca por ID
- `findAll(options)` - Lista todos com filtros
- `delete(id)` - Remove evento
- `exists(id)` - Verifica existência
- `calculateTotalExpenses(eventId)` - Calcula total de despesas
- `calculateTotalIncome(eventId)` - Calcula total de receitas
- `calculateTotalReimbursements(eventId)` - Calcula total de reembolsos
- `calculateTotalFees(eventId)` - Calcula total de honorários
- `calculateNetBalance(eventId)` - Calcula saldo líquido (receitas - despesas)
- `calculateNetProfit(eventId)` - Calcula lucro líquido (honorários - despesas)
- `getFinancialSummary(eventId)` - Obtém resumo financeiro completo
- `countExpensesWithReceipt(eventId)` - Conta despesas com nota fiscal
- `countExpensesWithoutReceipt(eventId)` - Conta despesas sem nota fiscal

### TransactionRepository

Define contratos para persistência e consultas de transações:

- `save(transaction)` - Salva transação
- `findById(id)` - Busca por ID
- `findByEventId(eventId)` - Lista transações de um evento
- `findAll(options)` - Lista todas com filtros
- `delete(id)` - Remove transação
- `deleteByEventId(eventId)` - Remove todas as transações de um evento
- `calculateTotalExpenses(eventId)` - Calcula total de despesas
- `calculateTotalIncome(eventId)` - Calcula total de receitas
- `calculateTotalReimbursements(eventId)` - Calcula total de reembolsos
- `calculateTotalFees(eventId)` - Calcula total de honorários
- `countExpensesWithReceipt(eventId)` - Conta despesas com nota fiscal
- `countExpensesWithoutReceipt(eventId)` - Conta despesas sem nota fiscal

## 📝 Exemplos de Uso

### Criar um Evento

```javascript
const event = Event.create('Workshop de Culinária', '2024-12-15', 'Workshop sobre técnicas avançadas');
```

### Criar uma Despesa (EXPENSE)

```javascript
const expense = Transaction.createExpense(
  event.id,
  'Compra de ingredientes',
  500.00,
  false // sem nota fiscal ainda
);

// Marcar nota fiscal como emitida
expense.markReceiptAsIssued();
```

### Criar uma Receita de Honorário (INCOME)

```javascript
const fee = Transaction.createIncome(
  event.id,
  'Diária do evento',
  1000.00,
  false // é honorário, não reembolso
);
```

### Criar uma Receita de KM (INCOME - Reembolso)

```javascript
const settings = Settings.createDefault();
const kmIncome = Transaction.createKmIncome(
  event.id,
  'Deslocamento até o evento',
  150, // km rodados
  settings.rateKm,
  true // é reembolso
);
```

## 🎯 Princípios Aplicados

1. **Validação Rica**: Todas as entidades validam seus dados internamente
2. **Imutabilidade Parcial**: Campos críticos só podem ser alterados através de métodos específicos
3. **Factory Methods**: Métodos estáticos para criação facilitada
4. **Separação de Responsabilidades**: Lógica de domínio separada da persistência
5. **Interfaces de Repositório**: Contratos claros para implementações de infraestrutura

