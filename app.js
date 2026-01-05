const starCanvas = document.getElementById("starCanvas");
const sCtx = starCanvas.getContext("2d");
const gameCanvas = document.getElementById("gameCanvas");
const ctx = gameCanvas.getContext("2d");

// --- CONFIGURATION ---
let COMBAT_WIDTH = Math.min(800, window.innerWidth);
let isMuted = false;
let gameRunning = false;
let animationId;

// Assets
const shipImg = new Image();
shipImg.src = "assets/spaceship2.png";
const inv1 = new Image();
inv1.src = "assets/invader1.png";
const inv2 = new Image();
inv2.src = "assets/invader2.png";
const inv3 = new Image();
inv3.src = "assets/invader3.png";

// --- PERSISTENCE (HIGH SCORE) ---
function saveHighScore(currentScore) {
    const savedHi = localStorage.getItem("spaceInvaders_hiScore") || 0;
    if (currentScore > parseInt(savedHi)) {
        localStorage.setItem("spaceInvaders_hiScore", currentScore);
        return true; // New record
    }
    return false;
}

function loadHighScore() {
    const savedHi = localStorage.getItem("spaceInvaders_hiScore") || 0;
    document.getElementById("hs-val").innerText = savedHi;
}

// --- AUDIO ---
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playSound(freq, type, duration, vol, drop = false) {
    if (isMuted) return;
    try {
        const o = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        o.type = type;
        o.frequency.setValueAtTime(freq, audioCtx.currentTime);
        if (drop)
            o.frequency.exponentialRampToValueAtTime(
                10,
                audioCtx.currentTime + duration
            );
        o.connect(g);
        g.connect(audioCtx.destination);
        g.gain.setValueAtTime(vol, audioCtx.currentTime);
        g.gain.exponentialRampToValueAtTime(
            0.0001,
            audioCtx.currentTime + duration
        );
        o.start();
        o.stop(audioCtx.currentTime + duration);
    } catch (e) {}
}

// --- BACKGROUND STARS ---
const stars = [];
function initStars() {
    starCanvas.width = window.innerWidth;
    starCanvas.height = window.innerHeight;
    stars.length = 0;
    for (let i = 0; i < 150; i++) {
        stars.push({
            x: Math.random() * starCanvas.width,
            y: Math.random() * starCanvas.height,
            size: Math.random() * 2,
            speed: Math.random() * 1 + 0.2,
        });
    }
}
function drawStars() {
    sCtx.fillStyle = "#020205";
    sCtx.fillRect(0, 0, starCanvas.width, starCanvas.height);
    sCtx.fillStyle = "white";
    stars.forEach((s) => {
        s.y += s.speed;
        if (s.y > starCanvas.height) s.y = -5;
        sCtx.fillRect(s.x, s.y, s.size, s.size);
    });
    requestAnimationFrame(drawStars);
}

// --- GAME ENGINE ---
let score = 0,
    lives = 3,
    level = 1;
let player = { x: 0, y: 0, w: 50, h: 50, isDragging: false };
let enemies = [],
    projectiles = [],
    enemyProjectiles = [];
let enemyDir = 1,
    enemyTimer = 0,
    lastFire = 0;
const keys = {};

function initGame() {
    COMBAT_WIDTH = Math.min(800, window.innerWidth);
    gameCanvas.width = COMBAT_WIDTH;
    gameCanvas.height = window.innerHeight;

    // Reset Stats
    score = 0;
    lives = 3;
    level = 1;
    enemyProjectiles = [];
    projectiles = [];
    document.getElementById("current-score").innerText = "0";

    player.x = COMBAT_WIDTH / 2 - 25;
    player.y = gameCanvas.height - 100;

    spawnEnemies();
    loadHighScore();
}

function spawnEnemies() {
    enemies = [];
    const colWidth = 60;
    const maxCols = Math.floor((COMBAT_WIDTH * 0.8) / colWidth); // Use 80% of screen width
    const gridWidth = maxCols * colWidth;
    const startX = (COMBAT_WIDTH - gridWidth) / 2;

    for (let r = 0; r < 5; r++) {
        for (let c = 0; c < maxCols; c++) {
            enemies.push({
                x: startX + c * colWidth,
                y: r * 50 + 80,
                w: 35,
                h: 35,
                type: r === 0 ? inv3 : r < 3 ? inv2 : inv1,
            });
        }
    }
}

function update() {
    if (!gameRunning) return;

    // Movement
    if ((keys["ArrowLeft"] || keys["KeyA"]) && player.x > 0) player.x -= 7;
    if (
        (keys["ArrowRight"] || keys["KeyD"]) &&
        player.x < COMBAT_WIDTH - player.w
    )
        player.x += 7;

    // Fire
    if (keys["Space"] && Date.now() - lastFire > 300) {
        fireProjectile();
        lastFire = Date.now();
    }

    // Enemy AI with screen-bounds check
    enemyTimer++;
    if (enemyTimer > Math.max(2, 35 - level * 3)) {
        let hitWall = false;
        enemies.forEach((en) => {
            en.x += (10 + level) * enemyDir;
            if (en.x + en.w > COMBAT_WIDTH - 15 || en.x < 15) hitWall = true;
        });
        if (hitWall) {
            enemyDir *= -1;
            enemies.forEach((en) => (en.y += 20));
        }
        enemyTimer = 0;
    }

    // Player Projectiles
    projectiles.forEach((p, i) => {
        p.y -= 10;
        if (p.y < 0) projectiles.splice(i, 1);
        enemies.forEach((en, ei) => {
            if (
                p.x > en.x &&
                p.x < en.x + en.w &&
                p.y > en.y &&
                p.y < en.y + en.h
            ) {
                enemies.splice(ei, 1);
                projectiles.splice(i, 1);
                score += 100;
                document.getElementById("current-score").innerText = score;
                playSound(200, "square", 0.1, 0.05);
                if (enemies.length === 0) {
                    level++;
                    spawnEnemies();
                    playSound(500, "sine", 0.3, 0.1);
                }
            }
        });
    });

    // Enemy Projectiles
    if (Math.random() < 0.01 + level * 0.005 && enemies.length > 0) {
        const en = enemies[Math.floor(Math.random() * enemies.length)];
        enemyProjectiles.push({ x: en.x + en.w / 2, y: en.y + en.h });
    }

    enemyProjectiles.forEach((p, i) => {
        p.y += 5;
        if (p.y > gameCanvas.height) enemyProjectiles.splice(i, 1);
        if (
            p.x > player.x &&
            p.x < player.x + player.w &&
            p.y > player.y &&
            p.y < player.y + player.h
        ) {
            enemyProjectiles.splice(i, 1);
            lives--;
            updateHUD();
            playSound(60, "sawtooth", 0.5, 0.2);
            if (lives <= 0) gameOver();
        }
    });
}

function draw() {
    ctx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);
    ctx.drawImage(shipImg, player.x, player.y, player.w, player.h);
    enemies.forEach((en) => ctx.drawImage(en.type, en.x, en.y, en.w, en.h));

    ctx.fillStyle = "#00f3ff";
    projectiles.forEach((p) => ctx.fillRect(p.x, p.y, 4, 15));

    ctx.fillStyle = "#ff5555";
    enemyProjectiles.forEach((p) => ctx.fillRect(p.x, p.y, 4, 15));

    if (gameRunning) {
        update();
        animationId = requestAnimationFrame(draw);
    }
}

function fireProjectile() {
    projectiles.push({ x: player.x + player.w / 2 - 2, y: player.y });
    playSound(800, "sine", 0.1, 0.05, true);
}

function gameOver() {
    gameRunning = false;
    cancelAnimationFrame(animationId);
    saveHighScore(score);
    loadHighScore();
    document.getElementById("game-over-screen").classList.remove("hidden");
    document.getElementById("final-score").innerText = score;
}

function updateHUD() {
    document.getElementById("heart-container").innerText = "❤️".repeat(lives);
}

// --- NAVIGATION ---
function backToHome() {
    gameRunning = false;
    cancelAnimationFrame(animationId);
    saveHighScore(score); // Save progress if they quit early
    loadHighScore();

    document.getElementById("start-screen").classList.remove("hidden");
    document.getElementById("game-hud").classList.add("hidden");
    document.getElementById("top-left-ui").classList.add("hidden");
    document.getElementById("game-over-screen").classList.add("hidden");
    ctx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);
}

document.getElementById("back-to-home").onclick = backToHome;

document.getElementById("play-btn").onclick = () => {
    if (audioCtx.state === "suspended") audioCtx.resume();
    document.getElementById("start-screen").classList.add("hidden");
    document.getElementById("game-hud").classList.remove("hidden");
    document.getElementById("top-left-ui").classList.remove("hidden");
    initGame();
    gameRunning = true;
    updateHUD();
    draw();
};

document.getElementById("tutorial-icon").onclick = () => {
    gameRunning = false;
    document.getElementById("tutorial-modal").classList.remove("hidden");
};

document.getElementById("close-tut").onclick = () => {
    document.getElementById("tutorial-modal").classList.add("hidden");
    // Only resume the loop if the game was actually active
    if (
        !document.getElementById("game-hud").classList.contains("hidden") &&
        document.getElementById("game-over-screen").classList.contains("hidden")
    ) {
        gameRunning = true;
        draw();
    }
};

document.getElementById("sound-toggle").onclick = function () {
    isMuted = !isMuted;
    this.innerText = isMuted ? "🔇" : "🔊";
};

// Input Listeners
window.addEventListener("keydown", (e) => (keys[e.code] = true));
window.addEventListener("keyup", (e) => (keys[e.code] = false));

// Improved Touch/Mouse Controls
const handleMove = (clientX) => {
    if (player.isDragging && gameRunning) {
        const rect = gameCanvas.getBoundingClientRect();
        const relativeX = clientX - rect.left;
        player.x = Math.max(
            0,
            Math.min(COMBAT_WIDTH - player.w, relativeX - player.w / 2)
        );
    }
};

gameCanvas.addEventListener("mousedown", (e) => {
    player.isDragging = true;
    if (gameRunning && Date.now() - lastFire > 300) fireProjectile();
});
window.addEventListener("mouseup", () => (player.isDragging = false));
window.addEventListener("mousemove", (e) => handleMove(e.clientX));

gameCanvas.addEventListener("touchstart", (e) => {
    player.isDragging = true;
    if (gameRunning && Date.now() - lastFire > 300) fireProjectile();
});
window.addEventListener("touchend", () => (player.isDragging = false));
window.addEventListener("touchmove", (e) => handleMove(e.touches[0].clientX));

// Initialization
window.addEventListener("resize", () => {
    initStars();
    if (gameRunning) initGame();
});

initStars();
drawStars();
loadHighScore(); // Load record immediately on page load
