import React, { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Alert, ScrollView, ActivityIndicator } from 'react-native';
import Board from './Board';
import { createInitialState, makeMove, isValidMove, GameState } from '../logic/songoLogic';
import { getBestMoveWithTimeout } from '../logic/songoAI';
import { COLORS } from '../styles/theme';

const SongoGame: React.FC = () => {
  const [gameMode, setGameMode] = useState<'vsAI' | 'pvp' | null>(null);
  const [gameState, setGameState] = useState<GameState>(createInitialState());
  const [isAiThinking, setIsAiThinking] = useState(false);

  // AI execution trigger hook
  useEffect(() => {
    if (gameMode !== 'vsAI' || gameState.currentPlayer !== 1 || gameState.gameOver || isAiThinking) {
      return;
    }

    setIsAiThinking(true);
    const startTime = Date.now();
    let isCurrentEffect = true;
    let delayTimerId: NodeJS.Timeout | null = null;

    // Call asynchronous AI solver with a strict 15-second timeout
    getBestMoveWithTimeout(gameState, 4, 15000).then(({ move }) => {
      if (!isCurrentEffect) return;

      if (move !== -1) {
        // Enforce the 10-second minimum response delay
        const elapsed = Date.now() - startTime;
        const remainingDelay = Math.max(0, 10000 - elapsed);

        delayTimerId = setTimeout(() => {
          if (!isCurrentEffect) return;

          setGameState((prevState) => {
            const nextState = makeMove(prevState, move);
            
            if (nextState.gameOver && !prevState.gameOver) {
              let message = '';
              if (nextState.winner === 'draw') {
                message = 'Match nul !';
              } else {
                message = nextState.winner === 1 ? "L'IA a gagné ! 🤖" : "Félicitations, vous avez gagné ! 🎉";
              }
              Alert.alert('Fin de la partie', message);
            }
            
            return nextState;
          });
          setIsAiThinking(false);
        }, remainingDelay);
      } else {
        setIsAiThinking(false);
      }
    }).catch(() => {
      if (isCurrentEffect) {
        setIsAiThinking(false);
      }
    });

    return () => {
      isCurrentEffect = false;
      if (delayTimerId) {
        clearTimeout(delayTimerId);
      }
    };
  }, [gameState, gameMode, isAiThinking]);

  const handleHolePress = useCallback((index: number) => {
    // Prevent moves during AI's turn or when AI is computing
    if (gameMode === 'vsAI' && gameState.currentPlayer === 1) {
      return;
    }
    if (isAiThinking) {
      return;
    }

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
  }, [gameState, gameMode, isAiThinking]);

  const resetGame = () => {
    setGameState(createInitialState());
    setIsAiThinking(false);
  };

  const goToMenu = () => {
    setGameMode(null);
    setGameState(createInitialState());
    setIsAiThinking(false);
  };

  // Rendering the Mode Selection Screen if no mode has been selected
  if (gameMode === null) {
    return (
      <ScrollView contentContainerStyle={styles.menuContainer}>
        <Text style={styles.menuLogo}>🎮</Text>
        <Text style={styles.menuTitle}>SONGO</Text>
        <Text style={styles.menuSubtitle}>Sélectionnez votre mode de jeu</Text>
        
        <TouchableOpacity 
          style={styles.menuButton} 
          onPress={() => setGameMode('vsAI')}
          activeOpacity={0.85}
        >
          <View style={styles.menuButtonContent}>
            <Text style={styles.menuButtonEmoji}>🤖</Text>
            <View style={styles.menuButtonTextContainer}>
              <Text style={styles.menuButtonText}>Solo contre l'IA</Text>
              <Text style={styles.menuButtonDesc}>
                Défiez notre intelligence artificielle tactique (Minimax + Élagage Alpha-Bêta)
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.menuButton} 
          onPress={() => setGameMode('pvp')}
          activeOpacity={0.85}
        >
          <View style={styles.menuButtonContent}>
            <Text style={styles.menuButtonEmoji}>👥</Text>
            <View style={styles.menuButtonTextContainer}>
              <Text style={styles.menuButtonText}>À deux (Pass & Play)</Text>
              <Text style={styles.menuButtonDesc}>
                Jouez en face-à-face à tour de rôle sur le même téléphone
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        <View style={styles.menuRulesBox}>
          <Text style={styles.menuRulesTitle}>Règles majeures :</Text>
          <Text style={styles.menuRulesItem}>• Capturez les graines chez l'adversaire (groupes de 2 ou 3).</Text>
          <Text style={styles.menuRulesItem}>• Nourrissez impérativement votre adversaire s'il n'a plus de graines.</Text>
          <Text style={styles.menuRulesItem}>• Le premier à capturer plus de 35 graines remporte la partie !</Text>
        </View>
      </ScrollView>
    );
  }

  // Active Game UI
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Songo</Text>
      
      <View style={styles.gameInfo}>
        {gameState.gameOver ? (
          <Text style={styles.statusText}>
            {gameState.winner === 'draw' 
              ? 'Match nul !' 
              : gameMode === 'vsAI'
                ? gameState.winner === 0 
                  ? 'Victoire ! Vous avez gagné 🎉' 
                  : "Défaite ! L'IA a gagné 🤖"
                : `Gagnant : Joueur ${gameState.winner! + 1}`}
          </Text>
        ) : isAiThinking ? (
          <View style={styles.thinkingContainer}>
            <ActivityIndicator size="small" color={COLORS.primary} style={styles.thinkingIndicator} />
            <Text style={styles.statusText}>L'IA réfléchit...</Text>
          </View>
        ) : (
          <Text style={styles.statusText}>
            {gameMode === 'vsAI'
              ? gameState.currentPlayer === 0 
                ? 'Votre tour (Joueur 1)' 
                : "Tour de l'IA (Joueur 2)"
              : `Tour du Joueur ${gameState.currentPlayer + 1}`}
          </Text>
        )}
      </View>

      <Board gameState={gameState} onHolePress={handleHolePress} />

      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.resetButton} onPress={resetGame}>
          <Text style={styles.actionButtonText}>Nouvelle Partie</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.resetButton, styles.menuButtonBack]} onPress={goToMenu}>
          <Text style={styles.actionButtonText}>Menu Principal</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.rulesContainer}>
        <Text style={styles.rulesTitle}>
          Mode : {gameMode === 'vsAI' ? "Solo contre l'IA 🤖" : "À deux (Pass & Play) 👥"}
        </Text>
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
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: 'rgba(139, 69, 19, 0.1)',
    borderRadius: 15,
    minWidth: '80%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.primary,
    textAlign: 'center',
  },
  thinkingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thinkingIndicator: {
    marginRight: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    marginTop: 30,
    gap: 15,
    width: '90%',
    justifyContent: 'center',
  },
  resetButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    minWidth: 140,
    alignItems: 'center',
  },
  menuButtonBack: {
    backgroundColor: COLORS.secondary,
  },
  actionButtonText: {
    color: COLORS.white,
    fontSize: 16,
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
  // Menu selection styles
  menuContainer: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
    paddingHorizontal: 20,
    backgroundColor: COLORS.background,
  },
  menuLogo: {
    fontSize: 70,
    marginBottom: 10,
  },
  menuTitle: {
    fontSize: 48,
    fontWeight: 'bold',
    color: COLORS.boardHoleContainer,
    fontFamily: 'serif',
    letterSpacing: 2,
  },
  menuSubtitle: {
    fontSize: 16,
    color: COLORS.primary,
    marginBottom: 35,
    fontWeight: '500',
  },
  menuButton: {
    width: '100%',
    maxWidth: 350,
    backgroundColor: COLORS.white,
    borderRadius: 15,
    padding: 16,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: 'rgba(139, 69, 19, 0.15)',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  menuButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuButtonEmoji: {
    fontSize: 36,
    marginRight: 16,
  },
  menuButtonTextContainer: {
    flex: 1,
  },
  menuButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 4,
  },
  menuButtonDesc: {
    fontSize: 12,
    color: COLORS.text,
    opacity: 0.8,
    lineHeight: 16,
  },
  menuRulesBox: {
    width: '100%',
    maxWidth: 350,
    marginTop: 20,
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(139, 69, 19, 0.08)',
  },
  menuRulesTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.boardHoleContainer,
    marginBottom: 8,
  },
  menuRulesItem: {
    fontSize: 12,
    color: COLORS.text,
    opacity: 0.9,
    marginBottom: 4,
  },
});

export default SongoGame;
