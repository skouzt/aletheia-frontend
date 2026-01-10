import { useCall } from '@/context/CallContext';
import { useCallback, useMemo } from 'react';

export type SessionState = 'active' | 'idle' | 'connecting' | 'disconnected';
export type SessionAction = 'pause' | 'resume';

export function useSessionController(_room: any) {
  const { sessionState: rawSessionState, toggleSessionPause, isConnecting, isInCall } = useCall();

  const sessionState: SessionState = useMemo(() => {
    if (isConnecting) return 'connecting';
    if (!isInCall) return 'disconnected';
    return rawSessionState; // 'active' or 'idle'
  }, [rawSessionState, isConnecting, isInCall]);

  const pauseSession = useCallback(() => {
    if (sessionState === 'active') {
      toggleSessionPause();
    }
  }, [sessionState, toggleSessionPause]);

  const resumeSession = useCallback(() => {
    if (sessionState === 'idle') {
      toggleSessionPause();
    }
  }, [sessionState, toggleSessionPause]);

  return {
    sessionState,
    pauseSession,
    resumeSession,
    isPaused: sessionState === 'idle',
    isActive: sessionState === 'active'
  };
}