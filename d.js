const board = document.getElementById("game-board");
const scoreDisplay = document.getElementById("score");
const timerDisplay = document.getElementById("timer");
const highScoreDisplay = document.getElementById("high-score");
const startBtn = document.getElementById("start-btn");
const diff = document.getElementById("difficulty");
const startScreen = document.getElementById("start-screen");
const gameContainer = document.getElementById("game-container");
const worldCircle = document.getElementById("world-circle");

const N = 20;
let snake, direction, nextDirection, apples, bullets;
let score, timer;
let gi, ti, bi, freezeTO;
let isImmortal, isRunning, extraApples, isFrozen;
let frozenTail = [];
let touchStartX, touchStartY;

function init() {
  snake = [{ x: 10, y: 10 }];
  direction = { x: 0, y: 0 };
  nextDirection = { x: 1, y: 0 };
  apples = [];
  bullets = [];
  extraApples = [];
  frozenTail = [];
  score = 0;
  timer = 0;
  isImmortal = false;
  isFrozen = false;
  isRunning = true;
}

function spawnAppleForced(type = "red") {
  let p;
  do {
    p = { x: Math.floor(Math.random() * N), y: Math.floor(Math.random() * N), type };
  } while (
    snake.some(s => s.x === p.x && s.y === p.y) ||
    apples.some(a => a.x === p.x && a.y === p.y) ||
    bullets.some(b => b.x === p.x && b.y === p.y)
  );
  apples.push(p);
  if (type === "red" && isImmortal) extraApples.push(p);
}

function spawnApple() {
  if (!isFrozen) {
    const r = Math.random();
    const type = r < 0.1 ? "rainbow" : r < 0.4 ? "blue" : "red";
    spawnAppleForced(type);
  }
}

function showTheWorldEffect() {
  worldCircle.style.display = "block";
  setTimeout(() => worldCircle.style.display = "none", 1200);
}

function freezeTime(ms, type) {
  if (isFrozen) return;
  isFrozen = true;
  isImmortal = true;
  showTheWorldEffect();

  if (diff.value === "superhard") clearInterval(bi);

  frozenTail = [...snake.slice(1)];
  const count = type === "rainbow" ? 6 : 3;
  for (let i = 0; i < count; i++) spawnAppleForced("red");

  clearInterval(gi);
  clearTimeout(freezeTO);
  freezeTO = setTimeout(() => {
    isImmortal = false;
    isFrozen = false;
    frozenTail = [];

    extraApples.forEach(a => {
      const i = apples.indexOf(a);
      if (i >= 0) apples.splice(i, 1);
    });
    extraApples = [];
    if (apples.length === 0) spawnApple();

    gi = setInterval(moveSnake, diff.value === "superhard" ? 90 : diff.value === "hard" ? 100 : 200);
    if (diff.value === "superhard") startBullets();
  }, ms);

  document.body.classList.add("frozen");
  setTimeout(() => document.body.classList.remove("frozen"), ms);
}

function spawnBonus(type) {
  if (type === "blue") {
    score++;
    freezeTime(7000, "blue");
  } else if (type === "rainbow") {
    score += 5;
    for (let i = 0; i < 3; i++) snake.push({ ...snake[snake.length - 1] });
    freezeTime(10000, "rainbow");
  } else {
    score++;
  }
  scoreDisplay.textContent = `Счёт: ${score}`;
}

function moveSnake() {
  direction = nextDirection;
  const head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };
  const hitWall = head.x < 0 || head.x >= N || head.y < 0 || head.y >= N;
  const hitSelf = snake.slice(1).some(s => s.x === head.x && s.y === head.y);
  if (!isImmortal && (hitWall || hitSelf)) return endGame();
  snake.unshift(head);

  const ai = apples.findIndex(a => a.x === head.x && a.y === head.y);
  if (ai >= 0) {
    const A = apples[ai];
    apples.splice(ai, 1);
    spawnBonus(A.type);
    spawnApple();
  } else if (!isFrozen && !isImmortal) {
    snake.pop();
  }

  moveBullets();
  if (!isImmortal && bullets.some(b => b.x === head.x && b.y === head.y)) return endGame();

  draw();
}

function moveBullets() {
  if (isFrozen) return;
  bullets.forEach(b => b.x++);
  bullets = bullets.filter(b => b.x >= 0 && b.x < N);
}

function draw() {
  document.querySelectorAll(".cell").forEach(c => c.className = "cell");
  snake.forEach(s => {
    const el = board.children[s.y * N + s.x];
    if (el) el.classList.add("snake");
  });
  if (isFrozen && frozenTail.length > 0) {
    frozenTail.forEach(s => {
      const el = board.children[s.y * N + s.x];
      if (el) el.classList.add("snake-frozen");
    });
  }
  apples.forEach(a => {
    const el = board.children[a.y * N + a.x];
    if (el) el.classList.add(
      a.type === "blue" ? "blue-apple" :
      a.type === "rainbow" ? "rainbow-apple" :
      "apple"
    );
  });
  bullets.forEach(b => {
    const el = board.children[b.y * N + b.x];
    if (el) el.classList.add("bullet");
  });
}

function startBullets() {
  clearInterval(bi);
  bullets = [];
  bi = setInterval(() => {
    if (!isFrozen) bullets.push({ x: 0, y: Math.floor(Math.random() * N) });
  }, 3000);
}

function handleTouchStart(e) {
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
}

function handleTouchMove(e) {
  if (!touchStartX || !touchStartY) return;
  const touchEndX = e.touches[0].clientX;
  const touchEndY = e.touches[0].clientY;
  const deltaX = touchEndX - touchStartX;
  const deltaY = touchEndY - touchStartY;

  if (Math.abs(deltaX) > Math.abs(deltaY)) {
    if (deltaX > 0 && direction.y === 0) nextDirection = { x: 1, y: 0 };
    else if (deltaX < 0 && direction.y === 0) nextDirection = { x: -1, y: 0 };
  } else {
    if (deltaY > 0 && direction.x === 0) nextDirection = { x: 0, y: 1 };
    else if (deltaY < 0 && direction.x === 0) nextDirection = { x: 0, y: -1 };
  }
  touchStartX = null;
  touchStartY = null;
}

function changeDir(e) {
  if (!isRunning) return;
  const d = direction;
  if (e.key === "ArrowUp" && d.y === 0) nextDirection = { x: 0, y: -1 };
  if (e.key === "ArrowDown" && d.y === 0) nextDirection = { x: 0, y: 1 };
  if (e.key === "ArrowLeft" && d.x === 0) nextDirection = { x: -1, y: 0 };
  if (e.key === "ArrowRight" && d.x === 0) nextDirection = { x: 1, y: 0 };
}

function startGame() {
  clearInterval(gi);
  clearInterval(ti);
  clearInterval(bi);
  clearTimeout(freezeTO);
  init();
  isRunning = true;
  scoreDisplay.textContent = "Счёт: 0";
  timerDisplay.textContent = "Время: 0 сек";
  highScoreDisplay.textContent = `Рекорд: ${localStorage.getItem("snakeHighScore") || 0}`;
  startScreen.classList.add("hidden");
  gameContainer.classList.remove("hidden");
  board.innerHTML = "";
  board.style.gridTemplateColumns = `repeat(${N}, 20px)`;
  for (let i = 0; i < N * N; i++) {
    const c = document.createElement("div");
    c.className = "cell";
    board.appendChild(c);
  }
  spawnApple();
  draw();
  gi = setInterval(moveSnake, diff.value === "superhard" ? 90 : diff.value === "hard" ? 100 : 200);
  ti = setInterval(() => {
    timer++;
    timerDisplay.textContent = `Время: ${timer} сек`;
  }, 1000);
  if (diff.value === "superhard") startBullets();
}

function endGame() {
  clearInterval(gi);
  clearInterval(ti);
  clearInterval(bi);
  clearTimeout(freezeTO);
  isRunning = false;
  if (score > +(localStorage.getItem("snakeHighScore") || 0))
    localStorage.setItem("snakeHighScore", score);
  alert(`💀 Игра окончена! Счёт: ${score}`);
  gameContainer.classList.add("hidden");
  startScreen.classList.remove("hidden");
}

document.getElementById('up').addEventListener('click', () => {
  if (!isRunning || direction.y === 0) nextDirection = { x: 0, y: -1 };
});
document.getElementById('down').addEventListener('click', () => {
  if (!isRunning || direction.y === 0) nextDirection = { x: 0, y: 1 };
});
document.getElementById('left').addEventListener('click', () => {
  if (!isRunning || direction.x === 0) nextDirection = { x: -1, y: 0 };
});
document.getElementById('right').addEventListener('click', () => {
  if (!isRunning || direction.x === 0) nextDirection = { x: 1, y: 0 };
});

document.addEventListener("keydown", changeDir);
gameContainer.addEventListener("touchstart", handleTouchStart, { passive: true });
gameContainer.addEventListener("touchmove", handleTouchMove, { passive: true });
startBtn.addEventListener("click", startGame);
window.onload = () => {
  highScoreDisplay.textContent = `Рекорд: ${localStorage.getItem("snakeHighScore") || 0}`;
};