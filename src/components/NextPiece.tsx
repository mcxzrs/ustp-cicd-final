import { useEffect, useRef } from 'react';
import { CELL_SIZE, Tetromino } from '@/lib/tetris';
import { Card } from '@/components/ui/card';

type NextPieceProps = {
  nextPiece: Tetromino | null;
};

export function NextPiece({ nextPiece }: NextPieceProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (nextPiece) {
      const shapeWidth = nextPiece.shape[0].length;
      const shapeHeight = nextPiece.shape.length;
      const offsetX = (4 - shapeWidth) * CELL_SIZE / 2;
      const offsetY = (4 - shapeHeight) * CELL_SIZE / 2;

      for (let y = 0; y < nextPiece.shape.length; y++) {
        for (let x = 0; x < nextPiece.shape[y].length; x++) {
          if (nextPiece.shape[y][x]) {
            ctx.fillStyle = nextPiece.color;
            ctx.fillRect(
              offsetX + x * CELL_SIZE + 1,
              offsetY + y * CELL_SIZE + 1,
              CELL_SIZE - 2,
              CELL_SIZE - 2
            );

            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.lineWidth = 2;
            ctx.strokeRect(
              offsetX + x * CELL_SIZE + 2,
              offsetY + y * CELL_SIZE + 2,
              CELL_SIZE - 4,
              CELL_SIZE - 4
            );
          }
        }
      }
    }
  }, [nextPiece]);

  return (
    <Card className="p-4 bg-card/50 backdrop-blur">
      <h3 className="text-sm font-bold text-primary mb-3 text-center">NEXT</h3>
      <canvas
        ref={canvasRef}
        width={4 * CELL_SIZE}
        height={4 * CELL_SIZE}
        className="border border-border rounded"
      />
    </Card>
  );
}
