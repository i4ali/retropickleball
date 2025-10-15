import { Game } from './game';

// Initialize the game when DOM is loaded
window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;

  if (!canvas) {
    console.error('Canvas element not found!');
    return;
  }

  // Set canvas size (portrait orientation for retro feel)
  canvas.width = 600;
  canvas.height = 800;

  // Create and start the game
  const game = new Game(canvas);
  game.start();

  console.log('🎮 Retro Pickleball started!');
});
