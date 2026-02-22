import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import Animated, {
  Easing,
  SlideInDown,
  SlideOutDown,
} from "react-native-reanimated";

export default function PrivacyPolicyScreen() {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(true);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => router.back(), 320);
  };

  return (
   <View className="flex-1 justify-end bg-black/40">

      {isVisible && (
        <Animated.View
            entering={SlideInDown.duration(400).easing(Easing.out(Easing.ease))}
            exiting={SlideOutDown.duration(300).easing(Easing.in(Easing.ease))}
            className="overflow-hidden bg-[#F6F8F7]"
            style={{
              height: "92%",
              borderTopLeftRadius: 32,
              borderTopRightRadius: 32,
            }}
          >
            {/* ---------- HEADER ---------- */}
            <View className="relative pb-6 pt-2">
              <LinearGradient
                colors={["#EAF6F1", "#F6F8F7"]}
                className="absolute top-0 left-0 right-0 h-full"
              />

              {/* Handle */}
              <View className="items-center pt-3 pb-4">
                <View className="h-1.5 w-12 rounded-full bg-gray-300/80" />
              </View>

              {/* Title Row */}
              <View className="relative px-6 pt-2">
                <View className="flex-row justify-between items-start mb-4">
                  <View className="flex-row items-center gap-3 mt-4">
                    <View className="w-9 h-9 rounded-full bg-[#01985e]/10 items-center justify-center">
                      <Ionicons name="shield-checkmark-outline" size={20} color="#01985e" />
                    </View>

                    <Text className="text-3xl text-[#0C1C16] font-bold">
                      Privacy Policy
                    </Text>
                  </View>

                  <Pressable
                    onPress={handleClose}
                    className="w-10 h-10 rounded-full bg-white/70 items-center justify-center"
                  >
                    <Ionicons name="close" size={22} color="#0C1C16" />
                  </Pressable>
                </View>

                <Text className="text-sm text-[#46A07D] leading-relaxed max-w-[300px]">
                  Your privacy matters to us. Here's how we collect, use, and protect your information when you use our app.
                </Text>
              </View>
            </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }} className="px-6 pt-2">
            <Section index="01" title="Introduction" body="We are committed to protecting your privacy and ensuring a safe experience while using the app. By using our app, you agree to the practices described in this policy. Our app is designed as a wellness tool and does not replace professional medical or mental health care." />

            <Section index="02" title="Information We Collect" body="We collect information you choose to share and data collected automatically:" list={[
              "Your name, email address, and profile details (optional)",
              "Messages and text shared during sessions with the AI",
              "Device information (device type, operating system)",
              "App usage data, crash logs, and performance data",
              "Information from third parties like authentication services"
            ]} />

            <Section index="03" title="How We Use Your Information" body="We use your information to:" list={[
              "Provide and operate the app services",
              "Improve features and user experience",
              "Personalize interactions within the app",
              "Maintain security and prevent misuse",
              "Respond to support requests sent via email",
              "Train and improve our AI models using anonymized data"
            ]} />

            <View className="mb-8 bg-[#01985e]/5 rounded-xl p-5 border border-[#01985e]/10">
              <View className="flex-row items-center gap-2 mb-3">
                <Ionicons name="sparkles" size={20} color="#01985e" />
                <Text className="text-lg font-bold text-[#01985e]">AI & Conversations</Text>
              </View>

              <Text className="text-sm text-gray-700 leading-relaxed mb-3">
                Messages you share with the AI are processed to generate supportive responses. Conversations may be stored securely to allow session history and improve the app experience.
              </Text>
              <Text className="text-sm text-gray-700 leading-relaxed mb-3">
                We do not sell or share your conversations with third parties. Any data used to improve the system is anonymized and cannot be linked back to you personally.
              </Text>
              <Text className="text-sm text-gray-700 leading-relaxed">
                Important: The AI is not a licensed healthcare professional and cannot provide medical advice. Always consult qualified professionals for medical concerns.
              </Text>
            </View>

            <Section index="04" title="Data Sharing" body="We respect your privacy:" list={[
              "We do not sell your personal data",
              "We only share limited data with trusted service providers (hosting, analytics) when necessary",
              "Providers are required to protect your information and use it only for authorized purposes",
              "We may share aggregated, anonymized statistics that do not identify you personally"
            ]} />

            <Section index="05" title="Data Security" body="We implement comprehensive security measures including encryption, access controls, and regular security assessments. While no system can guarantee complete security, we continuously work to safeguard your data against unauthorized access or misuse." />

            <Section index="06" title="Your Rights" body="You have the right to:" list={[
              "Access your personal information",
              "Update or correct your data",
              "Request deletion of your data",
              "Export your data in a portable format",
              "Opt out of marketing communications",
              "Withdraw consent where processing is based on consent"
            ]} />

            <Section index="07" title="Data Retention" body="We retain different types of data for different periods. Personal account data is retained while your account is active, conversation history is stored temporarily then anonymized or deleted, and usage data is anonymized after a period. You may request deletion of your data at any time." />

            <Section index="08" title="Children's Privacy" body="This app is not intended for children under 13. We do not knowingly collect personal information from children. If you believe a child has provided us with personal data, please contact us so we can take appropriate action." />

            <Section index="09" title="Changes to This Policy" body="We may update this Privacy Policy periodically. Any changes will be reflected within the app, and continued use indicates acceptance of the updated policy. We encourage you to review this policy regularly." />

            <Section index="10" title="Contact Information" body={[
              "If you have any questions or concerns about this Privacy Policy or how your data is handled, you can contact us at ",
              "skouzt3@gmail.com",
              ". We aim to respond to privacy inquiries within 7 business days."
            ]} />

            <View className="mb-8 mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <Text className="text-sm text-gray-600 italic leading-relaxed">
                Disclaimer: This app provides wellness support and is not a substitute for professional medical advice, diagnosis, or treatment. If you are experiencing a medical emergency, please call emergency services immediately.
              </Text>
            </View>
          </ScrollView>

          <View className="absolute bottom-0 left-0 w-full h-12 bg-gradient-to-t from-[#F6F8F7] to-transparent pointer-events-none" />
        </Animated.View>
      )}
    </View>
  );
}

function Section({ index, title, body, list }: { index: string; title: string; body: string | string[]; list?: string[] }) {
  if (Array.isArray(body)) {
    return (
      <View className="mb-8">
        <View className="flex-row items-center gap-2 mb-3">
          <Text className="text-[#01985e] italic font-bold">{index}</Text>
          <Text className="text-lg font-bold text-[#0C1C16]">{title}</Text>
        </View>
        <Text className="text-gray-600 leading-relaxed mb-3">
          {body[0]}
          <Text 
            className="text-[#01985e] underline"
            onPress={() => Linking.openURL("mailto:skouzt3@gmail.com")}
          >
            {body[1]}
          </Text>
          {body[2]}
        </Text>
        {list && list.map((item) => (
          <View key={item} className="flex-row items-start mb-1 ml-1">
            <Text className="text-[#01985e] mr-2 mt-1">•</Text>
            <Text className="text-gray-600 flex-1">{item}</Text>
          </View>
        ))}
      </View>
    );
  }

  return (
    <View className="mb-8">
      <View className="flex-row items-center gap-2 mb-3">
        <Text className="text-[#01985e] italic font-bold">{index}</Text>
        <Text className="text-lg font-bold text-[#0C1C16]">{title}</Text>
      </View>
      <Text className="text-gray-600 leading-relaxed mb-3">{body}</Text>
      {list && list.map((item) => (
        <View key={item} className="flex-row items-start mb-1 ml-1">
          <Text className="text-[#01985e] mr-2 mt-1">•</Text>
          <Text className="text-gray-600 flex-1">{item}</Text>
        </View>
      ))}
    </View>
  );
}