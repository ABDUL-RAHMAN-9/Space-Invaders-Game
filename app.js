const starCanvas = document.getElementById("starCanvas");
const sCtx = starCanvas.getContext("2d");
const gameCanvas = document.getElementById("gameCanvas");
const ctx = gameCanvas.getContext("2d");

// --- CONFIGURATION ---
const COMBAT_WIDTH = 800;
let isMuted = false;
let gameRunning = false;

// Assets
const shipImg = new Image(); shipImg.src = "assets/spaceship2.png";
const inv1 = new Image(); inv1.src = "assets/invader1.png";
const inv2 = new Image(); inv2.src = "assets/invader2.png";
const inv3 = new Image(); inv3.src = "assets/invader3.png";

// --- AUDIO ENGINE ---
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playSound(freq, type, duration, vol, drop = false) {
    if (isMuted) return;
    try {
        const o = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        o.type = type;
        o.frequency.setValueAtTime(freq, audioCtx.currentTime);
        if (drop) o.frequency.exponentialRampToValueAtTime(10, audioCtx.currentTime + duration);
        o.connect(g); g.connect(audioCtx.destination);
        g.gain.setValueAtTime(vol, audioCtx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
        o.start(); o.stop(audioCtx.currentTime + duration);
    } catch(e) {}
}

// --- FULL SCREEN STARS ---
const stars = [];
function initStars() {
    starCanvas.width = window.innerWidth;
    starCanvas.height = window.innerHeight;
    for (let i = 0; i < 200; i++) {
        stars.push({ x: Math.random() * starCanvas.width, y: Math.random() * starCanvas.height, size: Math.random() * 2 + 1, speed: Math.random() * 1 + 0.5 });
    }
}
function drawStars() {
    sCtx.fillStyle = "#020205";
    sCtx.fillRect(0, 0, starCanvas.width, starCanvas.height);
    sCtx.fillStyle = "white";
    stars.forEach(s => {
        s.x += s.speed * 0.5; s.y += s.speed;
        if (s.y > starCanvas.height) { s.y = -5; s.x = Math.random() * starCanvas.width; }
        sCtx.fillRect(s.x, s.y, s.size, s.size);
    });
    requestAnimationFrame(drawStars);
}

// --- GAME LOGIC ---
let score = 0, lives = 3, level = 1;
let player = { x: COMBAT_WIDTH / 2 - 25, y: 0, w: 50, h: 50, isDragging: false };
let enemies = [], projectiles = [], enemyProjectiles = [];
let enemyDir = 1, enemyTimer = 0, lastFire = 0;
const keys = {};

function initGame() {
    gameCanvas.width = COMBAT_WIDTH;
    gameCanvas.height = window.innerHeight;
    player.y = gameCanvas.height - 100;
    spawnEnemies();
    document.getElementById("hs-val").innerText = localStorage.getItem("hiScore") || 0;
}

function spawnEnemies() {
    enemies = [];
    for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 9; c++) {
            enemies.push({ x: c * 70 + 80, y: r * 60 + 100, w: 40, h: 40, type: r === 0 ? inv3 : (r < 3 ? inv2 : inv1) });
        }
    }
}

function update() {
    if (!gameRunning) return;

    // KEYBOARD MOVEMENT
    if ((keys["ArrowLeft"] || keys["KeyA"]) && player.x > 0) player.x -= 8;
    if ((keys["ArrowRight"] || keys["KeyD"]) && player.x < COMBAT_WIDTH - player.w) player.x += 8;
    
    // FIRING (With Cooldown)
    if ((keys["Space"] || keys["ArrowUp"]) && Date.now() - lastFire > 250) {
        fireProjectile();
        lastFire = Date.now();
    }

    // ENEMY AI
    enemyTimer++;
    if (enemyTimer > Math.max(5, 40 - level * 5)) {
        let hitWall = false;
        enemies.forEach(en => {
            en.x += 15 * enemyDir;
            if (en.x + en.w > COMBAT_WIDTH || en.x < 0) hitWall = true;
        });
        if (hitWall) {
            enemyDir *= -1;
            enemies.forEach(en => en.y += 25);
            playSound(100, 'square', 0.1, 0.02);
        }
        enemyTimer = 0;
    }

    // COLLISION DETECTION
    projectiles.forEach((p, i) => {
        p.y -= 12;
        if (p.y < 0) projectiles.splice(i, 1);
        enemies.forEach((en, ei) => {
            if (p.x > en.x && p.x < en.x + en.w && p.y > en.y && p.y < en.y + en.h) {
                enemies.splice(ei, 1);
                projectiles.splice(i, 1);
                score += 100;
                document.getElementById("current-score").innerText = score;
                playSound(200, 'square', 0.1, 0.05);
                if (enemies.length === 0) { level++; spawnEnemies(); playSound(600, 'sine', 0.4, 0.1); }
            }
        });
    });

    if (Math.random() < 0.01 + level * 0.005) {
        const en = enemies[Math.floor(Math.random() * enemies.length)];
        if (en) enemyProjectiles.push({ x: en.x + 20, y: en.y + 40 });
    }

    enemyProjectiles.forEach((p, i) => {
        p.y += 6;
        if (p.y > gameCanvas.height) enemyProjectiles.splice(i, 1);
        if (p.x > player.x && p.x < player.x + player.w && p.y > player.y && p.y < player.y + player.h) {
            enemyProjectiles.splice(i, 1);
            lives--; updateHUD();
            playSound(60, 'sawtooth', 0.5, 0.2);
            if (lives <= 0) gameOver();
        }
    });
}

function draw() {
    ctx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);
    ctx.drawImage(shipImg, player.x, player.y, player.w, player.h);
    enemies.forEach(en => ctx.drawImage(en.type, en.x, en.y, en.w, en.h));
    
    ctx.fillStyle = "#00f3ff";
    projectiles.forEach(p => { ctx.shadowBlur = 10; ctx.shadowColor = "#00f3ff"; ctx.fillRect(p.x, p.y, 4, 15); });
    ctx.shadowBlur = 0;
    
    ctx.fillStyle = "#ff5555";
    enemyProjectiles.forEach(p => ctx.fillRect(p.x, p.y, 4, 15));

    if (gameRunning) requestAnimationFrame(() => { update(); draw(); });
}

function fireProjectile() {
    projectiles.push({ x: player.x + player.w / 2 - 2, y: player.y });
    playSound(800, 'sine', 0.1, 0.05, true);
}

function gameOver() {
    gameRunning = false;
    document.getElementById("game-over-screen").classList.remove("hidden");
    document.getElementById("final-score").innerText = score;
    const hi = localStorage.getItem("hiScore") || 0;
    if (score > hi) localStorage.setItem("hiScore", score);
}

function updateHUD() { document.getElementById("heart-container").innerText = "❤️".repeat(lives); }

// --- LISTENERS ---
window.addEventListener("keydown", e => { keys[e.code] = true; });
window.addEventListener("keyup", e => { keys[e.code] = false; });

// Mouse/Touch Drag Control
gameCanvas.addEventListener('mousedown', () => player.isDragging = true);
window.addEventListener('mouseup', () => player.isDragging = false);
window.addEventListener('mousemove', (e) => {
    if (player.isDragging && gameRunning) {
        const rect = gameCanvas.getBoundingClientRect();
        player.x = (e.clientX - rect.left) - player.w / 2;
    }
});

document.getElementById("play-btn").onclick = () => {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    document.getElementById("start-screen").classList.add("hidden");
    document.getElementById("game-hud").classList.remove("hidden");
    gameRunning = true;
    updateHUD();
    draw();
};

document.getElementById("sound-toggle").onclick = function() {
    isMuted = !isMuted;
    this.innerText = isMuted ? "🔇" : "🔊";
};

document.getElementById("tutorial-icon").onclick = () => {
    gameRunning = false;
    document.getElementById("tutorial-modal").classList.remove("hidden");
};

document.getElementById("close-tut").onclick = () => {
    document.getElementById("tutorial-modal").classList.add("hidden");
    if(!document.getElementById("game-hud").classList.contains("hidden")) gameRunning = true;
};

window.addEventListener("resize", () => { initStars(); initGame(); });

initStars();
drawStars();
initGame();