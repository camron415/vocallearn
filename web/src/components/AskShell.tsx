"use client";

import {
  FormEvent,
  Suspense,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import { useSearchParams } from "next/navigation";
import { AttachButton, AttachList } from "@/components/AttachButton";
import { ComposeField } from "@/components/ComposeField";
import { ComposeSuggest, type SuggestRow } from "@/components/ComposeSuggest";
import { DictateButton } from "@/components/DictateButton";
import { useEffectiveMotion } from "@/components/MotionProvider";
import {
  COMPOSE_TRAVEL_MS,
  rememberHeroCompose,
  resetComposeTravel,
  travelComposeTowardDock,
  travelComposeTowardHero,
} from "@/components/SpringStage";
import { ComposeStadium, WaterAction } from "@/components/WaterSurface";

export type AskShellMode = "home" | "chat";

const HOME_COPY = "What’s on your mind?";
const CHAT_COPY = "Follow up…";

type HomeComposeUi = {
  hints: SuggestRow[];
  activeHint: number;
  setActiveHint: (index: number) => void;
  onPickHint: (title: string) => void;
  onFillDraft: (title: string) => void;
  composeOpen: boolean;
  onFocusField: () => void;
  onBlurField: () => void;
  onKeyDown: (event: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  playing: boolean;
  playKind?: string;
  grown: boolean;
  playSlot?: ReactNode;
  suggestOpen: boolean;
};

type ShellSubmit = (event: FormEvent) => void | Promise<void>;

type CopySwap = { from: string; to: string; toMuted: boolean };

type AskShellContextValue = {
  active: boolean;
  mode: AskShellMode;
  composeRef: RefObject<HTMLDivElement | null>;
  draft: string;
  setDraft: (value: string) => void;
  files: File[];
  setFiles: (files: File[] | ((prev: File[]) => File[])) => void;
  sending: boolean;
  setSending: (value: boolean) => void;
  listening: boolean;
  setListening: (value: boolean) => void;
  error: string | null;
  setError: (value: string | null) => void;
  setHomeUi: (ui: HomeComposeUi | null) => void;
  setSubmitHandler: (handler: ShellSubmit | null) => void;
  leaveToChat: (navigate: () => void | Promise<void>) => void;
  leaveToHome: (navigate: () => void) => void;
  contentLeaving: boolean;
  contentEntering: boolean;
  onContentSettled: () => void;
};

const AskShellContext = createContext<AskShellContextValue | null>(null);

export function useAskShell() {
  return useContext(AskShellContext);
}

function modeFromView(view: string | null): AskShellMode | "other" {
  if (view === "join" || view === "login") return "other";
  return view === "chat" ? "chat" : "home";
}

export function AskShellProvider({
  children,
  lab = false,
}: {
  children: ReactNode;
  lab?: boolean;
}) {
  return (
    <Suspense fallback={<AskShellInner lab={lab} view={null}>{children}</AskShellInner>}>
      <AskShellFromSearch lab={lab}>{children}</AskShellFromSearch>
    </Suspense>
  );
}

function AskShellFromSearch({
  children,
  lab,
}: {
  children: ReactNode;
  lab: boolean;
}) {
  const searchParams = useSearchParams();
  return (
    <AskShellInner lab={lab} view={searchParams.get("view")}>
      {children}
    </AskShellInner>
  );
}

function AskShellInner({
  children,
  lab,
  view,
}: {
  children: ReactNode;
  lab: boolean;
  view: string | null;
}) {
  const soft = useEffectiveMotion() === "reduced";
  const stage = modeFromView(view);
  const active = lab && stage !== "other";
  const [mode, setMode] = useState<AskShellMode>(() =>
    stage === "other" ? "home" : stage
  );
  const [draft, setDraft] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [sending, setSending] = useState(false);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [homeUi, setHomeUiState] = useState<HomeComposeUi | null>(null);
  const [submitHandler, setSubmitHandlerState] = useState<ShellSubmit | null>(
    null
  );
  const [contentLeaving, setContentLeaving] = useState(false);
  const [contentEntering, setContentEntering] = useState(false);
  const [copySwap, setCopySwap] = useState<CopySwap | null>(null);
  const composeRef = useRef<HTMLDivElement | null>(null);
  const leaving = useRef(false);

  useEffect(() => {
    if (!active) {
      delete document.documentElement.dataset.haloAskShell;
      return;
    }
    document.documentElement.dataset.haloAskShell = "1";
    return () => {
      delete document.documentElement.dataset.haloAskShell;
    };
  }, [active]);

  useEffect(() => {
    if (leaving.current || stage === "other") return;
    setMode((prev) => (prev === stage ? prev : stage));
  }, [stage]);

  useLayoutEffect(() => {
    if (!active || soft) return;
    const el = composeRef.current;
    if (!el) return;
    rememberHeroCompose(el);
  }, [active, soft, mode]);

  const setHomeUi = useCallback((ui: HomeComposeUi | null) => {
    setHomeUiState(ui);
  }, []);

  const setSubmitHandler = useCallback((handler: ShellSubmit | null) => {
    setSubmitHandlerState(() => handler);
  }, []);

  const onContentSettled = useCallback(() => {
    setContentEntering(false);
  }, []);

  const runCopySwap = useCallback(
    (from: string, to: string, toMuted: boolean) => {
      if (soft) {
        setCopySwap(null);
        return;
      }
      setCopySwap({ from, to, toMuted });
      window.setTimeout(() => setCopySwap(null), COMPOSE_TRAVEL_MS);
    },
    [soft]
  );

  const leaveToChat = useCallback(
    (navigate: () => void | Promise<void>) => {
      if (leaving.current || soft) {
        void navigate();
        return;
      }
      leaving.current = true;
      setContentLeaving(true);
      rememberHeroCompose(composeRef.current);
      travelComposeTowardDock(composeRef.current);
      window.setTimeout(() => {
        const from = draft.trim() || HOME_COPY;
        resetComposeTravel(composeRef.current);
        setMode("chat");
        setDraft("");
        setFiles([]);
        setContentLeaving(false);
        setContentEntering(true);
        runCopySwap(from, CHAT_COPY, true);
        void (async () => {
          try {
            await navigate();
          } finally {
            leaving.current = false;
            window.setTimeout(() => setContentEntering(false), COMPOSE_TRAVEL_MS);
          }
        })();
      }, COMPOSE_TRAVEL_MS);
    },
    [soft, draft, runCopySwap]
  );

  const leaveToHome = useCallback(
    (navigate: () => void) => {
      if (leaving.current || soft) {
        navigate();
        return;
      }
      leaving.current = true;
      setContentLeaving(true);
      travelComposeTowardHero(composeRef.current);
      window.setTimeout(() => {
        const from = draft.trim() || CHAT_COPY;
        resetComposeTravel(composeRef.current);
        setMode("home");
        setDraft("");
        setFiles([]);
        setContentLeaving(false);
        setContentEntering(true);
        runCopySwap(from, HOME_COPY, true);
        navigate();
        leaving.current = false;
        window.setTimeout(() => setContentEntering(false), COMPOSE_TRAVEL_MS);
      }, COMPOSE_TRAVEL_MS);
    },
    [soft, draft, runCopySwap]
  );

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    await submitHandler?.(event);
  }

  const value = useMemo<AskShellContextValue>(
    () => ({
      active,
      mode,
      composeRef,
      draft,
      setDraft,
      files,
      setFiles,
      sending,
      setSending,
      listening,
      setListening,
      error,
      setError,
      setHomeUi,
      setSubmitHandler,
      leaveToChat,
      leaveToHome,
      contentLeaving,
      contentEntering,
      onContentSettled,
    }),
    [
      active,
      mode,
      draft,
      files,
      sending,
      listening,
      error,
      setHomeUi,
      setSubmitHandler,
      leaveToChat,
      leaveToHome,
      contentLeaving,
      contentEntering,
      onContentSettled,
    ]
  );

  if (!active) {
    return (
      <AskShellContext.Provider value={value}>{children}</AskShellContext.Provider>
    );
  }

  const home = mode === "home";
  const ui = homeUi;
  const playing = Boolean(ui?.playing);
  const placeholder = home ? HOME_COPY : CHAT_COPY;
  const actionLabel = sending
    ? home
      ? "Asking…"
      : "Sending…"
    : home
      ? "Ask"
      : "Send";

  return (
    <AskShellContext.Provider value={value}>
      <div
        className={`ask-shell ask-shell--${mode}${
          contentLeaving ? " is-content-leaving" : ""
        }${contentEntering ? " is-content-entering" : ""}${
          copySwap ? " is-copy-swap" : ""
        }`}
      >
        <div className="ask-shell-page">{children}</div>
        <div
          className={`ask-shell-compose${
            home && ui?.suggestOpen ? " is-open" : ""
          }${playing ? " is-play" : ""}${
            playing && ui?.grown ? " is-play-grown" : ""
          }`}
        >
          <div
            className="ask-shell-compose-inner"
            onPointerDown={(event) => {
              if (!home || playing) return;
              const target = event.target as HTMLElement;
              if (
                target.closest(".compose-actions") ||
                target.closest(".compose-suggest") ||
                target.closest("button")
              ) {
                return;
              }
              ui?.onFocusField();
            }}
          >
            <ComposeStadium
              className={`compose${home ? "" : " compose-dock"}${
                playing ? " is-play-lesson" : ""
              }${playing && ui?.grown ? " is-grown" : ""}`}
              kind={
                playing && ui?.playKind
                  ? (ui.playKind as "when" | "where" | "who" | "meaning")
                  : undefined
              }
              elementRef={composeRef}
              listening={listening}
            >
              {playing && ui?.playSlot ? (
                ui.playSlot
              ) : (
                <form onSubmit={onSubmit} className="compose-form">
                  {error ? <p className="form-error">{error}</p> : null}
                  <AttachList
                    files={files}
                    onRemove={(file) =>
                      setFiles((prev) => prev.filter((f) => f !== file))
                    }
                  />
                  <label className="sr-only" htmlFor="ask-shell-field">
                    {home ? "What’s on your mind?" : "Follow up"}
                  </label>
                  <div className="compose-row">
                    <div className="ask-shell-copy-slot">
                      <ComposeField
                        id="ask-shell-field"
                        className={copySwap ? "is-copy-hidden" : ""}
                        placeholder={placeholder}
                        value={draft}
                        onValueChange={setDraft}
                        disabled={sending}
                        onFocus={home ? ui?.onFocusField : undefined}
                        onBlur={home ? ui?.onBlurField : undefined}
                        onKeyDown={home ? ui?.onKeyDown : undefined}
                      />
                      {copySwap ? (
                        <>
                          <span className="ask-shell-copy is-out" aria-hidden>
                            {copySwap.from}
                          </span>
                          <span
                            className={`ask-shell-copy is-in${
                              copySwap.toMuted ? " is-muted" : ""
                            }`}
                            aria-hidden
                          >
                            {copySwap.to}
                          </span>
                        </>
                      ) : null}
                    </div>
                    <div className="compose-actions">
                      <AttachButton
                        files={files}
                        onFiles={setFiles}
                        disabled={sending}
                        onError={setError}
                      />
                      <DictateButton
                        value={draft}
                        onValueChange={setDraft}
                        listening={listening}
                        onListeningChange={setListening}
                        disabled={sending}
                        onBlocked={setError}
                      />
                      <WaterAction
                        className="action-btn"
                        disabled={
                          sending || (!draft.trim() && files.length === 0)
                        }
                      >
                        {actionLabel}
                      </WaterAction>
                    </div>
                  </div>
                </form>
              )}
            </ComposeStadium>
            {home && !playing && ui ? (
              <ComposeSuggest
                key={draft.trim() ? "type" : "idle"}
                items={ui.hints}
                active={ui.activeHint}
                onPick={ui.onPickHint}
                onActive={ui.setActiveHint}
              />
            ) : null}
          </div>
        </div>
      </div>
    </AskShellContext.Provider>
  );
}

export function abortAskShellTravel() {
  resetComposeTravel(
    document.querySelector<HTMLDivElement>(".ask-shell-compose .compose")
  );
}
