# Chef Finance

Sistema web (SPA) para gestão financeira de eventos corporativos culinários.

## 📋 Sobre o Sistema

O **Chef Finance** foi desenvolvido para auxiliar na gestão financeira de eventos culinários, diferenciando claramente entre **reembolsos** (dinheiro gasto que será devolvido) e **lucros** (diárias, horas extras, compensações de viagem).

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

1. Abra o arquivo `index.html` em um navegador moderno que suporte ES6 Modules
   - **Importante:** Use um servidor HTTP local (não abra o arquivo diretamente)
   - Python: `python -m http.server 8000`
   - Node.js: `npx http-server -p 8000`
   - PHP/XAMPP: Coloque em `htdocs` e acesse via `http://localhost`
2. Os dados são armazenados localmente no navegador (localStorage)
3. Navegue pelas seções usando o menu superior (Dashboard, Configurações)
4. Crie eventos e adicione transações (despesas e receitas)
5. Configure as taxas de KM e Hora de Viagem nas Configurações

## 📱 Instalação como App (PWA)

A aplicação pode ser instalada no seu dispositivo móvel como um app nativo!

### Para Instalar:

**Android (Chrome):**
1. Acesse a aplicação no Chrome
2. Toque no menu (3 pontos) > **"Adicionar à tela inicial"** ou **"Instalar app"**
3. Confirme a instalação

**iOS (Safari):**
1. Acesse a aplicação no Safari
2. Toque no botão de compartilhar > **"Adicionar à Tela de Início"**
3. Confirme

**Nota:** Antes de instalar, você precisa criar os ícones. Veja `PWA-SETUP.md` para instruções completas.

## 📦 Estrutura de Arquivos

O projeto possui duas estruturas:

### Estrutura Nova (Ativa) - `/src`
```
src/
├── domain/              # Entidades e interfaces de repositórios
│   ├── entities/        # Settings, Event, Transaction
│   └── repositories/    # Interfaces
├── application/         # Casos de uso
│   └── use-cases/       # CreateEvent, AddTransaction, etc.
├── infrastructure/      # Implementação com localStorage
│   └── repositories/     # LocalStorageEventRepository, etc.
├── presentation/        # UI e Views
│   ├── styles/          # CSS modular (variables, base, components)
│   └── views/           # DashboardView, EventDetailView, SettingsView
└── main.js             # Ponto de entrada principal
```

### Estrutura Antiga (Referência) - Raiz
```
control-gi-mendes/
├── domain/              # Estrutura antiga
├── application/         # Estrutura antiga
├── infrastructure/      # Estrutura antiga
├── presentation/        # Estrutura antiga
├── styles/             # CSS antigo
├── index.html          # HTML principal
└── app.js              # Inicialização antiga
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

**Nova Arquitetura:**
- `chef_finance_events` - Eventos
- `chef_finance_transactions` - Transações (despesas e receitas unificadas)
- `chef_finance_settings` - Configurações

**Estrutura Antiga (compatibilidade):**
- `gi_financas_eventos`
- `gi_financas_despesas`
- `gi_financas_receitas`
- `gi_financas_configuracao`

## 🌐 Hospedagem no GitHub Pages

O sistema foi projetado para ser hospedado no GitHub Pages, funcionando apenas com HTML, CSS e JavaScript puro, sem necessidade de servidor backend.

### 📋 Passo a Passo para Deploy

1. **Crie um repositório no GitHub**
   - Vá para [github.com/new](https://github.com/new)
   - Nome do repositório: `chef-finance` (ou outro nome de sua preferência)
   - Escolha se será público ou privado
   - **NÃO** marque "Initialize this repository with a README" (você já tem um)

2. **Faça upload dos arquivos**
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Chef Finance"
   git branch -M main
   git remote add origin https://github.com/SEU-USUARIO/chef-finance.git
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
     `https://SEU-USUARIO.github.io/chef-finance/`

### ⚠️ Erro de Domínio Personalizado

Se você recebeu o erro:
> "The custom domain `chef-finance` is not properly formatted"

**Solução**: Você não precisa configurar um domínio personalizado! O GitHub Pages funciona automaticamente sem isso.

**Se você realmente quiser usar um domínio personalizado:**
- Você precisa ter um domínio registrado (ex: `chef-finance.com`)
- O formato correto seria `chef-finance.com` ou `www.chef-finance.com` (não apenas `chef-finance`)
- Configure o DNS do seu domínio apontando para o GitHub Pages
- Adicione o domínio completo nas configurações do GitHub Pages

**Recomendação**: Para começar, use apenas o GitHub Pages sem domínio personalizado. É mais simples e funciona perfeitamente!

## 📚 Documentação Completa

Para uma visão detalhada do projeto, consulte:

- **[PROJETO.md](./PROJETO.md)** - Documentação completa com status de todos os arquivos
- **[ESTRUTURA.md](./ESTRUTURA.md)** - Estrutura visual em árvore do projeto
- **[DEPLOY.md](./DEPLOY.md)** - Guia completo de deploy no GitHub Pages

## 📊 Status do Projeto

O projeto está **funcional** com a nova arquitetura mais robusta:

- ✅ **Domain Layer** - 100% completo (nova arquitetura)
- ✅ **Application Layer** - 100% completo (funcionalidades principais)
- ✅ **Infrastructure Layer** - 100% completo (nova arquitetura)
- ✅ **Presentation Layer** - 100% completo (nova arquitetura)

**Estrutura nova**: Sistema operacional e pronto para uso
**Estrutura antiga**: 100% funcional e completa (mantida para referência)

## 📝 Licença

Este projeto é de uso pessoal.