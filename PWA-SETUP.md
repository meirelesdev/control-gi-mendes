# 📱 Configuração PWA - Gi Finanças

Este guia explica como configurar a aplicação como PWA (Progressive Web App) para instalação em dispositivos móveis.

## ✅ Arquivos Criados

1. **`manifest.json`** - Manifesto PWA com informações da aplicação
2. **`sw.js`** - Service Worker para funcionamento offline
3. **`create-icons.html`** - Gerador de ícones (opcional)

## 🎨 Passo 1: Criar os Ícones

### Opção A: Usar o Gerador Incluído

1. Abra o arquivo `create-icons.html` no navegador
2. Clique em "Gerar Ícones"
3. Clique em "Baixar Todos"
4. Coloque os arquivos `icon-192.png` e `icon-512.png` na raiz do projeto

### Opção B: Criar Manualmente

Crie dois ícones:
- **icon-192.png** - 192x192 pixels
- **icon-512.png** - 512x512 pixels

Use um design simples com as iniciais "GF" ou um ícone relacionado a finanças.

## 🚀 Passo 2: Testar Localmente

### Para Testar em Desenvolvimento Local:

1. **Use um servidor HTTP** (não abra direto o arquivo HTML)
   
   **Opção 1: Python**
   ```bash
   python -m http.server 8000
   ```
   
   **Opção 2: Node.js (http-server)**
   ```bash
   npx http-server -p 8000
   ```
   
   **Opção 3: PHP (XAMPP)**
   - Coloque o projeto em `htdocs`
   - Acesse via `http://localhost/control-gi-mendes`

2. Acesse `http://localhost:8000` (ou sua URL)

3. Abra o DevTools (F12) e vá em **Application > Service Workers**
   - Deve mostrar "activated and is running"

## 📱 Passo 3: Instalar no Dispositivo Móvel

### Android (Chrome):

1. Abra o Chrome no Android
2. Acesse a URL da aplicação (ex: `http://seu-ip:8000`)
3. Toque no menu (3 pontos) > **"Adicionar à tela inicial"** ou **"Instalar app"**
4. Confirme a instalação
5. O app aparecerá na tela inicial

### iOS (Safari):

1. Abra o Safari no iOS
2. Acesse a URL da aplicação
3. Toque no botão de compartilhar (quadrado com seta)
4. Selecione **"Adicionar à Tela de Início"**
5. Personalize o nome se desejar
6. Toque em **"Adicionar"**

## 🌐 Passo 4: Deploy em Produção (GitHub Pages)

Para funcionar como PWA em produção:

1. **Faça commit dos arquivos:**
   ```bash
   git add manifest.json sw.js icon-192.png icon-512.png
   git commit -m "Adiciona suporte PWA"
   git push
   ```

2. **Configure GitHub Pages** (se ainda não fez):
   - Settings > Pages > Source: `main` branch

3. Acesse `https://seu-usuario.github.io/control-gi-mendes`

4. O navegador deve mostrar um banner de instalação

## 🔧 Troubleshooting

### Service Worker não registra:

- ✅ Certifique-se de estar usando **HTTPS** ou **localhost**
- ✅ Verifique se o arquivo `sw.js` está na raiz do projeto
- ✅ Abra o DevTools > Application > Service Workers para ver erros

### Ícones não aparecem:

- ✅ Verifique se os arquivos `icon-192.png` e `icon-512.png` estão na raiz
- ✅ Verifique o caminho no `manifest.json`
- ✅ Limpe o cache do navegador

### App não instala:

- ✅ Verifique se o `manifest.json` está válido (use um validador online)
- ✅ Certifique-se de que o Service Worker está ativo
- ✅ No Chrome, verifique se não está em modo de navegação anônima

## 📋 Checklist Final

- [ ] Arquivo `manifest.json` criado e configurado
- [ ] Arquivo `sw.js` criado
- [ ] Ícones `icon-192.png` e `icon-512.png` na raiz
- [ ] `index.html` atualizado com referências ao manifest
- [ ] Service Worker registrado no `main.js`
- [ ] Testado localmente
- [ ] Deploy em produção (se aplicável)

## 🎯 Funcionalidades PWA Ativadas

✅ Instalação no dispositivo móvel  
✅ Funcionamento offline básico  
✅ Ícone na tela inicial  
✅ Tema personalizado  
✅ Modo standalone (sem barra do navegador)  

---

**Nota:** Para funcionamento offline completo, você pode expandir o Service Worker para cachear mais recursos conforme necessário.
