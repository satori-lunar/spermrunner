# Spermrunner 🏊

A mobile-friendly web racing game where you compete as a sperm racing to reach the egg. Built with Phaser 3 and deployed on Vercel.

## Game Overview

Race through 8 increasingly challenging stages over approximately 30 minutes of gameplay. Bump rivals off course, avoid obstacles, collect powerups, and be the first to reach the egg!

## Features

### Core Mechanics
- **Steering**: Touch joystick (left side) or arrow keys/WASD
- **Boost**: Tap boost button (right side) or spacebar for speed burst
- **Bumping**: Collide with rivals to knock them off course
- **Obstacles**: Debris, mucus walls, and moving hazards
- **Currents**: Flowing areas that push you off course

### AI Rivals
Four distinct rival archetypes:
- **Aggressive** (Red): Fast and bumps frequently
- **Defensive** (Blue): Blocks lanes, hard to pass
- **Slippery** (Yellow): Very fast but avoids contact
- **Blocker** (Orange): Slow but wide, blocks the path

### Powerups
- ⚡ **Speed Boost**: Instant boost recharge
- 🛡️ **Shield**: Temporary immunity to knockback
- 💚 **Sticky Trap**: Drop trap to slow rivals

### 8 Stages of Increasing Difficulty
1. **The Beginning** - Tutorial-lite, wide lanes
2. **First Challenge** - More rivals join
3. **Turbulent Waters** - Currents introduced
4. **The Maze** - Tight turns and choke points
5. **The Gauntlet** - Aggressive rivals
6. **Chaos Zone** - Obstacles everywhere
7. **The Needle** - Narrow lanes, high speed
8. **The Final Sprint** - Everything at maximum!

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

The built files will be in the `dist` folder.

## Deployment (Vercel)

This project is configured for Vercel deployment:

1. Connect your GitHub repository to Vercel
2. Vercel will auto-detect the Vite configuration
3. Deploy!

Or deploy manually:

```bash
npx vercel
```

## Tech Stack

- **Game Engine**: Phaser 3
- **Bundler**: Vite
- **Language**: JavaScript (ES Modules)
- **Deployment**: Vercel

## Controls

### Mobile (Touch)
- **Left side of screen**: Touch and drag to steer
- **Right boost button**: Tap to activate speed boost

### Desktop (Keyboard)
- **Arrow keys / WASD**: Steer
- **Spacebar**: Boost

## Game Design

### Difficulty Progression
- Stages 1-2: Learn basics, few rivals, wide tracks
- Stages 3-4: Introduce currents, tighter turns
- Stages 5-6: Aggressive AI, mixed obstacles
- Stages 7-8: Maximum challenge, narrow lanes, high speed

### Target Duration
~30 minutes for a complete playthrough (8 stages × ~3.75 minutes each)

## File Structure

```
src/
├── main.js              # Entry point, Phaser config
├── config/
│   └── GameConfig.js    # Game settings, difficulty curves
├── entities/
│   ├── Player.js        # Player sperm entity
│   ├── Rival.js         # AI rival sperms
│   ├── Obstacle.js      # Obstacles, currents, powerups
│   └── Track.js         # Track generation
├── scenes/
│   ├── MenuScene.js     # Main menu
│   └── GameScene.js     # Core gameplay
└── ui/
    ├── TouchControls.js # Virtual joystick & boost
    └── HUD.js           # Heads-up display
```

## License

MIT
