import { CloseX } from '@/components/lily/ui';
import { LilyColors, LilyFonts } from '@/constants/lily';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { TouchableOpacity, ScrollView, Text, View } from 'react-native';
import Animated, { Easing, SlideInDown, SlideOutDown } from 'react-native-reanimated';

function Section({
  index,
  title,
  body,
  list,
}: {
  index: string;
  title: string;
  body: string | string[];
  list?: string[];
}) {
  const bullets = list?.map((item) => (
    <View key={item} style={{ flexDirection: 'row', marginTop: 6, paddingLeft: 2 }}>
      <Text style={{ color: LilyColors.accent, marginRight: 8, fontSize: 14 }}>•</Text>
      <Text
        style={{
          flex: 1,
          fontSize: 14,
          lineHeight: 23,
          fontFamily: LilyFonts.sans,
          color: LilyColors.textBody,
        }}
      >
        {item}
      </Text>
    </View>
  ));

  return (
    <View style={{ marginBottom: 30 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <Text style={{ fontFamily: LilyFonts.sansBold, fontSize: 13, color: LilyColors.accent }}>
          {index}
        </Text>
        <Text
          style={{ fontFamily: LilyFonts.sansSemi, fontSize: 16, color: LilyColors.textPrimary }}
        >
          {title}
        </Text>
      </View>

      {Array.isArray(body) ? (
        <Text
          style={{
            fontSize: 14,
            lineHeight: 23,
            fontFamily: LilyFonts.sans,
            color: LilyColors.textBody,
          }}
        >
          {body[0]}
          <Text
            style={{ color: LilyColors.accent, textDecorationLine: 'underline' }}
            onPress={() => Linking.openURL('mailto:skouzt3@gmail.com')}
          >
            {body[1]}
          </Text>
          {body[2]}
        </Text>
      ) : (
        <Text
          style={{
            fontSize: 14,
            lineHeight: 23,
            fontFamily: LilyFonts.sans,
            color: LilyColors.textBody,
          }}
        >
          {body}
        </Text>
      )}

      {bullets}
    </View>
  );
}

export default function PrivacyPolicyScreen() {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(true);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => router.back(), 320);
  };

  return (
    <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: LilyColors.scrim }}>
      {isVisible && (
        <Animated.View
          entering={SlideInDown.duration(400).easing(Easing.out(Easing.ease))}
          exiting={SlideOutDown.duration(300).easing(Easing.in(Easing.ease))}
          style={{
            height: '92%',
            overflow: 'hidden',
            backgroundColor: LilyColors.ground,
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            borderTopWidth: 1,
            borderTopColor: LilyColors.hairlineBright,
          }}
        >
          <View style={{ alignItems: 'center', paddingTop: 10, paddingBottom: 4 }}>
            <View
              style={{
                height: 4,
                width: 38,
                borderRadius: 3,
                backgroundColor: 'rgba(255,255,255,0.16)',
              }}
            />
          </View>

          <View style={{ paddingHorizontal: 22, paddingTop: 8, paddingBottom: 18 }}>
            <View
              style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}
            >
              <Text
                style={{
                  flex: 1,
                  fontFamily: LilyFonts.serif,
                  fontSize: 30,
                  color: LilyColors.textPrimary,
                }}
              >
                Privacy Policy
              </Text>

              <TouchableOpacity
                onPress={handleClose}
                hitSlop={10}
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 17,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: LilyColors.ghostFill,
                }}
              >
                <CloseX />
              </TouchableOpacity>
            </View>

            <Text
              style={{
                marginTop: 10,
                maxWidth: 300,
                fontSize: 13,
                lineHeight: 21,
                fontFamily: LilyFonts.sans,
                color: LilyColors.textMuted,
              }}
            >
              Your privacy matters. Here&apos;s how we collect, use, and protect your information.
            </Text>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: 60 }}
          >
            <Section
              index="01"
              title="Introduction"
              body="We are committed to protecting your privacy and ensuring a safe experience while using the app. By using our app, you agree to the practices described in this policy. Our app is designed as a wellness tool and does not replace professional medical or mental health care."
            />

            <Section
              index="02"
              title="Information We Collect"
              body="We collect information you choose to share and data collected automatically:"
              list={[
                'Your name, email address, and profile details (optional)',
                'Messages and text shared during sessions with the AI',
                'Device information (device type, operating system)',
                'App usage data, crash logs, and performance data',
                'Information from third parties like authentication services',
              ]}
            />

            <Section
              index="03"
              title="How We Use Your Information"
              body="We use your information to:"
              list={[
                'Provide and operate the app services',
                'Improve features and user experience',
                'Personalize interactions within the app',
                'Maintain security and prevent misuse',
                'Respond to support requests sent via email',
                'Train and improve our AI models using anonymized data',
              ]}
            />

            <View
              style={{
                marginBottom: 30,
                borderRadius: 24,
                padding: 18,
                backgroundColor: LilyColors.surface,
                borderWidth: 1,
                borderColor: 'rgba(63,191,127,0.18)',
              }}
            >
              <Text
                style={{ fontFamily: LilyFonts.serif, fontSize: 18, color: LilyColors.accent, marginBottom: 10 }}
              >
                AI &amp; Conversations
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  lineHeight: 23,
                  fontFamily: LilyFonts.sans,
                  color: LilyColors.textBody,
                  marginBottom: 10,
                }}
              >
                Messages you share with the AI are processed to generate supportive responses.
                Conversations may be stored securely to allow session history and improve the app
                experience.
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  lineHeight: 23,
                  fontFamily: LilyFonts.sans,
                  color: LilyColors.textBody,
                  marginBottom: 10,
                }}
              >
                We do not sell or share your conversations with third parties. Any data used to
                improve the system is anonymized and cannot be linked back to you personally.
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  lineHeight: 23,
                  fontFamily: LilyFonts.sans,
                  color: LilyColors.textSoft,
                }}
              >
                Important: The AI is not a licensed healthcare professional and cannot provide
                medical advice. Always consult qualified professionals for medical concerns.
              </Text>
            </View>

            <Section
              index="04"
              title="Data Sharing"
              body="We respect your privacy:"
              list={[
                'We do not sell your personal data',
                'We only share limited data with trusted service providers (hosting, analytics) when necessary',
                'Providers are required to protect your information and use it only for authorized purposes',
                'We may share aggregated, anonymized statistics that do not identify you personally',
              ]}
            />

            <Section
              index="05"
              title="Data Security"
              body="We implement comprehensive security measures including encryption, access controls, and regular security assessments. While no system can guarantee complete security, we continuously work to safeguard your data against unauthorized access or misuse."
            />

            <Section
              index="06"
              title="Your Rights"
              body="You have the right to:"
              list={[
                'Access your personal information',
                'Update or correct your data',
                'Request deletion of your data',
                'Export your data in a portable format',
                'Opt out of marketing communications',
                'Withdraw consent where processing is based on consent',
              ]}
            />

            <Section
              index="07"
              title="Data Retention"
              body="We retain different types of data for different periods. Personal account data is retained while your account is active, conversation history is stored temporarily then anonymized or deleted, and usage data is anonymized after a period. You may request deletion of your data at any time."
            />

            <Section
              index="08"
              title="Children's Privacy"
              body="This app is not intended for children under 13. We do not knowingly collect personal information from children. If you believe a child has provided us with personal data, please contact us so we can take appropriate action."
            />

            <Section
              index="09"
              title="Changes to This Policy"
              body="We may update this Privacy Policy periodically. Any changes will be reflected within the app, and continued use indicates acceptance of the updated policy. We encourage you to review this policy regularly."
            />

            <Section
              index="10"
              title="Contact Information"
              body={[
                'If you have any questions or concerns about this Privacy Policy or how your data is handled, you can contact us at ',
                'skouzt3@gmail.com',
                '. We aim to respond to privacy inquiries within 7 business days.',
              ]}
            />

            <View
              style={{
                marginTop: 4,
                marginBottom: 20,
                padding: 16,
                borderRadius: 18,
                backgroundColor: LilyColors.surface,
                borderWidth: 1,
                borderColor: LilyColors.hairline,
              }}
            >
              <Text
                style={{
                  fontSize: 13,
                  lineHeight: 21,
                  fontStyle: 'italic',
                  fontFamily: LilyFonts.sans,
                  color: LilyColors.textFaint,
                }}
              >
                Disclaimer: This app provides wellness support and is not a substitute for
                professional medical advice, diagnosis, or treatment. If you are experiencing a
                medical emergency, please call emergency services immediately.
              </Text>
            </View>
          </ScrollView>
        </Animated.View>
      )}
    </View>
  );
}
