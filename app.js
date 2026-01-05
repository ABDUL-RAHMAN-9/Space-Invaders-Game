const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const scoreEl = document.getElementById("score");
const startBtn = document.getElementById("start-btn");
const startScreen = document.getElementById("start-screen");

// Game Config
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let score = 0;
let gameActive = false;

// --- AUDIO ENGINE (Generates sounds via Code) ---
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playSound(freq, type, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(
        0.0001,
        audioCtx.currentTime + duration
    );
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
}

// --- GAME OBJECTS ---
class Player {
    constructor() {
        this.width = 50;
        this.height = 40;
        this.x = canvas.width / 2 - this.width / 2;
        this.y = canvas.height - 80;
        this.speed = 8;
    }
    draw() {
        ctx.shadowBlur = 15;
        ctx.shadowColor = "#00f3ff";
        ctx.fillStyle = "#00f3ff";
        // Ship Shape
        ctx.beginPath();
        ctx.moveTo(this.x + this.width / 2, this.y);
        ctx.lineTo(this.x, this.y + this.height);
        ctx.lineTo(this.x + this.width, this.y + this.height);
        ctx.closePath();
        ctx.fill();
    }
}

class Projectile {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 4;
        this.speed = 12;
    }
    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = "#ff00ff";
        ctx.fill();
    }
    update() {
        this.y -= this.speed;
    }
}

class Invader {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 40;
        this.height = 30;
        this.color = `hsl(${Math.random() * 360}, 70%, 50%)`;
    }
    draw() {
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
}

class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.velocity = {
            x: (Math.random() - 0.5) * 5,
            y: (Math.random() - 0.5) * 5,
        };
        this.alpha = 1;
    }
    draw() {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, 2, 2);
        ctx.restore();
    }
    update() {
        this.x += this.velocity.x;
        this.y += this.velocity.y;
        this.alpha -= 0.02;
    }
}

// --- GAME STATE ---
const player = new Player();
const projectiles = [];
const invaders = [];
const particles = [];
const keys = {};

function spawnInvaders() {
    for (let row = 0; row < 5; row++) {
        for (let col = 0; col < 10; col++) {
            invaders.push(new Invader(col * 60 + 100, row * 50 + 50));
        }
    }
}

// --- MAIN LOOP ---
function animate() {
    if (!gameActive) return;
    requestAnimationFrame(animate);
    ctx.fillStyle = "rgba(2, 2, 5, 0.3)"; // Trail effect
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    player.draw();

    // Player Movement
    if (keys["ArrowLeft"] && player.x > 0) player.x -= player.speed;
    if (keys["ArrowRight"] && player.x < canvas.width - player.width)
        player.x += player.speed;

    // Particles update
    particles.forEach((p, i) => {
        if (p.alpha <= 0) particles.splice(i, 1);
        else p.update() || p.draw();
    });

    // Projectiles update
    projectiles.forEach((p, index) => {
        p.update();
        p.draw();
        if (p.y < 0) projectiles.splice(index, 1);
    });

    // Invaders & Collision
    invaders.forEach((invader, i) => {
        invader.draw();

        // Check collision with projectile
        projectiles.forEach((proj, pi) => {
            if (
                proj.x > invader.x &&
                proj.x < invader.x + invader.width &&
                proj.y > invader.y &&
                proj.y < invader.y + invader.height
            ) {
                // Boom!
                playSound(150, "square", 0.1);
                for (let k = 0; k < 15; k++)
                    particles.push(
                        new Particle(
                            invader.x + 20,
                            invader.y + 15,
                            invader.color
                        )
                    );

                invaders.splice(i, 1);
                projectiles.splice(pi, 1);
                score += 100;
                scoreEl.innerText = score;
            }
        });

        // Simple movement
        invader.y += 0.2;
        if (invader.y + invader.height > player.y) {
            gameActive = false;
            document.getElementById("game-over").classList.remove("hidden");
            document.getElementById("final-score").innerText = score;
        }
    });
}

// --- INPUTS ---
window.addEventListener("keydown", (e) => {
    keys[e.key] = true;
    if (e.code === "Space" && gameActive) {
        projectiles.push(new Projectile(player.x + player.width / 2, player.y));
        playSound(440, "sine", 0.1);
    }
});
window.addEventListener("keyup", (e) => (keys[e.key] = false));

startBtn.addEventListener("click", () => {
    startScreen.classList.add("hidden");
    gameActive = true;
    spawnInvaders();
    animate();
});
