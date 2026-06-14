import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useColors } from "@/hooks/useColors";
import { useSession } from "@/context/SessionContext";
import type { User } from "@/lib/api";

const USER_PHOTOS: Record<User, string> = {
  Aaron: "https://cataas.com/cat/black?width=200&height=200",
  Electra: "https://cataas.com/cat/cute?width=200&height=200",
};

export function SignInModal() {
  const colors = useColors();
  const { currentUser, loading, signIn, signOut } = useSession();
  const [visible, setVisible] = React.useState(false);
  const [signingIn, setSigningIn] = React.useState(false);

  const handleSignIn = async (user: User) => {
    setSigningIn(true);
    try {
      await signIn(user);
      setVisible(false);
    } finally {
      setSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    setVisible(false);
  };

  return (
    <>
      {/* Avatar button in header */}
      <Pressable
        onPress={() => setVisible(true)}
        style={[styles.avatarBtn, { borderColor: colors.border }]}
      >
        {loading ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : currentUser ? (
          <Image
            source={{ uri: USER_PHOTOS[currentUser] }}
            style={styles.avatarImg}
          />
        ) : (
          <Ionicons name="person-circle-outline" size={28} color={colors.mutedForeground} />
        )}
      </Pressable>

      {/* Modal */}
      <Modal
        visible={visible}
        animationType="fade"
        transparent
        onRequestClose={() => setVisible(false)}
      >
        <Pressable
          style={styles.overlay}
          onPress={() => setVisible(false)}
        >
          <Pressable
            style={[
              styles.sheet,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Title */}
            <Text style={[styles.title, { color: colors.textPrimary }]}>
              {currentUser ? `Signed in as ${currentUser}` : "Who are you?"}
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {currentUser
                ? "Switch profiles or sign out below."
                : "Choose your profile to sync your watchlist."}
            </Text>

            {/* Profile buttons */}
            <View style={styles.profiles}>
              {(["Aaron", "Electra"] as User[]).map((user) => (
                <Pressable
                  key={user}
                  onPress={() => handleSignIn(user)}
                  disabled={signingIn}
                  style={({ pressed }) => [
                    styles.profileBtn,
                    {
                      backgroundColor:
                        currentUser === user
                          ? colors.primary + "22"
                          : colors.surface2,
                      borderColor:
                        currentUser === user ? colors.primary : colors.border,
                      opacity: pressed ? 0.7 : 1,
                    },
                  ]}
                >
                  <Image
                    source={{ uri: USER_PHOTOS[user] }}
                    style={styles.profileImg}
                  />
                  <Text style={[styles.profileName, { color: colors.textPrimary }]}>
                    {user}
                  </Text>
                  {currentUser === user && (
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color={colors.primary}
                    />
                  )}
                </Pressable>
              ))}
            </View>

            {/* Sign out */}
            {currentUser && (
              <Pressable
                onPress={handleSignOut}
                style={({ pressed }) => [
                  styles.signOutBtn,
                  { borderColor: colors.border, opacity: pressed ? 0.7 : 1 },
                ]}
              >
                <Ionicons
                  name="log-out-outline"
                  size={18}
                  color={colors.textTertiary}
                />
                <Text style={[styles.signOutText, { color: colors.textTertiary }]}>
                  Sign out
                </Text>
              </Pressable>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  avatarBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    marginRight: 4,
  },
  avatarImg: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "center",
    alignItems: "center",
  },
  sheet: {
    width: "86%",
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    gap: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  profiles: {
    gap: 12,
    marginTop: 4,
  },
  profileBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
  },
  profileImg: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  profileName: {
    flex: 1,
    fontSize: 17,
    fontWeight: "600",
  },
  signOutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    marginTop: 4,
  },
  signOutText: {
    fontSize: 15,
  },
});
