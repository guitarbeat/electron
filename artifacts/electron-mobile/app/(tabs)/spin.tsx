import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { Movie } from "@/components/MovieCard";
import { useColors } from "@/hooks/useColors";
import { useSession } from "@/context/SessionContext";
import { getState, mutateState } from "@/lib/api";

export default function SpinScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { currentUser } = useSession();
  const queryClient = useQueryClient();

  const [picked, setPicked] = useState<Movie | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [marked, setMarked] = useState(false);

  const rotation = useSharedValue(0);
  const totalRotation = useRef(0);

  const { data, isLoading } = useQuery({
    queryKey: ["state", "movies"],
    queryFn: () => getState<Movie[]>("movies"),
    refetchInterval: 60_000,
  });

  const unwatched = (data?.data ?? []).filter((m) =>
    currentUser ? !m.watchedBy.includes(currentUser) : m.watchedBy.length === 0
  );

  const [markError, setMarkError] = useState<string | null>(null);

  const markWatchedMutation = useMutation({
    mutationFn: async (movie: Movie) => {
      if (!currentUser) throw new Error("Not signed in");
      return mutateState<Movie[]>("movies", {
        op: "toggle_watched",
        baseVersion: data?.version ?? "",
        payload: { movieId: movie.id },
      });
    },
    onSuccess: (result) => {
      queryClient.setQueryData(["state", "movies"], result);
      setMarked(true);
      setMarkError(null);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    onError: (err: Error) => {
      setMarkError(err.message ?? "Failed to mark as watched. Try again.");
    },
  });

  const spin = async () => {
    if (unwatched.length === 0 || spinning) return;
    setSpinning(true);
    setPicked(null);
    setMarked(false);
    setMarkError(null);

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const extraSpins = 5 + Math.floor(Math.random() * 4);
    totalRotation.current += extraSpins * 360;

    rotation.value = withTiming(
      totalRotation.current,
      {
        duration: 1600,
        easing: Easing.out(Easing.cubic),
      },
      (finished) => {
        "worklet";
        if (finished) {
        }
      }
    );

    setTimeout(async () => {
      const idx = Math.floor(Math.random() * unwatched.length);
      setPicked(unwatched[idx]);
      setSpinning(false);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, 1600);
  };

  const wheelStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const movieCount = data?.data?.length ?? 0;

  const isAlreadyWatched =
    picked && currentUser ? picked.watchedBy.includes(currentUser) : false;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={[
        styles.container,
        { paddingBottom: insets.bottom + 100 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headline, { color: colors.textPrimary }]}>
          Can't decide?
        </Text>
        <Text style={[styles.subline, { color: colors.textSecondary }]}>
          Spin to pick a random unwatched movie
          {currentUser ? ` for ${currentUser}` : ""}.
        </Text>
      </View>

      {/* Wheel */}
      <View style={styles.wheelArea}>
        <Animated.View
          style={[
            styles.wheel,
            {
              borderColor: colors.primary,
              backgroundColor: colors.surface1,
            },
            wheelStyle,
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

          {/* Mark as Watched */}
          {currentUser && (
            <Pressable
              onPress={() => {
                if (!marked && !isAlreadyWatched) {
                  markWatchedMutation.mutate(picked);
                }
              }}
              disabled={
                marked ||
                isAlreadyWatched ||
                markWatchedMutation.isPending
              }
              style={({ pressed }) => [
                styles.markWatchedBtn,
                {
                  backgroundColor:
                    marked || isAlreadyWatched
                      ? colors.success + "22"
                      : colors.primary,
                  borderColor:
                    marked || isAlreadyWatched
                      ? colors.success + "66"
                      : colors.primary,
                  opacity:
                    pressed || markWatchedMutation.isPending ? 0.7 : 1,
                },
              ]}
            >
              {markWatchedMutation.isPending ? (
                <ActivityIndicator
                  color={marked || isAlreadyWatched ? colors.success : "#fff"}
                  size="small"
                />
              ) : (
                <>
                  <Ionicons
                    name={
                      marked || isAlreadyWatched
                        ? "checkmark-circle"
                        : "eye-outline"
                    }
                    size={16}
                    color={
                      marked || isAlreadyWatched ? colors.success : "#fff"
                    }
                  />
                  <Text
                    style={[
                      styles.markWatchedText,
                      {
                        color:
                          marked || isAlreadyWatched
                            ? colors.success
                            : "#fff",
                      },
                    ]}
                  >
                    {marked || isAlreadyWatched
                      ? "Marked as watched!"
                      : "Mark as Watched"}
                  </Text>
                </>
              )}
            </Pressable>
          )}

          {/* Mark error */}
          {markError && (
            <Text style={[styles.markError, { color: colors.error }]}>
              {markError}
            </Text>
          )}

          {/* Pick again */}
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
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
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
  },
  wheelEmoji: { fontSize: 56 },
  pointer: {
    position: "absolute",
    bottom: -12,
    width: 0,
    height: 0,
    borderLeftWidth: 11,
    borderRightWidth: 11,
    borderTopWidth: 20,
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
  markWatchedBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 11,
  },
  markWatchedText: { fontSize: 15, fontWeight: "600" },
  markError: { fontSize: 13, textAlign: "center" },
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
