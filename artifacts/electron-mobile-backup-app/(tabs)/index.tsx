import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import React, { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AddMovieSheet } from "@/components/AddMovieSheet";
import { MovieCard } from "@/components/MovieCard";
import { UserAvatar } from "@/components/UserAvatar";
import { UserSelector } from "@/components/UserSelector";
import { api } from "@/lib/api";
import { useSession } from "@/lib/session";
import type { Movie, OmdbSearchResult } from "@/lib/types";
import { useColors } from "@/hooks/useColors";

export default function MoviesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { selectedUser } = useSession();
  const queryClient = useQueryClient();
  const [showAddMovie, setShowAddMovie] = useState(false);
  const [showUserSelector, setShowUserSelector] = useState(false);

  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ["movies"],
    queryFn: api.state.movies,
    refetchInterval: 15_000,
  });

  const movies = data?.data ?? [];
  const version = data?.version ?? "";

  const toggleWatchedMutation = useMutation({
    mutationFn: ({ movieId }: { movieId: string }) =>
      api.state.mutate<Movie[]>("movies", "toggle_watched", { movieId }, version),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["movies"] });
    },
  });

  const addMovieMutation = useMutation({
    mutationFn: ({ title, omdbResult }: { title: string; omdbResult?: OmdbSearchResult }) => {
      const id = Date.now().toString() + Math.random().toString(36).slice(2, 7);
      const payload: Record<string, string> = { id, title };
      if (omdbResult) {
        if (omdbResult.Poster && omdbResult.Poster !== "N/A") {
          payload.posterUrl = omdbResult.Poster;
        }
        payload.year = omdbResult.Year;
      }
      return api.state.mutate<Movie[]>("movies", "add_movie", payload, version);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["movies"] });
      setShowAddMovie(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
  });

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
        <View>
          <Text style={[styles.screenTitle, { color: colors.foreground }]}>Movies</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            {movies.length === 0 ? "Nothing queued yet" : `${movies.length} in the queue`}
          </Text>
        </View>
        <Pressable onPress={() => setShowUserSelector(true)}>
          {selectedUser ? (
            <UserAvatar user={selectedUser} size={36} showRing />
          ) : (
            <View style={[styles.profileBtn, { borderColor: colors.border, backgroundColor: colors.muted }]}>
              <Feather name="user" size={18} color={colors.mutedForeground} />
            </View>
          )}
        </Pressable>
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : isError ? (
        <View style={styles.centered}>
          <Feather name="wifi-off" size={40} color={colors.mutedForeground} />
          <Text style={[styles.emptyTitle, { color: colors.foreground, marginTop: 16 }]}>
            Can't reach the server
          </Text>
          <Pressable onPress={() => refetch()} style={[styles.retryBtn, { borderColor: colors.border }]}>
            <Text style={[styles.retryText, { color: colors.foreground }]}>Retry</Text>
          </Pressable>
        </View>
      ) : movies.length === 0 ? (
        <View style={styles.centered}>
          <Feather name="film" size={48} color={colors.mutedForeground} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Your list is wide open</Text>
          <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>
            Tap + to add your first movie or show
          </Text>
        </View>
      ) : (
        <FlatList
          data={movies}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 100 }]}
          renderItem={({ item }) => (
            <MovieCard
              movie={item}
              currentUser={selectedUser}
              onToggleWatched={(id) => toggleWatchedMutation.mutate({ movieId: id })}
            />
          )}
          refreshing={isRefetching}
          onRefresh={refetch}
          showsVerticalScrollIndicator={false}
        />
      )}

      <Pressable
        style={[styles.fab, { backgroundColor: colors.primary, bottom: insets.bottom + 80 }]}
        onPress={() => {
          if (!selectedUser) {
            setShowUserSelector(true);
          } else {
            setShowAddMovie(true);
          }
        }}
      >
        <Feather name="plus" size={26} color={colors.primaryForeground} />
      </Pressable>

      <AddMovieSheet
        visible={showAddMovie}
        onClose={() => setShowAddMovie(false)}
        onAdd={(title, omdbResult) => addMovieMutation.mutate({ title, omdbResult })}
        isAdding={addMovieMutation.isPending}
      />

      <UserSelector visible={showUserSelector} onClose={() => setShowUserSelector(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  screenTitle: { fontSize: 28, fontFamily: "Inter_700Bold" },
  subtitle: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 2 },
  profileBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingHorizontal: 40,
  },
  emptyTitle: { fontSize: 18, fontFamily: "Inter_600SemiBold", textAlign: "center" },
  emptySubtitle: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20 },
  retryBtn: { marginTop: 8, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, borderWidth: 1 },
  retryText: { fontSize: 14, fontFamily: "Inter_500Medium" },
  list: { padding: 16 },
  fab: {
    position: "absolute",
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
