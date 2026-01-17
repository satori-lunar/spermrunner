// Main entry point
import React from 'react';
import ReactDOM from 'react-dom/client';
import { Game } from './components/Game';

// Prevent default touch behaviors on mobile
document.addEventListener('touchstart', (e) => {
  if (e.target.closest('canvas')) {
    e.preventDefault();
  }
}, { passive: false });

document.addEventListener('touchmove', (e) => {
  if (e.target.closest('canvas')) {
    e.preventDefault();
  }
}, { passive: false });

// Mount app
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Game />
  </React.StrictMode>
);

console.log('🏊 Sperm Run - Race to the Egg!');
