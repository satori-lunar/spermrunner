# Sperm Run 🏊

A 3D endless runner web game built with React Three Fiber. Race as a sperm through a microscopic rainbow world to reach the egg!

## Features

### True 3D Graphics
- React Three Fiber + Three.js rendering
- Low-poly 3D models with physically-based materials
- Real-time animated sperm tail using sine wave physics
- Translucent, glossy materials with rim lighting

### Gameplay
- Lane-based runner (3 lanes like Subway Surfers)
- Swipe or keyboard controls (A/D or arrows)
- Increasing speed and difficulty
- Rival sperms that try to knock you off
- Neutral-colored obstacles for contrast

### Visual Design
- Rainbow track with lane color bands:
  - Left: Red → Orange
  - Center: Green → Cyan
  - Right: Blue → Purple
- Jelly-like translucent track material
- Emissive glow effects
- Microscopic world atmosphere with floating particles
- Fog for depth perception

### Camera
- Third-person perspective follow camera
- Subtle sway when switching lanes
- FOV increases with speed
- Smooth transitions

### Performance
- Optimized for mobile WebGL
- Efficient particle systems
- Object pooling for obstacles

## Controls

### Mobile
- **Tap left side**: Move left
- **Tap right side**: Move right

### Desktop
- **A / Left Arrow**: Move left
- **D / Right Arrow**: Move right
- **P / Escape**: Pause

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

### Build for Production

```bash
npm run build
```

## Tech Stack

- **Framework**: React 18
- **3D Engine**: Three.js
- **R3F**: React Three Fiber
- **Utilities**: @react-three/drei
- **State**: Zustand
- **Bundler**: Vite
- **Deployment**: Vercel

## Project Structure

```
src/
├── main.jsx              # Entry point
├── store/
│   └── gameStore.js      # Zustand game state
└── components/
    ├── Game.jsx          # Main game setup
    ├── Player.jsx        # Sperm with animated tail
    ├── Track.jsx         # Rainbow track with shader
    ├── GameCamera.jsx    # Follow camera
    ├── Obstacles.jsx     # Obstacles & rivals
    ├── Environment.jsx   # Lighting & atmosphere
    ├── UI.jsx            # React UI overlays
    └── UI.css            # UI styles
```

## License

MIT
