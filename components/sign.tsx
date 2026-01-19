import { useAuth, useSignIn, useSignUp, useSSO } from '@clerk/clerk-expo';
import * as AuthSession from "expo-auth-session";
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';

import React, { useEffect, useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';


// Debug component


export const useWarmUpBrowser = () => {
  useEffect(() => {
    WebBrowser.maybeCompleteAuthSession(); // ✅ Add this here

    if (Platform.OS !== 'android') return;
    void WebBrowser.warmUpAsync();
    return () => {
      void WebBrowser.coolDownAsync();
    };
  }, []);
};



const redirectUrl = AuthSession.makeRedirectUri({
  scheme: "aletheia",
  path: "auth",
});




const AnimatedView = Animated.createAnimatedComponent(View);

const MiraWelcomeScreen = () => {

  useWarmUpBrowser();
  
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.replace('/');
    }
  }, [isLoaded, isSignedIn]);
  // Modal states
  const [signInModalVisible, setSignInModalVisible] = useState(false);
  const [signUpModalVisible, setSignUpModalVisible] = useState(false);

  // Sign In Logic
  const { signIn, setActive: setSignInActive, isLoaded: signInLoaded } = useSignIn();
  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');

  // Sign Up Logic
  const { isLoaded: signUpLoaded, signUp, setActive: setSignUpActive } = useSignUp();
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState('');

  // SSO (Google)
  const { startSSOFlow } = useSSO();

  // Animation
  const contentProgress = useSharedValue(0);

  useEffect(() => {
    setTimeout(() => {
      contentProgress.value = withTiming(1, {
        duration: 700,
        easing: Easing.out(Easing.quad),
      });
    }, 1000);
  }, [contentProgress]);

  const animatedContentStyle = useAnimatedStyle(() => {
    const translateY = (1 - contentProgress.value) * 30;
    return {
      opacity: contentProgress.value,
      transform: [{ translateY }],
    };
  });

  const animatedButtonStyle = useAnimatedStyle(() => {
    const translateY = (1 - contentProgress.value) * 15;
    return {
      opacity: contentProgress.value,
      transform: [{ translateY }],
    };
  });

  const onGooglePress = React.useCallback(async () => {
    try {      
      const { createdSessionId, signIn, signUp, setActive } = await startSSOFlow({
        strategy: 'oauth_google',
      });
      // If we have a session, set it as active
      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
        router.replace('/');
        return;
      }

      // Handle transfer flow (if user needs to complete sign-in/sign-up)
      if (signUp?.verifications?.externalAccount?.status === 'transferable') {
        await signUp.create({ transfer: true });
        await setActive?.({ session: signUp.createdSessionId });
        router.replace('/');
        return;
      }

      if (signIn?.firstFactorVerification?.status === 'transferable') {
        await signIn.create({ transfer: true });
        await setActive?.({ session: signIn.createdSessionId });
        router.replace('/');
        return;
      }

      
    } catch (err: any) {
      console.error('❌ Google OAuth failed:', err);
      console.error('Error details:', {
        message: err.message,
        errors: err.errors,
        clerkError: err.clerkError
      });
    }
  }, [startSSOFlow, router]);


  
// Email Sign In
const onSignInPress = async () => {
  
  if (!signInLoaded) {
    return;
  }
  
  try {
    const signInAttempt = await signIn.create({
      identifier: emailAddress,
      password,
    });

   

    if (signInAttempt.status === 'complete') {
      await setSignInActive({ session: signInAttempt.createdSessionId });
      router.replace('/');
    } else {
      console.log('Sign in not complete - status:', signInAttempt.status);
    }
  } catch (err) {
    console.error('Sign in error:', err);
  }
};

  // Email/Password Sign Up
  const onSignUpPress = async () => {
    
    if (!signUpLoaded) {
      return;
    }
    
    try {
      await signUp.create({
        emailAddress: signUpEmail,
        password: signUpPassword,
      });

      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setPendingVerification(true);
    } catch (err: any) {
      console.error('Sign up error:', JSON.stringify(err, null, 2));
      if (err.errors && err.errors.length > 0) {
        alert(err.errors[0].message);
      }
    }
  };

  // Email Verification
  const onVerifyPress = async () => {
    
    if (!signUpLoaded) {
      return;
    }
    
    try {
      const signUpAttempt = await signUp.attemptEmailAddressVerification({ code });

      if (signUpAttempt.status === 'complete') {
        await setSignUpActive({ session: signUpAttempt.createdSessionId });
        
        setSignUpModalVisible(false);
        setPendingVerification(false);
        router.replace('/');
      } else {
        alert(`Verification failed: ${JSON.stringify(signUpAttempt)}`);
      }
    } catch (err: any) {
      if (err.errors && err.errors.length > 0) {
        alert(err.errors[0].message);
      }
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
      <View className="flex-1 p-4">
        {/* Animated Welcome */}
        <AnimatedView
          style={animatedContentStyle}
          className="flex-1 items-center justify-center max-w-xl w-full self-center opacity-0"
        >
          <View className="flex-1" />
          <View className="w-full px-4 mb-8">
            <Text className="text-4xl font-extrabold leading-10 text-[#0d1c17] text-center pb-2">
              Your Non-Judgmental Listening Ear.
            </Text>
            <Text className="text-sm leading-5 text-[#499c7f] text-center">
              Aletheia is always here — find immediate, confidential support without the wait or the worry of being judged.
            </Text>
          </View>
          <Image
              source={require('@/assets/images/Anxiety.gif')}
              resizeMode="contain"
              style={{
                width: 320,
                height: 320,
                marginBottom: 28,
              }}
            />
          <View className="flex-1" />
        </AnimatedView>

        {/* Buttons */}
        <AnimatedView
          style={animatedButtonStyle}
          className="w-full max-w-xl self-center px-4 py-3 gap-3 opacity-0"
        >
          <TouchableOpacity
            onPress={() => setSignUpModalVisible(true)}
            className="h-12 bg-[#019863] rounded-xl items-center justify-center px-5"
          >
            <Text className="text-base font-bold tracking-widest text-white">SIGN UP</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setSignInModalVisible(true)}
            className="h-12 bg-[#e0e7e5] rounded-xl items-center justify-center px-5"
          >
            <Text className="text-base font-bold tracking-widest text-[#0d1c17]">LOG IN</Text>
          </TouchableOpacity>
        </AnimatedView>
      </View>

      {/* Sign In Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={signInModalVisible}
        onRequestClose={() => setSignInModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1 justify-end"
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => setSignInModalVisible(false)}
            className="bg-black/50 flex-1"
          />
          <ScrollView
                keyboardShouldPersistTaps="handled"
                automaticallyAdjustKeyboardInsets
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{
                  paddingBottom: 24,
                }}
                className="bg-white rounded-t-3xl p-6 max-h-[90%]"
              >
            <View className="w-12 h-1 bg-gray-300 rounded-full self-center mb-4" />
            <Text className="text-2xl font-bold text-[#0d1c17] mb-6">Sign In</Text>

            <TouchableOpacity
              onPress={onGooglePress}
              className="h-12 bg-[#4285F4] rounded-xl items-center justify-center mb-4"
            >
              <Text className="text-base font-bold text-white">Sign in with Google</Text>
            </TouchableOpacity>

            <View className="flex-row items-center my-2">
              <View className="flex-1 h-px bg-gray-300" />
              <Text className="mx-4 text-gray-500">OR</Text>
              <View className="flex-1 h-px bg-gray-300" />
            </View>

            <TextInput
              autoCapitalize="none"
              value={emailAddress}
              placeholder="Enter email"
              onChangeText={setEmailAddress}
              className="h-12 bg-[#f5f5f5] rounded-xl px-4 mb-4 mt-2"
            />
            <TextInput
              value={password}
              placeholder="Enter password"
              secureTextEntry={true}
              onChangeText={setPassword}
              className="h-12 bg-[#f5f5f5] rounded-xl px-4 mb-6"
            />

            <TouchableOpacity
              onPress={onSignInPress}
              className="h-12 bg-[#019863] rounded-xl items-center justify-center mb-4"
            >
              <Text className="text-base font-bold text-white">Continue</Text>
            </TouchableOpacity>

            <View className="flex-row justify-center items-center gap-1">
              <Text className="text-gray-600">Don't have an account?</Text>
              <TouchableOpacity
                onPress={() => {
                  setSignInModalVisible(false);
                  setSignUpModalVisible(true);
                }}
              >
                <Text className="text-[#019863] font-semibold">Sign up</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>

        </KeyboardAvoidingView>
      </Modal>

      {/* Sign Up Modal */}
      
       <Modal
  animationType="slide"
  transparent
  visible={signUpModalVisible}
  onRequestClose={() => setSignUpModalVisible(false)}
>
  
    {/* Overlay */}
    <TouchableOpacity
      activeOpacity={1}
      onPress={() => {
        setSignUpModalVisible(false);
        setPendingVerification(false);
      }}
      style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }}
    />

    {/* Bottom Sheet */}
    <View
      style={{
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        height: '85%',          // 🔑 FIXED HEIGHT (not maxHeight)
      }}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          padding: 24,
          paddingBottom: 40,
        }}
      >
        <View className="w-12 h-1 bg-gray-300 rounded-full self-center mb-4" />

        {pendingVerification ? (
          <>
            <Text className="text-2xl font-bold text-[#0d1c17] mb-2">
              Verify your email
            </Text>
            <Text className="text-gray-600 mb-6">
              Enter the verification code sent to your email
            </Text>

            <TextInput
              value={code}
              placeholder="Enter verification code"
              onChangeText={setCode}
              keyboardType="number-pad"
              className="h-12 bg-[#f5f5f5] rounded-xl px-4 mb-6 text-center text-lg tracking-widest"
            />

            <TouchableOpacity
              onPress={onVerifyPress}
              className="h-12 bg-[#019863] rounded-xl items-center justify-center"
            >
              <Text className="text-base font-bold text-white">Verify</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text className="text-2xl font-bold text-[#0d1c17] mb-6">
              Sign Up
            </Text>

                <TouchableOpacity
                  onPress={onGooglePress}
                  className="h-12 bg-[#4285F4] rounded-xl items-center justify-center mb-4"
                >
                  <Text className="text-base font-bold text-white">Sign up with Google</Text>
                </TouchableOpacity>

                <View className="flex-row items-center my-2">
                  <View className="flex-1 h-px bg-gray-300" />
                  <Text className="mx-4 text-gray-500">OR</Text>
                  <View className="flex-1 h-px bg-gray-300" />
                </View>

                <TextInput
                  autoCapitalize="none"
                  value={signUpEmail}
                  placeholder="Enter email"
                  onChangeText={setSignUpEmail}
                  className="h-12 bg-[#f5f5f5] rounded-xl px-4 mb-4 mt-2"
                />
                <TextInput
                  value={signUpPassword}
                  placeholder="Enter password"
                  secureTextEntry={true}
                  onChangeText={setSignUpPassword}
                  className="h-12 bg-[#f5f5f5] rounded-xl px-4 mb-6"
                />

                <TouchableOpacity
                  onPress={onSignUpPress}
                  className="h-12 bg-[#019863] rounded-xl items-center justify-center mb-4"
                >
                  <Text className="text-base font-bold text-white">Continue</Text>
                </TouchableOpacity>

                <View className="flex-row justify-center items-center gap-1">
                  <Text className="text-gray-600">Already have an account?</Text>
                  <TouchableOpacity
                    onPress={() => {
                      setSignUpModalVisible(false);
                      setSignInModalVisible(true);
                    }}
                  >
                    <Text className="text-[#019863] font-semibold">Sign in</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
      </ScrollView>
      </View>
      </Modal>
    </SafeAreaView>
  );
};

export default MiraWelcomeScreen;