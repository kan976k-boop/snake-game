const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('high-score');
const startOverlay = document.getElementById('start-overlay');
const gameOverOverlay = document.getElementById('game-over-overlay');
const finalScoreElement = document.getElementById('final-score');
const restartBtn = document.getElementById('restart-btn');

const nameEntryOverlay = document.getElementById('name-entry-overlay');
const playerNameInput = document.getElementById('player-name-input');
const saveNameBtn = document.getElementById('save-name-btn');
const leaderboardOverlay = document.getElementById('leaderboard-overlay');
const leaderboardList = document.getElementById('leaderboard-list');
const openLeaderboardBtn = document.getElementById('open-leaderboard-btn');
const gameOverLeaderboardBtn = document.getElementById('game-over-leaderboard-btn');
const closeLeaderboardBtn = document.getElementById('close-leaderboard-btn');

// Game Constants
const GRID_SIZE = 20;
const TILE_COUNT = canvas.width / GRID_SIZE;
const GAME_SPEED = 85; // ms per frame

// Colors
const COLOR_BG = '#050505';
const COLOR_SNAKE = '#39ff14';
const COLOR_FOOD = '#ff00ff';

// Game Variables
let snake = [];
let foods = [];
let foodsEaten = 0;
let level = 1;
let dx = 0;
let dy = 0;
let nextDx = 0;
let nextDy = 0;
let score = 0;
let highScore = localStorage.getItem('neonSnakeHighScore') || 0;
let gameLoop;
let isPlaying = false;
let isGameOver = false;
let playerName = localStorage.getItem('neonSnakePlayerName') || '';
let leaderboardData = JSON.parse(localStorage.getItem('neonSnakeLeaderboard') || '[]');

// Health & Shop Variables
let coins = parseInt(localStorage.getItem('neonSnakeCoins') || '0');
let maxHealth = parseInt(localStorage.getItem('neonSnakeMaxHealth') || '100');
let wallDamage = parseInt(localStorage.getItem('neonSnakeWallDamage') || '50');
let currentHealth = maxHealth;
let healthCost = parseInt(localStorage.getItem('neonSnakeHealthCost') || '100');
let armorCost = parseInt(localStorage.getItem('neonSnakeArmorCost') || '150');
let scoreMultiplier = parseInt(localStorage.getItem('neonSnakeScoreMultiplier') || '10');
let appleHeal = parseInt(localStorage.getItem('neonSnakeAppleHeal') || '0');
let multiplierCost = parseInt(localStorage.getItem('neonSnakeMultiplierCost') || '200');
let healCost = parseInt(localStorage.getItem('neonSnakeHealCost') || '150');

const coinsElement = document.getElementById('coins');
const healthFillElement = document.getElementById('health-fill');
const shopCoinsElement = document.getElementById('shop-coins');
const currentMaxHealthElement = document.getElementById('current-max-health');
const currentWallDamageElement = document.getElementById('current-wall-damage');
const currentScoreMultiplierElement = document.getElementById('current-score-multiplier');
const currentAppleHealElement = document.getElementById('current-apple-heal');

const buyHealthBtn = document.getElementById('buy-health-btn');
const buyArmorBtn = document.getElementById('buy-armor-btn');
const buyMultiplierBtn = document.getElementById('buy-multiplier-btn');
const buyHealBtn = document.getElementById('buy-heal-btn');

const healthCostElement = document.getElementById('health-cost');
const armorCostElement = document.getElementById('armor-cost');
const multiplierCostElement = document.getElementById('multiplier-cost');
const healCostElement = document.getElementById('heal-cost');

const openShopBtn = document.getElementById('open-shop-btn');
const gameOverShopBtn = document.getElementById('game-over-shop-btn');
const closeShopBtn = document.getElementById('close-shop-btn');
const shopOverlay = document.getElementById('shop-overlay');

function updateUI() {
    if(coinsElement) coinsElement.textContent = coins;
    if(shopCoinsElement) shopCoinsElement.textContent = coins;
    if(currentMaxHealthElement) currentMaxHealthElement.textContent = maxHealth;
    if(currentWallDamageElement) currentWallDamageElement.textContent = wallDamage;
    if(currentScoreMultiplierElement) currentScoreMultiplierElement.textContent = scoreMultiplier;
    if(currentAppleHealElement) currentAppleHealElement.textContent = appleHeal;
    if(healthCostElement) healthCostElement.textContent = healthCost;
    if(armorCostElement) armorCostElement.textContent = armorCost;
    if(multiplierCostElement) multiplierCostElement.textContent = multiplierCost;
    if(healCostElement) healCostElement.textContent = healCost;
    
    // Update health bar
    if(healthFillElement) {
        const percent = Math.max(0, (currentHealth / maxHealth) * 100);
        healthFillElement.style.width = percent + '%';
        if (percent > 50) healthFillElement.style.backgroundColor = 'var(--neon-green)';
        else if (percent > 20) healthFillElement.style.backgroundColor = 'orange';
        else healthFillElement.style.backgroundColor = 'red';
    }
}
updateUI();

// Audio context
const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx;

function initAudio() {
    if (!audioCtx) {
        audioCtx = new AudioContext();
    } else if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

function playSound(type) {
    if (!audioCtx) return;
    
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    if (type === 'eat') {
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(800, audioCtx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.1);
        gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.1);
    } else if (type === 'gameOver') {
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(300, audioCtx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(50, audioCtx.currentTime + 0.5);
        gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.5);
    }
}

// Initialize
highScoreElement.textContent = highScore;
initGame();

function initGame() {
    snake = [
        { x: 10, y: 10 },
        { x: 10, y: 11 },
        { x: 10, y: 12 }
    ];
    dx = 0;
    dy = -1;
    nextDx = 0;
    nextDy = -1;
    score = 0;
    foodsEaten = 0;
    level = 1;
    currentHealth = maxHealth;
    const levelEl = document.getElementById('level');
    if (levelEl) levelEl.textContent = level;
    scoreElement.textContent = score;
    foods = [];
    placeFoods();
    updateUI();
    draw(); // Initial draw
}

function placeFoods() {
    let foodCount = 1;
    if (foodsEaten >= 10) {
        foodCount = 3;
        level = 3;
    } else if (foodsEaten >= 3) {
        foodCount = 2;
        level = 2;
    } else {
        level = 1;
    }
    const levelEl = document.getElementById('level');
    if (levelEl) levelEl.textContent = level;
    
    while (foods.length < foodCount) {
        let validPosition = false;
        let newFood = {};
        while (!validPosition) {
            newFood = {
                x: Math.floor(Math.random() * TILE_COUNT),
                y: Math.floor(Math.random() * TILE_COUNT)
            };
            // Ensure food doesn't spawn on snake
            const onSnake = snake.some(segment => segment.x === newFood.x && segment.y === newFood.y);
            // Ensure food doesn't spawn on other foods
            const onFood = foods.some(f => f.x === newFood.x && f.y === newFood.y);
            validPosition = !onSnake && !onFood;
        }
        foods.push(newFood);
    }
}

function startGame() {
    if (isPlaying) return;
    
    initAudio();
    
    initGame();
    isPlaying = true;
    isGameOver = false;
    startOverlay.classList.remove('active');
    gameOverOverlay.classList.remove('active');
    
    if (gameLoop) clearInterval(gameLoop);
    gameLoop = setInterval(update, GAME_SPEED);
}

function gameOver() {
    isPlaying = false;
    isGameOver = true;
    clearInterval(gameLoop);
    
    playSound('gameOver');
    
    coins += score;
    localStorage.setItem('neonSnakeCoins', coins);
    updateUI();
    
    // Leaderboard
    if (score > 0) {
        const nameToSave = playerName || 'Anonim';
        const existingEntryIndex = leaderboardData.findIndex(entry => entry.name === nameToSave);
        
        if (existingEntryIndex !== -1) {
            // Sadece yeni skor daha yüksekse güncelle
            if (score > leaderboardData[existingEntryIndex].score) {
                leaderboardData[existingEntryIndex].score = score;
            }
        } else {
            leaderboardData.push({ name: nameToSave, score: score });
        }
        
        leaderboardData.sort((a, b) => b.score - a.score);
        leaderboardData = leaderboardData.slice(0, 10);
        localStorage.setItem('neonSnakeLeaderboard', JSON.stringify(leaderboardData));
    }

    if (score > highScore) {
        highScore = score;
        localStorage.setItem('neonSnakeHighScore', highScore);
        highScoreElement.textContent = highScore;
    }
    
    finalScoreElement.textContent = score;
    gameOverOverlay.classList.add('active');
}

function update() {
    if (!isPlaying) return;

    dx = nextDx;
    dy = nextDy;

    const head = { x: snake[0].x + dx, y: snake[0].y + dy };

    // Wall collision
    if (head.x < 0 || head.x >= TILE_COUNT || head.y < 0 || head.y >= TILE_COUNT) {
        currentHealth -= wallDamage;
        updateUI();
        playSound('gameOver');
        
        if (currentHealth <= 0) {
            gameOver();
            return;
        } else {
            if (head.x < 0) head.x = TILE_COUNT - 1;
            else if (head.x >= TILE_COUNT) head.x = 0;
            if (head.y < 0) head.y = TILE_COUNT - 1;
            else if (head.y >= TILE_COUNT) head.y = 0;
        }
    }

    // Self collision
    const hitIndex = snake.findIndex(segment => segment.x === head.x && segment.y === head.y);
    if (hitIndex !== -1) {
        currentHealth -= wallDamage;
        updateUI();
        playSound('gameOver');
        
        if (currentHealth <= 0) {
            gameOver();
            return;
        } else {
            // Kuyruğu koptuğu yerden kes
            snake.splice(hitIndex);
        }
    }

    snake.unshift(head);

    // Food collision
    let ateFoodIndex = -1;
    for (let i = 0; i < foods.length; i++) {
        if (head.x === foods[i].x && head.y === foods[i].y) {
            ateFoodIndex = i;
            break;
        }
    }

    if (ateFoodIndex !== -1) {
        playSound('eat');
        score += scoreMultiplier;
        currentHealth = Math.min(maxHealth, currentHealth + appleHeal);
        foodsEaten++;
        scoreElement.textContent = score;
        foods.splice(ateFoodIndex, 1);
        placeFoods();
        updateUI();
    } else {
        snake.pop();
    }

    draw();
}

function draw() {
    // Clear canvas
    ctx.fillStyle = COLOR_BG;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    for (let i = 0; i < TILE_COUNT; i++) {
        ctx.beginPath();
        ctx.moveTo(i * GRID_SIZE, 0);
        ctx.lineTo(i * GRID_SIZE, canvas.height);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(0, i * GRID_SIZE);
        ctx.lineTo(canvas.width, i * GRID_SIZE);
        ctx.stroke();
    }

    // Draw foods with glow
    ctx.shadowBlur = 15;
    ctx.shadowColor = COLOR_FOOD;
    ctx.fillStyle = COLOR_FOOD;
    foods.forEach(f => {
        ctx.fillRect(f.x * GRID_SIZE + 2, f.y * GRID_SIZE + 2, GRID_SIZE - 4, GRID_SIZE - 4);
    });

    // Draw snake with glow
    ctx.shadowBlur = 10;
    ctx.shadowColor = COLOR_SNAKE;
    
    snake.forEach((segment, index) => {
        // Head is brighter
        if (index === 0) {
            ctx.fillStyle = '#fff';
            ctx.shadowBlur = 20;
        } else {
            ctx.fillStyle = COLOR_SNAKE;
            ctx.shadowBlur = 10;
        }
        
        ctx.fillRect(segment.x * GRID_SIZE + 1, segment.y * GRID_SIZE + 1, GRID_SIZE - 2, GRID_SIZE - 2);
    });

    // Reset shadow
    ctx.shadowBlur = 0;
}

// Input handling
window.addEventListener('keydown', e => {
    // Prevent default scrolling for arrow keys and space
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
    }

    if (e.key === ' ' && !isPlaying) {
        startGame();
        return;
    }

    if (!isPlaying) return;

    switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
            if (dy !== 1) { nextDx = 0; nextDy = -1; }
            break;
        case 'ArrowDown':
        case 's':
        case 'S':
            if (dy !== -1) { nextDx = 0; nextDy = 1; }
            break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
            if (dx !== 1) { nextDx = -1; nextDy = 0; }
            break;
        case 'ArrowRight':
        case 'd':
        case 'D':
            if (dx !== -1) { nextDx = 1; nextDy = 0; }
            break;
    }
});

startOverlay.addEventListener('click', (e) => {
    if (e.target.tagName !== 'BUTTON') startGame();
});
restartBtn.addEventListener('click', startGame);

// Touch Controls
let touchStartX = 0;
let touchStartY = 0;

canvas.addEventListener('touchstart', e => {
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
    if (isPlaying) e.preventDefault();
}, {passive: false});

canvas.addEventListener('touchend', e => {
    if (isPlaying) e.preventDefault();
    if (!isPlaying) return;
    
    const touchEndX = e.changedTouches[0].screenX;
    const touchEndY = e.changedTouches[0].screenY;
    
    const diffX = touchEndX - touchStartX;
    const diffY = touchEndY - touchStartY;
    
    // Require a minimum swipe distance to avoid accidental changes on tap
    if (Math.abs(diffX) < 30 && Math.abs(diffY) < 30) return;

    if (Math.abs(diffX) > Math.abs(diffY)) {
        // Horizontal swipe
        if (diffX > 0 && dx !== -1) {
            nextDx = 1; nextDy = 0; // Right
        } else if (diffX < 0 && dx !== 1) {
            nextDx = -1; nextDy = 0; // Left
        }
    } else {
        // Vertical swipe
        if (diffY > 0 && dy !== -1) {
            nextDx = 0; nextDy = 1; // Down
        } else if (diffY < 0 && dy !== 1) {
            nextDx = 0; nextDy = -1; // Up
        }
    }
}, {passive: true});

// Shop Logic
if (openShopBtn) openShopBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    shopOverlay.classList.add('active');
    updateUI();
});
if (gameOverShopBtn) gameOverShopBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    shopOverlay.classList.add('active');
    updateUI();
});
if (closeShopBtn) closeShopBtn.addEventListener('click', () => {
    shopOverlay.classList.remove('active');
});

// Leaderboard Logic
function updateLeaderboardUI() {
    if (!leaderboardList) return;
    leaderboardList.innerHTML = '';
    leaderboardData.forEach((entry) => {
        const li = document.createElement('li');
        li.innerHTML = `<span class="name">${entry.name}</span><span class="score">${entry.score}</span>`;
        leaderboardList.appendChild(li);
    });
}

if (openLeaderboardBtn) openLeaderboardBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    updateLeaderboardUI();
    leaderboardOverlay.classList.add('active');
});
if (gameOverLeaderboardBtn) gameOverLeaderboardBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    updateLeaderboardUI();
    leaderboardOverlay.classList.add('active');
});
if (closeLeaderboardBtn) closeLeaderboardBtn.addEventListener('click', () => {
    leaderboardOverlay.classList.remove('active');
});

// Name Entry Logic
if (playerName) {
    if (nameEntryOverlay) nameEntryOverlay.classList.remove('active');
    if (startOverlay) startOverlay.classList.add('active');
}
if (saveNameBtn) saveNameBtn.addEventListener('click', () => {
    const name = playerNameInput.value.trim();
    if (name) {
        playerName = name;
        localStorage.setItem('neonSnakePlayerName', playerName);
        nameEntryOverlay.classList.remove('active');
        startOverlay.classList.add('active');
    }
});

if (buyHealthBtn) buyHealthBtn.addEventListener('click', () => {
    if (coins >= healthCost) {
        coins -= healthCost;
        maxHealth += 50;
        healthCost = Math.floor(healthCost * 1.5);
        localStorage.setItem('neonSnakeCoins', coins);
        localStorage.setItem('neonSnakeMaxHealth', maxHealth);
        localStorage.setItem('neonSnakeHealthCost', healthCost);
        updateUI();
        playSound('eat');
    }
});

if (buyArmorBtn) buyArmorBtn.addEventListener('click', () => {
    if (coins >= armorCost && wallDamage > 10) {
        coins -= armorCost;
        wallDamage = Math.max(10, wallDamage - 10);
        armorCost = Math.floor(armorCost * 1.5);
        localStorage.setItem('neonSnakeCoins', coins);
        localStorage.setItem('neonSnakeWallDamage', wallDamage);
        localStorage.setItem('neonSnakeArmorCost', armorCost);
        updateUI();
        playSound('eat');
    }
});

if (buyMultiplierBtn) buyMultiplierBtn.addEventListener('click', () => {
    if (coins >= multiplierCost) {
        coins -= multiplierCost;
        scoreMultiplier += 5;
        multiplierCost = Math.floor(multiplierCost * 2);
        localStorage.setItem('neonSnakeCoins', coins);
        localStorage.setItem('neonSnakeScoreMultiplier', scoreMultiplier);
        localStorage.setItem('neonSnakeMultiplierCost', multiplierCost);
        updateUI();
        playSound('eat');
    }
});

if (buyHealBtn) buyHealBtn.addEventListener('click', () => {
    if (coins >= healCost) {
        coins -= healCost;
        appleHeal += 5;
        healCost = Math.floor(healCost * 1.5);
        localStorage.setItem('neonSnakeCoins', coins);
        localStorage.setItem('neonSnakeAppleHeal', appleHeal);
        localStorage.setItem('neonSnakeHealCost', healCost);
        updateUI();
        playSound('eat');
    }
});

// Mobile D-Pad Controls
const btnUp = document.getElementById('btn-up');
const btnDown = document.getElementById('btn-down');
const btnLeft = document.getElementById('btn-left');
const btnRight = document.getElementById('btn-right');

const handleDpad = (direction) => {
    if (!isPlaying) {
        startGame();
        return;
    }
    if (direction === 'up' && dy !== 1) { nextDx = 0; nextDy = -1; }
    else if (direction === 'down' && dy !== -1) { nextDx = 0; nextDy = 1; }
    else if (direction === 'left' && dx !== 1) { nextDx = -1; nextDy = 0; }
    else if (direction === 'right' && dx !== -1) { nextDx = 1; nextDy = 0; }
};

if (btnUp) {
    btnUp.addEventListener('touchstart', (e) => { e.preventDefault(); handleDpad('up'); }, {passive: false});
    btnUp.addEventListener('mousedown', (e) => { e.preventDefault(); handleDpad('up'); });
}
if (btnDown) {
    btnDown.addEventListener('touchstart', (e) => { e.preventDefault(); handleDpad('down'); }, {passive: false});
    btnDown.addEventListener('mousedown', (e) => { e.preventDefault(); handleDpad('down'); });
}
if (btnLeft) {
    btnLeft.addEventListener('touchstart', (e) => { e.preventDefault(); handleDpad('left'); }, {passive: false});
    btnLeft.addEventListener('mousedown', (e) => { e.preventDefault(); handleDpad('left'); });
}
if (btnRight) {
    btnRight.addEventListener('touchstart', (e) => { e.preventDefault(); handleDpad('right'); }, {passive: false});
    btnRight.addEventListener('mousedown', (e) => { e.preventDefault(); handleDpad('right'); });
}
