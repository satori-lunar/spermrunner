# StreamRacer ✨

A whimsical mobile-friendly web racing game where you guide a glowing pod through colorful abstract tunnels to reach the Energy Core!

## Game Overview

Race through 8 vibrant stages over approximately 30 minutes of gameplay. Bump playful rivals, avoid floating obstacles, collect sparkly powerups, and be the first to reach the glowing Energy Core!

## Features

### Visual Style
- **Playful & Abstract**: Bright colors, rounded shapes, smooth motion
- **Glowing Pods**: Cute swimmer-like characters with flowing ribbon trails
- **Flowing Tunnels**: Soft gradients and atmospheric particle effects
- **Energy Core Goal**: Pulsing golden core with orbiting sparkles

### Core Mechanics
- **Smooth Touch Controls**: Drag anywhere to steer fluidly
- **Boost Button**: Tap for a burst of speed with particle effects
- **Bumping**: Collide with rivals to slow them down
- **Flowing Currents**: Energy streams that push you off course

### Rival Pods
Four distinct character types:
- **Swift** (Pink): Quick and nimble
- **Steady** (Blue): Consistent and reliable
- **Bouncy** (Orange): Loves to bump!
- **Floaty** (Purple): Drifts gracefully

### Powerups
- ⚡ **Speed Burst**: Instant energy boost
- 🛡️ **Shield Bubble**: Protected from knockback
- ⭐ **Star Trail**: Leave sparkles behind

### 8 Stages
1. **Gentle Stream** - A calm beginning
2. **Bubbling Rapids** - The pace picks up
3. **Swirling Currents** - Watch for drifting streams
4. **Crystal Caverns** - Navigate the shimmering maze
5. **Neon Rush** - Speed through the glow
6. **Cosmic Chaos** - Everything is moving
7. **Starlight Sprint** - Race among the stars
8. **The Core Awaits** - The energy core is near!

## Development

### Prerequisites
- Node.js 18+
- npm

### Installation

```bash
npm install
```

### Run Development Server

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

### Build for Production

```bash
npm run build
```

## Deployment (Vercel)

This project is configured for Vercel deployment:

1. Connect your GitHub repository to Vercel
2. Vercel will auto-detect the Vite configuration
3. Deploy!

## Tech Stack

- **Game Engine**: Phaser 3
- **Bundler**: Vite
- **Language**: JavaScript (ES Modules)
- **Deployment**: Vercel

## Controls

### Mobile (Touch)
- **Touch & drag**: Steer your pod smoothly
- **Boost button**: Tap for speed burst

### Desktop (Keyboard)
- **Arrow keys / WASD**: Steer
- **Spacebar**: Boost

## File Structure

```
src/
├── main.js              # Entry point, Phaser config
├── config/
│   └── GameConfig.js    # Colors, settings, difficulty
├── entities/
│   ├── Player.js        # Glowing pod with ribbon trail
│   ├── Rival.js         # Colorful AI pods
│   ├── Obstacle.js      # Bubbles, crystals, floaters
│   └── Track.js         # Flowing tunnel generation
├── scenes/
│   ├── MenuScene.js     # Whimsical main menu
│   └── GameScene.js     # Core gameplay
└── ui/
    ├── TouchControls.js # Smooth touch steering
    └── HUD.js           # Playful interface
```

## License

MIT
