import { Ionicons } from "@expo/vector-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import React, { useState, useMemo } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { useSession } from "@/context/SessionContext";
import { MovieCard } from "@/components/MovieCard";
import type { Movie } from "@/components/MovieCard";
import { getState, mutateState } from "@/lib/api";

type FilterMode = "all" | "unwatched" | "watched";

export default function MoviesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { currentUser } = useSession();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterMode>("all");

  const { data, isLoading, isError, error, refetch, isRefetching } = useQuery({
    queryKey: ["state", "movies"],
    queryFn: () => getState<Movie[]>("movies"),
    refetchInterval: 60_000,
  });

  const toggleWatchedMutation = useMutation({
    mutationFn: async (movie: Movie) => {
      if (!currentUser) throw new Error("Not signed in");
      const isWatched = movie.watchedBy.includes(currentUser);
      const op = isWatched ? "unmarkWatched" : "markWatched";
      return mutateState<Movie[]>("movies", {
        op,
        baseVersion: data?.version ?? "",
        payload: { id: movie.id, user: currentUser },
      });
    },
    onSuccess: (result) => {
      queryClient.setQueryData(["state", "movies"], result);
    },
  });

  const movies = useMemo(() => {
    if (!data?.data) return [];
    let list = data.data;

    if (filter === "watched") {
      list = list.filter((m) =>
        currentUser
          ? m.watchedBy.includes(currentUser)
          : m.watchedBy.length > 0
      );
    } else if (filter === "unwatched") {
      list = list.filter((m) =>
        currentUser
          ? !m.watchedBy.includes(currentUser)
          : m.watchedBy.length === 0
      );
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (m) =>
          m.title.toLowerCase().includes(q) ||
          m.genre?.toLowerCase().includes(q) ||
          m.director?.toLowerCase().includes(q)
      );
    }

    return list;
  }, [data?.data, filter, search, currentUser]);

  const filterBtns: { label: string; value: FilterMode }[] = [
    { label: "All", value: "all" },
    { label: "Unwatched", value: "unwatched" },
    { label: "Watched", value: "watched" },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Search bar */}
      <View
        style={[
          styles.searchBar,
          { backgroundColor: colors.surface1, borderColor: colors.border },
        ]}
      >
        <Ionicons name="search" size={16} color={colors.textTertiary} />
        <TextInput
          placeholder="Search movies…"
          placeholderTextColor={colors.textTertiary}
          value={search}
          onChangeText={setSearch}
          style={[styles.searchInput, { color: colors.textPrimary }]}
        />
        {search.length > 0 && (
          <Pressable onPress={() => setSearch("")}>
            <Ionicons
              name="close-circle"
              size={16}
              color={colors.textTertiary}
            />
          </Pressable>
        )}
      </View>

      {/* Filter tabs */}
      <View style={styles.filterRow}>
        {filterBtns.map((btn) => (
          <Pressable
            key={btn.value}
            onPress={() => setFilter(btn.value)}
            style={[
              styles.filterBtn,
              {
                backgroundColor:
                  filter === btn.value ? colors.primary : colors.surface1,
                borderColor:
                  filter === btn.value ? colors.primary : colors.border,
              },
            ]}
          >
            <Text
              style={[
                styles.filterBtnText,
                {
                  color:
                    filter === btn.value
                      ? colors.primaryForeground
                      : colors.textSecondary,
                },
              ]}
            >
              {btn.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {isLoading && (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textTertiary }]}>
            Loading movies…
          </Text>
        </View>
      )}

      {isError && (
        <View style={styles.center}>
          <Ionicons name="warning-outline" size={32} color={colors.error} />
          <Text style={[styles.errorText, { color: colors.error }]}>
            {error instanceof Error ? error.message : "Failed to load"}
          </Text>
          <Pressable
            onPress={() => refetch()}
            style={[styles.retryBtn, { borderColor: colors.border }]}
          >
            <Text style={{ color: colors.textSecondary }}>Retry</Text>
          </Pressable>
        </View>
      )}

      {!isLoading && !isError && (
        <FlatList
          data={movies}
          keyExtractor={(m) => m.id}
          renderItem={({ item }) => (
            <MovieCard
              movie={item}
              currentUser={currentUser}
              onToggleWatched={
                currentUser
                  ? (m) => toggleWatchedMutation.mutate(m)
                  : undefined
              }
            />
          )}
          contentContainerStyle={[
            styles.list,
            { paddingBottom: insets.bottom + 100 },
          ]}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🎬</Text>
              <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
                {search ? "No movies match your search" : "No movies yet"}
              </Text>
            </View>
          }
          ListHeaderComponent={
            data?.data ? (
              <Text style={[styles.count, { color: colors.textTertiary }]}>
                {movies.length} {movies.length === 1 ? "movie" : "movies"}
                {data.degraded ? " · degraded" : ""}
              </Text>
            ) : null
          }
        />
      )}

      {!currentUser && !isLoading && (
        <View
          style={[
            styles.signInBanner,
            {
              backgroundColor: colors.surface2,
              borderColor: colors.border,
              bottom: insets.bottom + 100,
            },
          ]}
        >
          <Ionicons
            name="person-outline"
            size={16}
            color={colors.textSecondary}
          />
          <Text style={[styles.signInText, { color: colors.textSecondary }]}>
            Tap the avatar above to sign in
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    padding: 0,
  },
  filterRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  filterBtn: {
    borderWidth: 1,
    borderRadius: 100,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  filterBtnText: {
    fontSize: 13,
    fontWeight: "600",
  },
  list: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 32,
  },
  loadingText: { fontSize: 14 },
  errorText: { fontSize: 14, textAlign: "center" },
  retryBtn: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  empty: { alignItems: "center", gap: 8, marginTop: 60 },
  emptyIcon: { fontSize: 40 },
  emptyText: { fontSize: 15, textAlign: "center" },
  count: { fontSize: 12, marginBottom: 8 },
  signInBanner: {
    position: "absolute",
    left: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  signInText: { fontSize: 13 },
});
