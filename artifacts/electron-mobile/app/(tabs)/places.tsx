import { Feather } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
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
import { PlaceCard } from "@/components/PlaceCard";
import { useColors } from "@/hooks/useColors";
import { api } from "@/lib/api";

export default function PlacesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ["places"],
    queryFn: api.state.places,
    refetchInterval: 15_000,
  });

  const places = data?.data ?? [];
  const visitedCount = places.filter((p) => !!p.visitedAt).length;
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
        <View>
          <Text style={[styles.screenTitle, { color: colors.foreground }]}>Places</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            {places.length === 0
              ? "No places yet"
              : `${visitedCount} of ${places.length} visited`}
          </Text>
        </View>
        <View
          style={[
            styles.statsChip,
            { backgroundColor: colors.secondary + "20", borderColor: colors.secondary },
          ]}
        >
          <Feather name="map-pin" size={13} color={colors.secondary} />
          <Text style={[styles.statsText, { color: colors.secondary }]}>{places.length}</Text>
        </View>
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
      ) : places.length === 0 ? (
        <View style={styles.centered}>
          <Feather name="map" size={48} color={colors.mutedForeground} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No places saved yet</Text>
          <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>
            Add places to visit together from the web app
          </Text>
        </View>
      ) : (
        <FlatList
          data={places}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 100 }]}
          renderItem={({ item }) => <PlaceCard place={item} />}
          refreshing={isRefetching}
          onRefresh={refetch}
          showsVerticalScrollIndicator={false}
        />
      )}
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
  statsChip: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1,
  },
  statsText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 18, fontFamily: "Inter_600SemiBold", textAlign: "center" },
  emptySubtitle: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20 },
  retryBtn: { marginTop: 8, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, borderWidth: 1 },
  retryText: { fontSize: 14, fontFamily: "Inter_500Medium" },
  list: { padding: 16 },
});
