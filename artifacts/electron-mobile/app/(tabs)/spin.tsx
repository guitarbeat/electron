import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { useSession } from "@/context/SessionContext";
import type { Movie } from "@/components/MovieCard";
import { getState } from "@/lib/api";

export default function SpinScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { currentUser } = useSession();
  const [picked, setPicked] = useState<Movie | null>(null);
  const [spinning, setSpinning] = useState(false);
  const spinAnim = useRef(new Animated.Value(0)).current;

  const { data, isLoading } = useQuery({
    queryKey: ["state", "movies"],
    queryFn: () => getState<Movie[]>("movies"),
  });

  const unwatched = (data?.data ?? []).filter((m) =>
    currentUser ? !m.watchedBy.includes(currentUser) : m.watchedBy.length === 0
  );

  const spin = () => {
    if (unwatched.length === 0 || spinning) return;
    setSpinning(true);
    setPicked(null);

    spinAnim.setValue(0);
    Animated.timing(spinAnim, {
      toValue: 1,
      duration: 1400,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      const idx = Math.floor(Math.random() * unwatched.length);
      setPicked(unwatched[idx]);
      setSpinning(false);
    });
  };

  const rotate = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "1440deg"],
  });

  const movieCount = data?.data?.length ?? 0;

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.background, paddingBottom: insets.bottom + 100 },
      ]}
    >
      {/* Header copy */}
      <View style={styles.header}>
        <Text style={[styles.headline, { color: colors.textPrimary }]}>
          Can't decide?
        </Text>
        <Text style={[styles.subline, { color: colors.textSecondary }]}>
          Spin to pick a random unwatched movie
          {currentUser ? ` for ${currentUser}` : ""}.
        </Text>
      </View>

      {/* Spinner wheel */}
      <View style={styles.wheelArea}>
        <Animated.View
          style={[
            styles.wheel,
            {
              borderColor: colors.primary,
              backgroundColor: colors.surface1,
              transform: [{ rotate }],
            },
          ]}
        >
          {isLoading ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <Text style={styles.wheelEmoji}>🎬</Text>
          )}
        </Animated.View>

        {/* Pointer */}
        <View style={[styles.pointer, { borderTopColor: colors.primary }]} />
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View
          style={[
            styles.statChip,
            { backgroundColor: colors.surface1, borderColor: colors.border },
          ]}
        >
          <Ionicons name="film-outline" size={14} color={colors.textTertiary} />
          <Text style={[styles.statText, { color: colors.textSecondary }]}>
            {movieCount} total
          </Text>
        </View>
        <View
          style={[
            styles.statChip,
            { backgroundColor: colors.surface1, borderColor: colors.border },
          ]}
        >
          <Ionicons name="eye-off-outline" size={14} color={colors.textTertiary} />
          <Text style={[styles.statText, { color: colors.textSecondary }]}>
            {unwatched.length} unwatched
          </Text>
        </View>
      </View>

      {/* Spin button */}
      <Pressable
        onPress={spin}
        disabled={spinning || unwatched.length === 0 || isLoading}
        style={({ pressed }) => [
          styles.spinBtn,
          {
            backgroundColor:
              unwatched.length === 0 ? colors.surface2 : colors.primary,
            opacity: pressed || spinning ? 0.7 : 1,
          },
        ]}
      >
        {spinning ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Ionicons
              name="shuffle"
              size={20}
              color={
                unwatched.length === 0
                  ? colors.textTertiary
                  : colors.primaryForeground
              }
            />
            <Text
              style={[
                styles.spinBtnText,
                {
                  color:
                    unwatched.length === 0
                      ? colors.textTertiary
                      : colors.primaryForeground,
                },
              ]}
            >
              {unwatched.length === 0 ? "Nothing to spin" : "Spin!"}
            </Text>
          </>
        )}
      </Pressable>

      {/* Result card */}
      {picked && (
        <View
          style={[
            styles.resultCard,
            {
              backgroundColor: colors.surface1,
              borderColor: colors.primary + "66",
            },
          ]}
        >
          <Text style={[styles.resultLabel, { color: colors.primary }]}>
            Tonight's pick ✨
          </Text>

          <View style={styles.resultInner}>
            {/* Poster */}
            {picked.posterUrl ? (
              <Image
                source={{ uri: picked.posterUrl }}
                style={styles.resultPoster}
              />
            ) : (
              <View
                style={[
                  styles.resultPosterPlaceholder,
                  { backgroundColor: colors.surface2 },
                ]}
              >
                <Ionicons
                  name="film-outline"
                  size={28}
                  color={colors.textTertiary}
                />
              </View>
            )}

            {/* Info */}
            <View style={styles.resultInfo}>
              <Text
                style={[styles.resultTitle, { color: colors.textPrimary }]}
                numberOfLines={3}
              >
                {picked.title}
              </Text>
              <View style={styles.resultMeta}>
                {picked.year && (
                  <Text
                    style={[styles.resultMetaText, { color: colors.textTertiary }]}
                  >
                    {picked.year}
                  </Text>
                )}
                {picked.imdbRating && (
                  <>
                    <Text style={[styles.resultDot, { color: colors.textTertiary }]}>
                      ·
                    </Text>
                    <Ionicons name="star" size={11} color="#fde68a" />
                    <Text
                      style={[styles.resultMetaText, { color: colors.textTertiary }]}
                    >
                      {" "}
                      {picked.imdbRating}
                    </Text>
                  </>
                )}
              </View>
              {picked.genre && (
                <Text
                  style={[styles.resultGenre, { color: colors.textSecondary }]}
                  numberOfLines={1}
                >
                  {picked.genre}
                </Text>
              )}
            </View>
          </View>

          {/* Re-spin */}
          <Pressable
            onPress={spin}
            disabled={spinning}
            style={({ pressed }) => [
              styles.reSpinBtn,
              { borderColor: colors.border, opacity: pressed ? 0.6 : 1 },
            ]}
          >
            <Ionicons name="refresh" size={16} color={colors.textSecondary} />
            <Text style={[styles.reSpinText, { color: colors.textSecondary }]}>
              Pick again
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    paddingTop: 24,
    gap: 24,
  },
  header: { alignItems: "center", gap: 6, paddingHorizontal: 32 },
  headline: { fontSize: 26, fontWeight: "800", textAlign: "center" },
  subline: { fontSize: 14, textAlign: "center", lineHeight: 20 },
  wheelArea: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  wheel: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
  },
  wheelEmoji: { fontSize: 52 },
  pointer: {
    position: "absolute",
    bottom: -10,
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderTopWidth: 18,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
  },
  statChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: 100,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  statText: { fontSize: 13 },
  spinBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 14,
    paddingHorizontal: 36,
    paddingVertical: 16,
  },
  spinBtnText: { fontSize: 18, fontWeight: "700" },
  resultCard: {
    width: "88%",
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    gap: 12,
  },
  resultLabel: { fontSize: 14, fontWeight: "700", textAlign: "center" },
  resultInner: { flexDirection: "row", gap: 14 },
  resultPoster: { width: 70, height: 100, borderRadius: 8 },
  resultPosterPlaceholder: {
    width: 70,
    height: 100,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  resultInfo: { flex: 1, gap: 4, justifyContent: "center" },
  resultTitle: { fontSize: 17, fontWeight: "700", lineHeight: 22 },
  resultMeta: { flexDirection: "row", alignItems: "center", gap: 2 },
  resultMetaText: { fontSize: 12 },
  resultDot: { fontSize: 12, marginHorizontal: 2 },
  resultGenre: { fontSize: 12 },
  reSpinBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 8,
  },
  reSpinText: { fontSize: 14 },
});
