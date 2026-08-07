# Space Invaders

![JavaScript](https://img.shields.io/badge/javascript-%23323330.svg?style=for-the-badge&logo=javascript&logoColor=%23F7DF1E)
![HTML5](https://img.shields.io/badge/html5-%23E34F26.svg?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/css3-%231572B6.svg?style=for-the-badge&logo=css3&logoColor=white)

A lightweight, mobile-responsive recreation of the classic arcade game built using vanilla JavaScript and the HTML5 Canvas API. This project demonstrates how to construct a modular 2D game loop, implement custom vector collision detection, and generate procedural audio effects entirely in the browser without external libraries or frameworks.

<img width="1912" height="930" alt="image" src="https://github.com/user-attachments/assets/43a0ecd2-000f-44e7-a0cc-cca9b66d9573" />



## 1. Key Features

*   **Procedural Parallax Starfield:** Generates a multi-layered, infinite depth effect using recycled star coordinates to keep memory and rendering overhead low.
*   **Custom Synthesized Audio:** Dynamically generates retro 8-bit sound effects using the native **Web Audio API (Oscillators)**, eliminating the need to load external MP3 audio assets.
*   **Destructible Defense Bunkers:** Implements pixel-degrading protective shields with dedicated health pools that take structural damage from both alien and player lasers.
*   **Persistent High Scores:** Automatically saves top scores locally using `localStorage` to preserve progress across browser sessions.
*   **Adaptive Cross-Platform Inputs:** Instantly detects the user's platform to adapt controls—using key bindings for desktop and fluid touch-and-drag mechanics for mobile.



## 2. Controls & Input Mapping

The engine automatically updates the active layout based on the user's input environment:

### Desktop Inputs
*   **Movement:** `Left Arrow` / `Right Arrow` or `A` / `D` keys
*   **Primary Weapon:** `Spacebar` to fire lasers
*   **Pilot Manual:** Click the on-screen `?` icon to toggle the tutorial overlay

### Touchscreen Inputs (Mobile / Tablet)
*   **Movement:** Touch and drag the starship horizontally
*   **Primary Weapon:** Tap anywhere on the screen to fire
*   **On-Screen Utilities:** Tap HUD icons directly to mute/unmute audio or view the tutorial

## 3. Technical & Architectural Overview

The code is structured as a native, single-threaded system dividing rendering logic into modular, highly-performant engines:

*   **Core Game Loop (`requestAnimationFrame`):** Orchestrates frame updates and drawing routines at a smooth 60 FPS. Handles automated, multi-array collision detection matrices between the `Enemies`, `Player Projectiles`, and `Enemy Projectiles` collections.
*   **Starfield Parallax Engine:** Manages a multi-depth backdrop array where star coordinates are dynamically recycled as they exit the viewport boundaries, maintaining zero-allocation memory footprints during continuous gameplay.
*   **State Persistence Layer:** Coordinates with the Web Storage API during initial loading (`initGame`) and termination (`gameOver`) sequences to prevent data loss and retain scoring consistency.



## 4. Local Setup & Execution

Because the game is built entirely on native web standards with zero external dependencies, running it locally requires no packages, build steps, or local servers.

### 1. Clone the Repository
```bash
git clone https://github.com/abdul-rahman-0x/space-invaders-game.git
cd space-invaders-game
```

### 2. Launch the Game

Simply double-click or open `index.html` in any modern web browser.


## Bunker Mechanics

- Each bunker starts with 30 HP.
- Bunkers block both player and enemy shots.
- Once HP reaches 0, the bunker is destroyed, leaving the player vulnerable.


## License

This project is open-source and licensed under the [MIT License](./LICENSE).


## Author

Built by **[Abdul Rahman](https://github.com/abdul-rahman-0x)** — Software Engineer.
