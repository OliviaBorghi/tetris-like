// Tetris Game Setup

// Get the canvas and context for drawing
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game settings
const ROWS = 20;
const COLS = 10;
const BLOCK_SIZE = 30; // Size of each block (in pixels)
const COLORS = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ffffff'];

// The game board, 2D array initialized with 0 (empty cells)
let board = Array.from({ length: ROWS }, () => Array(COLS).fill(0));

// Tetromino shapes and their rotations
const TETROMINOS = [
    [[1, 1, 1], [0, 1, 0]], // T shape
    [[1, 1], [1, 1]], // O shape
    [[1, 1, 0], [0, 1, 1]], // S shape
    [[0, 1, 1], [1, 1, 0]], // Z shape
    [[1, 0, 0], [1, 1, 1]], // L shape
    [[0, 0, 1], [1, 1, 1]], // J shape
    [[1, 1, 1, 1]], // I shape
];

// Active Tetromino
let currentTetromino = { shape: null, x: 0, y: 0, color: null };

// Generate a random Tetromino
function getRandomTetromino() {
    const index = Math.floor(Math.random() * TETROMINOS.length);
    const shape = TETROMINOS[index];
    const color = COLORS[index];
    return { shape, x: Math.floor(COLS / 2) - Math.floor(shape[0].length / 2), y: 0, color };
}

// Draw the game board and current Tetromino
function drawBoard() {
    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw each cell of the board
    for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
            if (board[y][x] !== 0) {
                ctx.fillStyle = COLORS[board[y][x] - 1];
                ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
            }
        }
    }

    // Draw the current Tetromino
    if (currentTetromino.shape) {
        ctx.fillStyle = currentTetromino.color;
        for (let y = 0; y < currentTetromino.shape.length; y++) {
            for (let x = 0; x < currentTetromino.shape[y].length; x++) {
                if (currentTetromino.shape[y][x] !== 0) {
                    ctx.fillRect((currentTetromino.x + x) * BLOCK_SIZE, (currentTetromino.y + y) * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
                }
            }
        }
    }
}

// Move the Tetromino down
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
}

// Check for collision
function collisionDetected() {
    for (let y = 0; y < currentTetromino.shape.length; y++) {
        for (let x = 0; x < currentTetromino.shape[y].length; x++) {
            if (currentTetromino.shape[y][x] !== 0) {
                const boardX = currentTetromino.x + x;
                const boardY = currentTetromino.y + y;
                if (boardY >= ROWS || boardX < 0 || boardX >= COLS || board[boardY][boardX] !== 0) {
                    return true;
                }
            }
        }
    }
    return false;
}

// Place the Tetromino on the board
function placeTetromino() {
    for (let y = 0; y < currentTetromino.shape.length; y++) {
        for (let x = 0; x < currentTetromino.shape[y].length; x++) {
            if (currentTetromino.shape[y][x] !== 0) {
                board[currentTetromino.y + y][currentTetromino.x + x] = COLORS.indexOf(currentTetromino.color) + 1;
            }
        }
    }
    clearLines();
}

// Clear full lines
function clearLines() {
    for (let y = ROWS - 1; y >= 0; y--) {
        if (board[y].every(cell => cell !== 0)) {
            board.splice(y, 1);
            board.unshift(Array(COLS).fill(0));
        }
    }
}

// Update the game state
function update() {
    moveTetrominoDown();
    drawBoard();
}

// Game loop
function gameLoop() {
    update();
    setTimeout(gameLoop, 500); // Adjust the speed here (500ms)
}

// Reset the game
function resetGame() {
    board = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
    currentTetromino = getRandomTetromino();
    gameLoop();
}

// Start the game
resetGame();
