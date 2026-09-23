const NATIVE_ATTR = "data-halo-native";

type CapacitorBridge = {
  isNativePlatform?: () => boolean;
};

export function isNativeApp() {
  if (typeof window === "undefined") return false;
  const cap = (window as unknown as { Capacitor?: CapacitorBridge }).Capacitor;
  if (!cap) return false;
  if (typeof cap.isNativePlatform === "function") return cap.isNativePlatform();
  return true;
}

export function markNativeHtml() {
  if (typeof document === "undefined" || !isNativeApp()) return;
  document.documentElement.setAttribute(NATIVE_ATTR, "1");
}
