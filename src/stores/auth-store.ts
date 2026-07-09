import { create } from "zustand";
import { supabase } from "@/lib/supabase";
import { setNamePronunciation } from "@/lib/voice";
import type { Session } from "@supabase/supabase-js";

let hasInitializedAuthStore = false;

interface AuthState {
  session: Session | null;
  loading: boolean;
  firstName: string | null;
  ttsName: string | null;
  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, firstName?: string, ttsName?: string) => Promise<void>;
  signOut: () => Promise<void>;
  fetchProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  loading: true,
  firstName: null,
  ttsName: null,

  initialize: async () => {
    if (hasInitializedAuthStore) return;
    hasInitializedAuthStore = true;

    const {
      data: { session },
    } = await supabase.auth.getSession();
    set({ session, loading: false });

    if (session) {
      void get().fetchProfile();
    }

    // Listen for auth changes
    supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setNamePronunciation("", "");
        set({ session: null, firstName: null, ttsName: null });
        return;
      }

      set({ session });
      void get().fetchProfile();
    });
  },

  fetchProfile: async () => {
    const session = get().session;
    if (!session?.user?.id) return;

    // tts_name is stored in user_metadata — available immediately, no extra DB call
    const meta = session.user.user_metadata ?? {};
    const metaTtsName: string | null = meta.tts_name ?? null;

    try {
      const { data } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", session.user.id)
        .single();
      if (data?.display_name) {
        const first = data.display_name.split(" ")[0];
        const tts = metaTtsName ?? null;
        set({ firstName: first, ttsName: tts });
        setNamePronunciation(first, tts ?? first);
      }
    } catch {
      // Non-fatal
    }
  },

  signIn: async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  },

  signUp: async (email, password, firstName?: string, ttsName?: string) => {
    const metadata: Record<string, string> = {};
    if (firstName) metadata.display_name = firstName;
    if (ttsName) metadata.tts_name = ttsName;

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: Object.keys(metadata).length ? { data: metadata } : undefined,
    });
    if (error) throw error;

    if (firstName) {
      const tts = ttsName ?? null;
      set({ firstName, ttsName: tts });
      setNamePronunciation(firstName, tts ?? firstName);
    }
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setNamePronunciation("", "");
    set({ session: null, firstName: null, ttsName: null });
  },
}));
