import { apiFetch } from "./client";

export type Recipe = {
  id: number;
  title: string;
  description: string | null;
  image_disk: string | null;
  image_path: string | null;
  image_thumb_path: string | null;
  image_webp_path: string | null;
  image_width: number | null;
  image_height: number | null;

  servings: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  prep_time_minutes: number | null;
  cook_time_minutes: number | null;
  avg_rating?: number | null;
  votes_count?: number;
  favorited_by_count?: number;
  user?: { id: number; name: string };
};

export async function listRecipes(): Promise<Recipe[]> {
  return apiFetch<Recipe[]>("/recipes", { method: "GET" });
}
