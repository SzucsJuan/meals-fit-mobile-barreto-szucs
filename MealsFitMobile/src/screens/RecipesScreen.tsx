import React from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Image,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { listMyRecipes, Recipe } from "../api/recipes";
import { useAuth } from "../store/auth";
import type { AppStackParamList } from "../navigation/AppNavigator";
import { API_BASE_URL } from "../config/env";
import { logoutApi } from "../api/auth";
import { TopBar } from "../components/TopBar";

const COLORS = {
  bg: "#020617",
  card: "#0b1220",
  border: "#1f2937",
  textPrimary: "#e5e7eb",
  textSecondary: "#94a3b8",
  accent: "#FF9800",
  danger: "#f97373",
  chipBg: "#0f172a",
};

type Nav = NativeStackNavigationProp<AppStackParamList, "Recipes">;

function resolveImageUrl(recipe: Recipe): string | undefined {
  let url = recipe.image_thumb_url || recipe.image_url || recipe.image_webp_url;
  if (!url) return undefined;

  // si backend devolvió localhost en storage link, lo reescribimos al base real
  if (url.includes("://localhost") || url.includes("://127.0.0.1")) {
    const idx = url.indexOf("/storage/");
    if (idx !== -1) {
      const storagePath = url.substring(idx + "/storage/".length);
      return `${API_BASE_URL}/storage/${storagePath}`;
    }
  }
  return url;
}

export default function RecipesScreen() {
  const user = useAuth((s) => s.user);
  const navigation = useNavigation<Nav>();

  const handleLogout = async () => {
    try {
      await logoutApi();
    } catch (e) {
      // console.log("Logout error", e);
    }
  };

  const { data, isLoading, isRefetching, error, refetch } = useQuery({
    queryKey: ["my-recipes", user?.id],
    enabled: !!user?.id,
    queryFn: () => listMyRecipes(user!.id),
  });

  const recipes = data ?? [];

  const renderItem = ({ item }: { item: Recipe }) => {
    const img = resolveImageUrl(item);

    const calories =
      item.calories !== undefined && item.calories !== null ? Math.round(item.calories) : null;
    const protein =
      item.protein !== undefined && item.protein !== null ? Math.round(item.protein) : null;
    const carbs =
      item.carbs !== undefined && item.carbs !== null ? Math.round(item.carbs) : null;
    const fat =
      item.fat !== undefined && item.fat !== null ? Math.round(item.fat) : null;

    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => navigation.navigate("RecipeDetail", { recipe: item })}
      >
        <View style={styles.card}>
          {img ? (
            <Image source={{ uri: img }} style={styles.image} resizeMode="cover" />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Text style={styles.imagePlaceholderText}>No image</Text>
            </View>
          )}

          <View style={styles.cardContent}>
            <Text style={styles.cardTitle} numberOfLines={1}>
              {item.title}
            </Text>

            {item.description ? (
              <Text style={styles.cardSubtitle} numberOfLines={2}>
                {item.description}
              </Text>
            ) : null}

            <View style={styles.metaRow}>
              {item.prep_time_minutes != null && (
                <View style={styles.metaChip}>
                  <Text style={styles.metaText}>⏱ {item.prep_time_minutes} min</Text>
                </View>
              )}
              {item.servings != null && (
                <View style={styles.metaChip}>
                  <Text style={styles.metaText}>👥 {item.servings} servings</Text>
                </View>
              )}
            </View>

            <View style={styles.macrosRow}>
              {calories !== null && (
                <Macro label="Calories" value={`${calories}`} />
              )}
              {protein !== null && (
                <Macro label="Protein" value={`${protein}g`} />
              )}
              {carbs !== null && (
                <Macro label="Carbs" value={`${carbs}g`} />
              )}
              {fat !== null && (
                <Macro label="Fats" value={`${fat}g`} />
              )}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (!user) {
    return (
      <View style={styles.center}>
        <Text style={styles.textSecondary}>No hay usuario autenticado.</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <TopBar onLogout={handleLogout} />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Recipes</Text>
        <Text style={styles.headerSubtitle}>Manage your recipes</Text>
      </View>

      {isLoading && !recipes.length ? (
        <View style={styles.center}>
          <Text style={styles.textSecondary}>Cargando tus recetas…</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.error}>Error cargando recetas.</Text>
        </View>
      ) : (
        <FlatList
          data={recipes}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          refreshing={isRefetching}
          onRefresh={refetch}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 110 }}
        />
      )}

      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.85}
        onPress={() => navigation.navigate("CreateRecipe")}
      >
        <Text style={styles.fabPlus}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

function Macro({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.macroItem}>
      <Text style={styles.macroNumber}>{value}</Text>
      <Text style={styles.macroLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },

  header: {
    paddingHorizontal: 12,
    paddingTop: 6,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: COLORS.textPrimary,
  },
  headerSubtitle: {
    color: COLORS.textSecondary,
    marginTop: 4,
  },

  center: {
    flex: 1,
    backgroundColor: COLORS.bg,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  textSecondary: { color: COLORS.textSecondary },
  error: { color: COLORS.danger, fontWeight: "800" },

  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 14,
    overflow: "hidden",
  },

  image: { width: "100%", height: 180 },
  imagePlaceholder: {
    width: "100%",
    height: 180,
    backgroundColor: COLORS.chipBg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },
  imagePlaceholderText: { color: COLORS.textSecondary },

  cardContent: { paddingHorizontal: 14, paddingVertical: 12 },
  cardTitle: { fontSize: 18, fontWeight: "900", color: COLORS.textPrimary },
  cardSubtitle: { fontSize: 14, color: COLORS.textSecondary, marginTop: 4 },

  metaRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 },
  metaChip: {
    backgroundColor: COLORS.chipBg,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  metaText: { color: COLORS.textSecondary, fontSize: 12, fontWeight: "700" },

  macrosRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
    gap: 10,
  },
  macroItem: { flex: 1, alignItems: "center", paddingVertical: 8 },
  macroNumber: { fontSize: 14, fontWeight: "900", color: COLORS.textPrimary },
  macroLabel: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },

  fab: {
    position: "absolute",
    bottom: 26,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#22C55E",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.28,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 8,
  },
  fabPlus: {
    fontSize: 32,
    color: "#0b1220",
    fontWeight: "900",
    marginTop: -2,
  },
});
