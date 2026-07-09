import { Gesture } from "react-native-gesture-handler";
import { useRouter, usePathname } from "expo-router";

const TAB_ROUTES = ["/", "/subjects", "/learn", "/profile"] as const;
const SWIPE_THRESHOLD = 50;
const VELOCITY_THRESHOLD = 500;

export function useSwipeTabs() {
  const router = useRouter();
  const pathname = usePathname();

  const currentIndex = (() => {
    if (pathname === "/" || pathname === "/index") return 0;
    if (pathname === "/subjects") return 1;
    if (pathname === "/learn") return 2;
    if (pathname === "/profile") return 3;
    return 0;
  })();

  const gesture = Gesture.Pan()
    .activeOffsetX([-30, 30])
    .failOffsetY([-20, 20])
    .runOnJS(true)
    .onEnd((event) => {
      const { translationX, velocityX } = event;
      const swipedRight = translationX > SWIPE_THRESHOLD || velocityX > VELOCITY_THRESHOLD;
      const swipedLeft = translationX < -SWIPE_THRESHOLD || velocityX < -VELOCITY_THRESHOLD;

      if (swipedLeft && currentIndex < TAB_ROUTES.length - 1) {
        router.replace(TAB_ROUTES[currentIndex + 1] as any);
      } else if (swipedRight && currentIndex > 0) {
        router.replace(TAB_ROUTES[currentIndex - 1] as any);
      }
    });

  return gesture;
}
