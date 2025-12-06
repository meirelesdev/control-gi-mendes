/**
 * Service Worker - Chef Finance
 * Permite funcionamento offline e instalação como PWA
 */

const CACHE_NAME = 'chef-finance-v2'; // Atualizado para forçar refresh dos ícones
// Base path para GitHub Pages
const BASE_PATH = '/control-gi-mendes';

const urlsToCache = [
  `${BASE_PATH}/`,
  `${BASE_PATH}/index.html`,
  `${BASE_PATH}/src/main.js`,
  `${BASE_PATH}/src/presentation/styles/main.css`,
  `${BASE_PATH}/src/presentation/styles/variables.css`,
  `${BASE_PATH}/src/presentation/styles/base.css`,
  `${BASE_PATH}/src/presentation/styles/components.css`,
  `${BASE_PATH}/manifest.json`,
  // Força atualização dos ícones
  `${BASE_PATH}/icon-192.png?v=2`,
  `${BASE_PATH}/icon-512.png?v=2`
];

// Ícones opcionais (só faz cache se existirem)
const optionalUrls = [
  `${BASE_PATH}/icon-192.png`,
  `${BASE_PATH}/icon-512.png`
];

// Instalação do Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Cache aberto');
        // Faz cache dos arquivos essenciais
        return cache.addAll(urlsToCache).then(() => {
          // Tenta fazer cache dos ícones opcionais (não falha se não existirem)
          return Promise.allSettled(
            optionalUrls.map(url => 
              fetch(url)
                .then(response => {
                  if (response.ok) {
                    return cache.put(url, response);
                  }
                })
                .catch(() => {
                  // Ignora erros de recursos opcionais
                  console.log(`Service Worker: Ícone ${url} não encontrado (opcional)`);
                })
            )
          );
        });
      })
      .catch((error) => {
        console.error('Service Worker: Erro ao fazer cache', error);
      })
  );
  self.skipWaiting();
});

// Ativação do Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Removendo cache antigo', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Interceptação de requisições
self.addEventListener('fetch', (event) => {
  // Ignora requisições de extensões do navegador
  if (event.request.url.startsWith('chrome-extension://') || 
      event.request.url.startsWith('moz-extension://')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Retorna do cache se disponível, senão busca na rede
        if (response) {
          return response;
        }
        return fetch(event.request).then((response) => {
          // Não cacheia se não for uma resposta válida
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          // Ignora cache de extensões
          if (response.url.startsWith('chrome-extension://') || 
              response.url.startsWith('moz-extension://')) {
            return response;
          }
          // Clona a resposta para cache
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache).catch(() => {
              // Ignora erros ao fazer cache (pode ser extensão ou recurso não suportado)
            });
          });
          return response;
        }).catch(() => {
          // Se falhar ao buscar, retorna página offline se for navegação
          if (event.request.mode === 'navigate') {
            return caches.match(`${BASE_PATH}/index.html`) || caches.match('/index.html');
          }
          // Para outros recursos, retorna erro silenciosamente
          return new Response('Recurso não disponível offline', { 
            status: 404, 
            statusText: 'Not Found' 
          });
        });
      })
      .catch(() => {
        // Se falhar, retorna página offline se for navegação
        if (event.request.mode === 'navigate') {
          return caches.match(`${BASE_PATH}/index.html`) || caches.match('/index.html');
        }
        return new Response('Recurso não disponível', { 
          status: 404, 
          statusText: 'Not Found' 
        });
      })
  );
});

// Mensagens do cliente
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
