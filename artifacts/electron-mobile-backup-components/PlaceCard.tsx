import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import { StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";
import type { Place } from "@/lib/types";

interface PlaceCardProps {
  place: Place;
}

export function PlaceCard({ place }: PlaceCardProps) {
  const colors = useColors();
  const isVisited = !!place.visitedAt;

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {place.imageUrl ? (
        <Image
          source={{ uri: place.imageUrl }}
          style={styles.image}
          contentFit="cover"
        />
      ) : (
        <View style={[styles.imagePlaceholder, { backgroundColor: colors.muted }]}>
          <Feather
            name={place.category === "Restaurant" ? "coffee" : "map-pin"}
            size={24}
            color={colors.secondary}
          />
        </View>
      )}

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={1}>
            {place.name}
          </Text>
          {isVisited ? (
            <View style={[styles.badge, { backgroundColor: colors.secondary + "22", borderColor: colors.secondary }]}>
              <Feather name="check" size={10} color={colors.secondary} />
              <Text style={[styles.badgeText, { color: colors.secondary }]}>Visited</Text>
            </View>
          ) : null}
        </View>

        {place.category ? (
          <Text style={[styles.category, { color: colors.secondary }]}>{place.category}</Text>
        ) : null}

        {place.notes ? (
          <Text style={[styles.notes, { color: colors.mutedForeground }]} numberOfLines={2}>
            {place.notes}
          </Text>
        ) : null}

        <View style={styles.footer}>
          {place.rating ? (
            <View style={styles.ratingRow}>
              <Feather name="star" size={11} color="#fde68a" />
              <Text style={[styles.footerText, { color: colors.mutedForeground, marginLeft: 3 }]}>
                {place.rating}
              </Text>
            </View>
          ) : null}
          {place.addedBy ? (
            <Text style={[styles.footerText, { color: colors.mutedForeground }]}>
              Added by {place.addedBy}
            </Text>
          ) : null}
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
  image: {
    width: 90,
    height: 100,
  },
  imagePlaceholder: {
    width: 90,
    height: 100,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
    padding: 12,
    justifyContent: "space-between",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  name: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    flex: 1,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 20,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 10,
    fontFamily: "Inter_500Medium",
  },
  category: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    marginTop: 2,
  },
  notes: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 4,
    lineHeight: 18,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 6,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  footerText: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
});
