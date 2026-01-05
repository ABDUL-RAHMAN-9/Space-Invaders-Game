const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Game State
let score = 0,
    lives = 3,
    level = 1,
    gameActive = false;
let superMeter = 0;
const keys = {};
let lastFireTime = 0;
const fireRate = 250; // ms between shots

// Assets
const shipImg = new Image();
shipImg.src = "https://cdn-icons-png.flaticon.com/512/3063/3063738.png";
const enemyImg = new Image();
enemyImg.src = "https://cdn-icons-png.flaticon.com/512/5434/5434383.png";

// --- AUDIO ENGINE (Fixed & Enhanced) ---
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playSound(freq, type, duration, vol = 0.1) {
    try {
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
    } catch (e) {
        console.log("Audio waiting for interaction");
    }
}

// Special Victory Arpeggio
function playVictorySound() {
    const notes = [440, 554.37, 659.25, 880];
    notes.forEach((f, i) => {
        setTimeout(() => playSound(f, "sine", 0.4, 0.15), i * 150);
    });
}

// Classes
class Player {
    constructor() {
        this.w = 60;
        this.h = 60;
        this.x = canvas.width / 2 - 30;
        this.y = canvas.height - 120;
        this.speed = 10;
    }
    draw() {
        ctx.drawImage(shipImg, this.x, this.y, this.w, this.h);
    }
}

class Projectile {
    constructor(x, y, isSuper = false) {
        this.x = x;
        this.y = y;
        this.w = isSuper ? 10 : 4;
        this.h = 25;
        this.color = isSuper ? "#ff00ff" : "#00f3ff";
        this.isSuper = isSuper;
    }
    update() {
        this.y -= 15;
    }
    draw() {
        ctx.fillStyle = this.color;
        ctx.shadowBlur = this.isSuper ? 25 : 8;
        ctx.shadowColor = this.color;
        ctx.fillRect(this.x, this.y, this.w, this.h);
        ctx.shadowBlur = 0;
    }
}

class Enemy {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.w = 45;
        this.h = 45;
    }
    draw() {
        ctx.drawImage(enemyImg, this.x, this.y, this.w, this.h);
    }
    update() {
        this.y += 0.35 + level * 0.12;
    }
}

const player = new Player();
let enemies = [],
    projectiles = [];

// REBALANCED ENEMIES (More count, better density)
function spawnEnemies() {
    enemies = [];
    const centerX = canvas.width / 2;
    const rows = 3;
    const cols = 6; // Increased enemies
    const spacingX = 80;
    const spacingY = 70;
    const totalWidth = (cols - 1) * spacingX;

    switch (level % 3) {
        case 1: // Dense Block
            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    enemies.push(
                        new Enemy(
                            centerX - totalWidth / 2 + c * spacingX,
                            r * spacingY + 100
                        )
                    );
                }
            }
            break;
        case 2: // Double V-Shape
            for (let i = 0; i < cols; i++) {
                enemies.push(
                    new Enemy(
                        centerX - totalWidth / 2 + i * spacingX,
                        100 + Math.abs(2.5 - i) * 60
                    )
                );
                enemies.push(
                    new Enemy(
                        centerX - totalWidth / 2 + i * spacingX,
                        220 + Math.abs(2.5 - i) * 60
                    )
                );
            }
            break;
        default: // Wide Wing
            for (let r = 0; r < 2; r++) {
                for (let c = 0; c < cols + 2; c++) {
                    if (c < 3 || c > 4)
                        enemies.push(
                            new Enemy(
                                centerX - 350 + c * 90,
                                r * spacingY + 100
                            )
                        );
                }
            }
    }
    document.getElementById("level-text").innerText = `SECTOR ${
        level < 10 ? "0" + level : level
    }`;
}

function handleFire() {
    const now = Date.now();
    if (now - lastFireTime < fireRate) return;

    if (superMeter >= 100) {
        // SUPERPOWER: Triple Blast + Sound
        projectiles.push(new Projectile(player.x + 28, player.y, true));
        projectiles.push(new Projectile(player.x + 0, player.y + 20, true));
        projectiles.push(new Projectile(player.x + 56, player.y + 20, true));
        playSound(220, "square", 0.4, 0.2);
        superMeter = 0;
        document.getElementById("power-bar").style.width = "0%";
    } else {
        projectiles.push(new Projectile(player.x + 28, player.y));
        playSound(600, "sine", 0.1, 0.1);
    }
    lastFireTime = now;
}

function animate() {
    if (!gameActive) return;
    requestAnimationFrame(animate);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // SIMULTANEOUS INPUT HANDLING
    if (keys["ArrowLeft"] && player.x > 0) player.x -= player.speed;
    if (keys["ArrowRight"] && player.x < canvas.width - player.w)
        player.x += player.speed;
    if (keys[" "] || keys["Space"]) handleFire();

    player.draw();

    projectiles.forEach((p, pi) => {
        p.update();
        p.draw();
        if (p.y < 0) projectiles.splice(pi, 1);
    });

    enemies.forEach((en, ei) => {
        en.update();
        en.draw();

        projectiles.forEach((p, pi) => {
            if (
                p.x > en.x &&
                p.x < en.x + en.w &&
                p.y < en.y + en.h &&
                p.y > en.y
            ) {
                enemies.splice(ei, 1);
                if (!p.isSuper) projectiles.splice(pi, 1);
                score += 100;
                superMeter = Math.min(100, superMeter + 8);
                document.getElementById("score").innerText = score;
                document.getElementById("power-bar").style.width =
                    superMeter + "%";
                playSound(150, "square", 0.1, 0.05);
            }
        });

        if (en.y + en.h > player.y) handleDeath();
    });

    if (enemies.length === 0) {
        level++;
        playVictorySound();
        spawnEnemies();
    }
}

function handleDeath() {
    lives--;
    playSound(100, "sawtooth", 0.5, 0.2);
    document.getElementById("lives").innerText = "❤️".repeat(lives);
    if (lives <= 0) {
        gameActive = false;
        document.getElementById("game-over").classList.remove("hidden");
        document.getElementById("final-score").innerText = score;
    } else {
        spawnEnemies();
    }
}

// Event Listeners (KeyMap pattern fixes the firing bug)
window.addEventListener("keydown", (e) => {
    keys[e.key] = true;
    if (e.key === " ") e.preventDefault(); // Stop page from scrolling
});
window.addEventListener("keyup", (e) => {
    keys[e.key] = false;
});

document.getElementById("start-btn").addEventListener("click", () => {
    if (audioCtx.state === "suspended") audioCtx.resume();
    document.getElementById("start-screen").classList.add("hidden");
    gameActive = true;
    spawnEnemies();
    animate();
});
