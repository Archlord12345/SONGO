/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useState, useEffect, useRef } from 'react';
import SongoGame from './src/components/SongoGame';
import { 
  StatusBar, 
  StyleSheet, 
  View, 
  Text, 
  Animated, 
  ActivityIndicator,
  TouchableOpacity
} from 'react-native';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import Sound from 'react-native-sound';
import songsList from './src/assets/songsList.json';

// Enable background playback in silence mode
Sound.setCategory('Playback');

function App() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor="#0F0804" />
      <AppContent />
    </SafeAreaProvider>
  );
}

function AppContent() {
  const safeAreaInsets = useSafeAreaInsets();
  const [showGame, setShowGame] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  
  // Animated values
  const fadeAnim = useRef(new Animated.Value(1)).current;      // Splash screen opacity
  const logoScale = useRef(new Animated.Value(0.85)).current;  // Logo entry scale
  const logoOpacity = useRef(new Animated.Value(0)).current;    // Logo entry opacity
  const spinnerOpacity = useRef(new Animated.Value(0)).current; // Spinner delay fade-in

  // Audio reference
  const soundRef = useRef<Sound | null>(null);

  useEffect(() => {
    // 1. Logo entry animation (scale up and fade in)
    Animated.parallel([
      Animated.timing(logoScale, {
        toValue: 1,
        duration: 900,
        useNativeDriver: true,
      }),
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    // 2. Spinner delay fade-in (starts slightly after the logo)
    Animated.timing(spinnerOpacity, {
      toValue: 1,
      duration: 500,
      delay: 400,
      useNativeDriver: true,
    }).start();

    // 3. Keep loading for 2.8 seconds, then fade out the splash screen
    const timer = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }).start(() => {
        setShowGame(true);
      });
    }, 2800);

    return () => clearTimeout(timer);
  }, [fadeAnim, logoOpacity, logoScale, spinnerOpacity]);

  // Audio Playback effect
  useEffect(() => {
    if (!songsList || songsList.length === 0) return;

    // Pick a random song from the compiled JSON list
    const randomIndex = Math.floor(Math.random() * songsList.length);
    const randomSong = songsList[randomIndex];
    
    // Load sound file from raw resources (Android expects Sound.MAIN_BUNDLE for packaged resources)
    const soundInstance = new Sound(randomSong, Sound.MAIN_BUNDLE, (error) => {
      if (error) {
        console.warn('Failed to load sound:', randomSong, error);
        return;
      }
      
      soundRef.current = soundInstance;
      
      // Loop indefinitely
      soundInstance.setNumberOfLoops(-1);
      
      // Set initial volume based on current state
      soundInstance.setVolume(isMuted ? 0 : 1);
      
      // Play background track
      soundInstance.play((success) => {
        if (!success) {
          console.warn('Playback finished due to decoding errors');
        }
      });
    });

    // Clean up when App Content unmounts
    return () => {
      if (soundRef.current) {
        soundRef.current.stop();
        soundRef.current.release();
        soundRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleMute = () => {
    setIsMuted((prev) => {
      const nextMuted = !prev;
      if (soundRef.current) {
        soundRef.current.setVolume(nextMuted ? 0 : 1);
      }
      return nextMuted;
    });
  };

  return (
    <View style={styles.container}>
      {/* Floating Mute Button (Shown if songs are bundled) */}
      {songsList && songsList.length > 0 && (
        <TouchableOpacity 
          style={[styles.muteButton, { top: safeAreaInsets.top + 10 }]} 
          onPress={toggleMute}
          activeOpacity={0.7}
        >
          <Text style={styles.muteButtonText}>{isMuted ? '🔇' : '🔊'}</Text>
        </TouchableOpacity>
      )}

      {showGame ? (
        <View style={[styles.gameContainer, { paddingTop: safeAreaInsets.top }]}>
          <SongoGame />
        </View>
      ) : (
        <Animated.View style={[styles.splashContainer, { opacity: fadeAnim }]}>
          <View style={styles.splashContent}>
            {/* Logo */}
            <Animated.Image
              source={require('./src/assets/logo.png')}
              style={[
                styles.logo,
                {
                  transform: [{ scale: logoScale }],
                  opacity: logoOpacity,
                },
              ]}
              resizeMode="contain"
            />
            
            {/* Title / Subtitle */}
            <Animated.View style={[styles.titleContainer, { opacity: logoOpacity }]}>
              <Text style={styles.splashTitle}>SONGO</Text>
              <Text style={styles.splashSubtitle}>Le Jeu Traditionnel</Text>
            </Animated.View>

            {/* Spinner and Loading Text */}
            <Animated.View style={[styles.loadingContainer, { opacity: spinnerOpacity }]}>
              <ActivityIndicator size="large" color="#FFD700" style={styles.spinner} />
              <Text style={styles.loadingText}>Chargement des graines...</Text>
            </Animated.View>
          </View>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0804', // Very deep brown/black matching the logo background
  },
  gameContainer: {
    flex: 1,
  },
  splashContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0F0804', // Deep luxurious background
    justifyContent: 'center',
    alignItems: 'center',
  },
  splashContent: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '80%',
    paddingTop: 80, // Nudges the logo and splash contents down
  },
  logo: {
    width: 240,
    height: 240,
    marginBottom: 25,
    borderRadius: 120, // Round logo styling matching the actual design
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  titleContainer: {
    alignItems: 'center',
  },
  splashTitle: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFD700', // Gold color matching logo
    fontFamily: 'serif',
    letterSpacing: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 5,
  },
  splashSubtitle: {
    fontSize: 16,
    color: '#D2B48C', // Tan/Wood secondary color
    letterSpacing: 2,
    marginTop: 5,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  loadingContainer: {
    marginTop: 50,
    alignItems: 'center',
  },
  spinner: {
    marginBottom: 12,
  },
  loadingText: {
    color: '#D2B48C',
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 1,
  },
  muteButton: {
    position: 'absolute',
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(93, 46, 11, 0.75)', // Semi-transparent mahogany color
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999, // Floating on top of everything
    borderWidth: 1,
    borderColor: '#FFD700',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  muteButtonText: {
    fontSize: 20,
  },
});

export default App;
