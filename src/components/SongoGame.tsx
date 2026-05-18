
import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Alert, ScrollView } from 'react-native';
import Board from './Board';
import { createInitialState, makeMove, isValidMove, GameState } from '../logic/songoLogic';
import { COLORS } from '../styles/theme';

const SongoGame: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(createInitialState());

  const handleHolePress = useCallback((index: number) => {
    if (!isValidMove(gameState, index)) {
      // Check if it's the "feed the opponent" rule
      const opponent = gameState.currentPlayer === 0 ? 1 : 0;
      const opponentSeeds = gameState.board.slice(
        opponent === 0 ? 0 : 7,
        opponent === 0 ? 7 : 14
      ).reduce((a, b) => a + b, 0);
      
      if (opponentSeeds === 0) {
        Alert.alert('Règle de Songo', 'Vous devez nourrir votre adversaire si possible !');
      }
      return;
    }

    setGameState((prevState) => {
      const nextState = makeMove(prevState, index);
      
      if (nextState.gameOver && !prevState.gameOver) {
        let message = '';
        if (nextState.winner === 'draw') {
          message = 'Match nul !';
        } else {
          message = `Le Joueur ${nextState.winner! + 1} a gagné !`;
        }
        Alert.alert('Fin de la partie', message);
      }
      
      return nextState;
    });
  }, [gameState]);

  const resetGame = () => {
    setGameState(createInitialState());
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Songo</Text>
      
      <View style={styles.gameInfo}>
        {gameState.gameOver ? (
          <Text style={styles.statusText}>
            {gameState.winner === 'draw' 
              ? 'Match nul !' 
              : `Gagnant : Joueur ${gameState.winner! + 1}`}
          </Text>
        ) : (
          <Text style={styles.statusText}>
            Tour du Joueur {gameState.currentPlayer + 1}
          </Text>
        )}
      </View>

      <Board gameState={gameState} onHolePress={handleHolePress} />

      <TouchableOpacity style={styles.resetButton} onPress={resetGame}>
        <Text style={styles.resetButtonText}>Nouvelle Partie</Text>
      </TouchableOpacity>

      <View style={styles.rulesContainer}>
        <Text style={styles.rulesTitle}>Comment jouer :</Text>
        <Text style={styles.ruleItem}>• Choisissez un trou de votre côté pour semer les graines.</Text>
        <Text style={styles.ruleItem}>• Capturez si la dernière graine tombe chez l'adversaire et fait 2 ou 3 graines.</Text>
        <Text style={styles.ruleItem}>• Gagnez en capturant plus de 35 graines.</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: COLORS.background,
  },
  title: {
    fontSize: 42,
    fontWeight: 'bold',
    color: COLORS.boardHoleContainer,
    marginBottom: 20,
    fontFamily: 'serif',
  },
  gameInfo: {
    marginBottom: 20,
    padding: 10,
    backgroundColor: 'rgba(139, 69, 19, 0.1)',
    borderRadius: 10,
  },
  statusText: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.primary,
  },
  resetButton: {
    marginTop: 30,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
    elevation: 3,
  },
  resetButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  rulesContainer: {
    marginTop: 40,
    padding: 20,
    width: '90%',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 15,
  },
  rulesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.boardHoleContainer,
    marginBottom: 10,
  },
  ruleItem: {
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 5,
  },
});

export default SongoGame;
