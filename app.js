const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// --- ASSET CONFIGURATION (Change images/sounds here) ---
const IMAGES = {
    ship: "https://cdn-icons-png.flaticon.com/512/3063/3063738.png",
    enemy1: "https://cdn-icons-png.flaticon.com/512/5434/5434383.png", // Cyan
    enemy2: "https://cdn-icons-png.flaticon.com/512/10312/10312015.png", // Red
};

// --- AUDIO ENGINE ---
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
let isMuted = false;

function playSound(freq, type, duration, vol = 0.1) {
    if (isMuted) return;
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

// --- GAME STATE ---
let score = 0,
    lives = 3,
    level = 1,
    gameRunning = false;
let player = { x: 0, y: 0, w: 50, h: 50 };
let enemies = [],
    projectiles = [],
    enemyProjectiles = [];
let enemyDirection = 1,
    enemyStepTimer = 0;
const keys = {};

// --- INITIALIZATION ---
function init() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    player.x = canvas.width / 2 - 25;
    player.y = canvas.height - 100;
}
window.addEventListener("resize", init);
init();

function spawnEnemies() {
    enemies = [];
    const rows = 4,
        cols = 8;
    const spacing = 70;
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            enemies.push({
                x: c * spacing + 100,
                y: r * spacing + 100,
                w: 40,
                h: 40,
                color: r < 2 ? "#ff5555" : "#55ffff",
            });
        }
    }
}

// --- CORE LOGIC ---
function update() {
    if (!gameRunning) return;

    // 1. Spaceship Movement
    if ((keys["ArrowLeft"] || keys["KeyA"]) && player.x > 0) player.x -= 8;
    if (
        (keys["ArrowRight"] || keys["KeyD"]) &&
        player.x < canvas.width - player.w
    )
        player.x += 8;

    // 2. Enemy Movement (Step logic)
    enemyStepTimer++;
    if (enemyStepTimer > Math.max(10, 40 - level * 5)) {
        let touchedEdge = false;
        enemies.forEach((en) => {
            en.x += 15 * enemyDirection;
            if (en.x + en.w > canvas.width || en.x < 0) touchedEdge = true;
        });

        if (touchedEdge) {
            enemyDirection *= -1;
            enemies.forEach((en) => (en.y += 30));
            playSound(100, "square", 0.2, 0.05); // Step sound
        }
        enemyStepTimer = 0;
    }

    // 3. Projectiles
    projectiles.forEach((p, i) => {
        p.y -= 12;
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
                playSound(200, "square", 0.1); // Hit sound
                if (enemies.length === 0) {
                    level++;
                    spawnEnemies();
                    playSound(600, "sine", 0.5);
                }
            }
        });
    });

    // 4. Enemy Shooting
    if (Math.random() < 0.01 + level * 0.005) {
        const en = enemies[Math.floor(Math.random() * enemies.length)];
        if (en) enemyProjectiles.push({ x: en.x + en.w / 2, y: en.y + en.h });
    }

    enemyProjectiles.forEach((p, i) => {
        p.y += 5;
        if (p.y > canvas.height) enemyProjectiles.splice(i, 1);
        if (
            p.x > player.x &&
            p.x < player.x + player.w &&
            p.y > player.y &&
            p.y < player.y + player.h
        ) {
            enemyProjectiles.splice(i, 1);
            lives--;
            updateHUD();
            playSound(50, "sawtooth", 0.5); // Damage sound
            if (lives <= 0) endGame();
        }
    });
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Player
    ctx.fillStyle = "#fff";
    ctx.fillRect(player.x, player.y + 10, player.w, player.h - 10);
    ctx.fillRect(player.x + 20, player.y, 10, 10); // Tip

    // Enemies
    enemies.forEach((en) => {
        ctx.fillStyle = en.color;
        ctx.fillRect(en.x, en.y, en.w, en.h);
    });

    // Projectiles
    ctx.fillStyle = "#fff";
    projectiles.forEach((p) => ctx.fillRect(p.x, p.y, 4, 15));
    ctx.fillStyle = "#ff5555";
    enemyProjectiles.forEach((p) => ctx.fillRect(p.x, p.y, 4, 15));

    if (gameRunning)
        requestAnimationFrame(() => {
            update();
            draw();
        });
}

// --- UTILS & NAVIGATION ---
function showScreen(id) {
    document
        .querySelectorAll(".screen")
        .forEach((s) => s.classList.add("hidden"));
    document.getElementById(id).classList.remove("hidden");
}

function updateHUD() {
    document.getElementById("heart-container").innerText = "❤️".repeat(lives);
}

function endGame() {
    gameRunning = false;
    showScreen("game-over-screen");
    document.getElementById("score-final").innerText = score;
    const hi = localStorage.getItem("hiScore") || 0;
    if (score > hi) localStorage.setItem("hiScore", score);
    document
        .querySelectorAll(".hs-val")
        .forEach((el) => (el.innerText = localStorage.getItem("hiScore")));
}

// --- LISTENERS ---
window.addEventListener("keydown", (e) => {
    keys[e.code] = true;
    if (e.code === "Space" && gameRunning) {
        if (projectiles.length < 3) {
            projectiles.push({ x: player.x + 23, y: player.y });
            playSound(800, "sine", 0.1, 0.05); // Shoot sound
        }
    }
});
window.addEventListener("keyup", (e) => (keys[e.code] = false));

document.getElementById("play-btn").onclick = () => {
    if (audioCtx.state === "suspended") audioCtx.resume();
    showScreen("start-screen"); // Hide all
    document.getElementById("start-screen").classList.add("hidden");
    document.getElementById("game-hud").classList.remove("hidden");
    gameRunning = true;
    spawnEnemies();
    updateHUD();
    draw();
};

document.getElementById("tutorial-icon").onclick = () => {
    gameRunning = false;
    showScreen("tutorial-screen");
};

document.getElementById("home-icon").onclick = () => location.reload();

document.getElementById("sound-toggle").onclick = (e) => {
    isMuted = !isMuted;
    e.target.innerText = isMuted ? "🔇" : "🔊";
};
