/**
 * Lily design tokens — transcribed from the "Lily app design system" design doc.
 *
 * Principle from the source: true black ground, near-black raised surfaces, and a
 * single mint accent used only for what's live, chosen, or actionable.
 */

export const LilyColors = {
  /* Ground + raised surfaces */
  ground: '#000000',
  surface: '#0C0C0C',
  surfaceRaised: '#101010',
  /** Cards on the Summaries screen. */
  surfaceRaisedAlt: '#0F0F0F',
  surfacePressed: '#111111',
  surfaceCard: '#131313',
  surfaceAlt: '#141414',
  surfaceDeep: '#0D110F',
  surfaceButton: '#101210',
  surfaceSelected: '#0F1512',
  /** Round chrome buttons — menu, new chat, mic. */
  surfaceButtonRaised: '#1A1A1A',
  surfaceComposer: '#1E1E1E',
  surfaceMic: '#2C2C2C',

  /* Green accent ramp — deep, not mint */
  accent: '#3FBF7F',
  accentDeep: '#1B7F51',
  accentBright: '#5FC79A',
  accentMid: '#35B278',
  accentDeeper: '#146B45',

  /* Chat */
  userBubble: '#1B3A2B',

  /* Text ramp, brightest → faintest */
  textPrimary: '#E9F5EE',
  textStrong: '#DCEBE2',
  textBody: '#C6DCD0',
  textSoft: '#A9C3B6',
  textMuted: '#8FA89C',
  textFaint: '#6F887C',
  /** Neutral greys the chat chrome uses instead of the green-tinted ramp. */
  textNeutral: '#ECECEC',
  textNeutralSoft: '#E4E4E4',
  textNeutralMuted: '#7C8B83',
  icon: '#E4E4E4',
  iconMuted: '#C9C9C9',

  danger: '#FF6B6B',

  /* Hairlines */
  hairline: 'rgba(255,255,255,0.08)',
  hairlineFaint: 'rgba(255,255,255,0.06)',
  hairlineDim: 'rgba(255,255,255,0.05)',
  hairlineSoft: 'rgba(255,255,255,0.07)',
  hairlineBright: 'rgba(255,255,255,0.09)',

  /* Washes */
  accentWash: 'rgba(63,191,127,0.14)',
  accentWashSoft: 'rgba(63,191,127,0.12)',
  accentBorder: 'rgba(63,191,127,0.18)',
  glassFill: 'rgba(255,255,255,0.055)',
  ghostFill: 'rgba(255,255,255,0.06)',
  scrim: 'rgba(0,0,0,0.6)',
} as const;

/** Gradients, as [from, to] pairs for expo-linear-gradient. */
export const LilyGradients = {
  /** Primary actionable fill — chips, toggles, send button, plan CTA. */
  accent: ['#3FBF7F', '#1B7F51'] as const,
  /** Send button uses a slightly deeper end stop. */
  send: ['#3FBF7F', '#146B45'] as const,
  /** Welcome sign-up button — darker, with light text on top. */
  signUp: ['#1F7F52', '#0B4429'] as const,
  signUpPressed: ['#268F5E', '#0E5232'] as const,
} as const;

export const LilyFonts = {
  /** Instrument Serif — Lily's voice. Display + her name only. */
  serif: 'InstrumentSerif_400Regular',
  /** Plus Jakarta Sans — interface & body. */
  sans: 'PlusJakartaSans_400Regular',
  sansMedium: 'PlusJakartaSans_500Medium',
  sansSemi: 'PlusJakartaSans_600SemiBold',
  sansBold: 'PlusJakartaSans_700Bold',
} as const;

/** Design canvas was 390×844; these are the paddings it used. */
export const LilyLayout = {
  screenX: 20,
  headerTop: 56,
} as const;
