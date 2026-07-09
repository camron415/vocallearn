import { Dimensions, TouchableOpacity, View, Text, type ViewStyle, type StyleProp } from "react-native";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS } from "@/constants/config";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import type { Animated } from "react-native";

const SCREEN_WIDTH = Dimensions.get("window").width;

// Full-width horizontal slide between tabs
function forSlide({ current }: {
  current: { progress: Animated.AnimatedInterpolation<number> };
}): { sceneStyle: Animated.WithAnimatedValue<StyleProp<ViewStyle>> } {
  return {
    sceneStyle: {
      transform: [
        {
          translateX: current.progress.interpolate({
            inputRange: [-1, 0, 1],
            outputRange: [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
          }),
        },
      ],
    },
  };
}

const TAB_ICONS: Record<string, { active: keyof typeof Ionicons.glyphMap; inactive: keyof typeof Ionicons.glyphMap; size: number }> = {
  index: { active: "home", inactive: "home-outline", size: 22 },
  subjects: { active: "library", inactive: "library-outline", size: 22 },
  learn: { active: "play-circle", inactive: "play-circle-outline", size: 24 },
  profile: { active: "person", inactive: "person-outline", size: 22 },
};

function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        flexDirection: "row",
        backgroundColor: COLORS.tabBar,
        borderTopWidth: 0.5,
        borderTopColor: COLORS.tabBarBorder,
        paddingBottom: insets.bottom,
        paddingTop: 8,
      }}
    >
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label = options.title ?? route.name;
        const isFocused = state.index === index;
        const iconConfig = TAB_ICONS[route.name];

        const onPress = () => {
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        return (
          <TouchableOpacity
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            onPress={onPress}
            activeOpacity={0.7}
            style={{ flex: 1, alignItems: "center", paddingVertical: 4 }}
          >
            <Ionicons
              name={isFocused ? iconConfig.active : iconConfig.inactive}
              size={iconConfig.size}
              color={isFocused ? COLORS.primary : COLORS.textTertiary}
            />
            <Text
              style={{
                fontSize: 10,
                fontWeight: "600",
                letterSpacing: 0.2,
                color: isFocused ? COLORS.primary : COLORS.textTertiary,
                marginTop: 2,
              }}
            >
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        animation: "shift",
        transitionSpec: {
          animation: "timing",
          config: { duration: 250 },
        },
        sceneStyleInterpolator: forSlide,
        headerShown: false,
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Home" }} />
      <Tabs.Screen name="subjects" options={{ title: "Library" }} />
      <Tabs.Screen name="learn" options={{ title: "Learn" }} />
      <Tabs.Screen name="profile" options={{ title: "Profile" }} />
    </Tabs>
  );
}
