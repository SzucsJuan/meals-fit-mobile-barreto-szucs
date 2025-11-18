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

  // console.log("API /recipes RESPONSE:", res);

  const all = res.data ?? [];
  return all.filter((r) => r.user_id === userId);
}
