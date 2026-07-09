export const APP_CONFIG = {
  name: "VocalLearn",
  version: "0.1.0",

  // Session defaults
  defaultSessionMinutes: 25,
  breakMinutes: 7,
  maxFactsPerLesson: 15,

  // Spaced repetition
  defaultEaseFactor: 2.5,
  minimumEaseFactor: 1.3,

  // Free tier limits (Phase 5)
  freeMinutesPerDay: 15,
  freeLessonsAccess: 3,
} as const;

export const AI_CONFIG = {
  useVoiceThinkFastTutor: process.env.EXPO_PUBLIC_USE_VOICE_THINK_FAST_TUTOR === "true",
  useVoiceThinkFastTutorAudio:
    process.env.EXPO_PUBLIC_USE_VOICE_THINK_FAST_TUTOR_AUDIO !== "false",
  logModelRouting: process.env.EXPO_PUBLIC_LOG_MODEL_ROUTING === "true",
} as const;

// Premium light theme — clean Apple-style with bright backgrounds
// White base with warm coral accent, dark mode available via settings (Phase 3)
export const COLORS = {
  // Backgrounds — layered depth (light)
  bg: "#FFFFFF",            // Pure white base
  bgElevated: "#F2F2F7",   // Cards, surfaces — Apple system gray 6
  bgTertiary: "#E5E5EA",   // Nested cards, inputs — Apple system gray 5

  // Borders — subtle dividers
  border: "#D1D1D6",       // Apple system gray 4
  borderLight: "#E5E5EA",  // Lighter dividers

  // Primary accent — warm coral-red
  primary: "#FF6B6B",
  primaryDark: "#E55555",
  primaryMuted: "rgba(255, 107, 107, 0.10)",

  // Text hierarchy
  text: "#000000",           // Primary text — true black
  textSecondary: "#6E6E73",  // Secondary — Apple secondary label
  textTertiary: "#AEAEB2",   // Hints, placeholders — Apple tertiary label

  // Semantic
  success: "#34C759",        // Apple system green
  successMuted: "rgba(52, 199, 89, 0.10)",
  warning: "#FF9500",        // Apple system orange
  warningMuted: "rgba(255, 149, 0, 0.10)",
  error: "#FF3B30",          // Apple system red
  errorMuted: "rgba(255, 59, 48, 0.10)",

  // Accents
  blue: "#007AFF",           // Apple system blue
  purple: "#AF52DE",         // Apple system purple

  // Tab bar specific
  tabBar: "#FAFAFA",
  tabBarBorder: "#E0E0E0",
} as const;

// Legacy aliases for backward compatibility
export const LEGACY_COLORS = {
  background: COLORS.bg,
  surface: COLORS.bgElevated,
  border: COLORS.border,
  primary: COLORS.primary,
  primaryDark: COLORS.primaryDark,
  text: COLORS.text,
  textSecondary: COLORS.textSecondary,
  success: COLORS.success,
  warning: COLORS.warning,
  error: COLORS.error,
} as const;
