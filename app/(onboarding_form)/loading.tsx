import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Image, Text, View } from 'react-native';

const { height } = Dimensions.get("window");

const LoadingScreen = () => {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(1)).current;
  const subTextOpacity = useRef(new Animated.Value(0)).current;
  const [loadingText, setLoadingText] = useState('Inhale…');

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    const timer1 = setTimeout(() => {
      Animated.timing(textOpacity, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }).start();
    }, 1500);

    const timer2 = setTimeout(() => {
      setLoadingText('Exhale…');
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }).start();
    }, 2300);

    const timer3 = setTimeout(() => {
      Animated.timing(subTextOpacity, {
        toValue: 1,
        duration: 900,
        useNativeDriver: true,
      }).start();
    }, 3200);

    const timer4 = setTimeout(() => {
      router.push('/(tabs)/home');
    }, 5000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, []);

  return (
    <View className="flex-1 bg-[#F6F8F7]">
      <Animated.View
        className="flex-1 justify-center items-center px-6"
        style={{
          opacity: fadeAnim,
          transform: [
            {
              translateY: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [12, 0],
              }),
            },
          ],
        }}
      >
        {/* Center Content */}
        <View className="items-center">

          {/*GIF - about half screen height */}
         <Image
            source={require('../../assets/images/Mental health.gif')}
            style={{
              width: '70%',
              height: undefined,
              aspectRatio: 1, // keeps shape correct
              marginBottom: 40, // more breathing room
              marginTop: 20,    // slight upward spacing
            }}
            resizeMode="contain"
          />


          {/* Breathing Text */}
          <Animated.Text
            style={{
              opacity: textOpacity,
              fontFamily: "LibreCaslonText-Bold",
              fontSize: 32,
              textAlign: "center",
              color: "#2C3A3A",
              marginBottom: 4,
            }}
          >
            {loadingText}
          </Animated.Text>

          {/* Subtext */}
          <Animated.Text
            style={{
              opacity: subTextOpacity,
              fontFamily: "LibreCaslonText-Regular",
              fontSize: 17,
              textAlign: "center",
              color: "#6D807F",
            }}
          >
            Your space is loading.
          </Animated.Text>
        </View>
      </Animated.View>

      {/* Footer */}
      <View className="px-6 pb-8 items-center">
        <Text
          style={{
            fontFamily: "LibreCaslonText-Regular",
            fontSize: 13,
            color: "#8C9C99",
            textAlign: "center",
          }}
        >
          Your experience is private and secure.
        </Text>
      </View>
    </View>
  );
};

export default LoadingScreen;
