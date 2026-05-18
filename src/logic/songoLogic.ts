
export type Player = 0 | 1;

export interface GameState {
  board: number[]; // 14 holes, 0-6 for Player 0, 7-13 for Player 1
  scores: [number, number];
  currentPlayer: Player;
  gameOver: boolean;
  winner: Player | 'draw' | null;
}

export const INITIAL_SEEDS = 5;
export const HOLES_PER_PLAYER = 7;
export const TOTAL_HOLES = HOLES_PER_PLAYER * 2;

export const createInitialState = (): GameState => ({
  board: Array(TOTAL_HOLES).fill(INITIAL_SEEDS),
  scores: [0, 0],
  currentPlayer: 0,
  gameOver: false,
  winner: null,
});

const isOpponentTerritory = (player: Player, index: number) => {
  if (player === 0) return index >= HOLES_PER_PLAYER && index < TOTAL_HOLES;
  return index >= 0 && index < HOLES_PER_PLAYER;
};

const countSeedsInTerritory = (board: number[], player: Player): number => {
  const start = player === 0 ? 0 : HOLES_PER_PLAYER;
  const end = player === 0 ? HOLES_PER_PLAYER : TOTAL_HOLES;
  let count = 0;
  for (let i = start; i < end; i++) count += board[i];
  return count;
};

export const isValidMove = (state: GameState, holeIndex: number): boolean => {
  if (state.gameOver) return false;
  
  // Must select a hole belonging to the current player
  const isPlayer0Hole = holeIndex >= 0 && holeIndex < HOLES_PER_PLAYER;
  const isPlayer1Hole = holeIndex >= HOLES_PER_PLAYER && holeIndex < TOTAL_HOLES;
  
  if (state.currentPlayer === 0 && !isPlayer0Hole) return false;
  if (state.currentPlayer === 1 && !isPlayer1Hole) return false;
  
  // Hole must not be empty
  if (state.board[holeIndex] === 0) return false;

  // "Feed the opponent" rule: if opponent has no seeds, must play a move that gives them seeds if possible
  const opponent = state.currentPlayer === 0 ? 1 : 0;
  if (countSeedsInTerritory(state.board, opponent) === 0) {
    const feedsOpponent = wouldFeedOpponent(state, holeIndex);
    if (!feedsOpponent) {
      // Check if ANY move can feed the opponent
      const anyFeedingMoveExists = canAnyMoveFeedOpponent(state);
      if (anyFeedingMoveExists) {
        return false; // This move is invalid because another move exists that feeds the opponent
      }
    }
  }

  return true;
};

const wouldFeedOpponent = (state: GameState, holeIndex: number): boolean => {
  const tempBoard = [...state.board];
  let seeds = tempBoard[holeIndex];
  tempBoard[holeIndex] = 0;
  let currentIndex = holeIndex;
  
  while (seeds > 0) {
    currentIndex = (currentIndex + 1) % TOTAL_HOLES;
    tempBoard[currentIndex]++;
    seeds--;
  }

  const opponent = state.currentPlayer === 0 ? 1 : 0;
  return countSeedsInTerritory(tempBoard, opponent) > 0;
};

const canAnyMoveFeedOpponent = (state: GameState): boolean => {
  const start = state.currentPlayer === 0 ? 0 : HOLES_PER_PLAYER;
  const end = state.currentPlayer === 0 ? HOLES_PER_PLAYER : TOTAL_HOLES;
  
  for (let i = start; i < end; i++) {
    if (state.board[i] > 0 && wouldFeedOpponent(state, i)) {
      return true;
    }
  }
  return false;
};

export const makeMove = (state: GameState, holeIndex: number): GameState => {
  if (!isValidMove(state, holeIndex)) return state;

  const nextState = { ...state, board: [...state.board], scores: [...state.scores] as [number, number] };
  let seeds = nextState.board[holeIndex];
  nextState.board[holeIndex] = 0;

  let currentIndex = holeIndex;
  
  // Sowing
  while (seeds > 0) {
    currentIndex = (currentIndex + 1) % TOTAL_HOLES;
    nextState.board[currentIndex]++;
    seeds--;
  }

  // Capture Logic
  if (isOpponentTerritory(state.currentPlayer, currentIndex)) {
    let captureIndex = currentIndex;
    let capturedTotal = 0;

    // Songo capture: 2 or 3 seeds. Cascading backwards.
    while (isOpponentTerritory(state.currentPlayer, captureIndex)) {
      const count = nextState.board[captureIndex];
      if (count === 2 || count === 3) {
        capturedTotal += count;
        nextState.board[captureIndex] = 0;
        
        // Move backwards for cascading capture
        captureIndex = (captureIndex - 1 + TOTAL_HOLES) % TOTAL_HOLES;
      } else {
        break;
      }
    }

    if (capturedTotal > 0) {
      nextState.scores[state.currentPlayer] += capturedTotal;
    }
  }

  // Check Game Over
  if (nextState.scores[0] > 35) {
    nextState.gameOver = true;
    nextState.winner = 0;
  } else if (nextState.scores[1] > 35) {
    nextState.gameOver = true;
    nextState.winner = 1;
  } else if (nextState.scores[0] === 35 && nextState.scores[1] === 35) {
    nextState.gameOver = true;
    nextState.winner = 'draw';
  } else {
    // Check if next player has moves
    const nextPlayer = state.currentPlayer === 0 ? 1 : 0;
    const hasMoves = hasPossibleMoves(nextState, nextPlayer);
    
    if (!hasMoves) {
      // End game and collect remaining seeds
      const remainingSeeds0 = countSeedsInTerritory(nextState.board, 0);
      const remainingSeeds1 = countSeedsInTerritory(nextState.board, 1);
      
      nextState.scores[0] += remainingSeeds0;
      nextState.scores[1] += remainingSeeds1;
      nextState.board.fill(0);
      
      nextState.gameOver = true;
      if (nextState.scores[0] > nextState.scores[1]) nextState.winner = 0;
      else if (nextState.scores[1] > nextState.scores[0]) nextState.winner = 1;
      else nextState.winner = 'draw';
    } else {
      nextState.currentPlayer = nextPlayer;
    }
  }

  return nextState;
};

const hasPossibleMoves = (state: GameState, player: Player): boolean => {
  const start = player === 0 ? 0 : HOLES_PER_PLAYER;
  const end = player === 0 ? HOLES_PER_PLAYER : TOTAL_HOLES;
  
  for (let i = start; i < end; i++) {
    if (state.board[i] > 0) return true;
  }
  return false;
};
