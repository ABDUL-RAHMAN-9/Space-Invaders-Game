# Space-Invaders-Game

A high-performance, responsive retro arcade experience built from the ground up using Vanilla JavaScript, HTML5 Canvas, and CSS3. This version features pixel-perfect UI recreation, and persistent data storage.

<img width="1912" height="930" alt="image" src="https://github.com/user-attachments/assets/43a0ecd2-000f-44e7-a0cc-cca9b66d9573" />


##  Key Features

- **Responsive Retro UI:** Exactly matches classic arcade layouts with a centered scoring system and neon-style HUD.
- **Persistent High Scores:** Records are saved via `localStorage`, so your highest score remains even after refreshing the page or closing the browser.
- **Destructible Bunkers:** Four protective shields with health points (HP) that degrade as they take damage from either player or alien fire.
- **Procedural Starfield:** A dynamic, multi-layered background with stars that drop from the top, creating a 3D depth effect.
- **Custom Sound Engine:** Real-time audio synthesis using the Web Audio API (Oscillators) — no external MP3 files required.
- **Cross-Platform Controls:** Fully optimized for both Desktop (Keyboard) and Mobile (Touch/Drag).

##  Controls

### Desktop
- **Left/Right Arrows or A/D:** Move the starship.
- **Spacebar:** Fire primary laser.
- **? Icon:** Open Pilot Manual (Tutorial).

### Mobile / Tablet
- **Touch & Drag:** Move the ship horizontally.
- **Tap Screen:** Fire laser.
- **On-Screen Icons:** Toggle sound and view tutorial.

##  Technical Overview

The project is organized into three core modules:

1.  **Starfield Engine:** Manages a parallax background array where star objects are recycled as they leave the screen to maintain performance.
2.  **Game Loop:** A `requestAnimationFrame` driven engine that handles 60FPS collision detection between three distinct arrays (Enemies, Player Projectiles, and Enemy Projectiles).
3.  **Persistence Layer:** Logic that checks `localStorage` during the `gameOver` and `initGame` sequences to ensure records are never lost.

##  Installation & Setup

1. **Clone the repository:**
```bash
   git clone https://github.com/your-username/Space-Invaders-Game.git
```

2. **Navigate to the directory:**
```bash
   cd Space-Invaders-Game
```

3. **Run the game:**
```bash
   Simply open index.html in any modern web browser. No local server or dependencies required!
```

## Bunker Mechanics

- Each bunker starts with 30 HP.
- Bunkers block both player and enemy shots.
- Once HP reaches 0, the bunker is destroyed, leaving the player vulnerable.

## Future Roadmap

- Power-ups: Multi-shot and Rapid-fire drops.
- Boss Levels: Giant UFO motherships appearing every 5 levels.
- Global Leaderboard: Integration with a backend (Firebase/Node.js) to compete globally.

## Developed with ❤️ by Abdul Rahman.
    

  
