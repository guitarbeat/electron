import { Feather } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  SectionList,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MemoryCard } from "@/components/MemoryCard";
import { useColors } from "@/hooks/useColors";
import { api } from "@/lib/api";
import type { SharedMemory } from "@/lib/types";

export default function MemoriesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ["memories"],
    queryFn: api.state.memories,
    refetchInterval: 15_000,
  });

  const allMemories = data?.data ?? [];
  const pinned = allMemories.filter((m) => m.isPinned);
  const unpinned = allMemories.filter((m) => !m.isPinned);

  const sections = [
    ...(pinned.length > 0 ? [{ title: "Pinned", data: pinned }] : []),
    ...(unpinned.length > 0 ? [{ title: pinned.length > 0 ? "All Memories" : "Memories", data: unpinned }] : []),
  ];

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
        <View>
          <Text style={[styles.screenTitle, { color: colors.foreground }]}>Memories</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            {allMemories.length === 0 ? "No memories yet" : `${allMemories.length} shared memory${allMemories.length !== 1 ? "ies" : "y"}`}
          </Text>
        </View>
        {pinned.length > 0 ? (
          <View style={[styles.pinnedChip, { backgroundColor: colors.primary + "20", borderColor: colors.primary }]}>
            <Feather name="bookmark" size={12} color={colors.primary} />
            <Text style={[styles.pinnedText, { color: colors.primary }]}>{pinned.length} pinned</Text>
          </View>
        ) : null}
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
      ) : allMemories.length === 0 ? (
        <View style={styles.centered}>
          <Feather name="heart" size={48} color={colors.mutedForeground} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No memories yet</Text>
          <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>
            Share notes and moments about movies you've watched together
          </Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 100 }]}
          renderItem={({ item }) => <MemoryCard memory={item} />}
          renderSectionHeader={({ section }) => (
            <View style={[styles.sectionHeader, { backgroundColor: colors.background }]}>
              <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
                {section.title.toUpperCase()}
              </Text>
            </View>
          )}
          refreshing={isRefetching}
          onRefresh={refetch}
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled
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
  pinnedChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  pinnedText: { fontSize: 12, fontFamily: "Inter_500Medium" },
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
  sectionHeader: { paddingVertical: 8, paddingHorizontal: 16 },
  sectionTitle: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 1 },
});
