import { LilyColors, LilyFonts } from '@/constants/lily';
import { Pressable, Text, View } from 'react-native';

/**
 * Shown when we cannot reach the backend to find out where someone is.
 *
 * It exists so that "we don't know" has somewhere to go. The alternative is
 * guessing, and both guesses are wrong: assume onboarded and a new user lands
 * in an empty app, assume not and someone repeats a form they already filled in.
 */
export function ConnectionRetry({ onRetry }: { onRetry: () => void }) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: LilyColors.ground,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
      }}
    >
      <Text
        style={{ fontFamily: LilyFonts.serif, fontSize: 40, color: LilyColors.textPrimary }}
      >
        Lily
      </Text>

      <Text
        style={{
          fontSize: 14,
          fontFamily: LilyFonts.sans,
          color: LilyColors.textFaint,
          marginTop: 12,
          textAlign: 'center',
          lineHeight: 20,
        }}
      >
        We couldn&apos;t reach you just now.{'\n'}Check your connection and try again.
      </Text>

      <Pressable
        onPress={onRetry}
        hitSlop={12}
        style={({ pressed }) => ({
          marginTop: 28,
          paddingVertical: 12,
          paddingHorizontal: 32,
          borderRadius: 999,
          borderWidth: 1,
          borderColor: LilyColors.textFaint,
          opacity: pressed ? 0.6 : 1,
        })}
      >
        <Text
          style={{
            fontSize: 15,
            fontFamily: LilyFonts.sans,
            color: LilyColors.textPrimary,
          }}
        >
          Try again
        </Text>
      </Pressable>
    </View>
  );
}
