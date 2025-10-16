import { inject } from '@vercel/analytics';
import { Game } from './game';
import { supabase } from './supabase';

inject();

// Initialize the game when DOM is loaded
window.addEventListener('DOMContentLoaded', () => {
  const startScreen = document.getElementById('startScreen');
  const quickPlayBtn = document.getElementById('quickPlayBtn');
  const loginBtn = document.getElementById('loginBtn');
  const authModal = document.getElementById('authModal');
  const closeModal = document.getElementById('closeModal');
  const signUpBtn = document.getElementById('signUpBtn');
  const loginEmailBtn = document.getElementById('loginEmailBtn');
  const emailInput = document.getElementById('emailInput') as HTMLInputElement;
  const passwordInput = document.getElementById('passwordInput') as HTMLInputElement;
  const authMessage = document.getElementById('authMessage');
  const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;

  if (!startScreen || !quickPlayBtn || !loginBtn || !authModal || !closeModal || !signUpBtn || !loginEmailBtn || !emailInput || !passwordInput || !authMessage || !canvas) {
    console.error('Required elements not found!');
    return;
  }

  quickPlayBtn.addEventListener('click', () => {
    startGame();
  });

  loginBtn.addEventListener('click', () => {
    authModal.style.display = 'flex';
  });

  closeModal.addEventListener('click', () => {
    authModal.style.display = 'none';
  });

  signUpBtn.addEventListener('click', async () => {
    const { email, password } = getAuthInputs();
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) {
      authMessage.textContent = error.message;
    } else {
      authMessage.textContent = 'Sign up successful! Please check your email to verify your account.';
    }
  });

  loginEmailBtn.addEventListener('click', async () => {
    const { email, password } = getAuthInputs();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      authMessage.textContent = error.message;
    } else {
      authMessage.textContent = 'Login successful!';
      setTimeout(() => {
        authModal.style.display = 'none';
        startGame(true);
      }, 1000);
    }
  });

  function getAuthInputs() {
    return {
      email: emailInput.value,
      password: passwordInput.value,
    };
  }

  function startGame(isLoggedIn = false) {
    if (startScreen) {
      startScreen.style.display = 'none';
    }
    if (canvas) {
      canvas.style.display = 'block';

      // Set canvas size (portrait orientation for retro feel)
      canvas.width = 600;
      canvas.height = 800;

      // Create and start the game
      const game = new Game(canvas, isLoggedIn);
      game.start();
    }

    console.log('ðŸŽ® Retro Pickleball started!');
  }
});
