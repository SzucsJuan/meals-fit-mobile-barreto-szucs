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
import {
  RouteProp,
  useRoute,
  useNavigation,
} from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQueryClient } from "@tanstack/react-query";

import { AppStackParamList } from "../navigation/AppNavigator";
import { API_BASE_URL } from "../config/env";
import { Recipe, Ingredient } from "../api/recipes";
import { deleteRecipe } from "../api/recipes";
import { ConfirmModal } from "../components/ConfirmModal";

type Route = RouteProp<AppStackParamList, "RecipeDetail">;
type Nav = NativeStackNavigationProp<AppStackParamList, "RecipeDetail">;

const COLORS = {
  bg: "#F8F5F0",
  card: "#FFFFFF",
  cardSoft: "#F9FAFB",
  border: "#E5E7EB",
  textPrimary: "#1F2937",
  textSecondary: "#6B7280",
  green: "#22C55E",
  greenDark: "#16A34A",
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
    recipe.calories !== undefined && recipe.calories !== null
      ? Math.round(recipe.calories)
      : null;
  const protein =
    recipe.protein !== undefined && recipe.protein !== null
      ? Math.round(recipe.protein)
      : null;
  const carbs =
    recipe.carbs !== undefined && recipe.carbs !== null
      ? Math.round(recipe.carbs)
      : null;
  const fat =
    recipe.fat !== undefined && recipe.fat !== null
      ? Math.round(recipe.fat)
      : null;

  const handleDelete = useCallback(async () => {
    try {
      // Llamamos a la función de la API
      await deleteRecipe(recipe.id);

      // Refrescamos el listado de recetas
      queryClient.invalidateQueries({ queryKey: ["my-recipes"] });

      Alert.alert("Deleted", "Recipe deleted successfully.");
      setShowDeleteModal(false);
      navigation.goBack();
    } catch (e) {
      console.log("Delete error", e);
      Alert.alert("Error", "Unexpected error deleting recipe.");
      setShowDeleteModal(false);
    }
  }, [recipe.id, queryClient, navigation]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      {imageUrl && (
        <Image
          source={{ uri: imageUrl }}
          style={styles.image}
          resizeMode="cover"
        />
      )}

      {/* Header info (título, descripción, meta) */}
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{recipe.title}</Text>
          {recipe.description && (
            <Text style={styles.subtitle}>{recipe.description}</Text>
          )}
        </View>
      </View>

      <View style={styles.metaRow}>
        {recipe.prep_time_minutes != null && (
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Total Time</Text>
            <Text style={styles.metaValue}>
              {recipe.prep_time_minutes} min
            </Text>
          </View>
        )}
        {recipe.servings != null && (
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Servings</Text>
            <Text style={styles.metaValue}>{recipe.servings}</Text>
          </View>
        )}
      </View>

      {/* Nutrition Information */}
      {(calories !== null ||
        protein !== null ||
        carbs !== null ||
        fat !== null) && (
        <View style={styles.nutritionCard}>
          <Text style={styles.nutritionTitle}>Nutrition Information</Text>
          <Text style={styles.nutritionSubtitle}>
            Total (recipe) – si querés por porción dividí por{" "}
            {recipe.servings ?? 1}
          </Text>

          <View style={styles.nutritionRow}>
            {calories !== null && (
              <View style={styles.nutritionItem}>
                <Text style={[styles.nutritionNumber, styles.nutCalories]}>
                  {calories}
                </Text>
                <Text style={styles.nutritionLabel}>Calories</Text>
              </View>
            )}
            {protein !== null && (
              <View style={styles.nutritionItem}>
                <Text style={[styles.nutritionNumber, styles.nutProtein]}>
                  {protein}g
                </Text>
                <Text style={styles.nutritionLabel}>Protein</Text>
              </View>
            )}
            {carbs !== null && (
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionNumber}>{carbs}g</Text>
                <Text style={styles.nutritionLabel}>Carbs</Text>
              </View>
            )}
            {fat !== null && (
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionNumber}>{fat}g</Text>
                <Text style={styles.nutritionLabel}>Fats</Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Ingredientes + Instrucciones (tarjetas) */}
      <View style={styles.bottomRow}>
        <View style={styles.bottomCard}>
          <Text style={styles.bottomTitle}>Ingredients</Text>
          {ingredients.length === 0 && (
            <Text style={styles.bottomTextMuted}>
              No hay ingredientes cargados.
            </Text>
          )}
          {ingredients.map((ing, index) => {
            const name =
              ing.name ||
              (ing as any).ingredient_name ||
              `Ingrediente ${index + 1}`;

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
              <Text key={ing.id ?? index} style={styles.bottomText}>
                {qtyText
                  ? `${qtyText}${unit ? ` ${unit}` : ""} – ${name}`
                  : name}
              </Text>
            );
          })}
        </View>

        <View style={styles.bottomCard}>
          <Text style={styles.bottomTitle}>Instructions</Text>
          {steps.length === 0 && (
            <Text style={styles.bottomTextMuted}>
              No hay instrucciones cargadas.
            </Text>
          )}
          {steps.map((step, index) => (
            <Text key={index} style={styles.bottomText}>
              {index + 1}. {step}
            </Text>
          ))}
        </View>
      </View>

      {/* Botón DELETE */}
      <TouchableOpacity
        onPress={() => setShowDeleteModal(true)}
        style={styles.deleteButton}
        activeOpacity={0.8}
      >
        <Text style={styles.deleteButtonText}>Delete</Text>
      </TouchableOpacity>

      {/* Modal de confirmación */}
      <ConfirmModal
        visible={showDeleteModal}
        title="Delete Recipe"
        message="Are you sure you want to delete this recipe? This action cannot be undone."
        onCancel={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  image: {
    width: "100%",
    height: 220,
    borderRadius: 16,
    marginTop: 16,
    marginBottom: 18,
  },
  headerRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  subtitle: {
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  metaRow: {
    flexDirection: "row",
    marginTop: 10,
    marginBottom: 16,
    gap: 24,
  },
  metaItem: {},
  metaLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  metaValue: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  nutritionCard: {
    backgroundColor: "#FDF8F3",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 18,
  },
  nutritionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  nutritionSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 4,
    marginBottom: 10,
  },
  nutritionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
  },
  nutritionItem: {
    flex: 1,
    minWidth: "22%",
  },
  nutritionNumber: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  nutCalories: {
    color: COLORS.greenDark,
  },
  nutProtein: {
    color: "#F59E0B",
  },
  nutritionLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  bottomRow: {
    flexDirection: "column",
    gap: 12,
  },
  bottomCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  bottomTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  bottomText: {
    fontSize: 14,
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  bottomTextMuted: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  deleteButton: {
    backgroundColor: "#dc2626",
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 12,
    width: "100%",
    alignItems: "center",
  },
  deleteButtonText: {
    color: "white",
    fontWeight: "600",
  },
});