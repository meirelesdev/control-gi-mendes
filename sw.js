/**
 * Service Worker - Gi Finanças
 * Permite funcionamento offline e instalação como PWA
 */

const CACHE_NAME = 'gi-financas-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/src/main.js',
  '/src/presentation/styles/main.css',
  '/src/presentation/styles/variables.css',
  '/src/presentation/styles/base.css',
  '/src/presentation/styles/components.css',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

// Instalação do Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Cache aberto');
        return cache.addAll(urlsToCache);
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
          // Clona a resposta para cache
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          return response;
        });
      })
      .catch(() => {
        // Se falhar, retorna página offline se for navegação
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      })
  );
});

// Mensagens do cliente
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
