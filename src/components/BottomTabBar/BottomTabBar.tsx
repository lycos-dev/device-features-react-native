import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "../../context";

const { width: W } = Dimensions.get("window");
const BAR_HEIGHT = 72;
const FAB_SIZE = 60;
const NOTCH_RADIUS = 36;

// ─── Gear icon ────────────────────────────────────────────────────────────────
const GearIcon: React.FC<{ color: string; size?: number }> = ({
  color,
  size = 22,
}) => {
  const teeth = 6;
  const toothSize = size * 0.18;
  return (
    <View
      style={{
        width: size,
        height: size,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <View
        style={{
          position: "absolute",
          width: size * 0.78,
          height: size * 0.78,
          borderRadius: size * 0.39,
          borderWidth: size * 0.1,
          borderColor: color,
        }}
      />
      <View
        style={{
          position: "absolute",
          width: size * 0.3,
          height: size * 0.3,
          borderRadius: size * 0.15,
          borderWidth: size * 0.09,
          borderColor: color,
        }}
      />
      {Array.from({ length: teeth }).map((_, i) => (
        <View
          key={i}
          style={{
            position: "absolute",
            width: toothSize,
            height: size * 0.28,
            backgroundColor: color,
            borderRadius: toothSize * 0.3,
            transform: [
              { rotate: `${(i * 360) / teeth}deg` },
              { translateY: -(size * 0.37) },
            ],
          }}
        />
      ))}
    </View>
  );
};

// ─── Home icon ────────────────────────────────────────────────────────────────
const HomeIcon: React.FC<{ color: string; size?: number }> = ({
  color,
  size = 22,
}) => (
  <View
    style={{
      width: size,
      height: size,
      alignItems: "center",
      justifyContent: "flex-end",
    }}
  >
    <View
      style={{
        position: "absolute",
        top: 0,
        width: 0,
        height: 0,
        borderLeftWidth: size * 0.52,
        borderRightWidth: size * 0.52,
        borderBottomWidth: size * 0.5,
        borderLeftColor: "transparent",
        borderRightColor: "transparent",
        borderBottomColor: color,
      }}
    />
    <View
      style={{
        width: size * 0.62,
        height: size * 0.44,
        backgroundColor: color,
        borderTopLeftRadius: 1,
        borderTopRightRadius: 1,
      }}
    />
  </View>
);

// ─── Tab Button ───────────────────────────────────────────────────────────────
interface TabButtonProps {
  isActive: boolean;
  onPress: () => void;
  label: string;
  theme: ReturnType<typeof useTheme>["theme"];
  icon: React.ReactNode;
}

const TabButton: React.FC<TabButtonProps> = ({
  isActive,
  onPress,
  label,
  theme,
  icon,
}) => {
  const opacity = useRef(new Animated.Value(isActive ? 1 : 0.4)).current;
  const dotScale = useRef(new Animated.Value(isActive ? 1 : 0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: isActive ? 1 : 0.4,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.spring(dotScale, {
        toValue: isActive ? 1 : 0,
        useNativeDriver: true,
        speed: 24,
        bounciness: 10,
      }),
    ]).start();
  }, [isActive]);

  return (
    <TouchableOpacity
      style={styles.tabBtn}
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: isActive }}
    >
      <Animated.View style={[styles.tabContent, { opacity }]}>
        {icon}
      </Animated.View>

      {/* Active indicator pill */}
      <Animated.View
        style={[
          styles.activePill,
          {
            backgroundColor: theme.textPrimary,
            transform: [{ scaleX: dotScale }],
            opacity: dotScale,
          },
        ]}
      />
    </TouchableOpacity>
  );
};

// ─── BottomTabBar ─────────────────────────────────────────────────────────────
export const BottomTabBar: React.FC<BottomTabBarProps> = ({
  state,
  navigation,
}) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const fabScale = useRef(new Animated.Value(1)).current;
  const fabRotate = useRef(new Animated.Value(0)).current;

  const totalHeight = BAR_HEIGHT + insets.bottom;

  const handleFabPressIn = () => {
    Animated.parallel([
      Animated.spring(fabScale, {
        toValue: 0.88,
        useNativeDriver: true,
        speed: 50,
        bounciness: 4,
      }),
      Animated.timing(fabRotate, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleFabPressOut = () => {
    Animated.parallel([
      Animated.spring(fabScale, {
        toValue: 1,
        useNativeDriver: true,
        speed: 28,
        bounciness: 10,
      }),
      Animated.timing(fabRotate, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const rotation = fabRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "45deg"],
  });

  return (
    <View
      style={[styles.wrapper, { height: totalHeight }]}
      pointerEvents="box-none"
    >
      {/* Bar surface */}
      <View
        style={[
          styles.barSurface,
          {
            height: totalHeight,
            backgroundColor: theme.surface,
            shadowColor: theme.cardShadow,
          },
        ]}
      >
        {/* Notch cutout */}
        <View
          style={[styles.notchOuter, { backgroundColor: theme.background }]}
        >
          <View
            style={[styles.notchInner, { backgroundColor: theme.surface }]}
          />
        </View>

        {/* Tab row */}
        <View style={[styles.tabRow, { paddingBottom: insets.bottom }]}>
          <TabButton
            isActive={state.index === 0}
            onPress={() => navigation.navigate("Home" as never)}
            label="Home"
            theme={theme}
            icon={
              <HomeIcon
                color={state.index === 0 ? theme.textPrimary : theme.textMuted}
                size={22}
              />
            }
          />
          <View style={styles.fabSpacer} />
          <TabButton
            isActive={state.index === 1}
            onPress={() => navigation.navigate("Settings" as never)}
            label="Settings"
            theme={theme}
            icon={
              <GearIcon
                color={state.index === 1 ? theme.textPrimary : theme.textMuted}
                size={22}
              />
            }
          />
        </View>
      </View>

      {/* FAB */}
      <Animated.View
        style={[styles.fabWrap, { transform: [{ scale: fabScale }] }]}
        pointerEvents="box-none"
      >
        <TouchableWithoutFeedback
          onPress={() => navigation.navigate("AddEntry" as never)}
          onPressIn={handleFabPressIn}
          onPressOut={handleFabPressOut}
          accessibilityLabel="Add new travel entry"
          accessibilityRole="button"
        >
          <Animated.View
            style={[
              styles.fab,
              {
                backgroundColor: theme.fabBackground,
                shadowColor: theme.fabShadow,
              },
            ]}
          >
            <Animated.Text
              style={[
                styles.fabIcon,
                { color: theme.fabIcon, transform: [{ rotate: rotation }] },
              ]}
            >
              +
            </Animated.Text>
          </Animated.View>
        </TouchableWithoutFeedback>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    bottom: -20,
    left: 0,
    right: 0,
  },
  barSurface: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 16,
    overflow: "visible",
  },
  notchOuter: {
    position: "absolute",
    top: -(NOTCH_RADIUS + 6),
    alignSelf: "center",
    width: (NOTCH_RADIUS + 8) * 2,
    height: (NOTCH_RADIUS + 8) * 2,
    borderRadius: NOTCH_RADIUS + 8,
  },
  notchInner: {
    position: "absolute",
    top: 10,
    left: 10,
    right: 10,
    bottom: -20,
    borderRadius: NOTCH_RADIUS,
  },
  tabRow: {
    height: BAR_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
  },
  tabBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
    height: BAR_HEIGHT,
    paddingBottom: 7,
  },
  tabContent: {
    alignItems: "center",
    justifyContent: "center",
  },
  activePill: {
    position: "absolute",
    bottom: -1,
    width: 24,
    height: 3,
    borderRadius: 2,
  },
  fabSpacer: {
    width: FAB_SIZE + 24,
  },
  fabWrap: {
    position: "absolute",
    top: -(FAB_SIZE / 2) + 8,
    alignSelf: "center",
    width: FAB_SIZE,
    height: FAB_SIZE,
  },
  fab: {
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 14,
  },
  fabIcon: {
    fontSize: 30,
    fontWeight: "300",
    lineHeight: 34,
    includeFontPadding: false,
  },
});
