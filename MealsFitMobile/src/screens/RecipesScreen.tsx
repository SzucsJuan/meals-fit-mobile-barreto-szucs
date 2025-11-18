import React, { useState } from "react";
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
import { AppStackParamList } from "../navigation/AppNavigator";
import { API_BASE_URL } from "../config/env";
import { logoutApi } from "../api/auth";

const COLORS = {
  bg: "#F8F5F0", // fondo crema claro
  card: "#FFFFFF",
  border: "#E5E7EB",
  textPrimary: "#1F2937",
  textSecondary: "#6B7280",
  green: "#22C55E",
  greenDark: "#16A34A",
  iconGray: "#4B5563",
};

type Nav = NativeStackNavigationProp<AppStackParamList, "Recipes">;

function resolveImageUrl(recipe: Recipe): string | undefined {
  let url = recipe.image_thumb_url || recipe.image_url || recipe.image_webp_url;
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

/** Topbar con logo + usuario + botón hamburguesa */
function TopBar(props: { onLogout: () => Promise<void> }) {
  const user = useAuth((s) => s.user);
  const [open, setOpen] = useState(false);
  const logo = require("../../assets/icon.png");

  const toggleMenu = () => setOpen((prev) => !prev);

  return (
    <View style={styles.topBarWrapper}>
      <View style={styles.topBar}>
        <View style={styles.brandRow}>
          <Image source={logo} style={styles.brandLogo} />
          <Text style={styles.brandText}>Meals&Fit</Text>
        </View>

        <View style={styles.topRight}>
          {user && <Text style={styles.userName}>{user.name}</Text>}

          <TouchableOpacity
            onPress={toggleMenu}
            style={styles.burgerButton}
            activeOpacity={0.7}
          >
            <View style={styles.burgerLine} />
            <View style={styles.burgerLine} />
            <View style={styles.burgerLine} />
          </TouchableOpacity>
        </View>
      </View>

      {open && (
        <View style={styles.menuCard}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => setOpen(false)}
          >
            <Text style={styles.menuItemText}>Home</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => setOpen(false)}
          >
            <Text style={styles.menuItemText}>Meals</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, styles.menuItemActive]}
            onPress={() => setOpen(false)}
          >
            <Text style={[styles.menuItemText, styles.menuItemActiveText]}>
              My Recipes
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => setOpen(false)}
          >
            <Text style={styles.menuItemText}>Discover</Text>
          </TouchableOpacity>

          <View style={styles.menuDivider} />

          <TouchableOpacity
            style={styles.menuItem}
            onPress={async () => {
              setOpen(false);
              await props.onLogout();
            }}
          >
            <Text style={[styles.menuItemText, { color: "#DC2626" }]}>
              Logout
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

export default function RecipesScreen() {
  const user = useAuth((s) => s.user);
  const navigation = useNavigation<Nav>();

  const handleLogout = async () => {
    try {
      await logoutApi(); // limpia token + user en store
    } catch (e) {
      console.log("Logout error", e);
    }
    // AppNavigator detecta token null y vuelve al Login
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
      item.calories !== undefined && item.calories !== null
        ? Math.round(item.calories)
        : null;
    const protein =
      item.protein !== undefined && item.protein !== null
        ? Math.round(item.protein)
        : null;
    const carbs =
      item.carbs !== undefined && item.carbs !== null
        ? Math.round(item.carbs)
        : null;
    const fat =
      item.fat !== undefined && item.fat !== null
        ? Math.round(item.fat)
        : null;

    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => navigation.navigate("RecipeDetail", { recipe: item })}
      >
        <View style={styles.card}>
          {img && (
            <Image
              source={{ uri: img }}
              style={styles.image}
              resizeMode="cover"
            />
          )}

          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            {item.description && (
              <Text style={styles.cardSubtitle} numberOfLines={2}>
                {item.description}
              </Text>
            )}

            <View style={styles.metaRow}>
              {item.prep_time_minutes != null && (
                <Text style={styles.metaText}>
                  ⏱ {item.prep_time_minutes} min
                </Text>
              )}
              {item.servings != null && (
                <Text style={styles.metaText}>
                  👥 {item.servings} servings
                </Text>
              )}
            </View>

            <View style={styles.macrosRow}>
              {calories !== null && (
                <View style={styles.macroItem}>
                  <Text style={[styles.macroNumber, styles.macroCalories]}>
                    {calories}
                  </Text>
                  <Text style={styles.macroLabel}>Calories</Text>
                </View>
              )}
              {protein !== null && (
                <View style={styles.macroItem}>
                  <Text style={[styles.macroNumber, styles.macroProtein]}>
                    {protein}g
                  </Text>
                  <Text style={styles.macroLabel}>Protein</Text>
                </View>
              )}
              {carbs !== null && (
                <View style={styles.macroItem}>
                  <Text style={styles.macroNumber}>{carbs}g</Text>
                  <Text style={styles.macroLabel}>Carbs</Text>
                </View>
              )}
              {fat !== null && (
                <View style={styles.macroItem}>
                  <Text style={styles.macroNumber}>{fat}g</Text>
                  <Text style={styles.macroLabel}>Fats</Text>
                </View>
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

  if (isLoading && !recipes.length) {
    return (
      <View style={styles.center}>
        <Text style={styles.textSecondary}>Cargando tus recetas…</Text>
      </View>
    );
  }

  if (error) {
    console.log("RECIPES ERROR:", error);
    return (
      <View style={styles.center}>
        <Text style={styles.error}>Error cargando recetas.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TopBar onLogout={handleLogout} />

      <Text style={styles.headerTitle}>My Recipes</Text>
      <Text style={styles.headerSubtitle}>Manage your recipes</Text>

      <FlatList
        data={recipes}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        refreshing={isRefetching}
        onRefresh={refetch}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    paddingHorizontal: 16,
    paddingTop: 10,
  },

  /** Top bar + menú hamburguesa */
  topBarWrapper: {
    position: "relative",
    marginBottom: 12,
    paddingTop: 8,
    zIndex: 20, // que quede por encima de la lista
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  brandLogo: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 6,
  },
  brandText: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  topRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  userName: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginRight: 8,
  },
  burgerButton: {
    width: 32,
    height: 32,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    justifyContent: "center",
    alignItems: "center",
  },
  burgerLine: {
    width: 16,
    height: 2,
    backgroundColor: COLORS.textPrimary,
    marginVertical: 1,
  },
  menuCard: {
    position: "absolute",
    top: 44,
    right: 0,
    width: 190,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 10,
    paddingVertical: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 6,
    zIndex: 30,
  },
  menuTitle: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  menuItem: {
    paddingVertical: 6,
  },
  menuItemText: {
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  menuItemActive: {
    backgroundColor: COLORS.green,
    borderRadius: 999,
    paddingHorizontal: 10,
  },
  menuItemActiveText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  menuDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 6,
  },

  /** Títulos sección */
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  headerSubtitle: {
    color: COLORS.textSecondary,
    marginBottom: 14,
  },

  /** Listado tarjetas */
  center: {
    flex: 1,
    backgroundColor: COLORS.bg,
    justifyContent: "center",
    alignItems: "center",
  },
  textSecondary: {
    color: COLORS.textSecondary,
  },
  error: {
    color: "#DC2626",
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 18,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: 180,
  },
  cardContent: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  cardSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  metaRow: {
    flexDirection: "row",
    gap: 16,
    marginTop: 10,
  },
  metaText: {
    color: COLORS.iconGray,
    fontSize: 13,
  },
  macrosRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
  },
  macroItem: {
    flex: 1,
    alignItems: "center",
  },
  macroNumber: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  macroCalories: {
    color: COLORS.greenDark,
  },
  macroProtein: {
    color: "#F59E0B",
  },
  macroLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
});
