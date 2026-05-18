
import React from 'react';
import { View, StyleSheet, Text, useWindowDimensions } from 'react-native';
import Hole from './Hole';
import { GameState, HOLES_PER_PLAYER } from '../logic/songoLogic';
import { COLORS } from '../styles/theme';

interface BoardProps {
  gameState: GameState;
  onHolePress: (index: number) => void;
}

const Board: React.FC<BoardProps> = ({ gameState, onHolePress }) => {
  const { board, currentPlayer, gameOver } = gameState;
  const TOTAL_HOLES = HOLES_PER_PLAYER * 2;

  const { width: screenWidth } = useWindowDimensions();

  // Dynamic board calculations to guarantee fitting exactly 7 holes in a single row
  // Board width is restricted to screenWidth - 32 (16px margin on each side) up to a max of 600px
  const boardWidth = Math.min(screenWidth - 32, 600);
  
  // Padding around the player scores and the entire board
  const containerPadding = Math.max(Math.floor(boardWidth * 0.04), 8);
  
  // Horizontal padding inside the board itself
  const boardPadding = Math.max(Math.floor(boardWidth * 0.02), 6);
  
  // Estimate available width for the row of holes
  const availableWidthForHoles = boardWidth - (containerPadding * 2) - (boardPadding * 2);
  
  // Calculate hole size based on available width and responsive margins (holeMargin is at least 3)
  const approxHoleSize = Math.floor(availableWidthForHoles / 7);
  const holeMargin = Math.max(Math.floor(approxHoleSize * 0.08), 3);
  const holeSize = Math.min(Math.floor((availableWidthForHoles - (7 * holeMargin * 2)) / 7), 60);

  // Player 1 (Bottom): 0 to 6
  // Player 2 (Top): 13 down to 7 (to represent counter-clockwise sowing)
  const topRowIndices = Array.from({ length: HOLES_PER_PLAYER }, (_, i) => TOTAL_HOLES - 1 - i);
  const bottomRowIndices = Array.from({ length: HOLES_PER_PLAYER }, (_, i) => i);

  return (
    <View style={[styles.boardContainer, { width: boardWidth, padding: containerPadding }]}>
      <View style={styles.playerInfo}>
        <Text style={[styles.playerText, currentPlayer === 1 && styles.activePlayer]}>
          Joueur 2 {currentPlayer === 1 && '◀'}
        </Text>
        <Text style={styles.scoreText}>Score: {gameState.scores[1]}</Text>
      </View>

      <View 
        style={[
          styles.board, 
          { 
            paddingHorizontal: boardPadding, 
            width: boardWidth - (containerPadding * 2),
            marginVertical: Math.max(Math.floor(boardWidth * 0.04), 10),
          }
        ]}
      >
        <View style={styles.row}>
          {topRowIndices.map((index) => (
            <Hole
              key={index}
              seeds={board[index]}
              onPress={() => onHolePress(index)}
              disabled={gameOver || currentPlayer !== 1 || board[index] === 0}
              isPlayerHole={true}
              isCurrentPlayer={currentPlayer === 1}
              size={holeSize}
            />
          ))}
        </View>

        <View style={styles.row}>
          {bottomRowIndices.map((index) => (
            <Hole
              key={index}
              seeds={board[index]}
              onPress={() => onHolePress(index)}
              disabled={gameOver || currentPlayer !== 0 || board[index] === 0}
              isPlayerHole={false}
              isCurrentPlayer={currentPlayer === 0}
              size={holeSize}
            />
          ))}
        </View>
      </View>

      <View style={styles.playerInfo}>
        <Text style={[styles.playerText, currentPlayer === 0 && styles.activePlayer]}>
          Joueur 1 {currentPlayer === 0 && '◀'}
        </Text>
        <Text style={styles.scoreText}>Score: {gameState.scores[0]}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  boardContainer: {
    backgroundColor: COLORS.board,
    borderRadius: 15,
    borderWidth: 4,
    borderColor: COLORS.primary,
    alignItems: 'center',
  },
  board: {
    paddingVertical: 10,
    backgroundColor: COLORS.boardHoleContainer,
    borderRadius: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 10,
  },
  playerInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 10,
  },
  playerText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  activePlayer: {
    color: COLORS.primary,
    textDecorationLine: 'underline',
  },
  scoreText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
});

export default Board;
