import { View, Text, Pressable, StyleSheet, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { trpc } from "../../src/lib/trpc";
import { signOut } from "../../src/lib/auth";
import { COLORS } from "../../src/lib/constants";

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: session } = trpc.auth.getSession.useQuery();

  const handleSignOut = async () => {
    await signOut();
    router.replace("/auth/login");
  };

  if (!session?.user) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text style={styles.title}>Profil</Text>
        </View>
        <View style={styles.centered}>
          <Text style={styles.emptyText}>Connectez-vous pour continuer</Text>
          <Pressable
            onPress={() => router.push("/auth/login")}
            style={styles.loginButton}
          >
            <Text style={styles.loginButtonText}>Se connecter</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Profil</Text>
      </View>

      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {session.user.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()}
          </Text>
        </View>
        <Text style={styles.name}>{session.user.name}</Text>
        <Text style={styles.email}>{session.user.email}</Text>
      </View>

      <View style={styles.menu}>
        <Pressable
          style={styles.menuItem}
          onPress={() =>
            Alert.alert("Bientôt", "Cette fonctionnalité arrive prochainement")
          }
        >
          <Text style={styles.menuText}>Modifier le profil</Text>
          <Text style={styles.menuArrow}>›</Text>
        </Pressable>

        <Pressable
          style={styles.menuItem}
          onPress={() =>
            Alert.alert("Bientôt", "Cette fonctionnalité arrive prochainement")
          }
        >
          <Text style={styles.menuText}>Notifications</Text>
          <Text style={styles.menuArrow}>›</Text>
        </Pressable>

        <Pressable
          style={styles.menuItem}
          onPress={() =>
            Alert.alert("Bientôt", "Cette fonctionnalité arrive prochainement")
          }
        >
          <Text style={styles.menuText}>Aide & Support</Text>
          <Text style={styles.menuArrow}>›</Text>
        </Pressable>

        <Pressable
          style={[styles.menuItem, styles.menuItemLast]}
          onPress={handleSignOut}
        >
          <Text style={[styles.menuText, { color: COLORS.error }]}>
            Déconnexion
          </Text>
        </Pressable>
      </View>

      <Text style={styles.version}>Evanesc v1.0.0</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: COLORS.primary,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 100,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textLight,
    marginBottom: 16,
  },
  loginButton: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
  },
  loginButtonText: {
    color: COLORS.textInverse,
    fontWeight: "700",
    fontSize: 15,
  },
  profileCard: {
    alignItems: "center",
    paddingVertical: 24,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  avatarText: {
    color: COLORS.textInverse,
    fontSize: 24,
    fontWeight: "700",
  },
  name: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.primary,
  },
  email: {
    fontSize: 14,
    color: COLORS.textLight,
    marginTop: 2,
  },
  menu: {
    marginHorizontal: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  menuText: {
    fontSize: 15,
    fontWeight: "500",
    color: COLORS.text,
  },
  menuArrow: {
    fontSize: 20,
    color: COLORS.textLight,
  },
  version: {
    textAlign: "center",
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 32,
  },
});
