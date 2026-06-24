import { Image, StyleSheet, View } from "react-native";
import { useColors } from "@/hooks/useColors";
import type { User } from "@/lib/types";
import { USER_PHOTOS } from "@/lib/types";

interface UserAvatarProps {
  user: User;
  size?: number;
  showRing?: boolean;
}

export function UserAvatar({ user, size = 36, showRing = false }: UserAvatarProps) {
  const colors = useColors();

  return (
    <View
      style={[
        styles.wrapper,
        {
          width: size + (showRing ? 4 : 0),
          height: size + (showRing ? 4 : 0),
          borderRadius: (size + (showRing ? 4 : 0)) / 2,
          borderWidth: showRing ? 2 : 0,
          borderColor: colors.primary,
        },
      ]}
    >
      <Image
        source={{ uri: USER_PHOTOS[user] }}
        style={[
          styles.avatar,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatar: {
    resizeMode: "cover",
  },
});
