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
import { login } from "../api/auth";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    setError(null);

    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setLoading(true);
    try {
      const user = await login(email.trim(), password);
      console.log("Sign in OK", user);
      // El cambio de pantalla lo maneja AppNavigator cuando detecta token
    } catch (e: any) {
      console.error("SIGN IN FAILED", e);
      setError(e.message || "Sign in error");
    } finally {
      setLoading(false);
    }
  };

  const disabled = loading || !email.trim() || !password;
  const logo = require("../../assets/icon.png");

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.root}>
          {/* fondo “layout” similar al desktop */}
          <View style={styles.centerWrapper}>
            <View style={styles.card}>
              {/* logo + título, similar a EggFried + texto en desktop */}
              <View style={styles.header}>
                <Image source={logo} style={styles.logo} />
                <Text style={styles.title}>Meals&Fit</Text>
                <Text style={styles.subtitle}>
                  Sign in to continue with your plan.
                </Text>
              </View>

              {/* formulario */}
              <View style={styles.form}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  placeholder="example@email.com"
                  placeholderTextColor="#6b7280"
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  value={email}
                  onChangeText={setEmail}
                  returnKeyType="next"
                />

                <Text style={[styles.label, { marginTop: 16 }]}>
                  Password
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor="#6b7280"
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
                >
                  {loading ? (
                    <ActivityIndicator color="#0f172a" />
                  ) : (
                    <Text style={styles.buttonText}>Sign in</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <Text style={styles.footerText}>
              Meals&Fit · Nutrition and smart tracking
            </Text>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const COLORS = {
  bg: "#020617", // similar a fondo oscuro desktop
  card: "#020617", // card oscura
  border: "#1f2937",
  text: "#e5e7eb",
  muted: "#9ca3af",
  error: "#f97373",
  primary: "#22c55e", // verde tipo desktop
  primaryDark: "#16a34a",
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bg,
    paddingHorizontal: 24,
  },
  centerWrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    width: "100%",
    maxWidth: 420,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  header: {
    alignItems: "center",
    marginBottom: 20,
  },
  logoCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  logo: {
    width: 70,
    height: 70,
    borderRadius: 14, // opcional
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.muted,
    textAlign: "center",
  },
  form: {
    marginTop: 8,
  },
  label: {
    fontSize: 13,
    color: COLORS.text,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: COLORS.text,
    backgroundColor: "#020617",
    fontSize: 14,
  },
  error: {
    color: COLORS.error,
    marginTop: 10,
    fontSize: 13,
  },
  button: {
    marginTop: 20,
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: "center",
    backgroundColor: COLORS.primary,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: "#0f172a",
    fontWeight: "700",
    fontSize: 15,
  },
  footerText: {
    marginTop: 16,
    fontSize: 11,
    color: COLORS.muted,
    textAlign: "center",
  },
});
