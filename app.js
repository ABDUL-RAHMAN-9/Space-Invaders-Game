const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const scoreEl = document.getElementById("score");
const levelEl = document.getElementById("level");
const startBtn = document.getElementById("start-btn");
const startScreen = document.getElementById("start-screen");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let score = 0;
let level = 1;
let gameActive = false;
let enemySpeed = 0.3;

// --- AUDIO (Same Procedural Engine) ---
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playSound(freq, type, duration, vol = 0.1) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(vol, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(
        0.0001,
        audioCtx.currentTime + duration
    );
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
}

class Player {
    constructor() {
        this.width = 50;
        this.height = 30;
        this.x = canvas.width / 2 - this.width / 2;
        this.y = canvas.height - 100;
        this.speed = 10;
    }
    draw() {
        ctx.fillStyle = "#00f3ff";
        ctx.shadowBlur = 15;
        ctx.shadowColor = "#00f3ff";
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.fillRect(this.x + 20, this.y - 10, 10, 10); // Simple ship tip
    }
}

class Projectile {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 3;
        this.speed = 15;
    }
    update() {
        this.y -= this.speed;
    }
    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = "#ff00ff";
        ctx.fill();
    }
}

class Invader {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.width = 40;
        this.height = 30;
        this.color = color;
    }
    draw() {
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
    update() {
        this.y += enemySpeed;
    }
}

const player = new Player();
let projectiles = [];
let invaders = [];
const keys = {};

// CENTERED SPAWNING LOGIC
function spawnInvaders() {
    const cols = Math.min(10, Math.floor(canvas.width / 70));
    const rows = 4;
    const spacing = 60;
    const gridWidth = (cols - 1) * spacing + 40;
    const startX = (canvas.width - gridWidth) / 2; // Perfectly Centered

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const color = `hsl(${180 + row * 30}, 80%, 60%)`;
            invaders.push(
                new Invader(startX + col * spacing, row * 50 + 80, color)
            );
        }
    }
}

function nextLevel() {
    level++;
    levelEl.innerText = level;
    enemySpeed += 0.2; // Increase speed every level
    projectiles = [];
    playSound(600, "sine", 0.5, 0.2);
    spawnInvaders();
}

function animate() {
    if (!gameActive) return;
    requestAnimationFrame(animate);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    player.draw();
    if (keys["ArrowLeft"] && player.x > 0) player.x -= player.speed;
    if (keys["ArrowRight"] && player.x < canvas.width - player.width)
        player.x += player.speed;

    projectiles.forEach((p, pi) => {
        p.update();
        p.draw();
        if (p.y < 0) projectiles.splice(pi, 1);
    });

    invaders.forEach((invader, i) => {
        invader.update();
        invader.draw();

        // Collision Check (Accurate)
        projectiles.forEach((proj, pi) => {
            if (
                proj.x > invader.x &&
                proj.x < invader.x + invader.width &&
                proj.y > invader.y &&
                proj.y < invader.y + invader.height
            ) {
                playSound(150, "square", 0.1);
                invaders.splice(i, 1);
                projectiles.splice(pi, 1);
                score += 10;
                scoreEl.innerText = score;
            }
        });

        // Game Over Condition
        if (invader.y + invader.height > player.y) {
            gameActive = false;
            document.getElementById("game-over").classList.remove("hidden");
            document.getElementById("final-score").innerText = score;
        }
    });

    // Check for Level Clear
    if (invaders.length === 0) {
        nextLevel();
    }
}

// Controls
window.addEventListener("keydown", (e) => {
    keys[e.key] = true;
    if (e.code === "Space" && gameActive) {
        projectiles.push(new Projectile(player.x + player.width / 2, player.y));
        playSound(440, "sine", 0.05);
    }
});
window.addEventListener("keyup", (e) => (keys[e.key] = false));

// Start
startBtn.addEventListener("click", () => {
    if (audioCtx.state === "suspended") audioCtx.resume();
    startScreen.classList.add("hidden");
    gameActive = true;
    spawnInvaders();
    animate();
});

// Resize Support
window.addEventListener("resize", () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    player.x = canvas.width / 2 - player.width / 2;
});
