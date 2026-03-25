import RememberOrb, { RememberOrbRef } from "@/components/AnimatedOrb";
import { useCall } from "@/context/CallContext";
import { useSessionController } from "@/hooks/useSessionController";
import { useSessionLimit } from "@/hooks/useSessionLimit";
import { useAuth } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { Redirect, useRouter } from "expo-router";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  Text,
  View,
} from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

import { Dimensions } from "react-native";
const SIZE = Dimensions.get("window").width * 0.75;
const SESSION_PIPELINE_PREP_MS = 15000;



export default function SessionControlScreen() {
  const { isSignedIn, isLoaded } = useAuth();
  
  if (!isLoaded) {
    return (
      <View className="flex-1 justify-center items-center bg-black/50">
        <ActivityIndicator size="large" color="#019863" />
      </View>
    );
  }

  if (!isSignedIn) {
    return <Redirect href="/(auth)/auth" />;
  }

  return <SessionControlContent />;
}

function VoiceAnimatedOrb({ room }: { room: any }) {
  const { isSpeaking, transcript, isInCall } = useCall();
  const { isPaused } = useSessionController(room);
  const translateX = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    cancelAnimation(translateX);
    cancelAnimation(scale);

    if (!isInCall || isPaused) {
      scale.value = withTiming(1, { duration: 500 });
      translateX.value = withTiming(0, { duration: 500 });
      return;
    }

    if (isSpeaking) {
      translateX.value = withRepeat(
        withSequence(
          withTiming(6, { duration: 400, easing: Easing.ease }),
          withTiming(-6, { duration: 400, easing: Easing.ease }),
          withTiming(6, { duration: 400, easing: Easing.ease }),
          withTiming(0, { duration: 400, easing: Easing.ease })
        ),
        -1
      );
      scale.value = withRepeat(
        withSequence(
          withTiming(1.03, { duration: 300 }),
          withTiming(0.97, { duration: 300 })
        ),
        -1,
        true
      );
    } else if (transcript) {
      translateX.value = withTiming(0, { duration: 300 });
      scale.value = withRepeat(
        withSequence(
          withTiming(1.08, { duration: 200, easing: Easing.out(Easing.ease) }),
          withTiming(0.95, { duration: 200, easing: Easing.out(Easing.ease) }),
          withTiming(1, { duration: 200, easing: Easing.out(Easing.ease) })
        ),
        -1,
        true
      );
    } else {
      translateX.value = withTiming(0, { duration: 1000 });
      scale.value = withRepeat(
        withSequence(
          withTiming(1.02, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.98, { duration: 3000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    }
  }, [isInCall, isPaused, isSpeaking, transcript]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { scale: scale.value },
    ],
  }));

  return (
    <Animated.View
  style={[
    animatedStyle,
    {
      width: SIZE,
      height: SIZE,
      borderRadius: SIZE / 2,
      overflow: "hidden",  
    },
  ]}
>
  <RememberOrb />
</Animated.View>
  );
}


function SessionControlContent() {
  const { getToken } = useAuth();
  const router = useRouter();
  const orbRef = useRef<RememberOrbRef>(null);
  const { check ,record } = useSessionLimit();
  const hasRecorded = useRef(false);
  const hasRedirected = useRef(false);

 

  const [isEnding, setIsEnding] = useState(false);
  const [backendReady, setBackendReady] = useState(false);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [isStartingSession, setIsStartingSession] = useState(false);

  const roomName = useMemo(
    () => `aletheia-${Date.now().toString(36)}`,
    []
  );

  const {
    isConnecting,
    isInCall,
    muted,
    toggleMute,
    endCall,
    startCall,
    isSpeaking,
    assistantMessage,
    transcript,
    error,
    room,
  } = useCall();

const handleEndSession = useCallback(async () => {
  if (!isInCall || isEnding) return;

  setIsEnding(true);

  try {
    await endCall();

    if (!hasRecorded.current) {
      hasRecorded.current = true;
      await record(); 
    }

    await new Promise((r) => setTimeout(r, 500));

  } catch (err) {
    console.error("End session failed:", err);
  } finally {
    setIsEnding(false);
  }
}, [isInCall, isEnding, endCall, record]);


useEffect(() => {
  if (!isInCall) return;

  const interval = setInterval(async () => {
    try {
      const usage = await check();

      if (!usage) return;

     if (!usage.allowed && !hasRedirected.current) {
       hasRedirected.current = true;

       console.log("Usage limit reached");

        await handleEndSession();

        setTimeout(() => {
          router.replace("/(modal)/usage");
        }, 500);
      }
    } catch (err) {
      console.error("Usage check failed:", err);
    }
  }, 5000);

  return () => clearInterval(interval);
}, [isInCall, check, handleEndSession, router]); 

const { sessionState, isPaused, pauseSession, resumeSession } =
    useSessionController(room);

 useEffect(() => {
  setBackendReady(true);
}, []);



  useEffect(() => {
    if (!transcript || isPaused || !isInCall || isSpeaking) {
      setIsUserSpeaking(false);
      return;
    }
    
    setIsUserSpeaking(true);
    const timeout = setTimeout(() => setIsUserSpeaking(false), 1500);
    return () => clearTimeout(timeout);
  }, [transcript, isPaused, isInCall, isSpeaking]);

  useEffect(() => {
    if (!isInCall || isPaused) {
      orbRef.current?.setMode(0);
      orbRef.current?.setAmplitude(0.1);
      return;
    }

    if (isSpeaking) {
      orbRef.current?.setMode(2);
      
      const interval = setInterval(() => {
        const pulse = 0.5 + Math.sin(Date.now() * 0.008) * 0.3 + Math.random() * 0.2;
        orbRef.current?.setAmplitude(Math.min(1, pulse));
      }, 50);
      return () => clearInterval(interval);
    }

    if (isUserSpeaking) {
      orbRef.current?.setMode(1);
      
      const interval = setInterval(() => {
        const pulse = 0.4 + Math.sin(Date.now() * 0.012) * 0.4 + Math.random() * 0.2;
        orbRef.current?.setAmplitude(Math.min(1, pulse));
      }, 50);
      return () => clearInterval(interval);
    }

    orbRef.current?.setMode(0);
    orbRef.current?.setAmplitude(0.2);
  }, [isInCall, isPaused, isSpeaking, isUserSpeaking]);



  const proceedWithStart = useCallback(async (): Promise<boolean> => {
    try {
      const { Audio } = await import("expo-av");

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: false,
        playThroughEarpieceAndroid: false,
      });

      let permissionStatus = (await Audio.getPermissionsAsync()).status;
      if (permissionStatus !== "granted") {
        permissionStatus = (await Audio.requestPermissionsAsync()).status;
      }

      if (permissionStatus !== "granted") {
        Alert.alert("Permission Required", "Microphone access is required.");
        return false;
      }

      await startCall(roomName);
      return true;
    } catch (err) {
      console.error("Start call failed:", err);
      Alert.alert("Connection Error", "Unable to connect to Aletheia.");
      return false;
    }
  }, [roomName, startCall]);

  const handleStartSession = useCallback(async () => {
    if (isStartingSession || isConnecting || isEnding || isInCall) return;

    setIsStartingSession(true);
    try {
      const started = await proceedWithStart();
      if (started) {
        await new Promise((resolve) =>
          setTimeout(resolve, SESSION_PIPELINE_PREP_MS)
        );
      }
    } finally {
      setIsStartingSession(false);
    }
  }, [
    isStartingSession,
    isConnecting,
    isEnding,
    isInCall,
    proceedWithStart,
  ]);

 

const handlePauseResume = useCallback(() => {
    if (!isInCall || isConnecting || isStartingSession || isEnding) return;
    isPaused ? resumeSession() : pauseSession();
  }, [
    isInCall,
    isConnecting,
    isStartingSession,
    isEnding,
    isPaused,
    resumeSession,
    pauseSession,
  ]);

  const isSessionLoading = isConnecting || isStartingSession;

  useEffect(() => {
    if (error) {
      Alert.alert("Connection Error", error, [
        { text: "OK", onPress: () => router.replace("/(tabs)/home") },
      ]);
    }
  }, [error, router]);

  const getStatusConfig = () => {
    switch (sessionState) {
      case 'active':
        return {
          icon: 'checkmark-circle' as const,
          color: '#10B981',
          bgColor: '#D1FAE5',
          text: 'Session Active',
        };
      case 'idle':
        return {
          icon: 'time' as const,
          color: '#F59E0B',
          bgColor: '#FEF3C7',
          text: 'Session Paused',
        };
      case 'connecting':
        return {
          icon: 'sync' as const,
          color: '#3B82F6',
          bgColor: '#DBEAFE',
          text: 'Connecting...',
        };
      case 'disconnected':
        return {
          icon: 'close-circle' as const,
          color: '#6B7280',
          bgColor: '#F3F4F6',
          text: 'Disconnected',
        };
    }
  };


  return (
    <View className="flex-1 justify-end bg-black/50">
      <Animated.View
        entering={SlideInDown.duration(400)}
        exiting={SlideOutDown.duration(400)}
        className="bg-[#F6F8F7] rounded-t-[32px] overflow-hidden"
        style={{ height: '90%' }}
      >
        {/* Header with Usage Info */}
        <View className="pt-6 pb-4 px-6 items-center">
          <Text 
            className="text-xl font-semibold text-[#2D3A3A]"
            style={{ fontFamily: 'LibreCaslonText-Bold' }}
          >
            Mindful Conversation
          </Text>
          
          
        </View>

        {/* Main Content Area */}
        <View className="flex-1 items-center justify-center">
  <View
    style={{
      width: "100%",
      maxWidth: 360,
      aspectRatio: 1,
      alignItems: "center",
      justifyContent: "center",
      marginHorizontal: "auto",
    }}
  >

    {isSessionLoading ? (
      <ActivityIndicator size="large" color="#019863" />
    ) : (
      <Suspense fallback={<ActivityIndicator size="large" color="#019863" />}>
        <VoiceAnimatedOrb room={room} />
      </Suspense>
    )}
  </View>
</View>


        {/* Message Preview */}
        {assistantMessage && (
          <View className="px-6 mb-4">
            <View className="p-4 rounded-2xl bg-[#C8DCCF]/40">
              <Text className="text-xs font-semibold text-[#019863] mb-2">
                Aletheia
              </Text>
              <Text className="text-sm text-[#2D3A3A] leading-5">
                {assistantMessage}
              </Text>
            </View>
          </View>
        )}

        {transcript && (
          <View className="px-6 mb-4">
            <View className="p-4 rounded-2xl bg-white/90">
              <Text className="text-xs text-[#2D3A3A]/60 mb-2">
                You
              </Text>
              <Text className="text-sm text-[#2D3A3A] leading-5">
                {transcript}
              </Text>
            </View>
          </View>
        )}

        {/* Bottom Controls */}
        <View className="px-6 pb-8">
          <View 
            className="rounded-3xl p-5"
            style={{ backgroundColor: '#E8F0ED' }}
          >
            {isInCall && (
              <Animated.View 
                entering={FadeIn.duration(300)}
                exiting={FadeOut.duration(300)}
                className="flex-row gap-3 mb-3"
              >
                <Pressable
                  onPress={toggleMute}
                  disabled={isSessionLoading || isEnding}
                  className="flex-1"
                  style={{
                    height: 50,
                    borderRadius: 14,
                    backgroundColor: '#A8BFB3',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: (isSessionLoading || isEnding) ? 0.5 : 1,
                  }}
                >
                  <Ionicons
                    name={muted ? "mic-off" : "mic"}
                    size={22}
                    color="#2D3A3A"
                  />
                </Pressable>

                <Pressable
                  onPress={handlePauseResume}
                  disabled={isSessionLoading || isEnding}
                  className="flex-1"
                  style={{
                    height: 50,
                    borderRadius: 14,
                    backgroundColor: '#A8BFA3',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: (isSessionLoading || isEnding) ? 0.5 : 1,
                  }}
                >
                  <Ionicons
                    name={isPaused ? "play" : "pause"}
                    size={22}
                    color="#2D3A3A"
                  />
                </Pressable>
              </Animated.View>
            )}

            <Pressable
              onPress={isInCall ? handleEndSession : handleStartSession}
              disabled={!backendReady || isEnding || isSessionLoading}
              style={{
                height: 50,
                borderRadius: 14,
                backgroundColor: isInCall ? '#C88A7A' : '#019863',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: (!backendReady || isEnding || isSessionLoading) ? 0.5 : 1,
              }}
            >
              {(isEnding || isSessionLoading) ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text 
                  className="text-white font-bold text-base tracking-wide"
                  style={{ fontFamily: 'LibreCaslonText-Bold' }}
                >
                  {isInCall ? "END SESSION" : "START SESSION"}
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}
