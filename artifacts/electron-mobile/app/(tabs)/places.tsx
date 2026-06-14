import { Ionicons, Feather } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import React, { useState, useMemo } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { getState } from "@/lib/api";

interface Place {
  id: string;
  name: string;
  addedBy?: string;
  notes?: string;
  createdAt: string;
  visitedAt?: string;
  lat?: number;
  lng?: number;
  category?: string;
  rating?: string;
  description?: string;
  imageUrl?: string;
}

function PlaceCard({ place }: { place: Place }) {
  const colors = useColors();
  const visited = Boolean(place.visitedAt);

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface1,
          borderColor: visited ? colors.secondary + "44" : colors.border,
        },
      ]}
    >
      {/* Image or icon */}
      <View style={[styles.placeImg, { backgroundColor: colors.surface2 }]}>
        {place.imageUrl ? (
          <Image source={{ uri: place.imageUrl }} style={styles.placeImgFill} />
        ) : (
          <Feather name="map-pin" size={22} color={colors.textTertiary} />
        )}
      </View>

      {/* Info */}
      <View style={styles.info}>
        <Text
          style={[styles.name, { color: colors.textPrimary }]}
          numberOfLines={2}
        >
          {place.name}
        </Text>

        <View style={styles.meta}>
          {place.category && (
            <Text style={[styles.category, { color: colors.secondary }]}>
              {place.category}
            </Text>
          )}
          {place.rating && (
            <>
              {place.category && (
                <Text style={[styles.dot, { color: colors.textTertiary }]}>
                  ·
                </Text>
              )}
              <Ionicons name="star" size={11} color="#fde68a" />
              <Text style={[styles.metaText, { color: colors.textTertiary }]}>
                {" "}
                {place.rating}
              </Text>
            </>
          )}
        </View>

        {place.notes ? (
          <Text
            style={[styles.notes, { color: colors.textSecondary }]}
            numberOfLines={2}
          >
            {place.notes}
          </Text>
        ) : null}

        <View style={styles.badges}>
          {place.addedBy && (
            <View
              style={[
                styles.badge,
                { backgroundColor: colors.surface2, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.badgeText, { color: colors.textSecondary }]}>
                {place.addedBy}
              </Text>
            </View>
          )}
          {visited && (
            <View
              style={[
                styles.badge,
                {
                  backgroundColor: colors.secondary + "22",
                  borderColor: colors.secondary + "44",
                },
              ]}
            >
              <Ionicons
                name="checkmark-circle"
                size={12}
                color={colors.secondary}
              />
              <Text style={[styles.badgeText, { color: colors.secondary }]}>
                {" "}
                Visited
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

export default function PlacesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState("");

  const { data, isLoading, isError, error, refetch, isRefetching } = useQuery({
    queryKey: ["state", "places"],
    queryFn: () => getState<Place[]>("places"),
    refetchInterval: 60_000,
  });

  const places = useMemo(() => {
    if (!data?.data) return [];
    if (!search.trim()) return data.data;
    const q = search.toLowerCase();
    return data.data.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q) ||
        p.notes?.toLowerCase().includes(q)
    );
  }, [data?.data, search]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Search */}
      <View
        style={[
          styles.searchBar,
          { backgroundColor: colors.surface1, borderColor: colors.border },
        ]}
      >
        <Ionicons name="search" size={16} color={colors.textTertiary} />
        <TextInput
          placeholder="Search places…"
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

      {isLoading && (
        <View style={styles.center}>
          <ActivityIndicator color={colors.secondary} />
          <Text style={[styles.loadingText, { color: colors.textTertiary }]}>
            Loading places…
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
          data={places}
          keyExtractor={(p) => p.id}
          renderItem={({ item }) => <PlaceCard place={item} />}
          contentContainerStyle={[
            styles.list,
            { paddingBottom: insets.bottom + 100 },
          ]}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={colors.secondary}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>📍</Text>
              <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
                {search ? "No places match your search" : "No places yet"}
              </Text>
            </View>
          }
          ListHeaderComponent={
            data?.data ? (
              <Text style={[styles.count, { color: colors.textTertiary }]}>
                {places.length} {places.length === 1 ? "place" : "places"}
              </Text>
            ) : null
          }
        />
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
  searchInput: { flex: 1, fontSize: 15, padding: 0 },
  list: { paddingHorizontal: 16, paddingTop: 4 },
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
  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    gap: 12,
    marginBottom: 10,
  },
  placeImg: {
    width: 54,
    height: 54,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    overflow: "hidden",
  },
  placeImgFill: { width: 54, height: 54 },
  info: { flex: 1, gap: 4 },
  name: { fontSize: 15, fontWeight: "600", lineHeight: 20 },
  meta: { flexDirection: "row", alignItems: "center", gap: 2 },
  category: { fontSize: 12, fontWeight: "600" },
  dot: { fontSize: 12, marginHorizontal: 2 },
  metaText: { fontSize: 12 },
  notes: { fontSize: 13, lineHeight: 18, marginTop: 2 },
  badges: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 4 },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 100,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: { fontSize: 11, fontWeight: "500" },
});
