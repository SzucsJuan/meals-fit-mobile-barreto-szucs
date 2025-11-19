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
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
    bg: "#F8F5F0",
    card: "#FFFFFF",
    cardSoft: "#FDF8F3",
    border: "#E5E7EB",
    textPrimary: "#1F2937",
    textSecondary: "#6B7280",
    green: "#22C55E",
    greenDark: "#16A34A",
    orange: "#F97316",
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

    // ==== Info básica ====
    const [title, setTitle] = useState("");
    const [visibility, setVisibility] = useState<"public" | "private">("public");
    const [description, setDescription] = useState("");
    const [prepTime, setPrepTime] = useState("");
    const [cookTime, setCookTime] = useState("");
    const [servings, setServings] = useState("");

    // ==== Ingredientes dinámicos ====
    const [ingredients, setIngredients] = useState<IngredientRow[]>([
        {
            id: "ing-1",
            ingredientId: null,
            quantity: "",
            unit: "",
            notes: "",
        },
    ]);
    const [openIngredientRowId, setOpenIngredientRowId] = useState<string | null>(
        null
    );

    // ==== Pasos ====
    const [steps, setSteps] = useState<StepRow[]>([{ id: "step-1", text: "" }]);

    const [image, setImage] = useState<string | null>(null);
    const [imageError, setImageError] = useState<string | null>(null);

    // ==== Errores de form ====
    const [formError, setFormError] = useState<string | null>(null);

    // ==== Ingredientes desde backend ====
    const {
        data: ingredientOptions = [],
        isLoading: loadingIngredients,
        error: ingredientsError,
    } = useQuery({
        queryKey: ["ingredients"],
        queryFn: listIngredients,
    });

    // ==== MUTATION: create recipe ====
    const createMutation = useMutation({
        mutationFn: (input: CreateRecipeInput) => createRecipe(input),
        onSuccess: () => {
            // Refrescamos lista de recetas
            queryClient.invalidateQueries({ queryKey: ["my-recipes"] });
            navigation.goBack();
        },
        onError: (err: any) => {
            console.error("CREATE RECIPE ERROR", err);
            const msg =
                err?.message ||
                err?.response?.data?.message ||
                "Error saving recipe. Please try again.";
            setFormError(msg);
        },
    });

    const handleLogout = async () => {
        try {
            await logoutApi();
        } catch (e) {
            console.log("Logout error", e);
        }
    };

    const handleBack = () => {
        navigation.goBack();
    };

    // ---- Helpers ingredientes ----
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
        setIngredients((prev) =>
            prev.map((row) =>
                row.id === id ? { ...row, [field]: value as any } : row
            )
        );
    };

    const removeIngredientRow = (id: string) => {
        setIngredients((prev) =>
            prev.length <= 1 ? prev : prev.filter((row) => row.id !== id)
        );
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

    // ---- Helpers pasos ----
    const addStepRow = () => {
        setSteps((prev) => [
            ...prev,
            { id: `step-${Date.now()}-${prev.length + 1}`, text: "" },
        ]);
    };

    const updateStepRow = (id: string, text: string) => {
        setSteps((prev) =>
            prev.map((row) => (row.id === id ? { ...row, text } : row))
        );
    };

    const removeStepRow = (id: string) => {
        setSteps((prev) =>
            prev.length <= 1 ? prev : prev.filter((row) => row.id !== id)
        );
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

        if (!result.canceled) {
            setImage(result.assets[0].uri);
        }
    }

    // ---- Guardar receta (llama al endpoint) ----
    const saveRecipe = async () => {
        setFormError(null);

        if (!title.trim()) {
            setFormError("El título es obligatorio.");
            return;
        }

        const stepsText = steps.map((s) => s.text.trim()).filter((s) => s.length);
        if (!stepsText.length) {
            setFormError("Agregá al menos un paso.");
            return;
        }
        const stepsString = stepsText.join("\n");

        const ingForPayload = ingredients
            .filter((r) => r.ingredientId) // por las dudas
            .map((r) => ({
                ingredient_id: r.ingredientId as number,
                quantity: Number(r.quantity) || 0,
                unit: r.unit || null,
                notes: r.notes || null,
            }));

        if (!ingForPayload.length) {
            setFormError("Agregá al menos un ingrediente.");
            return;
        }

        const payload: CreateRecipeInput = {
            title: title.trim(),
            visibility,
            description: description.trim(),
            prep_time_minutes: prepTime ? Number(prepTime) : null,
            cook_time_minutes: cookTime ? Number(cookTime) : null,
            servings: servings ? Number(servings) : null,
            ingredients: ingForPayload,
            steps: stepsString,
        };

        console.log("Guardar receta →", payload);

        try {
            const created = await createRecipe(payload);
            console.log("RECETA CREADA RAW:", created);

            // soportar respuestas tipo {id: 1}, {recipe: {...}}, {data: {...}}
            const recipeId =
                created?.id ??
                created?.recipe?.id ??
                created?.data?.id ??
                created?.data?.recipe?.id;

            if (!recipeId) {
                console.log("No pude obtener recipeId de la respuesta:", created);
                alert("La receta se creó pero no pude subir la imagen (sin ID).");
                // invalidamos igualmente la lista y volvemos
                queryClient.invalidateQueries({ queryKey: ["my-recipes"] });
                navigation.goBack();
                return;
            }

            // Si hay imagen → subir imagen
            if (image) {
                const token = useAuth.getState().token;
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
                console.log("SUBIR IMAGEN →", url);

                const uploadResp = await fetch(url, {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${useAuth.getState().token}`,
                        // NO pongas Content-Type, fetch lo arma con boundary para multipart
                    },
                    body: formData,
                });

                const text = await uploadResp.text();
                console.log(
                    "RESPUESTA SUBIR IMAGEN:",
                    uploadResp.status,
                    uploadResp.ok,
                    text
                );

                if (!uploadResp.ok) {
                    console.log("ERROR SUBIENDO IMAGEN", text);
                    // no cortamos el flujo, solo avisamos
                    alert("La receta se creó pero hubo un error al subir la imagen.");
                }
            }

            // refrescamos lista y volvemos
            queryClient.invalidateQueries({ queryKey: ["my-recipes"] });
            alert("Receta creada correctamente.");
            navigation.goBack();
        } catch (e: any) {
            console.log("CREATE RECIPE ERROR", e);
            setFormError("No se pudo guardar la receta.");
        }
    };

    const isSaving = createMutation.isPending;

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                {/* Navbar con hamburguesa */}
                <TopBar onLogout={handleLogout} />

                {/* Flecha volver */}
                <TouchableOpacity
                    style={styles.backRow}
                    onPress={handleBack}
                    activeOpacity={0.7}
                >
                    <Text style={styles.backArrow}>←</Text>
                    <Text style={styles.backText}>Back to recipes</Text>
                </TouchableOpacity>

                <ScrollView
                    style={styles.scroll}
                    contentContainerStyle={{ paddingBottom: 40 }}
                    showsVerticalScrollIndicator={false}
                >
                    {/* ========= INFO BÁSICA ========= */}
                    <View style={styles.card}>
                        <View style={styles.cardHeaderRow}>
                            <Text style={styles.cardTitle}>Recipe</Text>
                            <View style={styles.visibilityRow}>
                                <Text style={styles.visibilityLabel}>Visibility</Text>
                                <View style={styles.visibilityPill}>
                                    <TouchableOpacity
                                        style={[
                                            styles.visibilityOption,
                                            visibility === "public" &&
                                            styles.visibilityOptionActive,
                                        ]}
                                        onPress={() => setVisibility("public")}
                                    >
                                        <Text
                                            style={[
                                                styles.visibilityOptionText,
                                                visibility === "public" &&
                                                styles.visibilityOptionTextActive,
                                            ]}
                                        >
                                            Public
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[
                                            styles.visibilityOption,
                                            visibility === "private" &&
                                            styles.visibilityOptionActive,
                                        ]}
                                        onPress={() => setVisibility("private")}
                                    >
                                        <Text
                                            style={[
                                                styles.visibilityOptionText,
                                                visibility === "private" &&
                                                styles.visibilityOptionTextActive,
                                            ]}
                                        >
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

                    {/* ========= INGREDIENTES ========= */}
                    <View style={styles.card}>
                        <View style={styles.cardHeaderRow}>
                            <View>
                                <Text style={styles.cardTitle}>Ingredients</Text>
                                <Text style={styles.cardSubtitle}>
                                    Select ingredients and amounts
                                </Text>
                            </View>
                            <TouchableOpacity
                                style={styles.addButton}
                                onPress={addIngredientRow}
                            >
                                <Text style={styles.addButtonPlus}>+</Text>
                                <Text style={styles.addButtonText}>Add Ingredient</Text>
                            </TouchableOpacity>
                        </View>

                        {ingredientsError && (
                            <Text style={styles.errorText}>
                                Error loading ingredients. Try again later.
                            </Text>
                        )}

                        {ingredients.map((row, index) => (
                            <View key={row.id} style={styles.ingredientBlock}>
                                {/* SELECTOR DE INGREDIENTE */}
                                <Text style={styles.labelSmall}>
                                    Ingredient {index + 1}
                                </Text>

                                <TouchableOpacity
                                    style={styles.selectInput}
                                    activeOpacity={0.7}
                                    onPress={() =>
                                        setOpenIngredientRowId(
                                            openIngredientRowId === row.id ? null : row.id
                                        )
                                    }
                                >
                                    <Text
                                        style={
                                            row.ingredientId
                                                ? styles.selectText
                                                : styles.selectPlaceholder
                                        }
                                    >
                                        {formatIngredientLabel(row.ingredientId)}
                                    </Text>
                                </TouchableOpacity>

                                {/* Dropdown */}
                                {openIngredientRowId === row.id && (
                                    <View style={styles.selectDropdown}>
                                        {loadingIngredients && (
                                            <Text style={styles.selectDropdownInfo}>
                                                Loading ingredients…
                                            </Text>
                                        )}

                                        {!loadingIngredients &&
                                            ingredientOptions.map((ing) => (
                                                <TouchableOpacity
                                                    key={ing.id}
                                                    style={styles.selectDropdownItem}
                                                    onPress={() => {
                                                        updateIngredientRow(
                                                            row.id,
                                                            "ingredientId",
                                                            ing.id
                                                        );
                                                        if (!row.unit && (ing.unit_short || ing.unit)) {
                                                            updateIngredientRow(
                                                                row.id,
                                                                "unit",
                                                                ing.unit_short || ing.unit || ""
                                                            );
                                                        }
                                                        setOpenIngredientRowId(null);
                                                    }}
                                                >
                                                    <Text style={styles.selectDropdownItemText}>
                                                        {formatIngredientOption(ing)}
                                                    </Text>
                                                </TouchableOpacity>
                                            ))}
                                    </View>
                                )}

                                {/* Quantity + Unit */}
                                <View style={styles.row2}>
                                    <View style={styles.col2}>
                                        <Text style={styles.labelSmall}>Quantity</Text>
                                        <TextInput
                                            style={styles.input}
                                            keyboardType="numeric"
                                            placeholder="0"
                                            placeholderTextColor={COLORS.textSecondary}
                                            value={row.quantity}
                                            onChangeText={(v) =>
                                                updateIngredientRow(row.id, "quantity", v)
                                            }
                                        />
                                    </View>
                                    <View style={styles.col2}>
                                        <Text style={styles.labelSmall}>Unit</Text>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="g, ml, unit..."
                                            placeholderTextColor={COLORS.textSecondary}
                                            value={row.unit}
                                            onChangeText={(v) =>
                                                updateIngredientRow(row.id, "unit", v)
                                            }
                                        />
                                    </View>
                                </View>

                                <Text style={styles.labelSmall}>Notes (optional)</Text>
                                <TextInput
                                    style={[styles.input, styles.notesInput]}
                                    placeholder="Extra notes about this ingredient"
                                    placeholderTextColor={COLORS.textSecondary}
                                    value={row.notes}
                                    onChangeText={(v) =>
                                        updateIngredientRow(row.id, "notes", v)
                                    }
                                />

                                {ingredients.length > 1 && (
                                    <TouchableOpacity
                                        style={styles.removeLink}
                                        onPress={() => removeIngredientRow(row.id)}
                                    >
                                        <Text style={styles.removeLinkText}>
                                            Remove ingredient
                                        </Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        ))}
                    </View>

                    {/* ========= INSTRUCCIONES ========= */}
                    <View style={styles.card}>
                        <View style={styles.cardHeaderRow}>
                            <View>
                                <Text style={styles.cardTitle}>Instructions</Text>
                                <Text style={styles.cardSubtitle}>Step-by-step</Text>
                            </View>
                            <TouchableOpacity style={styles.addButton} onPress={addStepRow}>
                                <Text style={styles.addButtonPlus}>+</Text>
                                <Text style={styles.addButtonText}>Add Step</Text>
                            </TouchableOpacity>
                        </View>

                        {steps.map((row, index) => (
                            <View key={row.id} style={styles.stepBlock}>
                                <View style={styles.stepHeaderRow}>
                                    <View style={styles.stepBadge}>
                                        <Text style={styles.stepBadgeText}>
                                            Step {index + 1}
                                        </Text>
                                    </View>

                                    {steps.length > 1 && (
                                        <TouchableOpacity
                                            onPress={() => removeStepRow(row.id)}
                                            style={styles.removeStepBtn}
                                        >
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

                    {/* ========= IMAGEN ========= */}
                    <View style={{ marginTop: 20 }}>
                        <Text style={{ color: COLORS.textSecondary, marginBottom: 6 }}>Recipe Image</Text>

                        {image && (
                            <Image
                                source={{ uri: image }}
                                style={{
                                    width: "100%",
                                    height: 180,
                                    borderRadius: 12,
                                    marginBottom: 10,
                                }}
                                resizeMode="cover"
                            />
                        )}

                        <TouchableOpacity
                            style={{
                                backgroundColor: COLORS.orange,
                                padding: 12,
                                borderRadius: 10,
                                alignItems: "center",
                                marginBottom: 10,
                            }}
                            onPress={pickImage}
                        >
                            <Text style={{ color: "#0f172a", fontWeight: "600" }}>
                                Seleccionar imagen
                            </Text>
                        </TouchableOpacity>

                        {imageError && <Text style={{ color: COLORS.textSecondary }}>{imageError}</Text>}
                    </View>

                    {/* ========= ERROR FORM + BOTÓN GUARDAR ========= */}
                    {formError && (
                        <Text style={[styles.errorText, { marginBottom: 8 }]}>
                            {formError}
                        </Text>
                    )}

                    <TouchableOpacity
                        style={[
                            styles.saveButton,
                            isSaving && { opacity: 0.7 },
                        ]}
                        onPress={saveRecipe}
                        disabled={isSaving}
                    >
                        {isSaving ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <Text style={styles.saveButtonText}>Save Recipe</Text>
                        )}
                    </TouchableOpacity>
                </ScrollView>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: COLORS.bg,
    },
    container: {
        flex: 1,
        backgroundColor: COLORS.bg,
    },
    scroll: {
        paddingHorizontal: 16,
    },

    backRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        marginTop: 4,
        marginBottom: 8,
    },
    backArrow: {
        fontSize: 20,
        color: COLORS.textPrimary,
        marginRight: 4,
    },
    backText: {
        fontSize: 14,
        color: COLORS.textSecondary,
    },

    card: {
        backgroundColor: COLORS.cardSoft,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
        paddingHorizontal: 14,
        paddingVertical: 14,
        marginBottom: 16,
    },
    cardHeaderRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: COLORS.textPrimary,
    },
    cardSubtitle: {
        fontSize: 13,
        color: COLORS.textSecondary,
        marginTop: 2,
    },

    visibilityRow: {
        alignItems: "flex-end",
    },
    visibilityLabel: {
        fontSize: 12,
        color: COLORS.textSecondary,
        marginBottom: 4,
    },
    visibilityPill: {
        flexDirection: "row",
        backgroundColor: COLORS.card,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: COLORS.border,
        overflow: "hidden",
    },
    visibilityOption: {
        paddingHorizontal: 10,
        paddingVertical: 6,
    },
    visibilityOptionActive: {
        backgroundColor: COLORS.green,
    },
    visibilityOptionText: {
        fontSize: 12,
        color: COLORS.textSecondary,
    },
    visibilityOptionTextActive: {
        color: "#FFFFFF",
        fontWeight: "600",
    },

    label: {
        fontSize: 14,
        fontWeight: "600",
        color: COLORS.textPrimary,
        marginBottom: 6,
    },
    labelSmall: {
        fontSize: 12,
        fontWeight: "600",
        color: COLORS.textPrimary,
        marginBottom: 4,
    },
    input: {
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 10,
        paddingHorizontal: 10,
        paddingVertical: 8,
        backgroundColor: COLORS.card,
        color: COLORS.textPrimary,
        fontSize: 14,
        marginBottom: 10,
    },
    textarea: {
        height: 90,
        textAlignVertical: "top",
    },

    row3: {
        flexDirection: "row",
        gap: 8,
        marginTop: 4,
    },
    col3: {
        flex: 1,
    },
    row2: {
        flexDirection: "row",
        gap: 8,
    },
    col2: {
        flex: 1,
    },

    addButton: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.card,
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    addButtonPlus: {
        fontSize: 16,
        color: COLORS.textPrimary,
        marginRight: 4,
    },
    addButtonText: {
        fontSize: 13,
        color: COLORS.textPrimary,
    },
    ingredientBlock: {
        marginTop: 8,
        paddingTop: 6,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
    },
    notesInput: {
        height: 60,
        textAlignVertical: "top",
    },
    removeLink: {
        marginTop: 4,
        alignSelf: "flex-start",
    },
    removeLinkText: {
        fontSize: 12,
        color: "#DC2626",
    },
    errorText: {
        color: "#DC2626",
        fontSize: 12,
        marginBottom: 8,
    },

    // select de ingrediente
    selectInput: {
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 10,
        paddingHorizontal: 10,
        paddingVertical: 10,
        backgroundColor: COLORS.card,
        marginBottom: 8,
    },
    selectText: {
        fontSize: 14,
        color: COLORS.textPrimary,
    },
    selectPlaceholder: {
        fontSize: 14,
        color: COLORS.textSecondary,
    },
    selectDropdown: {
        marginBottom: 10,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: COLORS.border,
        backgroundColor: COLORS.card,
        maxHeight: 200,
        overflow: "hidden",
    },
    selectDropdownInfo: {
        fontSize: 13,
        color: COLORS.textSecondary,
        padding: 8,
    },
    selectDropdownItem: {
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: "#F3F4F6",
    },
    selectDropdownItemText: {
        fontSize: 14,
        color: COLORS.textPrimary,
    },

    // pasos
    stepBlock: {
        marginTop: 8,
        paddingTop: 6,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
    },
    stepHeaderRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 4,
    },
    stepBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 999,
        backgroundColor: COLORS.card,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    stepBadgeText: {
        fontSize: 12,
        color: COLORS.textSecondary,
    },
    removeStepBtn: {
        paddingHorizontal: 6,
        paddingVertical: 2,
    },
    removeStepText: {
        fontSize: 12,
        color: "#DC2626",
    },

    // imagen
    imageRow: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 12,
        gap: 12,
    },
    imageDrop: {
        flex: 1,
        minHeight: 110,
        borderRadius: 12,
        borderWidth: 1,
        borderStyle: "dashed",
        borderColor: COLORS.border,
        backgroundColor: COLORS.card,
        justifyContent: "center",
        alignItems: "center",
        padding: 8,
    },
    imageDropText: {
        fontSize: 13,
        color: COLORS.textSecondary,
        textAlign: "center",
    },
    imagePreview: {
        width: "100%",
        height: "100%",
        borderRadius: 10,
    },
    uploadButton: {
        backgroundColor: COLORS.orange,
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 10,
    },
    uploadButtonText: {
        color: "#FFFFFF",
        fontWeight: "700",
        fontSize: 13,
    },

    // guardar
    saveButton: {
        marginTop: 8,
        backgroundColor: COLORS.green,
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: "center",
    },
    saveButtonText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "700",
    },
});
