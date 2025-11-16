import React from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Image,
  RefreshControl,
  Button,
} from "react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { listRecipes, Recipe } from "../api/recipes";
import { API_BASE_URL } from "../config/env";
import { logoutApi } from "../api/auth";

export default function HomeScreen() {
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ["recipes"],
    queryFn: listRecipes,
  });

  const onRefresh = async () => {
    await refetch();
  };

  const renderItem = ({ item }: { item: Recipe }) => {
    const imageUrl = item.image_path
      ? `${API_BASE_URL}/storage/${item.image_path}`
      : null;

    return (
      <View style={styles.card}>
        <Text style={styles.title}>{item.title}</Text>
        {imageUrl && (
          <Image source={{ uri: imageUrl }} style={styles.image} />
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.header}>Tus recetas</Text>
        <Button title="Salir" onPress={logoutApi} />
      </View>

      {isLoading && !data && <Text>Cargando...</Text>}
      {error && <Text style={styles.error}>Error cargando recetas</Text>}

      <FlatList
        data={data || []}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={onRefresh} />
        }
        contentContainerStyle={{ paddingBottom: 24 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, paddingTop: 32 },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  header: { fontSize: 22, fontWeight: "bold" },
  card: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    backgroundColor: "#fff",
  },
  title: { fontSize: 16, fontWeight: "600", marginBottom: 8 },
  image: { width: "100%", height: 160, borderRadius: 8, backgroundColor: "#eee" },
  error: { color: "red", marginBottom: 12 },
});
