/**
 * Script Node.js para gerar ícones PWA
 * Execute: node generate-icons.js
 */

const fs = require('fs');
const { createCanvas } = require('canvas');

// Cores do gradiente
const colors = {
  start: '#667eea',
  end: '#764ba2'
};

function createIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Cria gradiente
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, colors.start);
  gradient.addColorStop(1, colors.end);

  // Preenche fundo
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  // Adiciona texto "GF"
  ctx.fillStyle = 'white';
  ctx.font = `bold ${size * 0.4}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('GF', size / 2, size / 2);

  return canvas.toBuffer('image/png');
}

try {
  // Gera ícone 192x192
  const icon192 = createIcon(192);
  fs.writeFileSync('icon-192.png', icon192);
  console.log('✅ icon-192.png criado com sucesso!');

  // Gera ícone 512x512
  const icon512 = createIcon(512);
  fs.writeFileSync('icon-512.png', icon512);
  console.log('✅ icon-512.png criado com sucesso!');

  console.log('\n🎉 Ícones gerados com sucesso!');
} catch (error) {
  console.error('❌ Erro ao gerar ícones:', error.message);
  console.log('\n💡 Alternativa: Use o arquivo create-icons.html no navegador');
}
