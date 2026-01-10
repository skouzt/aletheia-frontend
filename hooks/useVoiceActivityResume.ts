// hooks/useVoiceActivityResume.ts
import { Room, RoomEvent } from 'livekit-client';
import { useCallback, useEffect } from 'react';

export function useVoiceActivityResume(room: Room | null, onResume: () => void, isPaused: boolean) {
  const handleResume = useCallback(onResume, [onResume]);

  useEffect(() => {
    if (!room || !isPaused) return;

    const handleTrackMuted = (pub: any, participant: any) => {
      const track = pub?.track;
      if (track?.kind === 'audio' && track.isMuted === false) {
        console.log('Audio activity detected while paused, triggering resume...');
        handleResume();
      }
    };

    const subscriptionMuted = room.addListener(RoomEvent.TrackMuted, handleTrackMuted);
    const subscriptionUnmuted = room.addListener(RoomEvent.TrackUnmuted, handleTrackMuted);

    return () => {
      subscriptionMuted;
      subscriptionUnmuted;
    };
  }, [room, handleResume, isPaused]);
}