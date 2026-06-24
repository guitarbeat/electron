import * as Haptics from "expo-haptics";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useSession } from "@/lib/session";
import { USERS, type User } from "@/lib/types";
import { UserAvatar } from "./UserAvatar";

interface UserSelectorProps {
  visible: boolean;
  onClose: () => void;
}

export function UserSelector({ visible, onClose }: UserSelectorProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { selectedUser, setSelectedUser } = useSession();

  const handleSelect = (user: User) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedUser(user);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              paddingBottom: insets.bottom + 20,
            },
          ]}
        >
          <Text style={[styles.title, { color: colors.foreground }]}>Who are you?</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Select your profile to track what you've watched
          </Text>

          <View style={styles.users}>
            {USERS.map((user) => (
              <Pressable
                key={user}
                style={[
                  styles.userBtn,
                  {
                    backgroundColor:
                      selectedUser === user ? colors.primary + "20" : colors.muted,
                    borderColor: selectedUser === user ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => handleSelect(user)}
              >
                <UserAvatar user={user} size={52} showRing={selectedUser === user} />
                <Text style={[styles.userName, { color: colors.foreground }]}>{user}</Text>
                {selectedUser === user ? (
                  <Text style={[styles.selected, { color: colors.primary }]}>✓ Selected</Text>
                ) : null}
              </Pressable>
            ))}
          </View>

          {selectedUser ? (
            <Pressable
              onPress={() => {
                setSelectedUser(null);
                onClose();
              }}
            >
              <Text style={[styles.clearText, { color: colors.mutedForeground }]}>
                Browse without a profile
              </Text>
            </Pressable>
          ) : null}
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    padding: 24,
    paddingTop: 20,
  },
  title: { fontSize: 22, fontFamily: "Inter_700Bold", marginBottom: 6 },
  subtitle: { fontSize: 14, fontFamily: "Inter_400Regular", marginBottom: 24 },
  users: { flexDirection: "row", gap: 14, marginBottom: 20 },
  userBtn: {
    flex: 1,
    alignItems: "center",
    gap: 10,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 2,
  },
  userName: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  selected: { fontSize: 12, fontFamily: "Inter_500Medium" },
  clearText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    paddingVertical: 10,
  },
});
