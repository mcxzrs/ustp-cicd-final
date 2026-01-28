import { useEffect, useRef } from 'react';
import { BOARD_WIDTH, BOARD_HEIGHT, CELL_SIZE, Cell, Tetromino } from '@/lib/tetris';

type GameBoardProps = {
  board: Cell[][];
  currentPiece: Tetromino | null;
  gameOver: boolean;
};

export function GameBoard({ board, currentPiece, gameOver }: GameBoardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let y = 0; y < BOARD_HEIGHT; y++) {
      for (let x = 0; x < BOARD_WIDTH; x++) {
        const cell = board[y][x];

        ctx.strokeStyle = 'oklch(0.30 0.05 250)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);

        if (cell.filled) {
          ctx.fillStyle = cell.color;
          ctx.fillRect(
            x * CELL_SIZE + 1,
            y * CELL_SIZE + 1,
            CELL_SIZE - 2,
            CELL_SIZE - 2
          );

          ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
          ctx.lineWidth = 2;
          ctx.strokeRect(
            x * CELL_SIZE + 2,
            y * CELL_SIZE + 2,
            CELL_SIZE - 4,
            CELL_SIZE - 4
          );
        }
      }
    }

    if (currentPiece) {
      for (let y = 0; y < currentPiece.shape.length; y++) {
        for (let x = 0; x < currentPiece.shape[y].length; x++) {
          if (currentPiece.shape[y][x]) {
            const boardX = currentPiece.position.x + x;
            const boardY = currentPiece.position.y + y;

            if (boardY >= 0) {
              ctx.fillStyle = currentPiece.color;
              ctx.fillRect(
                boardX * CELL_SIZE + 1,
                boardY * CELL_SIZE + 1,
                CELL_SIZE - 2,
                CELL_SIZE - 2
              );

              ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
              ctx.lineWidth = 2;
              ctx.strokeRect(
                boardX * CELL_SIZE + 2,
                boardY * CELL_SIZE + 2,
                CELL_SIZE - 4,
                CELL_SIZE - 4
              );
            }
          }
        }
      }
    }

    if (gameOver) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = 'oklch(0.98 0 0)';
      ctx.font = 'bold 36px JetBrains Mono';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2);
    }
  }, [board, currentPiece, gameOver]);

  return (
    <canvas
      ref={canvasRef}
      width={BOARD_WIDTH * CELL_SIZE}
      height={BOARD_HEIGHT * CELL_SIZE}
      className="border-2 border-primary rounded-lg shadow-lg shadow-primary/20"
    />
  );
}
