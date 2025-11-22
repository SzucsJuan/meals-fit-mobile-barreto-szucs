import { apiFetch } from "./client";

export type Ingredient = {
  id: number;
  name?: string;
  ingredient_name?: string;
  pivot?: {
    quantity?: number;
    unit?: string;
    grams?: number;
  };
  quantity?: number;
  unit?: string;
};

export type Recipe = {
  id: number;
  title: string;
  description?: string;
  image_url?: string;
  image_thumb_url?: string;
  image_webp_url?: string;
  user_id: number;

  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  servings?: number;
  prep_time_minutes?: number;
  cook_time_minutes?: number;

  steps?: string;
  ingredients?: Ingredient[];
};

type Paginated<T> = {
  current_page: number;
  data: T[];
};

export async function listMyRecipes(userId?: number): Promise<Recipe[]> {
  if (!userId) return [];

  const res = await apiFetch<Paginated<Recipe>>("/recipes", {
    method: "GET",
  });

  //Dejamos console.log para futuros testeos
  // console.log("API /recipes RESPONSE:", res);

  const all = res.data ?? [];
  return all.filter((r) => r.user_id === userId);
}


export async function getRecipe(id: number): Promise<Recipe> {
  return apiFetch<Recipe>(`/recipes/${id}`, { method: "GET" });
}

// Create Recipe

export type CreateRecipeInput = {
  title: string;
  visibility: "public" | "private";
  description: string;
  prep_time_minutes: number | null;
  cook_time_minutes: number | null;
  servings: number | null;
  ingredients: {
    ingredient_id: number;
    quantity: number;
    unit: string | null;
    notes: string | null;
  }[];
  steps: string;
};

export async function createRecipe(input: CreateRecipeInput) {
  const res = await apiFetch<any>("/recipes", {
    method: "POST",
    body: JSON.stringify(input),
  });

  return res;
}

export async function deleteRecipe(id: number): Promise<void> {
  await apiFetch(`/recipes/${id}`, {
    method: "DELETE",
  });
}