
import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { COLORS } from '../styles/theme';

interface HoleProps {
  seeds: number;
  onPress: () => void;
  disabled: boolean;
  isPlayerHole: boolean;
  isCurrentPlayer: boolean;
  size?: number;
}

const Hole: React.FC<HoleProps> = ({ 
  seeds, 
  onPress, 
  disabled, 
  isPlayerHole, 
  isCurrentPlayer,
  size = 60,
}) => {
  const seedContainerSize = Math.floor(size * 0.65);
  const seedSize = Math.max(Math.floor(size * 0.13), 4);
  const seedMargin = Math.max(Math.floor(size * 0.02), 1);
  const fontSize = Math.max(Math.floor(size * 0.25), 10);
  const seedCountBottom = -Math.max(Math.floor(size * 0.3), 15);
  const holeMargin = Math.max(Math.floor(size * 0.08), 3);

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.hole,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          margin: holeMargin,
        },
        isPlayerHole && styles.playerHole,
        isCurrentPlayer && !disabled && styles.activeHole,
      ]}
    >
      <View 
        style={[
          styles.seedContainer,
          {
            width: seedContainerSize,
            height: seedContainerSize,
          }
        ]}
      >
        {Array.from({ length: Math.min(seeds, 12) }).map((_, i) => (
          <View 
            key={i} 
            style={[
              styles.seed,
              {
                width: seedSize,
                height: seedSize,
                borderRadius: seedSize / 2,
                margin: seedMargin,
              }
            ]} 
          />
        ))}
        {seeds > 12 && (
          <Text 
            style={[
              styles.extraSeeds,
              {
                fontSize: Math.max(fontSize - 4, 8),
              }
            ]}
          >
            +{seeds - 12}
          </Text>
        )}
      </View>
      <Text 
        style={[
          styles.seedCount,
          {
            fontSize: fontSize,
            bottom: seedCountBottom,
          }
        ]}
      >
        {seeds}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  hole: {
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.boardHoleContainer,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  playerHole: {
    backgroundColor: COLORS.secondary,
  },
  activeHole: {
    borderColor: COLORS.gold,
    borderWidth: 3,
  },
  seedCount: {
    color: COLORS.white,
    fontWeight: 'bold',
    position: 'absolute',
  },
  seedContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
  },
  seed: {
    backgroundColor: COLORS.seed,
  },
  extraSeeds: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
});

export default Hole;
