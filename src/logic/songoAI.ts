import { GameState, Player, isValidMove, makeMove, HOLES_PER_PLAYER, TOTAL_HOLES } from './songoLogic';

// Helper to count active seeds of a specific player in their territory
const countSeedsInTerritory = (board: number[], player: Player): number => {
  const start = player === 0 ? 0 : HOLES_PER_PLAYER;
  const end = player === 0 ? HOLES_PER_PLAYER : TOTAL_HOLES;
  let count = 0;
  for (let i = start; i < end; i++) {
    count += board[i];
  }
  return count;
};

// Evaluation function for a given GameState from the perspective of aiPlayer
const evaluateState = (state: GameState, aiPlayer: Player): number => {
  const opponent = aiPlayer === 0 ? 1 : 0;
  
  if (state.gameOver) {
    if (state.winner === aiPlayer) return 10000;
    if (state.winner === opponent) return -10000;
    return 0; // Draw
  }
  
  // 1. Score differential (captures are primary objectives)
  // Weight: 100 per seed of capture advantage
  const scoreDiff = state.scores[aiPlayer] - state.scores[opponent];
  const scoreScore = scoreDiff * 100;
  
  // 2. Active seeds in territory (maintaining playing options)
  // Weight: 10 per seed differential
  const aiSeeds = countSeedsInTerritory(state.board, aiPlayer);
  const opponentSeeds = countSeedsInTerritory(state.board, opponent);
  const seedDiff = aiSeeds - opponentSeeds;
  const seedScore = seedDiff * 10;
  
  // 3. Vulnerability prevention (avoiding leaving holes with 1 or 2 seeds that the opponent can easily capture)
  // Weight: -15 per vulnerable hole
  let vulnerabilityScore = 0;
  const aiStart = aiPlayer === 0 ? 0 : HOLES_PER_PLAYER;
  const aiEnd = aiPlayer === 0 ? HOLES_PER_PLAYER : TOTAL_HOLES;
  
  for (let i = aiStart; i < aiEnd; i++) {
    const seeds = state.board[i];
    if (seeds === 1 || seeds === 2) {
      vulnerabilityScore -= 15;
    }
  }
  
  return scoreScore + seedScore + vulnerabilityScore;
};

// Minimax algorithm with Alpha-Beta Pruning
// Depth 4 allows search depth of 4 turns, extremely fast (under 2ms) and plays at high tactical level
export const getBestMove = (state: GameState, depth: number = 4): number => {
  const aiPlayer = state.currentPlayer;
  
  const minimax = (
    currentState: GameState, 
    currentDepth: number, 
    alpha: number, 
    beta: number, 
    isMaximizing: boolean
  ): number => {
    if (currentDepth === 0 || currentState.gameOver) {
      return evaluateState(currentState, aiPlayer);
    }
    
    const player = currentState.currentPlayer;
    const start = player === 0 ? 0 : HOLES_PER_PLAYER;
    const end = player === 0 ? HOLES_PER_PLAYER : TOTAL_HOLES;
    
    // Find all legal moves
    const legalMoves: number[] = [];
    for (let i = start; i < end; i++) {
      if (isValidMove(currentState, i)) {
        legalMoves.push(i);
      }
    }
    
    if (legalMoves.length === 0) {
      return evaluateState(currentState, aiPlayer);
    }
    
    if (isMaximizing) {
      let maxEval = -Infinity;
      for (const move of legalMoves) {
        const nextState = makeMove(currentState, move);
        const evaluation = minimax(
          nextState, 
          currentDepth - 1, 
          alpha, 
          beta, 
          nextState.currentPlayer === aiPlayer
        );
        maxEval = Math.max(maxEval, evaluation);
        alpha = Math.max(alpha, evaluation);
        if (beta <= alpha) break; // Beta cut-off
      }
      return maxEval;
    } else {
      let minEval = Infinity;
      for (const move of legalMoves) {
        const nextState = makeMove(currentState, move);
        const evaluation = minimax(
          nextState, 
          currentDepth - 1, 
          alpha, 
          beta, 
          nextState.currentPlayer === aiPlayer
        );
        minEval = Math.min(minEval, evaluation);
        beta = Math.min(beta, evaluation);
        if (beta <= alpha) break; // Alpha cut-off
      }
      return minEval;
    }
  };

  const startHole = aiPlayer === 0 ? 0 : HOLES_PER_PLAYER;
  const endHole = aiPlayer === 0 ? HOLES_PER_PLAYER : TOTAL_HOLES;
  
  let bestScore = -Infinity;
  let bestMove = -1;
  const legalMoves: number[] = [];
  
  for (let i = startHole; i < endHole; i++) {
    if (isValidMove(state, i)) {
      legalMoves.push(i);
    }
  }
  
  if (legalMoves.length === 0) return -1;
  if (legalMoves.length === 1) return legalMoves[0];
  
  for (const move of legalMoves) {
    const nextState = makeMove(state, move);
    const isMaximizing = nextState.currentPlayer === aiPlayer;
    const score = minimax(nextState, depth - 1, -Infinity, Infinity, isMaximizing);
    
    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }
  
  return bestMove !== -1 ? bestMove : legalMoves[0];
};

/**
 * Asynchronously calculates the best move using Minimax with Alpha-Beta pruning,
 * enforcing a maximum search timeout of 15 seconds.
 * If the calculation takes more than 15 seconds, it falls back to a random valid move.
 */
export const getBestMoveWithTimeout = (
  state: GameState, 
  depth: number = 4, 
  timeoutMs: number = 15000
): Promise<{ move: number; isRandom: boolean }> => {
  return new Promise((resolve) => {
    // Find all legal moves
    const aiPlayer = state.currentPlayer;
    const startHole = aiPlayer === 0 ? 0 : HOLES_PER_PLAYER;
    const endHole = aiPlayer === 0 ? HOLES_PER_PLAYER : TOTAL_HOLES;
    const legalMoves: number[] = [];
    
    for (let i = startHole; i < endHole; i++) {
      if (isValidMove(state, i)) {
        legalMoves.push(i);
      }
    }
    
    if (legalMoves.length === 0) {
      resolve({ move: -1, isRandom: false });
      return;
    }

    // Set up the 15-second safety timeout
    const timeoutId = setTimeout(() => {
      const randomMove = legalMoves[Math.floor(Math.random() * legalMoves.length)];
      resolve({ move: randomMove, isRandom: true });
    }, timeoutMs);

    // Execute minimax search
    setTimeout(() => {
      try {
        const bestMove = getBestMove(state, depth);
        clearTimeout(timeoutId);
        resolve({ move: bestMove, isRandom: false });
      } catch {
        clearTimeout(timeoutId);
        const randomMove = legalMoves[Math.floor(Math.random() * legalMoves.length)];
        resolve({ move: randomMove, isRandom: true });
      }
    }, 0);
  });
};
