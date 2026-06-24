import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";
import type { Movie, User } from "@/lib/types";
import { UserAvatar } from "./UserAvatar";

interface MovieCardProps {
  movie: Movie;
  currentUser: User | null;
  onToggleWatched?: (movieId: string) => void;
}

export function MovieCard({ movie, currentUser, onToggleWatched }: MovieCardProps) {
  const colors = useColors();
  const isWatchedByMe = currentUser ? movie.watchedBy.includes(currentUser) : false;
  const watchedCount = movie.watchedBy.length;

  const handleToggle = () => {
    if (!currentUser) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onToggleWatched?.(movie.id);
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {movie.posterUrl ? (
        <Image
          source={{ uri: movie.posterUrl }}
          style={styles.poster}
          contentFit="cover"
        />
      ) : (
        <View style={[styles.posterPlaceholder, { backgroundColor: colors.muted }]}>
          <Feather name="film" size={28} color={colors.mutedForeground} />
        </View>
      )}

      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={2}>
          {movie.title}
        </Text>

        <View style={styles.meta}>
          {movie.year ? (
            <Text style={[styles.metaText, { color: colors.mutedForeground }]}>{movie.year}</Text>
          ) : null}
          {movie.imdbRating ? (
            <View style={styles.rating}>
              <Feather name="star" size={11} color="#fde68a" />
              <Text style={[styles.metaText, { color: colors.mutedForeground, marginLeft: 3 }]}>
                {movie.imdbRating}
              </Text>
            </View>
          ) : null}
          {movie.runtime ? (
            <Text style={[styles.metaText, { color: colors.mutedForeground }]}>{movie.runtime}</Text>
          ) : null}
        </View>

        <View style={styles.footer}>
          <View style={styles.addedBy}>
            <UserAvatar user={movie.addedBy} size={20} />
            <Text style={[styles.addedByText, { color: colors.mutedForeground }]}>
              {movie.addedBy}
            </Text>
          </View>

          <Pressable
            onPress={handleToggle}
            style={[
              styles.watchedBtn,
              {
                backgroundColor: isWatchedByMe
                  ? colors.primary + "22"
                  : colors.muted,
                borderColor: isWatchedByMe ? colors.primary : colors.border,
              },
            ]}
          >
            <Feather
              name={isWatchedByMe ? "check-circle" : "circle"}
              size={14}
              color={isWatchedByMe ? colors.primary : colors.mutedForeground}
            />
            <Text
              style={[
                styles.watchedText,
                { color: isWatchedByMe ? colors.primary : colors.mutedForeground },
              ]}
            >
              {watchedCount === 0
                ? "Unwatched"
                : watchedCount === 2
                ? "Both watched"
                : isWatchedByMe
                ? "Watched"
                : "They watched"}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: 12,
  },
  poster: {
    width: 80,
    height: 110,
  },
  posterPlaceholder: {
    width: 80,
    height: 110,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
    padding: 12,
    justifyContent: "space-between",
  },
  title: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    lineHeight: 20,
    marginBottom: 4,
  },
  meta: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
    marginBottom: 8,
  },
  metaText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  rating: {
    flexDirection: "row",
    alignItems: "center",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  addedBy: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  addedByText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  watchedBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
  },
  watchedText: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
  },
});
