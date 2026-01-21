import { aletheiaApi } from '@/services/aletheiaApi';
import { useAuth } from '@clerk/clerk-expo';
import { AudioSession } from '@livekit/react-native';
import {
  ConnectionState,
  DataPacket_Kind,
  DisconnectReason,
  Participant,
  RemoteParticipant,
  Room,
  RoomEvent,
  Track,
} from 'livekit-client';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef, // ⭐ Added
  useState,
} from 'react';
import { Alert, PermissionsAndroid, Platform } from 'react-native';

interface CallContextType {
  isConnecting: boolean;
  isInCall: boolean;
  callId: string | null;
  roomName: string | null;
  isSpeaking: boolean;
  transcript: string;
  assistantMessage: string;
  muted: boolean;
  sessionState: 'active' | 'idle';
  startCall: (roomName: string, userId?: string) => Promise<void>;
  endCall: () => Promise<void>;
  toggleMute: () => void;
  toggleSessionPause: () => void;
  error: string | null;
  room: Room | null;
}

const CallContext = createContext<CallContextType | undefined>(undefined);

export function CallProvider({ children }: { children: React.ReactNode }) {
  const { getToken } = useAuth();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isInCall, setIsInCall] = useState(false);
  const [callId, setCallId] = useState<string | null>(null);
  const [roomName, setRoomName] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [assistantMessage, setAssistantMessage] = useState('');
  const [muted, setMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [sessionState, setSessionState] = useState<'active' | 'idle'>('active');
  
  // ⭐ Use ref to track room without causing re-renders
  const roomRef = useRef<Room | null>(null);

  const requestAudioPermissions = useCallback(async (): Promise<boolean> => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: 'Microphone Permission',
            message: 'Aletheia needs access to your microphone for therapy sessions.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );

        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          return true;
        } else {
          Alert.alert(
            'Permission Required',
            'Microphone access is required for therapy sessions. Please enable it in your device settings.',
            [{ text: 'OK' }],
          );
          return false;
        }
      } catch (err) {
        console.warn('Permission error:', err);
        return false;
      }
    }
    return true;
  }, []);

  const configureAudioSession = useCallback(async () => {
    if (Platform.OS !== 'web') {
      await AudioSession.startAudioSession();
    }
  }, []);

  const resetCallState = useCallback(() => {
    setCallId(null);
    setRoomName(null);
    setIsSpeaking(false);
    setTranscript('');
    setAssistantMessage('');
    setMuted(false);
    setSessionState('active');
    setError(null);
  }, []);

  const cleanup = useCallback(() => {
    setIsInCall(false);
    resetCallState();
    roomRef.current = null; // ⭐ Clear ref
  }, [resetCallState]);

  const endCall = useCallback(async () => {
    try {

      if (roomRef.current) { // ⭐ Use ref instead of state
        try {
          await roomRef.current.disconnect();
        } catch (leaveError) {
          console.warn('Error disconnecting room:', leaveError);
        }
        setRoom(null);
        roomRef.current = null;
      }

      if (Platform.OS !== 'web') {
        await AudioSession.stopAudioSession();
      }

      cleanup();
    } catch (err) {
      console.error('Error ending call:', err);
      setError('Error ending call');
      cleanup();
    }
  }, [cleanup]);

  const startCall = useCallback(
    async (roomName: string, userId?: string) => {
      // ⭐ Check ref instead of state to avoid stale closure
      if (isConnecting || isInCall || roomRef.current) {
        return;
      }

      try {
        setIsConnecting(true);
        setError(null);

        const hasPermission = await requestAudioPermissions();
        if (!hasPermission) {
          setError('Microphone permission is required for therapy sessions');
          setIsConnecting(false);
          return;
        }

        await configureAudioSession();

        try {
          const health = await aletheiaApi.healthCheck();
          if (health.status === 'ok' || health.status === 'unknown') {
          }
        } catch (healthError) {
          console.warn('Backend health check skipped');
        }

        const authToken = await getToken({ template: "backend-api" });

        if (!authToken) {
          throw new Error("Failed to retrieve auth token");
        }

        const connectionData = await aletheiaApi.connect(
          authToken,
          roomName,
          userId
        );


        const firstMsg =
          "Hey, I'm Aletheia. Think of me as a space where your thoughts can unfold and take shape. What's on your mind?";
        setAssistantMessage(firstMsg);


        const newRoom = new Room({
          adaptiveStream: true,
          dynacast: true,
        });

        newRoom.on(RoomEvent.Connected, () => {
          setIsInCall(true);
          setIsConnecting(false);
        });

        newRoom.on(RoomEvent.Disconnected, (reason?: DisconnectReason) => {
          setIsInCall(false);
          cleanup();
        });

        newRoom.on(
          RoomEvent.ConnectionStateChanged,
          (state: ConnectionState) => {
            if (state === ConnectionState.Disconnected) {
              setIsInCall(false);
              cleanup();
            }
          }
        );

        newRoom.on(
          RoomEvent.ParticipantConnected,
          (participant: RemoteParticipant) => {
          }
        );

        newRoom.on(
          RoomEvent.ParticipantDisconnected,
          (participant: RemoteParticipant) => {
          }
        );

        newRoom.on(RoomEvent.AudioPlaybackStatusChanged, (playing: boolean) => {
        });

        newRoom.on(
          RoomEvent.TrackSubscribed,
          (track: Track, publication: any, participant: Participant) => {
            if (track.kind === Track.Kind.Audio && !participant.isLocal) {
            }
          }
        );

        newRoom.on(
          RoomEvent.TrackUnsubscribed,
          (track: Track, publication: any, participant: Participant) => {
            if (track.kind === Track.Kind.Audio && !participant.isLocal) {
            }
          }
        );

        newRoom.on(
          RoomEvent.DataReceived,
          (payload: Uint8Array, participant?: RemoteParticipant, kind?: DataPacket_Kind) => {
            try {
              const messageStr = new TextDecoder().decode(payload);
              const data = JSON.parse(messageStr);

              if (data.type === 'session_state_change') {
                setSessionState(data.state);
                return;
              }

              if (data.type === 'transcript') {
                if (data.role === 'user') {
                  setTranscript(data.text);
                } else if (data.role === 'assistant') {
                  setAssistantMessage(data.text);
                }
              } else if (data.type === 'speaking') {
                setIsSpeaking(data.speaking);
              }
            } catch (err) {
              console.error('Error parsing data message:', err);
            }
          }
        );

        const livekitUrl = connectionData.room_url;
        const livekitToken = connectionData.user_token || connectionData.token;

        if (!livekitUrl || !livekitToken) {
          throw new Error('No LiveKit URL or token provided by backend');
        }

        setRoomName(connectionData.room_name);

        await newRoom.connect(livekitUrl, livekitToken);

        // ⭐ Set both state and ref
        setRoom(newRoom);
        roomRef.current = newRoom;

        setCallId(connectionData.bot_pid?.toString() || 'unknown');
        setSessionState('active');

        await newRoom.localParticipant.setMicrophoneEnabled(true);
      } catch (err) {
        console.error('Error starting call:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to start call';
        setError(errorMessage);
        setIsConnecting(false);
        await endCall();
        cleanup();
      }
    },
    [
      isConnecting,
      isInCall,
      requestAudioPermissions,
      configureAudioSession,
      cleanup,
      endCall,
      getToken,
    ]
  );

  const toggleMute = useCallback(async () => {
    if (roomRef.current) { // ⭐ Use ref
      try {
        const newMutedState = !muted;
        await roomRef.current.localParticipant.setMicrophoneEnabled(!newMutedState);
        setMuted(newMutedState);

        const payload = JSON.stringify({ type: 'mute', muted: newMutedState });
        const encoder = new TextEncoder();

        await roomRef.current.localParticipant.publishData(
          encoder.encode(payload),
          { reliable: true }
        );
      } catch (err) {
        console.error('Error toggling mute:', err);
      }
    }
  }, [muted]); // ⭐ REMOVED: room from dependencies

  const toggleSessionPause = useCallback(async () => {
    if (roomRef.current?.localParticipant) { // ⭐ Use ref
      try {
        const action = sessionState === 'active' ? 'pause' : 'resume';
        const payload = JSON.stringify({ type: 'session_control', action });
        const encoder = new TextEncoder();

        await roomRef.current.localParticipant.publishData(
          encoder.encode(payload),
          { reliable: true }
        );
        
      } catch (err) {
        console.error('Error toggling session pause:', err);
      }
    }
  }, [sessionState]); // ⭐ REMOVED: room from dependencies

  // ⭐ FIXED: Proper unmount cleanup (only runs on unmount)
  useEffect(() => {
    return () => {
      if (roomRef.current?.state === "connected") {
        roomRef.current.disconnect();
      }
      cleanup();
    };
  }, []); // ⭐ Empty dependency array

  return (
    <CallContext.Provider
      value={{
        isConnecting,
        isInCall,
        callId,
        roomName,
        isSpeaking,
        transcript,
        assistantMessage,
        muted,
        sessionState,
        startCall,
        endCall,
        toggleMute,
        toggleSessionPause,
        error,
        room,
      }}
    >
      {children}
    </CallContext.Provider>
  );
}

export function useCall() {
  const context = useContext(CallContext);
  if (context === undefined) {
    throw new Error('useCall must be used within a CallProvider');
  }
  return context;
}
