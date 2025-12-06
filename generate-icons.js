/**
 * Script Node.js para gerar ícones PWA - Chef Finance
 * Execute: node generate-icons.js
 * 
 * Requer: npm install canvas
 */

const fs = require('fs');
const { createCanvas } = require('canvas');

// Cores do tema Chef Finance
const colors = {
  primary: '#E91E63',      // Rosa/Magenta principal
  secondary: '#F4F7F6',    // Fundo claro
  accent: '#FF6B9D',       // Rosa claro
  dark: '#C2185B',         // Rosa escuro
  white: '#FFFFFF',
  gold: '#FFD700'          // Dourado para símbolo de dinheiro
};

function createChefFinanceIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Fundo com gradiente
  const gradient = ctx.createRadialGradient(
    size * 0.3, size * 0.3, 0,
    size * 0.5, size * 0.5, size * 0.8
  );
  gradient.addColorStop(0, colors.primary);
  gradient.addColorStop(1, colors.dark);
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  // Adiciona bordas arredondadas (simulado com círculo)
  ctx.globalCompositeOperation = 'destination-in';
  ctx.beginPath();
  const radius = size * 0.15;
  ctx.roundRect(0, 0, size, size, radius);
  ctx.fill();
  ctx.globalCompositeOperation = 'source-over';

  // Desenha símbolo de Chef (chapéu de chef estilizado)
  const centerX = size / 2;
  const centerY = size / 2;
  
  // Chapéu de chef (parte superior)
  ctx.fillStyle = colors.white;
  ctx.beginPath();
  ctx.arc(centerX, centerY - size * 0.15, size * 0.25, 0, Math.PI * 2);
  ctx.fill();
  
  // Faixa do chapéu
  ctx.fillStyle = colors.accent;
  ctx.fillRect(centerX - size * 0.2, centerY - size * 0.05, size * 0.4, size * 0.08);
  
  // Símbolo de cifrão ($) estilizado
  ctx.strokeStyle = colors.gold;
  ctx.fillStyle = colors.gold;
  ctx.lineWidth = size * 0.08;
  ctx.font = `bold ${size * 0.35}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('$', centerX, centerY + size * 0.25);

  return canvas.toBuffer('image/png');
}

// Polyfill para roundRect (se não disponível)
if (!CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function(x, y, width, height, radius) {
    this.beginPath();
    this.moveTo(x + radius, y);
    this.lineTo(x + width - radius, y);
    this.quadraticCurveTo(x + width, y, x + width, y + radius);
    this.lineTo(x + width, y + height - radius);
    this.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    this.lineTo(x + radius, y + height);
    this.quadraticCurveTo(x, y + height, x, y + height - radius);
    this.lineTo(x, y + radius);
    this.quadraticCurveTo(x, y, x + radius, y);
    this.closePath();
  };
}

try {
  // Gera ícone 192x192
  const icon192 = createChefFinanceIcon(192);
  fs.writeFileSync('icon-192.png', icon192);
  console.log('✅ icon-192.png criado com sucesso!');

  // Gera ícone 512x512
  const icon512 = createChefFinanceIcon(512);
  fs.writeFileSync('icon-512.png', icon512);
  console.log('✅ icon-512.png criado com sucesso!');

  console.log('\n🎉 Ícones Chef Finance gerados com sucesso!');
  console.log('📱 Os ícones estão prontos para uso no PWA');
} catch (error) {
  console.error('❌ Erro ao gerar ícones:', error.message);
  console.log('\n💡 Alternativa: Use o arquivo criar-icones.html no navegador');
  console.log('   Ou instale o canvas: npm install canvas');
}
