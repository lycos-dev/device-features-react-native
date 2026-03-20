import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import React, { useRef, useState } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  Image,
  LayoutChangeEvent,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "../../context";
import { RootStackParamList, RootStackNavigationProp } from "../../navigation";
import { deleteEntry } from "../../services";

type EntryDetailsRouteProp = RouteProp<RootStackParamList, "EntryDetails">;

const { width: W, height: H } = Dimensions.get("window");

// ─── Trash icon ───────────────────────────────────────────────────────────────
const TrashIcon: React.FC<{ color: string }> = ({ color }) => (
  <View style={{ alignItems: "center", gap: 1 }}>
    <View style={{ width: 14, height: 1.5, backgroundColor: color, borderRadius: 1 }} />
    <View style={{ width: 6, height: 1.5, backgroundColor: color, borderRadius: 1, marginTop: -3, marginBottom: 1 }} />
    <View style={{
      width: 12, height: 13,
      borderLeftWidth: 1.5, borderRightWidth: 1.5, borderBottomWidth: 1.5,
      borderColor: color, borderBottomLeftRadius: 2, borderBottomRightRadius: 2,
      flexDirection: "row", justifyContent: "space-evenly", alignItems: "center",
      paddingHorizontal: 2,
    }}>
      <View style={{ width: 1.5, height: 7, backgroundColor: color, borderRadius: 1 }} />
      <View style={{ width: 1.5, height: 7, backgroundColor: color, borderRadius: 1 }} />
    </View>
  </View>
);

// ─── Detail row ───────────────────────────────────────────────────────────────
const DetailRow: React.FC<{
  label: string;
  value: string;
  theme: ReturnType<typeof useTheme>["theme"];
  icon?: string;
}> = ({ label, value, theme, icon }) => (
  <View style={styles.detailRow}>
    <View style={[styles.detailIconWrap, { backgroundColor: theme.surfaceSecondary }]}>
      <Text style={[styles.detailIcon, { color: theme.textSecondary }]}>{icon ?? "◈"}</Text>
    </View>
    <View style={styles.detailText}>
      <Text style={[styles.detailLabel, { color: theme.textMuted }]}>{label}</Text>
      <Text style={[styles.detailValue, { color: theme.textPrimary }]}>{value}</Text>
    </View>
  </View>
);

// ─── Screen ───────────────────────────────────────────────────────────────────
export const EntryDetailsScreen: React.FC = () => {
  const navigation = useNavigation<RootStackNavigationProp>();
  const route = useRoute<EntryDetailsRouteProp>();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  const { entry } = route.params;

  const [imageError, setImageError] = useState(false);
  const [isLandscape, setIsLandscape] = useState(false);

  // Measure the bottom block (headline + hint) so gradient matches it exactly
  const [bottomBlockHeight, setBottomBlockHeight] = useState(160);

  // Measure the details panel actual content height to set proper scroll limit
  const [panelContentHeight, setPanelContentHeight] = useState(H);

  const scrollY = useRef(new Animated.Value(0)).current;

  const TRIGGER = H * 0.3;

  // ─── Button animations ────────────────────────────────────────────────────
  const btnBg = scrollY.interpolate({
    inputRange: [0, TRIGGER],
    outputRange: ["rgba(0,0,0,0.45)", theme.surface],
    extrapolate: "clamp",
  });
  const btnContentColor = scrollY.interpolate({
    inputRange: [0, TRIGGER],
    outputRange: ["#FFFFFF", theme.textPrimary],
    extrapolate: "clamp",
  });
  const btnBorderColor = scrollY.interpolate({
    inputRange: [0, TRIGGER],
    outputRange: ["rgba(255,255,255,0)", theme.border],
    extrapolate: "clamp",
  });

  // Swipe hint fades out as user starts scrolling
  const hintOpacity = scrollY.interpolate({
    inputRange: [0, 60],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  // ─── Date formatting ──────────────────────────────────────────────────────
  const formattedDate = (() => {
    try {
      const d = new Date(entry.createdAt);
      return {
        full: d.toLocaleDateString(undefined, {
          weekday: "long",
          month: "long",
          day: "numeric",
          year: "numeric",
        }),
        time: d.toLocaleTimeString(undefined, {
          hour: "2-digit",
          minute: "2-digit",
        }),
        short: d.toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
      };
    } catch {
      return { full: entry.createdAt, time: "", short: entry.createdAt };
    }
  })();

  // ─── Delete ───────────────────────────────────────────────────────────────
  const handleDelete = () => {
    Alert.alert("Delete Entry", "This entry will be permanently removed.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteEntry(entry.id);
            navigation.goBack();
          } catch (err) {
            Alert.alert(
              "Delete Failed",
              err instanceof Error ? err.message : "Could not delete."
            );
          }
        },
      },
    ]);
  };

  const handleImageLoad = (e: any) => {
    const { width: iw, height: ih } = e.nativeEvent.source;
    setIsLandscape(iw > ih);
  };

  const handleBottomBlockLayout = (e: LayoutChangeEvent) => {
    // Add a small buffer above the block so gradient starts just before the date
    setBottomBlockHeight(e.nativeEvent.layout.height + 24);
  };

  const handlePanelLayout = (e: LayoutChangeEvent) => {
    setPanelContentHeight(e.nativeEvent.layout.height);
  };

  return (
    <View style={[styles.container, { backgroundColor: "#000" }]}>
      <Animated.ScrollView
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        bounces={false}
        decelerationRate="fast"
        // Max scroll = photo height + panel content - screen height + safe bottom margin
        // This ensures scrolling stops right at the REF bottom with margin
        contentInset={{ bottom: 0 }}
      >
        {/* ── Full-screen photo ── */}
        <View style={styles.photoSection}>
          {imageError ? (
            <View style={styles.imageFallback}>
              <Text style={styles.fallbackSymbol}>⊘</Text>
              <Text style={styles.fallbackText}>Image unavailable</Text>
            </View>
          ) : (
            <Image
              source={{ uri: entry.imageUri }}
              style={styles.image}
              resizeMode={isLandscape ? "contain" : "cover"}
              onLoad={handleImageLoad}
              onError={() => setImageError(true)}
            />
          )}

          {/* Gradient — height measured from bottom block so it aligns exactly
              with the top of the date badge */}
          <View style={[styles.photoGradient, { height: bottomBlockHeight }]} />

          {/* Bottom block: date badge + headline + hint */}
          <View
            style={styles.photoBottom}
            onLayout={handleBottomBlockLayout}
          >
            <View style={styles.photoTitle}>
              <View style={styles.issueBadge}>
                <Text style={styles.issueDot}>◈</Text>
                <Text style={styles.issueText}>{formattedDate.short}</Text>
              </View>
              <Text style={styles.locationHeadline} numberOfLines={2}>
                {entry.address || "Unknown location"}
              </Text>
            </View>

            <Animated.View style={[styles.swipeHint, { opacity: hintOpacity }]}>
              <Text style={styles.swipeArrow}>↑</Text>
              <Text style={styles.swipeText}>Swipe up for details</Text>
            </Animated.View>
          </View>
        </View>

        {/* ── Details panel ──
            No minHeight: H — panel is only as tall as its actual content.
            ScrollView total height = H (photo) + panelContentHeight.
            Max scroll offset = panelContentHeight - insets.bottom - margin,
            which lands exactly at the bottom of REF. ── */}
        <View
          style={[styles.detailsPanel, { backgroundColor: theme.background }]}
          onLayout={handlePanelLayout}
        >
          <View style={styles.handleWrap}>
            <View style={[styles.handle, { backgroundColor: theme.border }]} />
          </View>

          {/* Captured */}
          <View style={[styles.detailsSection, { borderBottomColor: theme.border }]}>
            <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>CAPTURED</Text>
            <DetailRow
              label={formattedDate.full}
              value={formattedDate.time || "—"}
              theme={theme}
              icon="◷"
            />
          </View>

          {/* Location */}
          <View style={[styles.detailsSection, { borderBottomColor: theme.border }]}>
            <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>LOCATION</Text>
            <DetailRow
              label="Address"
              value={entry.address || "Unknown location"}
              theme={theme}
              icon="◎"
            />
            {entry.latitude != null && entry.longitude != null && (
              <DetailRow
                label="Coordinates"
                value={`${entry.latitude.toFixed(5)}, ${entry.longitude.toFixed(5)}`}
                theme={theme}
                icon="⊕"
              />
            )}
          </View>

          {/* Note */}
          {entry.description ? (
            <View style={[styles.detailsSection, { borderBottomColor: theme.border }]}>
              <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>NOTE</Text>
              <View style={[styles.noteBox, {
                backgroundColor: theme.surfaceSecondary,
                borderColor: theme.border,
              }]}>
                <Text style={[styles.noteText, { color: theme.textPrimary }]}>
                  {entry.description}
                </Text>
              </View>
            </View>
          ) : null}

          {/* Photo */}
          <View style={[styles.detailsSection, { borderBottomColor: theme.border }]}>
            <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>PHOTO</Text>
            <DetailRow
              label="Orientation"
              value={isLandscape ? "Landscape" : "Portrait"}
              theme={theme}
              icon={isLandscape ? "⬛" : "▬"}
            />
          </View>

          {/* REF — bottom padding = safe area + 40px margin so scroll stops here */}
          <View style={[styles.detailsSection, {
            borderBottomColor: "transparent",
            paddingBottom: insets.bottom + 40,
          }]}>
            <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>REF</Text>
            <Text style={[styles.refText, { color: theme.textMuted }]} numberOfLines={1}>
              {entry.id}
            </Text>
          </View>
        </View>
      </Animated.ScrollView>

      {/* ── Back button ── */}
      <Animated.View style={[styles.backBtnWrap, { top: insets.top + 12 }]}>
        <Animated.View style={[styles.floatBtn, {
          backgroundColor: btnBg,
          borderColor: btnBorderColor,
          borderWidth: 1,
        }]}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.floatBtnInner}
            activeOpacity={0.8}
            accessibilityLabel="Go back"
          >
            <Animated.Text style={[styles.floatBtnText, { color: btnContentColor }]}>
              ←
            </Animated.Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>

      {/* ── Delete button ── */}
      <Animated.View style={[styles.deleteBtnWrap, { top: insets.top + 12 }]}>
        <Animated.View style={[styles.floatBtn, {
          backgroundColor: btnBg,
          borderColor: btnBorderColor,
          borderWidth: 1,
        }]}>
          <TouchableOpacity
            onPress={handleDelete}
            style={styles.floatBtnInner}
            activeOpacity={0.8}
            accessibilityLabel="Delete entry"
          >
            <TrashIcon color="#FF4444" />
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },

  photoSection: {
    width: W,
    height: H,
    backgroundColor: "#000",
  },
  image: {
    ...StyleSheet.absoluteFillObject,
    width: W,
    height: H,
  },
  imageFallback: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  fallbackSymbol: { fontSize: 36, color: "#555" },
  fallbackText: { fontSize: 13, color: "#555" },

  // Height is set dynamically via bottomBlockHeight — starts exactly at the date
  photoGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.72)",
  },

  photoBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: 36,
    gap: 20,
  },

  photoTitle: {
    gap: 8,
  },
  issueBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  issueDot: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 11,
  },
  issueText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  locationHeadline: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.4,
    lineHeight: 30,
  },

  swipeHint: {
    alignItems: "center",
    gap: 4,
  },
  swipeArrow: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 16,
  },
  swipeText: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 11,
    fontWeight: "500",
    letterSpacing: 0.3,
  },

  detailsPanel: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 12,
    // No minHeight — panel is exactly as tall as its content
  },

  handleWrap: {
    alignItems: "center",
    paddingBottom: 20,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },

  detailsSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 14,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.4,
  },

  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  detailIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  detailIcon: { fontSize: 18 },
  detailText: {
    flex: 1,
    gap: 2,
  },
  detailLabel: {
    fontSize: 12,
    lineHeight: 16,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 20,
  },

  noteBox: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 14,
  },
  noteText: {
    fontSize: 14,
    lineHeight: 22,
    fontStyle: "italic",
  },

  refText: {
    fontSize: 11,
    letterSpacing: 0.3,
  },

  backBtnWrap: {
    position: "absolute",
    left: 16,
  },
  deleteBtnWrap: {
    position: "absolute",
    right: 16,
  },
  floatBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: "hidden",
  },
  floatBtnInner: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  floatBtnText: {
    fontSize: 18,
    fontWeight: "400",
  },
});