import { Ionicons } from '@expo/vector-icons';
import { Room } from 'livekit-client';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useSessionController } from '../hooks/useSessionController';

interface Props { room: Room | null; }

export function SessionControlButton({ room }: Props) {
  const { sessionState, pauseSession, resumeSession, isPaused } = useSessionController(room);

  if (sessionState === 'disconnected' || sessionState === 'connecting') {
    return null;
  }

  return (
    <TouchableOpacity
      onPress={isPaused ? resumeSession : pauseSession}
      style={[styles.button, isPaused ? styles.resumeButton : styles.pauseButton]}
    >
      <Ionicons 
        name={isPaused ? 'play-circle' : 'pause-circle'} 
        size={24} 
        color="#FFFFFF" 
      />
      <Text style={styles.buttonText}>
        {isPaused ? 'Resume Session' : 'Pause Session'}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 30,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  pauseButton: { backgroundColor: '#F59E0B' },
  resumeButton: { backgroundColor: '#10B981' },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});