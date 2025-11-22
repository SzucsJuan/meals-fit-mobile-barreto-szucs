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
      console.log("Sign in OK", user);
    } catch (e: any) {
      console.error("SIGN IN FAILED", e);
      setError(e.message || "Sign in error");
    } finally {
      setLoading(false);
    }
  };

  const disabled = loading || !email.trim() || !password;

  const goToRegister = () => {
    navigation.navigate("Register");
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
              <View style={styles.header}>
                <Image source={logo} style={styles.logo} />
                <Text style={styles.title}>Sign in to Meals&Fit</Text>
                <View style={styles.subtitleRow}>
                  <Text style={styles.subtitle}>New here? </Text>
                  <TouchableOpacity onPress={goToRegister}>
                    <Text style={styles.link}>Create an account</Text>
                  </TouchableOpacity>
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

                <Text style={[styles.label, { marginTop: 16 }]}>Password</Text>
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
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" />
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
    backgroundColor: "#FFFFFF",
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
    color: "#FFFFFF",
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
