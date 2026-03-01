import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import * as AppleAuthentication from "expo-apple-authentication";
import { signInWithEmail, signUpWithEmail } from "../../src/lib/auth";
import { COLORS } from "../../src/lib/constants";

export default function LoginScreen() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email || !password) {
      Alert.alert("Erreur", "Veuillez remplir tous les champs");
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        if (!name) {
          Alert.alert("Erreur", "Veuillez entrer votre nom");
          return;
        }
        await signUpWithEmail(email, password, name);
      } else {
        await signInWithEmail(email, password);
      }
      router.replace("/(tabs)");
    } catch (err: any) {
      Alert.alert("Erreur", err.message || "Erreur d'authentification");
    } finally {
      setLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      // Send credential.identityToken to your backend for verification
      Alert.alert("Succès", "Connexion Apple réussie");
      router.replace("/(tabs)");
    } catch (err: any) {
      if (err.code !== "ERR_REQUEST_CANCELED") {
        Alert.alert("Erreur", "Échec de la connexion Apple");
      }
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <View style={styles.inner}>
        <View style={styles.header}>
          <Text style={styles.logo}>Evanesc</Text>
          <Text style={styles.subtitle}>
            Deals éphémères à Saint-Barthélemy
          </Text>
        </View>

        <View style={styles.form}>
          {isSignUp && (
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Nom complet"
              placeholderTextColor={COLORS.textLight}
              style={styles.input}
              autoCapitalize="words"
            />
          )}

          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Email"
            placeholderTextColor={COLORS.textLight}
            style={styles.input}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Mot de passe"
            placeholderTextColor={COLORS.textLight}
            style={styles.input}
            secureTextEntry
          />

          <Pressable
            onPress={handleSubmit}
            disabled={loading}
            style={[styles.submitButton, loading && { opacity: 0.6 }]}
          >
            <Text style={styles.submitButtonText}>
              {loading
                ? "Chargement..."
                : isSignUp
                  ? "Créer un compte"
                  : "Se connecter"}
            </Text>
          </Pressable>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>ou</Text>
            <View style={styles.dividerLine} />
          </View>

          {Platform.OS === "ios" && (
            <AppleAuthentication.AppleAuthenticationButton
              buttonType={
                AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN
              }
              buttonStyle={
                AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
              }
              cornerRadius={12}
              style={styles.appleButton}
              onPress={handleAppleSignIn}
            />
          )}

          <Pressable
            onPress={() => setIsSignUp(!isSignUp)}
            style={styles.toggleButton}
          >
            <Text style={styles.toggleText}>
              {isSignUp
                ? "Déjà un compte ? Se connecter"
                : "Pas encore de compte ? S'inscrire"}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => router.back()}
            style={styles.closeButton}
          >
            <Text style={styles.closeText}>Fermer</Text>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  inner: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  logo: {
    fontSize: 36,
    fontWeight: "800",
    color: COLORS.primary,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.textLight,
    marginTop: 4,
  },
  form: {
    gap: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: COLORS.text,
    backgroundColor: COLORS.background,
  },
  submitButton: {
    backgroundColor: COLORS.accent,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 4,
  },
  submitButtonText: {
    color: COLORS.textInverse,
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dividerText: {
    paddingHorizontal: 12,
    fontSize: 13,
    color: COLORS.textLight,
  },
  appleButton: {
    height: 50,
  },
  toggleButton: {
    paddingVertical: 8,
  },
  toggleText: {
    color: COLORS.accent,
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  closeButton: {
    paddingVertical: 8,
  },
  closeText: {
    color: COLORS.textLight,
    fontSize: 14,
    textAlign: "center",
  },
});
