import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useColors } from "@/hooks/useColors";

export interface Movie {
  id: string;
  title: string;
  addedBy: "Aaron" | "Electra";
  watchedBy: string[];
  createdAt: string;
  posterUrl?: string;
  year?: string;
  plot?: string;
  imdbRating?: string;
  runtime?: string;
  genre?: string;
  director?: string;
  category?: string;
}

interface MovieCardProps {
  movie: Movie;
  currentUser: string | null;
  onToggleWatched?: (movie: Movie) => void;
}

export function MovieCard({ movie, currentUser, onToggleWatched }: MovieCardProps) {
  const colors = useColors();
  const watched = currentUser
    ? movie.watchedBy.includes(currentUser)
    : movie.watchedBy.length > 0;
  const bothWatched = movie.watchedBy.length >= 2;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface1,
          borderColor: watched ? colors.primary + "44" : colors.border,
        },
      ]}
    >
      {/* Poster */}
      <View style={[styles.poster, { backgroundColor: colors.surface2 }]}>
        {movie.posterUrl ? (
          <Image source={{ uri: movie.posterUrl }} style={styles.posterImg} />
        ) : (
          <Ionicons name="film-outline" size={28} color={colors.textTertiary} />
        )}
      </View>

      {/* Info */}
      <View style={styles.info}>
        <Text
          style={[styles.title, { color: colors.textPrimary }]}
          numberOfLines={2}
        >
          {movie.title}
        </Text>

        <View style={styles.meta}>
          {movie.year && (
            <Text style={[styles.metaText, { color: colors.textTertiary }]}>
              {movie.year}
            </Text>
          )}
          {movie.genre && (
            <>
              <Text style={[styles.metaDot, { color: colors.textTertiary }]}>
                ·
              </Text>
              <Text
                style={[styles.metaText, { color: colors.textTertiary }]}
                numberOfLines={1}
              >
                {movie.genre.split(",")[0]}
              </Text>
            </>
          )}
          {movie.imdbRating && (
            <>
              <Text style={[styles.metaDot, { color: colors.textTertiary }]}>
                ·
              </Text>
              <Ionicons name="star" size={11} color="#fde68a" />
              <Text style={[styles.metaText, { color: colors.textTertiary }]}>
                {" "}{movie.imdbRating}
              </Text>
            </>
          )}
        </View>

        {/* Badges */}
        <View style={styles.badges}>
          <View
            style={[
              styles.badge,
              { backgroundColor: colors.surface2, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.badgeText, { color: colors.textSecondary }]}>
              Added by {movie.addedBy}
            </Text>
          </View>
          {bothWatched && (
            <View
              style={[
                styles.badge,
                { backgroundColor: colors.success + "22", borderColor: colors.success + "44" },
              ]}
            >
              <Ionicons name="checkmark-circle" size={12} color={colors.success} />
              <Text style={[styles.badgeText, { color: colors.success }]}>
                {" "}Both watched
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Watch toggle */}
      {currentUser && onToggleWatched && (
        <Pressable
          onPress={() => onToggleWatched(movie)}
          style={({ pressed }) => [
            styles.watchBtn,
            {
              backgroundColor: watched
                ? colors.primary + "22"
                : colors.surface2,
              borderColor: watched ? colors.primary + "66" : colors.border,
              opacity: pressed ? 0.6 : 1,
            },
          ]}
        >
          <Ionicons
            name={watched ? "eye" : "eye-outline"}
            size={20}
            color={watched ? colors.primary : colors.textTertiary}
          />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    gap: 12,
    marginBottom: 10,
  },
  poster: {
    width: 54,
    height: 76,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    overflow: "hidden",
  },
  posterImg: {
    width: 54,
    height: 76,
  },
  info: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 15,
    fontWeight: "600",
    lineHeight: 20,
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 2,
  },
  metaText: {
    fontSize: 12,
  },
  metaDot: {
    fontSize: 12,
    marginHorizontal: 2,
  },
  badges: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 4,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 100,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "500",
  },
  watchBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
});
