// =====================
// TETRIS GAME SETUP
// =====================

// Get the canvas element and drawing context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game settings
const ROWS = 20;
const COLS = 10;
const BLOCK_SIZE = 30;
const COLORS = ['red', 'blue', 'lightgreen', 'yellow', 'cyan', 'magenta', 'pink'];

// Sounds
const rotateClockwiseSound = new Audio('sounds/rotateClockwise.wav')
const rotateAntiClockwiseSound = new Audio('sounds/rotateAntiClockwise.wav')
const lineClearSound = new Audio('sounds/lineClear.wav')
const tetrisSound = new Audio('sounds/tetris.wav')
const pauseSound = new Audio('sounds/pause.wav')

// Resize canvas to fit the grid
canvas.width = COLS * BLOCK_SIZE;
canvas.height = ROWS * BLOCK_SIZE;

// Track how many lines have been cleared (used to adjust speed)
let clears = 0;

// Keep track of game state
let isPaused = false;

// 2D board initialized with 0s (empty cells)
let board = Array.from({ length: ROWS }, () => Array(COLS).fill(0));

// Tetromino definitions (each is a 2D array)
const TETROMINOS = [
  [[1, 1, 1], [0, 1, 0]],        // T
  [[1, 1], [1, 1]],              // O
  [[1, 1, 0], [0, 1, 1]],        // S
  [[0, 1, 1], [1, 1, 0]],        // Z
  [[1, 0, 0], [1, 1, 1]],        // L
  [[0, 0, 1], [1, 1, 1]],        // J
  [[1, 1, 1, 1]]                 // I
];

// Current Tetromino state
let currentTetromino = { shape: null, x: 0, y: 0, color: null };

// Interval ID for downward movement
let moveDownInterval = null;

// ========== Tetromino Handling ========== //

// Generate a random Tetromino with its color
function getRandomTetromino() {
  const index = Math.floor(Math.random() * TETROMINOS.length);
  const shape = TETROMINOS[index];

  // Build a matching color matrix
  const colorMatrix = shape.map(row =>
    row.map(cell => (cell ? COLORS[index] : null))
  );

  return {
    shape,
    x: Math.floor(COLS / 2) - Math.floor(shape[0].length / 2),
    y: 0,
    color: colorMatrix
  };
}

// ========== Drawing ========== //

// Draw the game board and active tetromino
function drawBoard() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw the board cells
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      if (board[y][x] !== 0) {
        ctx.fillStyle = COLORS[board[y][x] - 1];
        ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
        drawCellOutline(x, y);
      }
    }
  }

  // Draw the current Tetromino
  if (currentTetromino.shape) {
    for (let y = 0; y < currentTetromino.shape.length; y++) {
      for (let x = 0; x < currentTetromino.shape[0].length; x++) {
        if (currentTetromino.shape[y][x] !== 0) {
          ctx.fillStyle = currentTetromino.color[y][x];
          const drawX = (currentTetromino.x + x) * BLOCK_SIZE;
          const drawY = (currentTetromino.y + y) * BLOCK_SIZE;
          ctx.fillRect(drawX, drawY, BLOCK_SIZE, BLOCK_SIZE);
          drawCellOutline(currentTetromino.x + x, currentTetromino.y + y);
        }
      }
    }
  }
}

function drawCellOutline(x, y) {
  ctx.strokeStyle = 'black';
  ctx.lineWidth = 2;
  ctx.strokeRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
}

function drawPauseOverlay() {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = 'white';
  ctx.font = '48px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Paused', canvas.width / 2, canvas.height / 2);
}


// ========== Movement ========== //

function moveTetrominoDown() {
  currentTetromino.y++;
  if (collisionDetected()) {
    currentTetromino.y--;
    placeTetromino();
    currentTetromino = getRandomTetromino();
    if (collisionDetected()) {
      alert('Game Over!');
      resetGame();
    }
  }
  drawBoard();
}

function moveTetrominoLeft() {
  currentTetromino.x--;
  if (collisionDetected()) currentTetromino.x++;
  drawBoard();
}

function moveTetrominoRight() {
  currentTetromino.x++;
  if (collisionDetected()) currentTetromino.x--;
  drawBoard();
}

function startMoveDown() {
  if (!moveDownInterval) {
    moveDownInterval = setInterval(moveTetrominoDown, 100);
  }
}

function stopMoveDown() {
  clearInterval(moveDownInterval);
  moveDownInterval = null;
}

// ========== Rotation ========== //

function rotateMatrixClockwise(matrix) {
  return matrix[0].map((_, i) => matrix.map(row => row[i]).reverse());
}

function rotateMatrixAntiClockwise(matrix) {
  return matrix[0].map((_, i) =>
    matrix.map(row => row[row.length - 1 - i])
  );
}

function rotateTetrominoClockwise() {
  const originalShape = currentTetromino.shape;
  const originalColor = currentTetromino.color;
  currentTetromino.shape = rotateMatrixClockwise(originalShape);
  currentTetromino.color = rotateMatrixClockwise(originalColor);

  if (rotateCollisionDetected()) {
    currentTetromino.shape = originalShape;
    currentTetromino.color = originalColor;
    return;
  }
  rotateClockwiseSound.play();
  drawBoard();
}

function rotateTetrominoAntiClockwise() {
  const originalShape = currentTetromino.shape;
  const originalColor = currentTetromino.color;
  currentTetromino.shape = rotateMatrixAntiClockwise(originalShape);
  currentTetromino.color = rotateMatrixAntiClockwise(originalColor);

  if (rotateCollisionDetected()) {
    currentTetromino.shape = originalShape;
    currentTetromino.color = originalColor;
    return;
  }
  rotateAntiClockwiseSound.play();
  drawBoard();
}

// ========== Collision Detection ========== //

function collisionDetected() {
  for (let y = 0; y < currentTetromino.shape.length; y++) {
    for (let x = 0; x < currentTetromino.shape[0].length; x++) {
      if (currentTetromino.shape[y][x]) {
        const boardX = currentTetromino.x + x;
        const boardY = currentTetromino.y + y;
        if (
          boardY >= ROWS ||
          boardX < 0 ||
          boardX >= COLS ||
          board[boardY][boardX] !== 0
        ) {
          return true;
        }
      }
    }
  }
  return false;
}

function rotateCollisionDetected() {
  for (let y = 0; y < currentTetromino.shape.length; y++) {
    for (let x = 0; x < currentTetromino.shape[0].length; x++) {
      if (currentTetromino.shape[y][x]) {
        const boardX = currentTetromino.x + x;
        const boardY = currentTetromino.y + y;
        if (
          boardX < 0 ||
          boardX >= COLS ||
          boardY >= ROWS ||
          board[boardY][boardX] !== 0
        ) {
          return true;
        }
      }
    }
  }
  return false;
}

// ========== Board Update ========== //

function placeTetromino() {
  for (let y = 0; y < currentTetromino.shape.length; y++) {
    for (let x = 0; x < currentTetromino.shape[0].length; x++) {
      if (currentTetromino.shape[y][x]) {
        board[currentTetromino.y + y][currentTetromino.x + x] =
          COLORS.indexOf(currentTetromino.color[y][x]) + 1;
      }
    }
  }
  clearLines();
}

function clearLines() {
  let clearTimes = 0;
  for (let y = ROWS - 1; y >= 0; ) {
    if (board[y].every(cell => cell !== 0)) {
      clearTimes ++;
      board.splice(y, 1); // Remove the filled row
      board.unshift(Array(COLS).fill(0)); // Add an empty row at the top
      clears -= 10; // Increase speed slightly
    } else {
      y--;
    }
  }
  if(clearTimes == 0){
    return;
  }else if (clearTimes == 4){
    tetrisSound.play();
  }else {
    lineClearSound.play();
  }
}

function togglePause() {
  isPaused = !isPaused;
  if (isPaused) {
    stopMoveDown(); // Stop fast drop if active
    pauseSound.play();
    drawPauseOverlay();
  } else {
    drawBoard(); // Redraw the board when resuming
  }
}


// ========== Game Loop ========== //

function update() {
  if (!isPaused) {
    moveTetrominoDown();
    drawBoard();
  }
}

function gameLoop() {
  update();
  setTimeout(gameLoop, 500 + clears);
}


function resetGame() {
  board = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
  currentTetromino = getRandomTetromino();
  drawBoard();
  gameLoop();
}

// ========== Event Handling ========== //

function handleKeyPress(event) {
  switch (event.key) {
    case 'a':
        if (!isPaused) moveTetrominoLeft(); 
        break;
    case 'd':
        if (!isPaused) moveTetrominoRight();
        break;
    case 's':
        if (!isPaused) startMoveDown();
        break;
    case 'q':
        if (!isPaused) rotateTetrominoAntiClockwise();
        break;
    case 'e':
        if (!isPaused) rotateTetrominoClockwise();
        break;
    case 'Escape':
        togglePause();
        break;
  }
}

function handleKeyRelease(event) {
  if (event.key === 's' && !isPaused) stopMoveDown();
}

// Start the game
document.addEventListener('keydown', handleKeyPress);
document.addEventListener('keyup', handleKeyRelease);
resetGame();
