# 🚀 Guia de Deploy - Chef Finance

## Erro: "The custom domain `chef-finance` is not properly formatted"

Este erro acontece quando você tenta configurar um **domínio personalizado** no GitHub Pages, mas o formato está incorreto.

### ✅ Solução Rápida: Use GitHub Pages SEM domínio personalizado

**Você NÃO precisa configurar um domínio personalizado!** O GitHub Pages funciona perfeitamente sem isso.

#### Passos para corrigir:

1. **Vá nas configurações do seu repositório**
   - Acesse: `https://github.com/SEU-USUARIO/SEU-REPOSITORIO/settings/pages`

2. **Remova o domínio personalizado (se houver)**
   - Na seção "Custom domain", **deixe em branco** ou **remova** qualquer valor
   - Clique em **Save** (se necessário)

3. **Configure apenas a branch**
   - Em **Source**, selecione **Deploy from a branch**
   - Branch: **main** (ou **master**)
   - Folder: **/ (root)**
   - Clique em **Save**

4. **Aguarde alguns minutos**
   - O GitHub vai fazer o deploy automaticamente
   - Seu site estará em: `https://SEU-USUARIO.github.io/NOME-DO-REPOSITORIO/`

---

## 📝 Deploy Completo (Passo a Passo)

### Opção 1: Via Interface Web do GitHub

1. **Crie o repositório**
   - Acesse [github.com/new](https://github.com/new)
   - Nome: `chef-finance` (ou outro)
   - **NÃO** marque "Initialize with README"

2. **Faça upload dos arquivos**
   - No repositório criado, clique em **"uploading an existing file"**
   - Arraste TODOS os arquivos do projeto:
     - `index.html`
     - `app.js`
     - Pasta `domain/`
     - Pasta `application/`
     - Pasta `infrastructure/`
     - Pasta `presentation/`
     - Pasta `styles/`
     - `README.md`
   - Clique em **"Commit changes"**

3. **Ative o GitHub Pages**
   - Vá em **Settings** → **Pages**
   - Source: **Deploy from a branch**
   - Branch: **main** → **/ (root)**
   - Clique em **Save**

4. **Acesse seu site**
   - Aguarde 1-2 minutos
   - Acesse: `https://SEU-USUARIO.github.io/chef-finance/`

### Opção 2: Via Git (Linha de Comando)

```bash
# 1. Inicialize o repositório Git
git init

# 2. Adicione todos os arquivos
git add .

# 3. Faça o primeiro commit
git commit -m "Initial commit: Chef Finance"

# 4. Renomeie a branch para main (se necessário)
git branch -M main

# 5. Adicione o repositório remoto (substitua SEU-USUARIO e NOME-REPO)
git remote add origin https://github.com/SEU-USUARIO/NOME-REPO.git

# 6. Envie para o GitHub
git push -u origin main
```

Depois, siga os passos 3 e 4 da Opção 1 para ativar o GitHub Pages.

---

## 🌐 Domínio Personalizado (Opcional)

**IMPORTANTE**: Você só precisa disso se realmente tiver um domínio próprio registrado (ex: `chef-finance.com`).

### Se você tem um domínio:

1. **Configure o DNS do seu domínio**
   - Adicione um registro CNAME apontando para: `SEU-USUARIO.github.io`
   - Ou um registro A apontando para os IPs do GitHub:
     - `185.199.108.153`
     - `185.199.109.153`
     - `185.199.110.153`
     - `185.199.111.153`

2. **Configure no GitHub**
   - Vá em **Settings** → **Pages**
   - Em **Custom domain**, digite: `chef-finance.com` (domínio completo!)
   - Marque **"Enforce HTTPS"** (após o DNS propagar)

3. **Aguarde a propagação DNS**
   - Pode levar até 24 horas
   - Verifique com: `nslookup chef-finance.com`

### Formato Correto vs Incorreto

❌ **ERRADO**: `chef-finance`  
✅ **CORRETO**: `chef-finance.com` ou `www.chef-finance.com`

---

## 🔍 Verificando se está funcionando

1. **Verifique o status do deploy**
   - Vá em **Actions** no seu repositório
   - Você verá o status do deploy do GitHub Pages

2. **Teste o site**
   - Acesse a URL do GitHub Pages
   - Verifique se o `index.html` carrega
   - Teste as funcionalidades do sistema

3. **Verifique o console do navegador**
   - Pressione F12
   - Vá na aba **Console**
   - Não deve haver erros de carregamento de arquivos

---

## ❓ Problemas Comuns

### "404 Not Found"
- Verifique se o arquivo `index.html` está na raiz do repositório
- Verifique se a branch está configurada corretamente
- Aguarde alguns minutos para o GitHub processar

### "Arquivos não carregam"
- Verifique se todos os arquivos foram enviados
- Verifique os caminhos no `index.html` (devem ser relativos)
- Verifique o console do navegador para erros

### "Domínio não funciona"
- Remova o domínio personalizado temporariamente
- Use apenas a URL do GitHub Pages
- Configure o domínio depois, se necessário

---

## 📞 Precisa de ajuda?

- [Documentação oficial do GitHub Pages](https://docs.github.com/pages)
- [Troubleshooting do GitHub Pages](https://docs.github.com/pages/getting-started-with-github-pages/troubleshooting-github-pages)

