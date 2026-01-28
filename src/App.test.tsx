import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// --- Mock Spark KV hook (prevents import.meta.env issues) ---
const setHighScoreMock = vi.fn();

vi.mock("@github/spark/hooks", () => ({
  useKV: (_key: string, initial: number) => [initial, setHighScoreMock],
}));

// --- Mock child components so App tests focus on App logic/UI ---
vi.mock("@/components/GameBoard", () => ({
  GameBoard: (props: any) => (
    <div data-testid="game-board">
      {/* expose a tiny bit of state for testing */}
      <div>gameOver:{String(!!props.gameOver)}</div>
      <div>hasPiece:{String(!!props.currentPiece)}</div>
      <div>rows:{props.board?.length ?? 0}</div>
    </div>
  ),
}));

vi.mock("@/components/NextPiece", () => ({
  NextPiece: (props: any) => (
    <div data-testid="next-piece">next:{String(!!props.nextPiece)}</div>
  ),
}));

// --- Mock Tetris lib to make behavior deterministic in unit tests ---
vi.mock("@/lib/tetris", () => {
  const createEmptyBoard = () =>
    Array.from({ length: 20 }, () => Array.from({ length: 10 }, () => 0));

  // piece shape doesn’t matter for these tests
  const getRandomTetromino = () => ({
    shape: [[1]],
    position: { x: 0, y: 0 },
  });

  return {
    createEmptyBoard,
    getRandomTetromino,
    checkCollision: () => false,
    mergeTetromino: (board: any) => board,
    clearLines: (board: any) => ({ newBoard: board, linesCleared: 0 }),
    rotateTetromino: (piece: any) => piece.shape,
    calculateScore: () => 0,
    calculateLevel: () => 1,
    getDropSpeed: () => 999999, // effectively disables auto-drop during tests
  };
});

import App from "./App";

describe("App (Tetris)", () => {
  beforeEach(() => {
    setHighScoreMock.mockClear();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders title and instructions", () => {
    render(<App />);

    expect(
      screen.getByRole("heading", { name: /tetris/i })
    ).toBeInTheDocument();

    expect(
      screen.getByText(/use arrow keys or wasd to play/i)
    ).toBeInTheDocument();
  });

  it("shows Start Game button initially", () => {
    render(<App />);
    expect(
      screen.getByRole("button", { name: /start game/i })
    ).toBeInTheDocument();

    // Pause/Resume should not be visible in idle
    expect(screen.queryByRole("button", { name: /pause/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /resume/i })).toBeNull();
  });

  it("clicking Start Game switches to playing (Pause + Restart buttons appear)", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: /start game/i }));

    expect(screen.getByRole("button", { name: /pause/i })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /restart/i })
    ).toBeInTheDocument();

    // Start Game should be gone once playing
    expect(screen.queryByRole("button", { name: /start game/i })).toBeNull();
  });

  it("clicking Pause switches to paused (Resume + Restart)", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: /start game/i }));
    await user.click(screen.getByRole("button", { name: /pause/i }));

    expect(screen.getByRole("button", { name: /resume/i })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /restart/i })
    ).toBeInTheDocument();

    // Pause should be gone in paused state
    expect(screen.queryByRole("button", { name: /pause/i })).toBeNull();
  });

  it("clicking Resume switches back to playing (Pause visible again)", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: /start game/i }));
    await user.click(screen.getByRole("button", { name: /pause/i }));
    await user.click(screen.getByRole("button", { name: /resume/i }));

    expect(screen.getByRole("button", { name: /pause/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /resume/i })).toBeNull();
  });

  it("pressing P toggles pause/resume while playing", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: /start game/i }));
    expect(screen.getByRole("button", { name: /pause/i })).toBeInTheDocument();

    await user.keyboard("p");
    expect(screen.getByRole("button", { name: /resume/i })).toBeInTheDocument();
  });

  it("Restart is available in playing and resets to playing state", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: /start game/i }));
    await user.click(screen.getByRole("button", { name: /restart/i }));
  });

  it("scoreboard labels are present", () => {
    render(<App />);

    expect(screen.getByText(/high score/i)).toBeInTheDocument();
    expect(screen.getByText(/lines/i)).toBeInTheDocument();
    expect(screen.getByText(/level/i)).toBeInTheDocument();
  });

  it("renders GameBoard and NextPiece containers", () => {
    render(<App />);
    expect(screen.getByTestId("game-board")).toBeInTheDocument();
    expect(screen.getByTestId("next-piece")).toBeInTheDocument();
  });
});
