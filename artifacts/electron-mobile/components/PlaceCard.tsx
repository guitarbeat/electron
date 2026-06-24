import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRef } from "react";
import { Animated, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import { useColors } from "@/hooks/useColors";
import type { Place } from "@/lib/types";

interface PlaceCardProps {
  place: Place;
  onToggleVisited?: (place: Place) => void;
}

export function PlaceCard({ place, onToggleVisited }: PlaceCardProps) {
  const colors = useColors();
  const isVisited = !!place.visitedAt;
  const swipeableRef = useRef<Swipeable>(null);

  const handleToggle = () => {
    swipeableRef.current?.close();
    onToggleVisited?.(place);
  };

  const renderRightActions = (
    _progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>
  ) => {
    const scale = dragX.interpolate({
      inputRange: [-100, -60],
      outputRange: [1, 0.85],
      extrapolate: "clamp",
    });

    const bgColor = isVisited ? "#ef4444" : colors.secondary;
    const icon = isVisited ? "x-circle" : "check-circle";
    const label = isVisited ? "Unvisit" : "Visited!";

    return (
      <TouchableOpacity
        onPress={handleToggle}
        activeOpacity={0.85}
        style={[styles.swipeAction, { backgroundColor: bgColor }]}
      >
        <Animated.View style={[styles.swipeActionInner, { transform: [{ scale }] }]}>
          <Feather name={icon} size={22} color="#fff" />
          <Text style={styles.swipeActionLabel}>{label}</Text>
        </Animated.View>
      </TouchableOpacity>
    );
  };

  return (
    <Swipeable
      ref={swipeableRef}
      renderRightActions={renderRightActions}
      rightThreshold={60}
      overshootRight={false}
      friction={2}
    >
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {place.imageUrl ? (
          <Image source={{ uri: place.imageUrl }} style={styles.image} contentFit="cover" />
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
            <TouchableOpacity
              onPress={handleToggle}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={[
                styles.badge,
                isVisited
                  ? { backgroundColor: colors.secondary + "22", borderColor: colors.secondary }
                  : { backgroundColor: colors.muted, borderColor: colors.border },
              ]}
            >
              <Feather
                name={isVisited ? "check" : "circle"}
                size={10}
                color={isVisited ? colors.secondary : colors.mutedForeground}
              />
              <Text
                style={[
                  styles.badgeText,
                  { color: isVisited ? colors.secondary : colors.mutedForeground },
                ]}
              >
                {isVisited ? "Visited" : "Visit?"}
              </Text>
            </TouchableOpacity>
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
            {place.addedBy ? (
              <Text style={[styles.footerText, { color: colors.mutedForeground }]}>
                Added by {place.addedBy}
              </Text>
            ) : null}
            {onToggleVisited ? (
              <Text style={[styles.swipeHint, { color: colors.mutedForeground }]}>
                ← swipe
              </Text>
            ) : null}
          </View>
        </View>
      </View>
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: 12,
    backgroundColor: "#fff",
  },
  image: { width: 90, height: 100 },
  imagePlaceholder: {
    width: 90,
    height: 100,
    alignItems: "center",
    justifyContent: "center",
  },
  content: { flex: 1, padding: 12, justifyContent: "space-between" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  name: { fontSize: 15, fontFamily: "Inter_600SemiBold", flex: 1 },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 20,
    borderWidth: 1,
  },
  badgeText: { fontSize: 10, fontFamily: "Inter_500Medium" },
  category: { fontSize: 12, fontFamily: "Inter_500Medium", marginTop: 2 },
  notes: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 4, lineHeight: 18 },
  footer: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 6 },
  footerText: { fontSize: 11, fontFamily: "Inter_400Regular" },
  swipeHint: { fontSize: 10, fontFamily: "Inter_400Regular", opacity: 0.5 },
  swipeAction: {
    justifyContent: "center",
    alignItems: "center",
    width: 88,
    marginBottom: 12,
    borderRadius: 12,
    marginLeft: 8,
  },
  swipeActionInner: {
    alignItems: "center",
    gap: 4,
  },
  swipeActionLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
  },
});
