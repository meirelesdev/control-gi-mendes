# Gi Finanças

Sistema web (SPA) para gestão financeira de eventos corporativos culinários.

## 📋 Sobre o Sistema

O **Gi Finanças** foi desenvolvido para auxiliar na gestão financeira de eventos culinários, diferenciando claramente entre **reembolsos** (dinheiro gasto que será devolvido) e **lucros** (diárias, horas extras, compensações de viagem).

## 🏗️ Arquitetura

O sistema segue os princípios da **Clean Architecture** com as seguintes camadas:

- **Domain**: Entidades e interfaces de repositórios
- **Application**: Casos de uso (use cases)
- **Infrastructure**: Implementação de repositórios usando localStorage
- **Presentation**: Controllers e Views (UI)

## ✨ Funcionalidades

### Eventos
- Cadastro, edição e remoção de eventos
- Listagem de eventos ordenados por data

### Despesas (Reembolsos)
- Cadastro de despesas vinculadas a eventos
- Controle de status de Nota Fiscal (emitida/pendente)
- Marcação rápida de Nota Fiscal como emitida
- Listagem agrupada por evento

### Receitas (Lucros)
- Cadastro de receitas com tipos:
  - **Diária**: Valor fixo por dia
  - **Hora Extra**: Valor por hora trabalhada
  - **KM Rodado**: Cálculo automático baseado na distância e taxa configurada
  - **Tempo de Viagem**: Cálculo automático baseado em horas e taxa configurada
- Cálculo automático de valores totais
- Listagem agrupada por evento

### Configurações
- Edição de preço por KM rodado
- Edição de preço por hora de viagem
- Valores configuráveis que são aplicados automaticamente

### Dashboard
- Resumo financeiro completo
- Total de reembolsos vs lucros
- Saldo (lucros - reembolsos)
- Status das notas fiscais
- Lista de eventos recentes

## 🚀 Como Usar

1. Abra o arquivo `index.html` em um navegador moderno
2. Os dados são armazenados localmente no navegador (localStorage)
3. Navegue pelas seções usando o menu superior

## 📦 Estrutura de Arquivos

```
control-gi-mendes/
├── domain/
│   ├── entities/          # Entidades de domínio
│   └── repositories/      # Interfaces de repositórios
├── application/
│   └── use-cases/         # Casos de uso
├── infrastructure/
│   └── repositories/      # Implementação com localStorage
├── presentation/
│   ├── controllers/       # Controllers da UI
│   └── views/            # Views da aplicação
├── styles/
│   └── main.css          # Estilos da aplicação
├── index.html            # Arquivo principal
├── app.js               # Inicialização da aplicação
└── README.md            # Este arquivo
```

## 🎯 Regras de Negócio

1. **Separação de Caixas**: Reembolsos e lucros são claramente diferenciados
2. **Configurabilidade**: Taxas de KM e hora de viagem são editáveis
3. **Cálculos Automáticos**: 
   - Valor KM = Distância × Taxa Atual
   - Valor Tempo Viagem = Horas × Taxa Hora
4. **Controle de Notas**: Cada despesa possui indicador de Nota Fiscal emitida/arquivada

## 💾 Armazenamento

Todos os dados são armazenados no `localStorage` do navegador, usando as seguintes chaves:
- `gi_financas_eventos`
- `gi_financas_despesas`
- `gi_financas_receitas`
- `gi_financas_configuracao`

## 🌐 Hospedagem

O sistema foi projetado para ser hospedado no GitHub Pages, funcionando apenas com HTML, CSS e JavaScript puro, sem necessidade de servidor backend.

## 📝 Licença

Este projeto é de uso pessoal.