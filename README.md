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

## 🌐 Hospedagem no GitHub Pages

O sistema foi projetado para ser hospedado no GitHub Pages, funcionando apenas com HTML, CSS e JavaScript puro, sem necessidade de servidor backend.

### 📋 Passo a Passo para Deploy

1. **Crie um repositório no GitHub**
   - Vá para [github.com/new](https://github.com/new)
   - Nome do repositório: `gi-financas` (ou outro nome de sua preferência)
   - Escolha se será público ou privado
   - **NÃO** marque "Initialize this repository with a README" (você já tem um)

2. **Faça upload dos arquivos**
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Gi Finanças"
   git branch -M main
   git remote add origin https://github.com/SEU-USUARIO/gi-financas.git
   git push -u origin main
   ```
   
   Ou use a interface web do GitHub:
   - Clique em "uploading an existing file"
   - Arraste todos os arquivos do projeto
   - Faça commit

3. **Ative o GitHub Pages**
   - Vá em **Settings** do repositório
   - Role até a seção **Pages**
   - Em **Source**, selecione **Deploy from a branch**
   - Escolha a branch **main** (ou **master**)
   - Escolha a pasta **/ (root)**
   - Clique em **Save**

4. **Acesse seu site**
   - Aguarde alguns minutos para o GitHub processar
   - Seu site estará disponível em:
     `https://SEU-USUARIO.github.io/gi-financas/`

### ⚠️ Erro de Domínio Personalizado

Se você recebeu o erro:
> "The custom domain `gi-financas` is not properly formatted"

**Solução**: Você não precisa configurar um domínio personalizado! O GitHub Pages funciona automaticamente sem isso.

**Se você realmente quiser usar um domínio personalizado:**
- Você precisa ter um domínio registrado (ex: `gi-financas.com`)
- O formato correto seria `gi-financas.com` ou `www.gi-financas.com` (não apenas `gi-financas`)
- Configure o DNS do seu domínio apontando para o GitHub Pages
- Adicione o domínio completo nas configurações do GitHub Pages

**Recomendação**: Para começar, use apenas o GitHub Pages sem domínio personalizado. É mais simples e funciona perfeitamente!

## 📝 Licença

Este projeto é de uso pessoal.