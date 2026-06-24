import { Feather } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";
import type { SharedMemory } from "@/lib/types";

interface MemoryCardProps {
  memory: SharedMemory;
}

export function MemoryCard({ memory }: MemoryCardProps) {
  const colors = useColors();

  const formattedDate = new Date(memory.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.card, borderColor: memory.isPinned ? colors.primary : colors.border },
      ]}
    >
      <View style={styles.header}>
        <View style={styles.titleRow}>
          {memory.isPinned ? (
            <Feather name="bookmark" size={14} color={colors.primary} style={{ marginRight: 6 }} />
          ) : null}
          <Text style={[styles.movieTitle, { color: colors.secondary }]} numberOfLines={1}>
            {memory.movieTitle}
          </Text>
        </View>
        <Text style={[styles.date, { color: colors.mutedForeground }]}>{formattedDate}</Text>
      </View>

      <Text style={[styles.note, { color: colors.foreground }]}>{memory.note}</Text>

      <Text style={[styles.author, { color: colors.mutedForeground }]}>— {memory.author}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  movieTitle: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    flex: 1,
  },
  date: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  note: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 21,
    marginBottom: 8,
  },
  author: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    fontStyle: "italic",
  },
});
