// components/SessionStatusIndicator.tsx
import { Room } from 'livekit-client';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useSessionController } from '../hooks/useSessionController';

interface SessionStatusIndicatorProps {
  room: Room | null;
}

export function SessionStatusIndicator({ room }: SessionStatusIndicatorProps) {
  const { sessionState } = useSessionController(room);

  const getStatusConfig = () => {
    switch (sessionState) {
      case 'active':
        return {
          icon: 'checkmark-circle',
          color: '#10B981',
          bgColor: '#D1FAE5',
          text: 'Session Active',
        };
      case 'idle':
        return {
          icon: 'time',
          color: '#F59E0B',
          bgColor: '#FEF3C7',
          text: 'Session Paused - Say "hello" to resume',
        };
      case 'connecting':
        return {
          icon: 'sync',
          color: '#3B82F6',
          bgColor: '#DBEAFE',
          text: 'Connecting...',
        };
      case 'disconnected':
        return {
          icon: 'wifi-off',
          color: '#6B7280',
          bgColor: '#F3F4F6',
          text: 'Disconnected',
        };
    }
  };

  const config = getStatusConfig();

  return (
    <View style={[styles.container, { backgroundColor: config.bgColor }]}>
      <Icon name={config.icon} size={20} color={config.color} />
      <Text style={[styles.text, { color: config.color }]}>
        {config.text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    gap: 8,
  },
  text: {
    fontSize: 14,
    fontWeight: '500',
  },
});