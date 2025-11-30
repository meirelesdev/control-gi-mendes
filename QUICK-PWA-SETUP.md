# ⚡ Configuração Rápida PWA

## Passo 1: Criar os Ícones (2 minutos)

1. Abra o arquivo `create-icons.html` no navegador
2. Clique em "Baixar Todos"
3. Os arquivos `icon-192.png` e `icon-512.png` serão baixados
4. Coloque esses arquivos na **raiz do projeto** (mesma pasta do `index.html`)

## Passo 2: Testar Localmente

### Se estiver usando XAMPP:

1. Certifique-se de que o projeto está em `C:\xampp\htdocs\control-gi-mendes`
2. Acesse `http://localhost/control-gi-mendes` no navegador
3. Abra o DevTools (F12) > Application > Service Workers
4. Deve aparecer "activated and is running" ✅

### Se estiver usando outro servidor:

Use um servidor HTTP local:
- Python: `python -m http.server 8000` → acesse `http://localhost:8000`
- Node.js: `npx http-server -p 8000` → acesse `http://localhost:8000`

## Passo 3: Instalar no Celular

### Android:

1. No Chrome do celular, acesse: `http://SEU-IP:8000/control-gi-mendes`
   - Para descobrir seu IP: `ipconfig` (Windows) ou `ifconfig` (Linux/Mac)
   - Exemplo: `http://192.168.1.100:8000` (substitua pelo seu IP)
2. Toque no menu (3 pontos) > **"Adicionar à tela inicial"**
3. Confirme
4. O app aparecerá na tela inicial! 🎉

### iOS:

1. No Safari do iPhone, acesse a mesma URL
2. Toque no botão de compartilhar (quadrado com seta)
3. Role para baixo e toque em **"Adicionar à Tela de Início"**
4. Confirme
5. O app aparecerá na tela inicial! 🎉

## ✅ Pronto!

Agora você pode:
- Abrir o app direto da tela inicial
- Usar offline (dados salvos localmente)
- Ter uma experiência de app nativo

## 🔧 Problemas?

- **Service Worker não registra?** Certifique-se de usar HTTP/HTTPS (não `file://`)
- **Ícones não aparecem?** Verifique se os arquivos estão na raiz do projeto
- **Não aparece opção de instalar?** Verifique o console do navegador para erros

Veja `PWA-SETUP.md` para mais detalhes.
