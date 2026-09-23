export const APP_TOUR_KEY = "halo-app-tour-v1";

export function appTourDone() {
  if (typeof window === "undefined") return true;
  try {
    return window.localStorage.getItem(APP_TOUR_KEY) === "1";
  } catch {
    return true;
  }
}

export function finishAppTour() {
  try {
    window.localStorage.setItem(APP_TOUR_KEY, "1");
  } catch {
    /* private browsing */
  }
}
