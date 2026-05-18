/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';

// Mock react-native-sound native module
jest.mock('react-native-sound', () => {
  const SoundMock = function (this: any, filename: string, type: any, callback: (error?: any) => void) {
    if (callback) {
      // Simulate successful load in test environment
      setTimeout(() => callback(null), 0);
    }
  };

  SoundMock.prototype.setNumberOfLoops = jest.fn();
  SoundMock.prototype.setVolume = jest.fn();
  SoundMock.prototype.play = jest.fn((cb) => {
    if (cb) cb(true);
  });
  SoundMock.prototype.stop = jest.fn();
  SoundMock.prototype.release = jest.fn();

  (SoundMock as any).setCategory = jest.fn();
  (SoundMock as any).MAIN_BUNDLE = 0;

  return SoundMock;
});

import App from '../App';

test('renders correctly', async () => {
  await ReactTestRenderer.act(() => {
    ReactTestRenderer.create(<App />);
  });
});
