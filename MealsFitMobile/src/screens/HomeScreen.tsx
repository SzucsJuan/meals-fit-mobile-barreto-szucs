import React, { useEffect, useMemo, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";

import type { AppStackParamList } from "../navigation/AppNavigator";
import { TopBar } from "../components/TopBar";
import { logoutApi } from "../api/auth";
import { getLatestPlan, saveGoals, type Plan } from "../api/goals";

type Props = NativeStackScreenProps<AppStackParamList, "Home">;

const COLORS = {
  bg: "#020617",
  card: "#0b1220",
  border: "#1f2937",
  text: "#e5e7eb",
  muted: "#94a3b8",
  accent: "#FF9800",
  ok: "#22C55E",
  danger: "#f97373",
};

type Routine = "maintain" | "lose" | "gain";
type Experience = "beginner" | "advanced" | "professional";
type Activity = "sedentary" | "light" | "moderate" | "high" | "athlete";

function mapMode(m: Routine): "maintenance" | "loss" | "gain" {
  return m === "maintain" ? "maintenance" : m === "lose" ? "loss" : "gain";
}

const fmtInt = (n?: number) => (typeof n === "number" ? Math.round(n) : 0);
const fmtOneDec = (n?: number) =>
  typeof n === "number" ? (Math.round(n * 10) / 10).toFixed(1) : "0.0";

export default function HomeScreen({ navigation }: Props) {
  const [selectedRoutine, setSelectedRoutine] = useState<Routine | null>(null);
  const [experienceLevel, setExperienceLevel] = useState<Experience | null>(null);
  const [activityLevel, setActivityLevel] = useState<Activity>("moderate");

  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [age, setAge] = useState("");

  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  const [latestPlan, setLatestPlan] = useState<Plan | null>(null);
  const [loadingPlan, setLoadingPlan] = useState(true);
  const [planError, setPlanError] = useState<string | null>(null);

  const [refreshing, setRefreshing] = useState(false);

  const canSave = !!selectedRoutine && !!experienceLevel && !!weight && !!height && !!age;
  const showPersonalInfo = useMemo(() => !loadingPlan && !latestPlan, [loadingPlan, latestPlan]);

  async function handleLogout() {
    try {
      await logoutApi();
    } catch {
    }
  }

  async function loadLatest() {
    setLoadingPlan(true);
    setPlanError(null);
    try {
      const p = await getLatestPlan();
      setLatestPlan(p);
    } catch (e: any) {
      setPlanError(e?.message || "Failed to load plan");
      setLatestPlan(null);
    } finally {
      setLoadingPlan(false);
    }
  }

  useEffect(() => {
    loadLatest();
  }, []);

  async function onRefresh() {
    setRefreshing(true);
    await loadLatest();
    setRefreshing(false);
  }

  async function handleSave() {
    setSaveMsg(null);

    if (!selectedRoutine || !experienceLevel) {
      setSaveMsg("Elegí tu objetivo y experiencia.");
      return;
    }
    if (!weight || !height || !age) {
      setSaveMsg("Completá peso, altura y edad.");
      return;
    }

    const w = Number(weight);
    const h = Number(height);
    const a = Number(age);

    if (!Number.isFinite(w) || !Number.isFinite(h) || !Number.isFinite(a)) {
      setSaveMsg("Revisá los valores numéricos.");
      return;
    }

    try {
      setSaving(true);

      const res = await saveGoals({
        mode: mapMode(selectedRoutine),
        experience: experienceLevel,
        activity_level: activityLevel,
        age: a,
        weight: w,
        height: h,
      });

      const plan = (res as any)?.plan ?? null;
      setLatestPlan(plan);
      setSaveMsg(plan ? `Perfil guardado. Plan v${plan.version ?? "?"}` : "Guardado.");
    } catch (e: any) {
      setSaveMsg(e?.message || "Error guardando");
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.root}>
      <TopBar onLogout={handleLogout} />

      <ScrollView
        style={styles.screen}
        contentContainerStyle={{ padding: 12, paddingBottom: 28 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.muted} />
        }
      >
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Ionicons name="home-outline" size={28} color={COLORS.accent} />
            <View>
              <Text style={styles.h1}>Welcome back!</Text>
              <Text style={styles.sub}>What’s on your plate today?</Text>
            </View>
          </View>
        </View>

        {showPersonalInfo && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Personal Information</Text>
            <Text style={styles.cardDesc}>
              Completá tus datos para calcular objetivos nutricionales personalizados.
            </Text>

            <View style={styles.grid3}>
              <Field label="Weight (kg)" value={weight} onChange={setWeight} />
              <Field label="Height (cm)" value={height} onChange={setHeight} />
              <Field label="Age (years)" value={age} onChange={setAge} />
            </View>

            <Text style={[styles.sectionTitle, { marginTop: 12 }]}>Experience Level</Text>
            <View style={styles.chipRow}>
              <Chip
                label="Beginner"
                active={experienceLevel === "beginner"}
                onPress={() => setExperienceLevel("beginner")}
              />
              <Chip
                label="Advanced"
                active={experienceLevel === "advanced"}
                onPress={() => setExperienceLevel("advanced")}
              />
              <Chip
                label="Professional"
                active={experienceLevel === "professional"}
                onPress={() => setExperienceLevel("professional")}
              />
            </View>

            <Text style={[styles.sectionTitle, { marginTop: 12 }]}>Your Fitness Goal</Text>
            <View style={styles.chipRow}>
              <Chip
                label="Maintain"
                active={selectedRoutine === "maintain"}
                onPress={() => setSelectedRoutine("maintain")}
              />
              <Chip
                label="Lose"
                active={selectedRoutine === "lose"}
                onPress={() => setSelectedRoutine("lose")}
              />
              <Chip
                label="Gain"
                active={selectedRoutine === "gain"}
                onPress={() => setSelectedRoutine("gain")}
              />
            </View>

            <Text style={[styles.sectionTitle, { marginTop: 12 }]}>Activity Level</Text>
            <View style={styles.chipRowWrap}>
              {[
                { key: "sedentary", label: "Sedentary" },
                { key: "light", label: "Light" },
                { key: "moderate", label: "Moderate" },
                { key: "high", label: "High" },
                { key: "athlete", label: "Athlete" },
              ].map((opt) => (
                <Chip
                  key={opt.key}
                  label={opt.label}
                  active={activityLevel === (opt.key as Activity)}
                  onPress={() => setActivityLevel(opt.key as Activity)}
                  small
                />
              ))}
            </View>

            <TouchableOpacity
              style={[styles.primaryBtn, (!canSave || saving) && { opacity: 0.6 }]}
              disabled={!canSave || saving}
              onPress={handleSave}
              activeOpacity={0.9}
            >
              <Text style={styles.primaryBtnText}>{saving ? "Saving..." : "Save Profile Settings"}</Text>
            </TouchableOpacity>

            {saveMsg && (
              <Text
                style={{
                  marginTop: 10,
                  color: saveMsg.startsWith("Perfil") ? COLORS.ok : COLORS.danger,
                }}
              >
                {saveMsg}
              </Text>
            )}
          </View>
        )}

        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Ionicons name="flame-outline" size={18} color={COLORS.accent} />
            <Text style={styles.cardTitle}>Your Current Plan</Text>
          </View>
          <Text style={styles.cardDesc}>Latest personalized targets based on your selections</Text>

          {loadingPlan && <Text style={styles.muted}>Loading plan…</Text>}
          {planError && <Text style={{ color: COLORS.danger }}>Error: {planError}</Text>}

          {!loadingPlan && !planError && latestPlan && (
            <>
              <View style={styles.badgeRow}>
                <Badge text={String(latestPlan.experience)} />
                <Badge text={String(latestPlan.activity_level)} />
                <Badge text={String(latestPlan.mode)} />
                {typeof (latestPlan as any).version === "number" && (
                  <Badge text={`v${(latestPlan as any).version}`} outline />
                )}
              </View>

              <View style={styles.statsGrid}>
                <Stat label="Daily Calories" value={`${fmtInt(latestPlan.calorie_target)} kcal`} />
                <Stat label="TDEE" value={`${fmtInt(latestPlan.tdee)} kcal`} />
                <Stat label="Protein" value={`${fmtInt(latestPlan.protein_g)} g`} />
                <Stat label="Carbs" value={`${fmtInt(latestPlan.carbs_g)} g`} />
                <Stat label="Fat" value={`${fmtInt(latestPlan.fat_g)} g`} />
                <Stat label="Water" value={`${fmtOneDec(latestPlan.water_l)} L`} />
              </View>
            </>
          )}

          {!loadingPlan && !planError && !latestPlan && (
            <Text style={styles.muted}>No plan yet. Guardá tu perfil para generar tus objetivos.</Text>
          )}
        </View>

        <View style={styles.actionsGrid}>
          <ActionCard
            icon="restaurant-outline"
            title="Create New Recipe"
            subtitle="Build and save custom recipes"
            onPress={() => navigation.navigate("CreateRecipe")}
          />
          <ActionCard
            icon="book-outline"
            title="My Recipes"
            subtitle="Browse your recipes list"
            onPress={() => navigation.navigate("Recipes")}
          />
        </View>
      </ScrollView>
    </View>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <View style={{ flex: 1, minWidth: 0 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        keyboardType="numeric"
        placeholder="0"
        placeholderTextColor={COLORS.muted}
        style={styles.input}
      />
    </View>
  );
}

function Chip({
  label,
  active,
  onPress,
  small,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  small?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      style={[
        styles.chip,
        small && { paddingVertical: 7, paddingHorizontal: 10 },
        active && { borderColor: COLORS.accent },
      ]}
    >
      <Text style={[styles.chipText, active && { color: COLORS.accent }]} numberOfLines={1}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function Badge({ text, outline }: { text: string; outline?: boolean }) {
  return (
    <View style={[styles.badge, outline ? { backgroundColor: "transparent" } : null]}>
      <Text style={styles.badgeText} numberOfLines={1} ellipsizeMode="tail">
        {text}
      </Text>
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel} numberOfLines={1} ellipsizeMode="tail">
        {label}
      </Text>
      <Text style={styles.statValue} numberOfLines={1} ellipsizeMode="tail">
        {value}
      </Text>
    </View>
  );
}

function ActionCard({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.actionCard} onPress={onPress} activeOpacity={0.9}>
      <Ionicons name={icon} size={20} color={COLORS.accent} />
      <Text style={styles.actionTitle} numberOfLines={1}>
        {title}
      </Text>
      <Text style={styles.actionSub} numberOfLines={2}>
        {subtitle}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  screen: { flex: 1, backgroundColor: COLORS.bg },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },

  h1: { color: COLORS.text, fontSize: 18, fontWeight: "900" },
  sub: { color: COLORS.muted, marginTop: 2 },

  card: {
    marginTop: 12,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    padding: 12,
  },
  cardTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  cardTitle: { color: COLORS.text, fontSize: 16, fontWeight: "900" },
  cardDesc: { color: COLORS.muted, marginTop: 6, lineHeight: 18 },

  label: { color: COLORS.muted, fontSize: 12, marginTop: 10, marginBottom: 6 },
  input: {
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    color: COLORS.text,
    backgroundColor: "#0f172a",
  },

  sectionTitle: { color: COLORS.text, fontWeight: "900", marginTop: 8, marginBottom: 8 },

  grid3: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 6,
  },

  chipRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  chipRowWrap: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  chip: {
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: "#0f172a",
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 999,
  },
  chipText: { color: COLORS.text, fontWeight: "700", fontSize: 12 },

  primaryBtn: {
    marginTop: 14,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnText: { color: "#111827", fontWeight: "900" },

  muted: { color: COLORS.muted, marginTop: 10 },

  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  badge: {
    maxWidth: "100%",
    backgroundColor: "#0f172a",
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  badgeText: {
    color: COLORS.text,
    fontWeight: "800",
    fontSize: 12,
    flexShrink: 1,
  },

  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 12,
  },
  stat: {
    flexBasis: "48%",
    backgroundColor: "#0f172a",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    padding: 12,
  },
  statLabel: { color: COLORS.muted, fontSize: 12 },
  statValue: { color: COLORS.text, fontWeight: "900", fontSize: 14, marginTop: 6 },

  actionsGrid: { marginTop: 12, flexDirection: "row", flexWrap: "wrap", gap: 10 },
  actionCard: {
    width: "48%",
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    padding: 12,
  },
  actionTitle: { color: COLORS.text, fontWeight: "900", marginTop: 10 },
  actionSub: { color: COLORS.muted, marginTop: 6, lineHeight: 18 },
});
