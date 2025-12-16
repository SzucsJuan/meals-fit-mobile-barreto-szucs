import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
} from "react-native";
import { RouteProp, useRoute, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQueryClient } from "@tanstack/react-query";

import { AppStackParamList } from "../navigation/AppNavigator";
import { API_BASE_URL } from "../config/env";
import { Recipe, Ingredient } from "../api/recipes";
import { deleteRecipe } from "../api/recipes";
import { ConfirmModal } from "../components/ConfirmModal";
import { TopBar } from "../components/TopBar";
import { logoutApi } from "../api/auth";

type Route = RouteProp<AppStackParamList, "RecipeDetail">;
type Nav = NativeStackNavigationProp<AppStackParamList, "RecipeDetail">;

const COLORS = {
  bg: "#020617",
  card: "#0b1220",
  chipBg: "#0f172a",
  border: "#1f2937",
  textPrimary: "#e5e7eb",
  textSecondary: "#94a3b8",
  accent: "#FF9800",
  danger: "#f97373",
  ok: "#22C55E",
};

function resolveImageUrl(recipe: Recipe): string | undefined {
  let url = recipe.image_url || recipe.image_webp_url || recipe.image_thumb_url;
  if (!url) return undefined;

  if (url.includes("://localhost") || url.includes("://127.0.0.1")) {
    const idx = url.indexOf("/storage/");
    if (idx !== -1) {
      const storagePath = url.substring(idx + "/storage/".length);
      return `${API_BASE_URL}/storage/${storagePath}`;
    }
  }
  return url;
}

export default function RecipeDetailScreen() {
  const route = useRoute<Route>();
  const navigation = useNavigation<Nav>();
  const queryClient = useQueryClient();

  const recipe = route.params.recipe as Recipe;
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const imageUrl = resolveImageUrl(recipe);
  const ingredients = (recipe.ingredients ?? []) as Ingredient[];

  const stepsText = (recipe.steps || "").trim();
  const steps = stepsText
    ? stepsText
        .split(/\r?\n/)
        .map((s) => s.trim())
        .filter((s) => s.length > 0)
    : [];

  const calories =
    recipe.calories !== undefined && recipe.calories !== null ? Math.round(recipe.calories) : null;
  const protein =
    recipe.protein !== undefined && recipe.protein !== null ? Math.round(recipe.protein) : null;
  const carbs =
    recipe.carbs !== undefined && recipe.carbs !== null ? Math.round(recipe.carbs) : null;
  const fat =
    recipe.fat !== undefined && recipe.fat !== null ? Math.round(recipe.fat) : null;

  async function handleLogout() {
    try {
      await logoutApi();
    } catch {
    }
  }

  const handleDelete = useCallback(async () => {
    try {
      await deleteRecipe(recipe.id);
      queryClient.invalidateQueries({ queryKey: ["my-recipes"] });

      Alert.alert("Deleted", "Recipe deleted successfully.");
      setShowDeleteModal(false);
      navigation.goBack();
    } catch (e) {
      Alert.alert("Error", "Unexpected error deleting recipe.");
      setShowDeleteModal(false);
    }
  }, [recipe.id, queryClient, navigation]);

  return (
    <View style={styles.root}>
      {/* ✅ TopBar con hamburguesa */}
      <TopBar onLogout={handleLogout} />

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.imagePlaceholderText}>No image</Text>
          </View>
        )}

        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{recipe.title}</Text>
            {recipe.description ? <Text style={styles.subtitle}>{recipe.description}</Text> : null}
          </View>
        </View>

        <View style={styles.metaRow}>
          {recipe.prep_time_minutes != null && (
            <View style={styles.metaChip}>
              <Text style={styles.metaLabel}>Total Time</Text>
              <Text style={styles.metaValue}>{recipe.prep_time_minutes} min</Text>
            </View>
          )}
          {recipe.servings != null && (
            <View style={styles.metaChip}>
              <Text style={styles.metaLabel}>Servings</Text>
              <Text style={styles.metaValue}>{recipe.servings}</Text>
            </View>
          )}
        </View>

        {(calories !== null || protein !== null || carbs !== null || fat !== null) && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Nutrition Information</Text>
            <Text style={styles.cardSub}>
              Total (recipe) – si querés por porción dividí por {recipe.servings ?? 1}
            </Text>

            <View style={styles.nutritionRow}>
              {calories !== null && <Nut label="Calories" value={`${calories}`} />}
              {protein !== null && <Nut label="Protein" value={`${protein}g`} />}
              {carbs !== null && <Nut label="Carbs" value={`${carbs}g`} />}
              {fat !== null && <Nut label="Fats" value={`${fat}g`} />}
            </View>
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Ingredients</Text>

          {ingredients.length === 0 ? (
            <Text style={styles.muted}>No hay ingredientes cargados.</Text>
          ) : (
            ingredients.map((ing, index) => {
              const name =
                ing.name || (ing as any).ingredient_name || `Ingrediente ${index + 1}`;

              const qty =
                (ing as any).pivot?.quantity ??
                (ing as any).quantity ??
                (ing as any).pivot?.grams ??
                null;

              const unit =
                (ing as any).pivot?.unit ??
                (ing as any).unit ??
                ((ing as any).pivot?.grams ? "g" : "");

              const qtyText =
                qty != null
                  ? typeof qty === "number"
                    ? qty % 1 === 0
                      ? String(qty)
                      : qty.toFixed(2)
                    : String(qty)
                  : null;

              return (
                <Text key={ing.id ?? index} style={styles.lineItem}>
                  {qtyText ? `${qtyText}${unit ? ` ${unit}` : ""} – ${name}` : name}
                </Text>
              );
            })
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Instructions</Text>

          {steps.length === 0 ? (
            <Text style={styles.muted}>No hay instrucciones cargadas.</Text>
          ) : (
            steps.map((step, index) => (
              <Text key={index} style={styles.lineItem}>
                {index + 1}. {step}
              </Text>
            ))
          )}
        </View>

        <TouchableOpacity
          onPress={() => setShowDeleteModal(true)}
          style={styles.deleteButton}
          activeOpacity={0.85}
        >
          <Text style={styles.deleteButtonText}>Delete</Text>
        </TouchableOpacity>

        <ConfirmModal
          visible={showDeleteModal}
          title="Delete Recipe"
          message="Are you sure you want to delete this recipe? This action cannot be undone."
          onCancel={() => setShowDeleteModal(false)}
          onConfirm={handleDelete}
        />
      </ScrollView>
    </View>
  );
}

function Nut({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.nutItem}>
      <Text style={styles.nutValue}>{value}</Text>
      <Text style={styles.nutLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },

  container: { flex: 1, backgroundColor: COLORS.bg },
  content: { paddingHorizontal: 12, paddingBottom: 32 },

  image: { width: "100%", height: 220, borderRadius: 16, marginTop: 12, marginBottom: 12 },
  imagePlaceholder: {
    width: "100%",
    height: 220,
    borderRadius: 16,
    marginTop: 12,
    marginBottom: 12,
    backgroundColor: COLORS.chipBg,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },
  imagePlaceholderText: { color: COLORS.textSecondary, fontWeight: "800" },

  headerRow: { flexDirection: "row", marginBottom: 6 },
  title: { fontSize: 22, fontWeight: "900", color: COLORS.textPrimary },
  subtitle: { color: COLORS.textSecondary, marginTop: 6, lineHeight: 18 },

  metaRow: { flexDirection: "row", gap: 10, flexWrap: "wrap", marginBottom: 10 },
  metaChip: {
    backgroundColor: COLORS.chipBg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  metaLabel: { fontSize: 12, color: COLORS.textSecondary, fontWeight: "800" },
  metaValue: { fontSize: 14, color: COLORS.textPrimary, fontWeight: "900", marginTop: 2 },

  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginTop: 10,
  },
  cardTitle: { fontSize: 16, fontWeight: "900", color: COLORS.textPrimary },
  cardSub: { fontSize: 13, color: COLORS.textSecondary, marginTop: 6, marginBottom: 10 },

  nutritionRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  nutItem: {
    flexGrow: 1,
    minWidth: "45%",
    backgroundColor: COLORS.chipBg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    padding: 12,
  },
  nutValue: { fontSize: 16, fontWeight: "900", color: COLORS.textPrimary },
  nutLabel: { marginTop: 4, color: COLORS.textSecondary, fontWeight: "800" },

  lineItem: { fontSize: 14, color: COLORS.textPrimary, marginTop: 6, lineHeight: 19 },
  muted: { color: COLORS.textSecondary, marginTop: 8 },

  deleteButton: {
    backgroundColor: "#dc2626",
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 14,
    width: "100%",
    alignItems: "center",
  },
  deleteButtonText: { color: "#fff", fontWeight: "900" },
});
