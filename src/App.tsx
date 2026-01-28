import { useState, useEffect, useCallback, useRef } from 'react';
import { useKV } from '@github/spark/hooks';
import { GameBoard } from '@/components/GameBoard';
import { NextPiece } from '@/components/NextPiece';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, ArrowsClockwise } from '@phosphor-icons/react';
import {
  createEmptyBoard,
  getRandomTetromino,
  checkCollision,
  mergeTetromino,
  clearLines,
  rotateTetromino,
  calculateScore,
  calculateLevel,
  getDropSpeed,
  Cell,
  Tetromino,
} from '@/lib/tetris';

type GameState = 'idle' | 'playing' | 'paused' | 'gameOver';

function App() {
  const [board, setBoard] = useState<Cell[][]>(createEmptyBoard());
  const [currentPiece, setCurrentPiece] = useState<Tetromino | null>(null);
  const [nextPiece, setNextPiece] = useState<Tetromino | null>(null);
  const [gameState, setGameState] = useState<GameState>('idle');
  const [score, setScore] = useState(0);
  const [totalLines, setTotalLines] = useState(0);
  const [level, setLevel] = useState(1);
  const [highScore, setHighScore] = useKV<number>('tetris-high-score', 0);

  const gameLoopRef = useRef<number | null>(null);
  const lastDropTimeRef = useRef<number>(0);

  const spawnNewPiece = useCallback(() => {
    const piece = nextPiece || getRandomTetromino();
    const newNextPiece = getRandomTetromino();

    if (checkCollision(board, piece)) {
      setGameState('gameOver');
      if (score > (highScore || 0)) {
        setHighScore(score);
      }
      return false;
    }

    setCurrentPiece(piece);
    setNextPiece(newNextPiece);
    return true;
  }, [board, nextPiece, score, highScore, setHighScore]);

  const movePiece = useCallback(
    (dx: number, dy: number) => {
      if (!currentPiece || gameState !== 'playing') return false;

      if (!checkCollision(board, currentPiece, dx, dy)) {
        setCurrentPiece({
          ...currentPiece,
          position: { x: currentPiece.position.x + dx, y: currentPiece.position.y + dy },
        });
        return true;
      }

      if (dy > 0) {
        const newBoard = mergeTetromino(board, currentPiece);
        const { newBoard: clearedBoard, linesCleared } = clearLines(newBoard);
        setBoard(clearedBoard);

        if (linesCleared > 0) {
          const newTotalLines = totalLines + linesCleared;
          const newLevel = calculateLevel(newTotalLines);
          const points = calculateScore(linesCleared, level);

          setTotalLines(newTotalLines);
          setLevel(newLevel);
          setScore((prevScore) => prevScore + points);
        }

        setCurrentPiece(null);
        setTimeout(() => {
          spawnNewPiece();
        }, 50);
      }

      return false;
    },
    [currentPiece, board, gameState, totalLines, level, spawnNewPiece]
  );

  const rotate = useCallback(() => {
    if (!currentPiece || gameState !== 'playing') return;

    const rotated = rotateTetromino(currentPiece);
    const rotatedPiece = { ...currentPiece, shape: rotated };

    if (!checkCollision(board, rotatedPiece)) {
      setCurrentPiece(rotatedPiece);
    } else {
      for (const offset of [1, -1, 2, -2]) {
        if (!checkCollision(board, rotatedPiece, offset, 0)) {
          setCurrentPiece({
            ...rotatedPiece,
            position: { x: rotatedPiece.position.x + offset, y: rotatedPiece.position.y },
          });
          return;
        }
      }
    }
  }, [currentPiece, board, gameState]);

  const hardDrop = useCallback(() => {
    if (!currentPiece || gameState !== 'playing') return;

    let dropDistance = 0;
    while (!checkCollision(board, currentPiece, 0, dropDistance + 1)) {
      dropDistance++;
    }

    const droppedPiece = {
      ...currentPiece,
      position: { x: currentPiece.position.x, y: currentPiece.position.y + dropDistance },
    };

    const newBoard = mergeTetromino(board, droppedPiece);
    const { newBoard: clearedBoard, linesCleared } = clearLines(newBoard);
    setBoard(clearedBoard);

    if (linesCleared > 0) {
      const newTotalLines = totalLines + linesCleared;
      const newLevel = calculateLevel(newTotalLines);
      const points = calculateScore(linesCleared, level);

      setTotalLines(newTotalLines);
      setLevel(newLevel);
      setScore((prevScore) => prevScore + points);
    }

    setCurrentPiece(null);
    setTimeout(() => {
      spawnNewPiece();
    }, 50);
  }, [currentPiece, board, gameState, totalLines, level, spawnNewPiece]);

  const startGame = () => {
    setBoard(createEmptyBoard());
    setScore(0);
    setTotalLines(0);
    setLevel(1);
    setCurrentPiece(null);
    setNextPiece(getRandomTetromino());
    setGameState('playing');
    lastDropTimeRef.current = Date.now();
  };

  const togglePause = () => {
    if (gameState === 'playing') {
      setGameState('paused');
    } else if (gameState === 'paused') {
      setGameState('playing');
      lastDropTimeRef.current = Date.now();
    }
  };

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (gameState !== 'playing') return;

      switch (e.key) {
        case 'ArrowLeft':
        case 'a':
        case 'A':
          e.preventDefault();
          movePiece(-1, 0);
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          e.preventDefault();
          movePiece(1, 0);
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          e.preventDefault();
          movePiece(0, 1);
          break;
        case 'ArrowUp':
        case 'w':
        case 'W':
          e.preventDefault();
          rotate();
          break;
        case ' ':
          e.preventDefault();
          hardDrop();
          break;
        case 'p':
        case 'P':
          e.preventDefault();
          togglePause();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [movePiece, rotate, hardDrop, gameState, togglePause]);

  useEffect(() => {
    if (gameState === 'playing' && !currentPiece) {
      spawnNewPiece();
    }
  }, [gameState, currentPiece, spawnNewPiece]);

  useEffect(() => {
    if (gameState !== 'playing') {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
        gameLoopRef.current = null;
      }
      return;
    }

    const gameLoop = () => {
      const now = Date.now();
      const dropSpeed = getDropSpeed(level);

      if (now - lastDropTimeRef.current > dropSpeed) {
        movePiece(0, 1);
        lastDropTimeRef.current = now;
      }

      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoopRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameState, level, movePiece]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <img
            src="https://cdn.ustp.at/@brand/logo/latest/logo-full-horizontal-primary.svg"
            alt="Brand Logo"
            className="h-12 md:h-16 mx-auto mb-6"
          />
          <h1 className="text-4xl md:text-5xl font-bold text-primary mb-2 tracking-tight">
            TETRIS
          </h1>
          <p className="text-muted-foreground text-sm">
            Use Arrow Keys or WASD to play • Space to drop • P to pause
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 items-start justify-center">
          <div className="flex flex-col gap-4">
            <Card className="p-6 bg-card/50 backdrop-blur">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">SCORE</p>
                  <p className="text-2xl font-bold text-primary tabular-nums">{score}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">HIGH SCORE</p>
                  <p className="text-2xl font-bold text-accent tabular-nums">{highScore}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">LINES</p>
                  <p className="text-2xl font-bold text-foreground tabular-nums">{totalLines}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">LEVEL</p>
                  <Badge variant="outline" className="text-lg font-bold border-primary text-primary">
                    {level}
                  </Badge>
                </div>
              </div>
            </Card>

            <NextPiece nextPiece={nextPiece} />

            <div className="hidden lg:block">
              <Card className="p-4 bg-card/50 backdrop-blur">
                <h3 className="text-xs font-bold text-primary mb-2">CONTROLS</h3>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <p>← → : Move</p>
                  <p>↑ : Rotate</p>
                  <p>↓ : Soft Drop</p>
                  <p>Space : Hard Drop</p>
                  <p>P : Pause</p>
                </div>
              </Card>
            </div>
          </div>

          <div className="flex flex-col items-center gap-4">
            <GameBoard board={board} currentPiece={currentPiece} gameOver={gameState === 'gameOver'} />

            <div className="flex gap-3">
              {gameState === 'idle' && (
                <Button onClick={startGame} size="lg" className="gap-2 shadow-lg shadow-primary/30">
                  <Play weight="fill" size={20} />
                  Start Game
                </Button>
              )}

              {gameState === 'playing' && (
                <Button onClick={togglePause} variant="secondary" size="lg" className="gap-2">
                  <Pause weight="fill" size={20} />
                  Pause
                </Button>
              )}

              {gameState === 'paused' && (
                <Button onClick={togglePause} size="lg" className="gap-2 shadow-lg shadow-primary/30">
                  <Play weight="fill" size={20} />
                  Resume
                </Button>
              )}

              {(gameState === 'playing' || gameState === 'paused' || gameState === 'gameOver') && (
                <Button onClick={startGame} variant="outline" size="lg" className="gap-2">
                  <ArrowsClockwise size={20} />
                  Restart
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;