// src/screens/RegisterScreen.tsx
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
import { register, RegisterInput } from "../api/auth";
import type { AuthStackParamList } from "../navigation/AppNavigator";

type Nav = NativeStackNavigationProp<AuthStackParamList, "Register">;

const COLORS = {
  bg: "#F8F5F0", 
  card: "#FFFFFF",
  border: "#E5E7EB",
  text: "#1F2937",
  muted: "#6B7280",
  error: "#DC2626",
  primary: "#22C55E",
  primaryDark: "#16A34A",
  link: "#16A34A",
};

export default function RegisterScreen() {
  const navigation = useNavigation<Nav>();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const logo = require("../../assets/icon.png");

  const onSubmit = async () => {
    setError(null);

    if (!name.trim() || !email.trim() || !password || !password2) {
      setError("Please complete all fields.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }
    if (password !== password2) {
      setError("Passwords must match.");
      return;
    }

    setLoading(true);
    try {
      const payload: RegisterInput = {
        name: name.trim(),
        email: email.trim(),
        password,
        password_confirmation: password2,
      };

      await register(payload);
      alert("Account created successfully. Please sign in.");
      navigation.navigate("Login");
    } catch (e: any) {
      console.error("REGISTER FAILED", e);
      const msg =
        e?.message ||
        e?.response?.data?.message ||
        "Error creating account. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const disabled =
    loading || !name.trim() || !email.trim() || !password || !password2;

  const goToLogin = () => {
    navigation.navigate("Login");
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.root}>
          <View style={styles.centerWrapper}>
            <View style={styles.card}>
              {/* Encabezado */}
              <View style={styles.header}>
                <Image source={logo} style={styles.logo} />
                <Text style={styles.title}>Create your account</Text>
                <View style={styles.subtitleRow}>
                  <Text style={styles.subtitle}>Already have an account? </Text>
                  <TouchableOpacity onPress={goToLogin}>
                    <Text style={styles.link}>Sign in</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Formulario */}
              <View style={styles.form}>
                <Text style={styles.sectionTitle}>Get started for free</Text>

                <Text style={[styles.label, { marginTop: 16 }]}>Full name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Your name"
                  placeholderTextColor={COLORS.muted}
                  value={name}
                  onChangeText={setName}
                  returnKeyType="next"
                />

                <Text style={[styles.label, { marginTop: 12 }]}>Email</Text>
                <TextInput
                  style={styles.input}
                  placeholder="name@example.com"
                  placeholderTextColor={COLORS.muted}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  value={email}
                  onChangeText={setEmail}
                  returnKeyType="next"
                />

                <Text style={[styles.label, { marginTop: 12 }]}>Password</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Create a strong password"
                  placeholderTextColor={COLORS.muted}
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                  returnKeyType="next"
                />
                <Text style={styles.helperText}>
                  Must be at least 8 characters long.
                </Text>

                <Text style={[styles.label, { marginTop: 12 }]}>
                  Confirm password
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="Confirm your password"
                  placeholderTextColor={COLORS.muted}
                  secureTextEntry
                  value={password2}
                  onChangeText={setPassword2}
                  returnKeyType="done"
                  onSubmitEditing={onSubmit}
                />
                <Text style={styles.helperText}>Passwords must match.</Text>

                {error && <Text style={styles.error}>{error}</Text>}

                <TouchableOpacity
                  style={[styles.button, disabled && styles.buttonDisabled]}
                  onPress={onSubmit}
                  disabled={disabled}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.buttonText}>Create account</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <Text style={styles.footerText}>
              By creating an account, you agree to our{" "}
              <Text style={styles.link}>Terms of Service</Text> and{" "}
              <Text style={styles.link}>Privacy Policy</Text>.
            </Text>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

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
    alignItems: "flex-start",
    marginBottom: 16,
  },
  logo: {
    width: 48,
    height: 48,
    borderRadius: 12,
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 4,
  },
  subtitleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.muted,
  },
  link: {
    fontSize: 13,
    color: COLORS.link,
    fontWeight: "600",
  },
  form: {
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 4,
  },
  label: {
    fontSize: 13,
    color: COLORS.text,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: COLORS.text,
    backgroundColor: "#FFFFFF",
    fontSize: 14,
  },
  helperText: {
    fontSize: 11,
    color: COLORS.muted,
    marginTop: 4,
  },
  error: {
    color: COLORS.error,
    marginTop: 10,
    fontSize: 13,
  },
  button: {
    marginTop: 20,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: COLORS.primary,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 15,
  },
  footerText: {
    marginTop: 16,
    fontSize: 11,
    color: COLORS.muted,
    textAlign: "center",
    maxWidth: 420,
  },
});
