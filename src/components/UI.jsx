// Game UI - Menus, HUD, and overlays
import { useGameStore } from '../store/gameStore';
import './UI.css';

// Main menu screen
export function MainMenu() {
  const { startGame, highScore } = useGameStore();
  
  return (
    <div className="menu-overlay">
      <div className="menu-content">
        <h1 className="game-title">
          <span className="title-sperm">SPERM</span>
          <span className="title-run">RUN</span>
        </h1>
        <p className="subtitle">Race to the Egg!</p>
        
        <button className="menu-button primary" onClick={startGame}>
          START GAME
        </button>
        
        {highScore > 0 && (
          <p className="high-score">High Score: {Math.floor(highScore)}</p>
        )}
        
        <div className="controls-hint">
          <p>Swipe or use A/D keys to switch lanes</p>
        </div>
      </div>
      
      <div className="menu-bg-particles" />
    </div>
  );
}

// In-game HUD
export function GameHUD() {
  const { score, distance, speedMultiplier, pauseGame } = useGameStore();
  
  return (
    <div className="game-hud">
      <div className="hud-top">
        <div className="score-display">
          <span className="score-label">DISTANCE</span>
          <span className="score-value">{Math.floor(distance)}m</span>
        </div>
        
        <button className="pause-button" onClick={pauseGame}>
          ⏸
        </button>
      </div>
      
      <div className="hud-bottom">
        <div className="speed-indicator">
          <div 
            className="speed-bar" 
            style={{ width: `${Math.min(speedMultiplier * 50, 100)}%` }}
          />
          <span className="speed-label">SPEED</span>
        </div>
      </div>
    </div>
  );
}

// Pause menu
export function PauseMenu() {
  const { resumeGame, returnToMenu } = useGameStore();
  
  return (
    <div className="pause-overlay">
      <div className="pause-content">
        <h2>PAUSED</h2>
        
        <button className="menu-button primary" onClick={resumeGame}>
          RESUME
        </button>
        
        <button className="menu-button secondary" onClick={returnToMenu}>
          QUIT TO MENU
        </button>
      </div>
    </div>
  );
}

// Game over screen
export function GameOverScreen() {
  const { distance, highScore, startGame, returnToMenu } = useGameStore();
  const isNewHighScore = Math.floor(distance) >= highScore;
  
  return (
    <div className="gameover-overlay">
      <div className="gameover-content">
        <h2 className="gameover-title">GAME OVER</h2>
        
        {isNewHighScore && distance > 0 && (
          <p className="new-highscore">🎉 NEW HIGH SCORE! 🎉</p>
        )}
        
        <div className="final-score">
          <span className="score-label">DISTANCE</span>
          <span className="score-value">{Math.floor(distance)}m</span>
        </div>
        
        <div className="best-score">
          <span className="score-label">BEST</span>
          <span className="score-value">{Math.floor(highScore)}m</span>
        </div>
        
        <div className="gameover-buttons">
          <button className="menu-button primary" onClick={startGame}>
            TRY AGAIN
          </button>
          
          <button className="menu-button secondary" onClick={returnToMenu}>
            MENU
          </button>
        </div>
      </div>
    </div>
  );
}

// Touch controls overlay
export function TouchControls() {
  const { switchLane, gameState } = useGameStore();
  
  if (gameState !== 'playing') return null;
  
  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    const screenWidth = window.innerWidth;
    
    if (touch.clientX < screenWidth / 2) {
      switchLane(-1); // Left
    } else {
      switchLane(1); // Right
    }
  };
  
  return (
    <div 
      className="touch-controls"
      onTouchStart={handleTouchStart}
    >
      <div className="touch-zone left">
        <span>◀</span>
      </div>
      <div className="touch-zone right">
        <span>▶</span>
      </div>
    </div>
  );
}

// Main UI component
export function GameUI() {
  const { gameState } = useGameStore();
  
  return (
    <div className="ui-container">
      {gameState === 'menu' && <MainMenu />}
      {gameState === 'playing' && <GameHUD />}
      {gameState === 'playing' && <TouchControls />}
      {gameState === 'paused' && <PauseMenu />}
      {gameState === 'gameover' && <GameOverScreen />}
    </div>
  );
}
