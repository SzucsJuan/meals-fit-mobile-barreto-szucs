import React, { useState } from "react";
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import * as ImagePicker from "expo-image-picker";
import { TopBar } from "../components/TopBar";
import { logoutApi } from "../api/auth";
import { AppStackParamList } from "../navigation/AppNavigator";
import { listIngredients, IngredientOption } from "../api/ingredients";
import { createRecipe, CreateRecipeInput } from "../api/recipes";
import { API_BASE_URL } from "../config/env";
import { useAuth } from "../store/auth";

type Nav = NativeStackNavigationProp<AppStackParamList, "CreateRecipe">;

const COLORS = {
    bg: "#020617",
    card: "#0b1220",
    chipBg: "#0f172a",
    border: "#1f2937",
    textPrimary: "#e5e7eb",
    textSecondary: "#94a3b8",
    accent: "#FF9800",
    green: "#22C55E",
    danger: "#f97373",
};

type IngredientRow = {
    id: string;
    ingredientId: number | null;
    quantity: string;
    unit: string;
    notes: string;
};

type StepRow = {
    id: string;
    text: string;
};

export default function CreateRecipeScreen() {
    const navigation = useNavigation<Nav>();
    const queryClient = useQueryClient();

    const [title, setTitle] = useState("");
    const [visibility, setVisibility] = useState<"public" | "private">("public");
    const [description, setDescription] = useState("");
    const [prepTime, setPrepTime] = useState("");
    const [cookTime, setCookTime] = useState("");
    const [servings, setServings] = useState("");

    const [ingredients, setIngredients] = useState<IngredientRow[]>([
        { id: "ing-1", ingredientId: null, quantity: "", unit: "", notes: "" },
    ]);
    const [openIngredientRowId, setOpenIngredientRowId] = useState<string | null>(null);

    const [steps, setSteps] = useState<StepRow[]>([{ id: "step-1", text: "" }]);

    const [image, setImage] = useState<string | null>(null);
    const [imageError, setImageError] = useState<string | null>(null);
    const [formError, setFormError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    const { data: ingredientOptions = [], isLoading: loadingIngredients, error: ingredientsError } =
        useQuery({
            queryKey: ["ingredients"],
            queryFn: listIngredients,
        });

    const handleLogout = async () => {
        try {
            await logoutApi();
        } catch (e) {
            // console.log("Logout error", e);
        }
    };

    const handleBack = () => navigation.goBack();

    const addIngredientRow = () => {
        setIngredients((prev) => [
            ...prev,
            {
                id: `ing-${Date.now()}-${prev.length + 1}`,
                ingredientId: null,
                quantity: "",
                unit: "",
                notes: "",
            },
        ]);
    };

    const updateIngredientRow = (
        id: string,
        field: keyof IngredientRow,
        value: string | number | null
    ) => {
        setIngredients((prev) => prev.map((row) => (row.id === id ? { ...row, [field]: value as any } : row)));
    };

    const removeIngredientRow = (id: string) => {
        setIngredients((prev) => (prev.length <= 1 ? prev : prev.filter((row) => row.id !== id)));
        if (openIngredientRowId === id) setOpenIngredientRowId(null);
    };

    const formatIngredientLabel = (ingredientId: number | null): string => {
        if (!ingredientId) return "Select ingredient";
        const ing = ingredientOptions.find((i) => i.id === ingredientId);
        if (!ing) return "Select ingredient";
        const unitLabel = ing.unit_short || ing.unit || "";
        return unitLabel ? `${ing.name} (${unitLabel})` : ing.name;
    };

    const formatIngredientOption = (ing: IngredientOption): string => {
        const unitLabel = ing.unit_short || ing.unit || "";
        return unitLabel ? `${ing.name} (${unitLabel})` : ing.name;
    };

    const addStepRow = () => {
        setSteps((prev) => [...prev, { id: `step-${Date.now()}-${prev.length + 1}`, text: "" }]);
    };

    const updateStepRow = (id: string, text: string) => {
        setSteps((prev) => prev.map((row) => (row.id === id ? { ...row, text } : row)));
    };

    const removeStepRow = (id: string) => {
        setSteps((prev) => (prev.length <= 1 ? prev : prev.filter((row) => row.id !== id)));
    };

    async function pickImage() {
        setImageError(null);

        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
            setImageError("Necesitás permitir acceso a la galería.");
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.7,
        });

        if (!result.canceled) setImage(result.assets[0].uri);
    }

    const saveRecipe = async () => {
        setFormError(null);

        if (!title.trim()) return setFormError("El título es obligatorio.");

        const stepsText = steps.map((s) => s.text.trim()).filter((s) => s.length);
        if (!stepsText.length) return setFormError("Agregá al menos un paso.");

        const ingForPayload = ingredients
            .filter((r) => r.ingredientId)
            .map((r) => ({
                ingredient_id: r.ingredientId as number,
                quantity: Number(r.quantity) || 0,
                unit: r.unit || null,
                notes: r.notes || null,
            }));

        if (!ingForPayload.length) return setFormError("Agregá al menos un ingrediente.");

        const payload: CreateRecipeInput = {
            title: title.trim(),
            visibility,
            description: description.trim(),
            prep_time_minutes: prepTime ? Number(prepTime) : null,
            cook_time_minutes: cookTime ? Number(cookTime) : null,
            servings: servings ? Number(servings) : null,
            ingredients: ingForPayload,
            steps: stepsText.join("\n"),
        };

        try {
            setSaving(true);

            const created = await createRecipe(payload);

            const recipeId =
                (created as any)?.id ??
                (created as any)?.recipe?.id ??
                (created as any)?.data?.id ??
                (created as any)?.data?.recipe?.id;

            if (!recipeId) {
                alert("La receta se creó pero no pude subir la imagen (sin ID).");
                queryClient.invalidateQueries({ queryKey: ["my-recipes"] });
                navigation.goBack();
                return;
            }

            if (image) {
                const formData = new FormData();
                formData.append(
                    "image",
                    {
                        uri: image,
                        name: "recipe.jpg",
                        type: "image/jpeg",
                    } as any
                );

                const url = `${API_BASE_URL}/api/recipes/${recipeId}/image`;

                const uploadResp = await fetch(url, {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${useAuth.getState().token}`,
                    },
                    body: formData,
                });

                const text = await uploadResp.text();
                if (!uploadResp.ok) {
                    // console.log("ERROR SUBIENDO IMAGEN", text);
                    alert("La receta se creó pero hubo un error al subir la imagen.");
                }
            }

            queryClient.invalidateQueries({ queryKey: ["my-recipes"] });
            alert("Receta creada correctamente.");
            navigation.goBack();
        } catch (e) {
            // console.log("CREATE RECIPE ERROR", e);
            setFormError("No se pudo guardar la receta.");
        } finally {
            setSaving(false);
        }
    };

    const isSaving = saving;

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <TopBar onLogout={handleLogout} />

                <TouchableOpacity style={styles.backRow} onPress={handleBack} activeOpacity={0.7}>
                    <Text style={styles.backArrow}>←</Text>
                    <Text style={styles.backText}>Back to recipes</Text>
                </TouchableOpacity>

                <ScrollView
                    style={styles.scroll}
                    contentContainerStyle={{ paddingBottom: 40 }}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={styles.card}>
                        <View style={styles.cardHeaderRow}>
                            <Text style={styles.cardTitle}>Recipe</Text>

                            <View style={styles.visibilityRow}>
                                <Text style={styles.visibilityLabel}>Visibility</Text>
                                <View style={styles.visibilityPill}>
                                    <TouchableOpacity
                                        style={[styles.visibilityOption, visibility === "public" && styles.visibilityOptionActive]}
                                        onPress={() => setVisibility("public")}
                                    >
                                        <Text style={[styles.visibilityOptionText, visibility === "public" && styles.visibilityOptionTextActive]}>
                                            Public
                                        </Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={[styles.visibilityOption, visibility === "private" && styles.visibilityOptionActive]}
                                        onPress={() => setVisibility("private")}
                                    >
                                        <Text style={[styles.visibilityOptionText, visibility === "private" && styles.visibilityOptionTextActive]}>
                                            Private
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>

                        <Text style={styles.label}>Recipe Name</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter recipe name..."
                            placeholderTextColor={COLORS.textSecondary}
                            value={title}
                            onChangeText={setTitle}
                        />

                        <Text style={styles.label}>Description</Text>
                        <TextInput
                            style={[styles.input, styles.textarea]}
                            placeholder="Describe the recipe"
                            placeholderTextColor={COLORS.textSecondary}
                            value={description}
                            onChangeText={setDescription}
                            multiline
                        />

                        <View style={styles.row3}>
                            <View style={styles.col3}>
                                <Text style={styles.labelSmall}>Prep Time (min)</Text>
                                <TextInput
                                    style={styles.input}
                                    keyboardType="numeric"
                                    value={prepTime}
                                    onChangeText={setPrepTime}
                                    placeholder="0"
                                    placeholderTextColor={COLORS.textSecondary}
                                />
                            </View>

                            <View style={styles.col3}>
                                <Text style={styles.labelSmall}>Cook Time (min)</Text>
                                <TextInput
                                    style={styles.input}
                                    keyboardType="numeric"
                                    value={cookTime}
                                    onChangeText={setCookTime}
                                    placeholder="0"
                                    placeholderTextColor={COLORS.textSecondary}
                                />
                            </View>

                            <View style={styles.col3}>
                                <Text style={styles.labelSmall}>Servings</Text>
                                <TextInput
                                    style={styles.input}
                                    keyboardType="numeric"
                                    value={servings}
                                    onChangeText={setServings}
                                    placeholder="1"
                                    placeholderTextColor={COLORS.textSecondary}
                                />
                            </View>
                        </View>
                    </View>

                    <View style={styles.card}>
                        <View style={styles.cardHeaderRow}>
                            <View>
                                <Text style={styles.cardTitle}>Ingredients</Text>
                                <Text style={styles.cardSubtitle}>Select ingredients and amounts</Text>
                            </View>

                            <TouchableOpacity style={styles.addButton} onPress={addIngredientRow} activeOpacity={0.9}>
                                <Text style={styles.addButtonPlus}>+</Text>
                                <Text style={styles.addButtonText}>Add</Text>
                            </TouchableOpacity>
                        </View>

                        {ingredientsError && <Text style={styles.errorText}>Error loading ingredients. Try again later.</Text>}

                        {ingredients.map((row, index) => (
                            <View key={row.id} style={styles.block}>
                                <Text style={styles.labelSmall}>Ingredient {index + 1}</Text>

                                <TouchableOpacity
                                    style={styles.selectInput}
                                    activeOpacity={0.7}
                                    onPress={() => setOpenIngredientRowId(openIngredientRowId === row.id ? null : row.id)}
                                >
                                    <Text style={row.ingredientId ? styles.selectText : styles.selectPlaceholder}>
                                        {formatIngredientLabel(row.ingredientId)}
                                    </Text>
                                </TouchableOpacity>

                                {openIngredientRowId === row.id && (
                                    <View style={styles.selectDropdown}>
                                        {loadingIngredients && <Text style={styles.selectDropdownInfo}>Loading ingredients…</Text>}

                                        {!loadingIngredients &&
                                            ingredientOptions.map((ing) => (
                                                <TouchableOpacity
                                                    key={ing.id}
                                                    style={styles.selectDropdownItem}
                                                    onPress={() => {
                                                        updateIngredientRow(row.id, "ingredientId", ing.id);
                                                        if (!row.unit && (ing.unit_short || ing.unit)) {
                                                            updateIngredientRow(row.id, "unit", ing.unit_short || ing.unit || "");
                                                        }
                                                        setOpenIngredientRowId(null);
                                                    }}
                                                >
                                                    <Text style={styles.selectDropdownItemText}>{formatIngredientOption(ing)}</Text>
                                                </TouchableOpacity>
                                            ))}
                                    </View>
                                )}

                                <View style={styles.row2}>
                                    <View style={styles.col2}>
                                        <Text style={styles.labelSmall}>Quantity</Text>
                                        <TextInput
                                            style={styles.input}
                                            keyboardType="numeric"
                                            placeholder="0"
                                            placeholderTextColor={COLORS.textSecondary}
                                            value={row.quantity}
                                            onChangeText={(v) => updateIngredientRow(row.id, "quantity", v)}
                                        />
                                    </View>

                                    <View style={styles.col2}>
                                        <Text style={styles.labelSmall}>Unit</Text>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="g, ml, unit..."
                                            placeholderTextColor={COLORS.textSecondary}
                                            value={row.unit}
                                            onChangeText={(v) => updateIngredientRow(row.id, "unit", v)}
                                        />
                                    </View>
                                </View>

                                <Text style={styles.labelSmall}>Notes (optional)</Text>
                                <TextInput
                                    style={[styles.input, styles.notesInput]}
                                    placeholder="Extra notes about this ingredient"
                                    placeholderTextColor={COLORS.textSecondary}
                                    value={row.notes}
                                    onChangeText={(v) => updateIngredientRow(row.id, "notes", v)}
                                    multiline
                                />

                                {ingredients.length > 1 && (
                                    <TouchableOpacity style={styles.removeLink} onPress={() => removeIngredientRow(row.id)} activeOpacity={0.8}>
                                        <Text style={styles.removeLinkText}>Remove ingredient</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        ))}
                    </View>

                    <View style={styles.card}>
                        <View style={styles.cardHeaderRow}>
                            <View>
                                <Text style={styles.cardTitle}>Instructions</Text>
                                <Text style={styles.cardSubtitle}>Step-by-step</Text>
                            </View>

                            <TouchableOpacity style={styles.addButton} onPress={addStepRow} activeOpacity={0.9}>
                                <Text style={styles.addButtonPlus}>+</Text>
                                <Text style={styles.addButtonText}>Add</Text>
                            </TouchableOpacity>
                        </View>

                        {steps.map((row, index) => (
                            <View key={row.id} style={styles.block}>
                                <View style={styles.stepHeaderRow}>
                                    <View style={styles.stepBadge}>
                                        <Text style={styles.stepBadgeText}>Step {index + 1}</Text>
                                    </View>

                                    {steps.length > 1 && (
                                        <TouchableOpacity onPress={() => removeStepRow(row.id)} style={styles.removeStepBtn} activeOpacity={0.8}>
                                            <Text style={styles.removeStepText}>Remove</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>

                                <TextInput
                                    style={[styles.input, styles.textarea]}
                                    placeholder="Describe this step"
                                    placeholderTextColor={COLORS.textSecondary}
                                    value={row.text}
                                    onChangeText={(v) => updateStepRow(row.id, v)}
                                    multiline
                                />
                            </View>
                        ))}
                    </View>

                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Recipe Image</Text>
                        <Text style={styles.cardSubtitle}>Optional</Text>

                        {image ? (
                            <Image source={{ uri: image }} style={styles.imagePreview} resizeMode="cover" />
                        ) : (
                            <View style={styles.imagePlaceholder}>
                                <Text style={styles.imagePlaceholderText}>No image selected</Text>
                            </View>
                        )}

                        <TouchableOpacity style={styles.imageBtn} onPress={pickImage} activeOpacity={0.9}>
                            <Text style={styles.imageBtnText}>Select image</Text>
                        </TouchableOpacity>

                        {imageError && <Text style={styles.muted}>{imageError}</Text>}
                    </View>

                    {formError && <Text style={styles.errorText}>{formError}</Text>}

                    <TouchableOpacity
                        style={[styles.saveButton, isSaving && { opacity: 0.7 }]}
                        onPress={saveRecipe}
                        disabled={isSaving}
                        activeOpacity={0.9}
                    >
                        {isSaving ? <ActivityIndicator color="#0b1220" /> : <Text style={styles.saveButtonText}>Save Recipe</Text>}
                    </TouchableOpacity>
                </ScrollView>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: COLORS.bg },
    container: { flex: 1, backgroundColor: COLORS.bg },

    scroll: { flex: 1 },

    backRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, marginTop: 4, marginBottom: 8 },
    backArrow: { fontSize: 20, color: COLORS.textPrimary, marginRight: 6 },
    backText: { fontSize: 14, color: COLORS.textSecondary },

    card: {
        backgroundColor: COLORS.card,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
        paddingHorizontal: 14,
        paddingVertical: 14,
        marginHorizontal: 12,
        marginBottom: 12,
    },

    cardHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
    cardTitle: { fontSize: 16, fontWeight: "900", color: COLORS.textPrimary },
    cardSubtitle: { fontSize: 13, color: COLORS.textSecondary, marginTop: 4 },

    visibilityRow: { alignItems: "flex-end" },
    visibilityLabel: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 4 },
    visibilityPill: {
        flexDirection: "row",
        backgroundColor: COLORS.chipBg,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: COLORS.border,
        overflow: "hidden",
    },
    visibilityOption: { paddingHorizontal: 10, paddingVertical: 6 },
    visibilityOptionActive: { backgroundColor: COLORS.accent },
    visibilityOptionText: { fontSize: 12, color: COLORS.textSecondary, fontWeight: "700" },
    visibilityOptionTextActive: { color: "#0b1220", fontWeight: "900" },

    label: { fontSize: 14, fontWeight: "800", color: COLORS.textPrimary, marginBottom: 6 },
    labelSmall: { fontSize: 12, fontWeight: "800", color: COLORS.textPrimary, marginBottom: 4 },

    input: {
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
        backgroundColor: COLORS.chipBg,
        color: COLORS.textPrimary,
        fontSize: 14,
        marginBottom: 10,
    },
    textarea: { height: 90, textAlignVertical: "top" },

    row3: { flexDirection: "row", gap: 8, marginTop: 4 },
    col3: { flex: 1 },
    row2: { flexDirection: "row", gap: 8 },
    col2: { flex: 1 },

    addButton: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.chipBg,
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 7,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    addButtonPlus: { fontSize: 16, color: COLORS.textPrimary, marginRight: 6, fontWeight: "900" },
    addButtonText: { fontSize: 13, color: COLORS.textPrimary, fontWeight: "900" },

    block: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: COLORS.border },

    notesInput: { height: 60, textAlignVertical: "top" },

    removeLink: { marginTop: 2, alignSelf: "flex-start" },
    removeLinkText: { fontSize: 12, color: COLORS.danger, fontWeight: "800" },

    errorText: { color: COLORS.danger, fontSize: 12, marginBottom: 8, marginHorizontal: 12 },

    selectInput: {
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 12,
        backgroundColor: COLORS.chipBg,
        marginBottom: 8,
    },
    selectText: { fontSize: 14, color: COLORS.textPrimary, fontWeight: "800" },
    selectPlaceholder: { fontSize: 14, color: COLORS.textSecondary, fontWeight: "700" },

    selectDropdown: {
        marginBottom: 10,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
        backgroundColor: COLORS.card,
        maxHeight: 220,
        overflow: "hidden",
    },
    selectDropdownInfo: { fontSize: 13, color: COLORS.textSecondary, padding: 10 },
    selectDropdownItem: { paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.border },
    selectDropdownItemText: { fontSize: 14, color: COLORS.textPrimary },

    stepHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
    stepBadge: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 999,
        backgroundColor: COLORS.chipBg,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    stepBadgeText: { fontSize: 12, color: COLORS.textSecondary, fontWeight: "800" },
    removeStepBtn: { paddingHorizontal: 6, paddingVertical: 2 },
    removeStepText: { fontSize: 12, color: COLORS.danger, fontWeight: "900" },

    imagePreview: { width: "100%", height: 180, borderRadius: 12, marginTop: 10, marginBottom: 10 },
    imagePlaceholder: {
        width: "100%",
        height: 180,
        borderRadius: 12,
        marginTop: 10,
        marginBottom: 10,
        backgroundColor: COLORS.chipBg,
        borderWidth: 1,
        borderColor: COLORS.border,
        alignItems: "center",
        justifyContent: "center",
    },
    imagePlaceholderText: { color: COLORS.textSecondary, fontWeight: "700" },

    imageBtn: {
        backgroundColor: COLORS.accent,
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: "center",
    },
    imageBtnText: { color: "#0b1220", fontWeight: "900" },

    muted: { color: COLORS.textSecondary, marginTop: 6 },

    saveButton: {
        marginTop: 4,
        marginHorizontal: 12,
        backgroundColor: COLORS.green,
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: "center",
        marginBottom: 20,
    },
    saveButtonText: { color: "#0b1220", fontSize: 16, fontWeight: "900" },
});
