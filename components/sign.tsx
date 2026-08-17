import { LilyGlow, LilyWelcomeArt } from '@/components/lily/LilyWelcomeArt';
import { LilyColors, LilyFonts, LilyGradients } from '@/constants/lily';
import { useAuth, useSSO, useSignIn, useSignUp } from '@clerk/clerk-expo';
import * as AuthSession from 'expo-auth-session';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';

import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const useWarmUpBrowser = () => {
  useEffect(() => {
    WebBrowser.maybeCompleteAuthSession();

    if (Platform.OS !== 'android') return;
    void WebBrowser.warmUpAsync();
    return () => {
      void WebBrowser.coolDownAsync();
    };
  }, []);
};

const redirectUrl = AuthSession.makeRedirectUri({
  scheme: 'aletheia',
  path: 'auth',
});

const AnimatedView = Animated.createAnimatedComponent(View);

const MiraWelcomeScreen = () => {
  useWarmUpBrowser();

  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isLoaded, isSignedIn } = useAuth();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.replace('/');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
        router.replace('/');
        return;
      }

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
        clerkError: err.clerkError,
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
    <View style={{ flex: 1, backgroundColor: LilyColors.ground, overflow: 'hidden' }}>
      {/* Radial washes — RN has no radial CSS gradient, so these are SVG ellipses */}
      <View
        pointerEvents="none"
        style={{ position: 'absolute', top: -140, left: '50%', marginLeft: -260 }}
      >
        <LilyGlow width={520} height={420} color="#1F8C58" opacity={0.22} stopAt={0.68} />
      </View>
      <View
        pointerEvents="none"
        style={{ position: 'absolute', bottom: -60, left: '50%', marginLeft: -230 }}
      >
        <LilyGlow width={460} height={300} color="#146B45" opacity={0.2} stopAt={0.7} />
      </View>

      <AnimatedView
        style={[
          animatedContentStyle,
          { paddingTop: Math.max(insets.top, 20) + 40, paddingHorizontal: 30, alignItems: 'center' },
        ]}
      >
        <Text
          style={{
            fontFamily: LilyFonts.serif,
            fontSize: 39,
            lineHeight: 44,
            letterSpacing: 0.2,
            textAlign: 'center',
            color: LilyColors.textPrimary,
            marginTop: 20,
          }}
        >
          Your non-judgmental listening ear.
        </Text>
        <Text
          style={{
            fontSize: 13.5,
            lineHeight: 22,
            textAlign: 'center',
            fontFamily: LilyFonts.sans,
            color: LilyColors.textMuted,
            marginTop: 12,
            paddingHorizontal: 6,
          }}
        >
          Lily is always here — immediate, confidential support, without the wait or the worry of
          being judged.
        </Text>
      </AnimatedView>

      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          paddingTop: 6,
          minHeight: 0,
        }}
      >
        <LilyWelcomeArt />
      </View>

      <AnimatedView
        style={[animatedButtonStyle, { paddingHorizontal: 22, paddingBottom: Math.max(insets.bottom, 16) + 18 }]}
      >
        {/* Trust row */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 16,
            paddingBottom: 20,
          }}
        >
          <Text style={{ fontSize: 11.5, fontFamily: LilyFonts.sans, color: LilyColors.textFaint }}>
            End-to-end private
          </Text>
          <View style={{ width: 3, height: 3, borderRadius: 1.5, backgroundColor: '#2B3B33' }} />
          <Text style={{ fontSize: 11.5, fontFamily: LilyFonts.sans, color: LilyColors.textFaint }}>
            No waitlist
          </Text>
          <View style={{ width: 3, height: 3, borderRadius: 1.5, backgroundColor: '#2B3B33' }} />
          <Text style={{ fontSize: 11.5, fontFamily: LilyFonts.sans, color: LilyColors.textFaint }}>
            Free to start
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => setSignUpModalVisible(true)}
          activeOpacity={0.9}
          style={{
            borderRadius: 100,
            overflow: 'hidden',
            shadowColor: '#0B4429',
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.55,
            shadowRadius: 28,
          }}
        >
          <LinearGradient
            colors={LilyGradients.signUp}
            start={{ x: 0.1, y: 0 }}
            end={{ x: 0.9, y: 1 }}
            style={{ paddingVertical: 18, paddingHorizontal: 20, alignItems: 'center' }}
          >
            <Text
              style={{
                fontSize: 14,
                fontFamily: LilyFonts.sansBold,
                letterSpacing: 1.6,
                color: '#DCF3E6',
              }}
            >
              SIGN UP
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setSignInModalVisible(true)}
          activeOpacity={0.9}
          style={{
            marginTop: 11,
            backgroundColor: LilyColors.surfaceButton,
            borderWidth: 1,
            borderColor: LilyColors.hairlineBright,
            borderRadius: 100,
            paddingVertical: 18,
            paddingHorizontal: 20,
            alignItems: 'center',
          }}
        >
          <Text
            style={{
              fontSize: 14,
              fontFamily: LilyFonts.sansSemi,
              letterSpacing: 1.6,
              color: LilyColors.textStrong,
            }}
          >
            LOG IN
          </Text>
        </TouchableOpacity>

        <Text
          style={{
            textAlign: 'center',
            fontSize: 11,
            lineHeight: 17,
            color: '#5E7268',
            fontFamily: LilyFonts.sans,
            marginTop: 14,
            paddingHorizontal: 12,
          }}
        >
          Lily is an AI companion, not a therapist or crisis service. By continuing you agree to our{' '}
          <Text style={{ color: '#7FCBA4' }} onPress={() => router.push('/(privacy)')}>
            Terms
          </Text>{' '}
          and{' '}
          <Text style={{ color: '#7FCBA4' }} onPress={() => router.push('/(privacy)')}>
            Privacy Policy
          </Text>
          .
        </Text>
      </AnimatedView>

      {/* Sign In Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={signInModalVisible}
        onRequestClose={() => setSignInModalVisible(false)}
        statusBarTranslucent
      >
        <KeyboardAvoidingView behavior="padding" style={{ flex: 1, justifyContent: 'flex-end' }}>
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => setSignInModalVisible(false)}
            style={{ flex: 1, backgroundColor: LilyColors.scrim }}
          />

          <ScrollView
            keyboardShouldPersistTaps="handled"
            automaticallyAdjustKeyboardInsets
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 24 }}
            style={{
              backgroundColor: LilyColors.ground,
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              borderTopWidth: 1,
              borderTopColor: LilyColors.hairlineBright,
              padding: 24,
              maxHeight: '90%',
            }}
          >
            <View
              style={{
                width: 44,
                height: 4,
                backgroundColor: 'rgba(255,255,255,0.18)',
                borderRadius: 3,
                alignSelf: 'center',
                marginBottom: 20,
              }}
            />
            <Text
              style={{
                fontSize: 24,
                fontFamily: LilyFonts.serif,
                color: LilyColors.textPrimary,
                marginBottom: 22,
              }}
            >
              Sign In
            </Text>

            <TouchableOpacity
              onPress={onGooglePress}
              activeOpacity={0.85}
              style={{
                height: 50,
                backgroundColor: '#FFFFFF',
                borderRadius: 14,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
              }}
            >
              <Text style={{ fontSize: 15, fontFamily: LilyFonts.sansSemi, color: '#1F1F1F' }}>
                Sign in with Google
              </Text>
            </TouchableOpacity>

            <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 8 }}>
              <View style={{ flex: 1, height: 1, backgroundColor: LilyColors.hairline }} />
              <Text
                style={{
                  marginHorizontal: 16,
                  fontFamily: LilyFonts.sans,
                  fontSize: 12,
                  color: LilyColors.textFaint,
                }}
              >
                OR
              </Text>
              <View style={{ flex: 1, height: 1, backgroundColor: LilyColors.hairline }} />
            </View>

            <TextInput
              autoCapitalize="none"
              keyboardType="email-address"
              value={emailAddress}
              placeholder="Enter email"
              placeholderTextColor={LilyColors.textFaint}
              onChangeText={setEmailAddress}
              style={{
                height: 50,
                backgroundColor: LilyColors.surface,
                borderWidth: 1,
                borderColor: LilyColors.hairline,
                borderRadius: 14,
                paddingHorizontal: 16,
                marginTop: 8,
                marginBottom: 16,
                color: LilyColors.textPrimary,
                fontFamily: LilyFonts.sans,
                fontSize: 15,
              }}
            />
            <TextInput
              value={password}
              placeholder="Enter password"
              placeholderTextColor={LilyColors.textFaint}
              secureTextEntry
              onChangeText={setPassword}
              style={{
                height: 50,
                backgroundColor: LilyColors.surface,
                borderWidth: 1,
                borderColor: LilyColors.hairline,
                borderRadius: 14,
                paddingHorizontal: 16,
                marginBottom: 24,
                color: LilyColors.textPrimary,
                fontFamily: LilyFonts.sans,
                fontSize: 15,
              }}
            />

            <TouchableOpacity
              onPress={onSignInPress}
              activeOpacity={0.85}
              style={{
                height: 50,
                backgroundColor: LilyColors.accent,
                borderRadius: 14,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
              }}
            >
              <Text
                style={{ fontSize: 15, fontFamily: LilyFonts.sansSemi, color: LilyColors.ground }}
              >
                Continue
              </Text>
            </TouchableOpacity>

            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
                gap: 5,
              }}
            >
              <Text
                style={{ fontFamily: LilyFonts.sans, fontSize: 14, color: LilyColors.textMuted }}
              >
                Don&apos;t have an account?
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setSignInModalVisible(false);
                  setSignUpModalVisible(true);
                }}
              >
                <Text
                  style={{ fontFamily: LilyFonts.sansSemi, fontSize: 14, color: LilyColors.accent }}
                >
                  Sign up
                </Text>
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
        statusBarTranslucent
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => {
            setSignUpModalVisible(false);
            setPendingVerification(false);
          }}
          style={{ flex: 1, backgroundColor: LilyColors.scrim }}
        />

        <View
          style={{
            backgroundColor: LilyColors.ground,
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            borderTopWidth: 1,
            borderTopColor: LilyColors.hairlineBright,
            height: '85%',
          }}
        >
          <ScrollView
            keyboardShouldPersistTaps="handled"
            automaticallyAdjustKeyboardInsets
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ padding: 24, paddingBottom: 40 }}
          >
            <View
              style={{
                width: 44,
                height: 4,
                backgroundColor: 'rgba(255,255,255,0.18)',
                borderRadius: 3,
                alignSelf: 'center',
                marginBottom: 20,
              }}
            />

            {pendingVerification ? (
              <>
                <Text
                  style={{
                    fontSize: 24,
                    fontFamily: LilyFonts.serif,
                    color: LilyColors.textPrimary,
                    marginBottom: 8,
                  }}
                >
                  Verify your email
                </Text>
                <Text
                  style={{
                    fontFamily: LilyFonts.sans,
                    fontSize: 14,
                    lineHeight: 22,
                    color: LilyColors.textMuted,
                    marginBottom: 24,
                  }}
                >
                  Enter the verification code sent to your email
                </Text>

                <TextInput
                  value={code}
                  placeholder="Enter verification code"
                  placeholderTextColor={LilyColors.textFaint}
                  onChangeText={setCode}
                  keyboardType="number-pad"
                  style={{
                    height: 50,
                    backgroundColor: LilyColors.surface,
                    borderWidth: 1,
                    borderColor: LilyColors.hairline,
                    borderRadius: 14,
                    paddingHorizontal: 16,
                    marginBottom: 24,
                    textAlign: 'center',
                    fontSize: 18,
                    letterSpacing: 4,
                    color: LilyColors.textPrimary,
                    fontFamily: LilyFonts.sans,
                  }}
                />

                <TouchableOpacity
                  onPress={onVerifyPress}
                  activeOpacity={0.85}
                  style={{
                    height: 50,
                    backgroundColor: LilyColors.accent,
                    borderRadius: 14,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text
                    style={{
                      fontSize: 15,
                      fontFamily: LilyFonts.sansSemi,
                      color: LilyColors.ground,
                    }}
                  >
                    Verify
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text
                  style={{
                    fontSize: 24,
                    fontFamily: LilyFonts.serif,
                    color: LilyColors.textPrimary,
                    marginBottom: 22,
                  }}
                >
                  Sign Up
                </Text>

                <TouchableOpacity
                  onPress={onGooglePress}
                  activeOpacity={0.85}
                  style={{
                    height: 50,
                    backgroundColor: '#FFFFFF',
                    borderRadius: 14,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 16,
                  }}
                >
                  <Text style={{ fontSize: 15, fontFamily: LilyFonts.sansSemi, color: '#1F1F1F' }}>
                    Sign up with Google
                  </Text>
                </TouchableOpacity>

                <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 8 }}>
                  <View style={{ flex: 1, height: 1, backgroundColor: LilyColors.hairline }} />
                  <Text
                    style={{
                      marginHorizontal: 16,
                      fontFamily: LilyFonts.sans,
                      fontSize: 12,
                      color: LilyColors.textFaint,
                    }}
                  >
                    OR
                  </Text>
                  <View style={{ flex: 1, height: 1, backgroundColor: LilyColors.hairline }} />
                </View>

                <TextInput
                  autoCapitalize="none"
                  keyboardType="email-address"
                  value={signUpEmail}
                  placeholder="Enter email"
                  placeholderTextColor={LilyColors.textFaint}
                  onChangeText={setSignUpEmail}
                  style={{
                    height: 50,
                    backgroundColor: LilyColors.surface,
                    borderWidth: 1,
                    borderColor: LilyColors.hairline,
                    borderRadius: 14,
                    paddingHorizontal: 16,
                    marginTop: 8,
                    marginBottom: 16,
                    color: LilyColors.textPrimary,
                    fontFamily: LilyFonts.sans,
                    fontSize: 15,
                  }}
                />
                <TextInput
                  value={signUpPassword}
                  placeholder="Enter password"
                  placeholderTextColor={LilyColors.textFaint}
                  secureTextEntry
                  onChangeText={setSignUpPassword}
                  style={{
                    height: 50,
                    backgroundColor: LilyColors.surface,
                    borderWidth: 1,
                    borderColor: LilyColors.hairline,
                    borderRadius: 14,
                    paddingHorizontal: 16,
                    marginBottom: 24,
                    color: LilyColors.textPrimary,
                    fontFamily: LilyFonts.sans,
                    fontSize: 15,
                  }}
                />

                <TouchableOpacity
                  onPress={onSignUpPress}
                  activeOpacity={0.85}
                  style={{
                    height: 50,
                    backgroundColor: LilyColors.accent,
                    borderRadius: 14,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 16,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 15,
                      fontFamily: LilyFonts.sansSemi,
                      color: LilyColors.ground,
                    }}
                  >
                    Continue
                  </Text>
                </TouchableOpacity>

                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: 5,
                  }}
                >
                  <Text
                    style={{ fontFamily: LilyFonts.sans, fontSize: 14, color: LilyColors.textMuted }}
                  >
                    Already have an account?
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      setSignUpModalVisible(false);
                      setSignInModalVisible(true);
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: LilyFonts.sansSemi,
                        fontSize: 14,
                        color: LilyColors.accent,
                      }}
                    >
                      Sign in
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

export default MiraWelcomeScreen;
