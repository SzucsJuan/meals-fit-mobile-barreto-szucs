import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Image,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { login } from "../api/auth";
import type { AuthStackParamList } from "../navigation/AppNavigator";

type Nav = NativeStackNavigationProp<AuthStackParamList, "Login">;

const COLORS = {
  bg: "#020617",
  card: "#0b1220",
  chipBg: "#0f172a",
  border: "#1f2937",
  text: "#e5e7eb",
  muted: "#94a3b8",
  error: "#f97373",
  primary: "#22C55E",
  link: "#FF9800",
};

export default function LoginScreen() {
  const navigation = useNavigation<Nav>();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const logo = require("../../assets/icon.png");

  const onSubmit = async () => {
    setError(null);

    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setLoading(true);
    try {
      const user = await login(email.trim(), password);
      // console.log("Sign in OK", user);
    } catch (e: any) {
      // console.error("SIGN IN FAILED", e);
      setError(e.message || "Sign in error");
    } finally {
      setLoading(false);
    }
  };

  const disabled = loading || !email.trim() || !password;

  const goToRegister = () => navigation.navigate("Register");

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.root}>
          <View style={styles.centerWrapper}>
            <View style={styles.card}>
              <View style={styles.header}>
                <View style={styles.brandRow}>
                  <Image source={logo} style={styles.logo} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.title}>Sign in to Meals&Fit</Text>
                    <View style={styles.subtitleRow}>
                      <Text style={styles.subtitle}>New here? </Text>
                      <TouchableOpacity onPress={goToRegister} activeOpacity={0.8}>
                        <Text style={styles.link}>Create an account</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>

              <View style={styles.form}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  placeholder="example@email.com"
                  placeholderTextColor={COLORS.muted}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  value={email}
                  onChangeText={setEmail}
                  returnKeyType="next"
                />

                <Text style={[styles.label, { marginTop: 14 }]}>Password</Text>
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor={COLORS.muted}
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                  returnKeyType="done"
                  onSubmitEditing={onSubmit}
                />

                {error && <Text style={styles.error}>{error}</Text>}

                <TouchableOpacity
                  style={[styles.button, disabled && styles.buttonDisabled]}
                  onPress={onSubmit}
                  disabled={disabled}
                  activeOpacity={0.9}
                >
                  {loading ? <ActivityIndicator color="#0b1220" /> : <Text style={styles.buttonText}>Sign in</Text>}
                </TouchableOpacity>
              </View>
            </View>

            <Text style={styles.footerText}>Meals&Fit · Nutrition and smart tracking</Text>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg, paddingHorizontal: 24 },
  centerWrapper: { flex: 1, justifyContent: "center", alignItems: "center" },

  card: {
    width: "100%",
    maxWidth: 420,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },

  header: { marginBottom: 12 },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 12 },

  logo: { width: 48, height: 48, borderRadius: 12 },

  title: { fontSize: 22, fontWeight: "900", color: COLORS.text, marginBottom: 4 },
  subtitleRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap" },
  subtitle: { fontSize: 13, color: COLORS.muted },
  link: { fontSize: 13, color: COLORS.link, fontWeight: "800" },

  form: { marginTop: 6 },

  label: { fontSize: 13, color: COLORS.text, marginBottom: 6, fontWeight: "800" },

  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: COLORS.text,
    backgroundColor: COLORS.chipBg,
    fontSize: 14,
  },

  error: { color: COLORS.error, marginTop: 10, fontSize: 13, fontWeight: "800" },

  button: {
    marginTop: 18,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: COLORS.primary,
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: "#0b1220", fontWeight: "900", fontSize: 15 },

  footerText: { marginTop: 16, fontSize: 11, color: COLORS.muted, textAlign: "center" },
});
