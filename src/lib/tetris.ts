export const BOARD_WIDTH = 10;
export const BOARD_HEIGHT = 20;
export const CELL_SIZE = 30;

export type TetrominoType = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L';

export type Cell = {
  filled: boolean;
  color: string;
};

export type Position = {
  x: number;
  y: number;
};

export type Tetromino = {
  type: TetrominoType;
  shape: number[][];
  color: string;
  position: Position;
};

export const TETROMINOES: Record<TetrominoType, { shape: number[][]; color: string }> = {
  I: {
    shape: [
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    color: 'oklch(0.75 0.15 195)',
  },
  O: {
    shape: [
      [1, 1],
      [1, 1],
    ],
    color: 'oklch(0.85 0.18 90)',
  },
  T: {
    shape: [
      [0, 1, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
    color: 'oklch(0.65 0.20 300)',
  },
  S: {
    shape: [
      [0, 1, 1],
      [1, 1, 0],
      [0, 0, 0],
    ],
    color: 'oklch(0.70 0.18 140)',
  },
  Z: {
    shape: [
      [1, 1, 0],
      [0, 1, 1],
      [0, 0, 0],
    ],
    color: 'oklch(0.65 0.20 25)',
  },
  J: {
    shape: [
      [1, 0, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
    color: 'oklch(0.60 0.20 250)',
  },
  L: {
    shape: [
      [0, 0, 1],
      [1, 1, 1],
      [0, 0, 0],
    ],
    color: 'oklch(0.70 0.20 50)',
  },
};

export function createEmptyBoard(): Cell[][] {
  return Array.from({ length: BOARD_HEIGHT }, () =>
    Array.from({ length: BOARD_WIDTH }, () => ({ filled: false, color: '' }))
  );
}

export function getRandomTetromino(): Tetromino {
  const types: TetrominoType[] = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
  const type = types[Math.floor(Math.random() * types.length)];
  const { shape, color } = TETROMINOES[type];

  return {
    type,
    shape: shape.map(row => [...row]),
    color,
    position: { x: Math.floor(BOARD_WIDTH / 2) - Math.floor(shape[0].length / 2), y: 0 },
  };
}

export function rotateTetromino(tetromino: Tetromino): number[][] {
  const n = tetromino.shape.length;
  const rotated: number[][] = Array.from({ length: n }, () => Array(n).fill(0));

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      rotated[j][n - 1 - i] = tetromino.shape[i][j];
    }
  }

  return rotated;
}

export function checkCollision(
  board: Cell[][],
  tetromino: Tetromino,
  offsetX: number = 0,
  offsetY: number = 0
): boolean {
  for (let y = 0; y < tetromino.shape.length; y++) {
    for (let x = 0; x < tetromino.shape[y].length; x++) {
      if (tetromino.shape[y][x]) {
        const newX = tetromino.position.x + x + offsetX;
        const newY = tetromino.position.y + y + offsetY;

        if (
          newX < 0 ||
          newX >= BOARD_WIDTH ||
          newY >= BOARD_HEIGHT ||
          (newY >= 0 && board[newY][newX].filled)
        ) {
          return true;
        }
      }
    }
  }
  return false;
}

export function mergeTetromino(board: Cell[][], tetromino: Tetromino): Cell[][] {
  const newBoard = board.map(row => row.map(cell => ({ ...cell })));

  for (let y = 0; y < tetromino.shape.length; y++) {
    for (let x = 0; x < tetromino.shape[y].length; x++) {
      if (tetromino.shape[y][x]) {
        const boardY = tetromino.position.y + y;
        const boardX = tetromino.position.x + x;

        if (boardY >= 0 && boardY < BOARD_HEIGHT && boardX >= 0 && boardX < BOARD_WIDTH) {
          newBoard[boardY][boardX] = { filled: true, color: tetromino.color };
        }
      }
    }
  }

  return newBoard;
}

export function clearLines(board: Cell[][]): { newBoard: Cell[][]; linesCleared: number } {
  let linesCleared = 0;
  const newBoard = board.filter(row => {
    const isFull = row.every(cell => cell.filled);
    if (isFull) linesCleared++;
    return !isFull;
  });

  while (newBoard.length < BOARD_HEIGHT) {
    newBoard.unshift(Array.from({ length: BOARD_WIDTH }, () => ({ filled: false, color: '' })));
  }

  return { newBoard, linesCleared };
}

export function calculateScore(linesCleared: number, level: number): number {
  const baseScores = [0, 100, 300, 500, 800];
  return baseScores[linesCleared] * level;
}

export function calculateLevel(totalLines: number): number {
  return Math.floor(totalLines / 10) + 1;
}

export function getDropSpeed(level: number): number {
  return Math.max(100, 1000 - (level - 1) * 100);
}
