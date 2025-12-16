import { apiFetch } from "./client";
import type { Recipe } from "./recipes";

type Paginated<T> = { data?: T[]; meta?: any } | T[];

export async function listMyFavorites(
  per_page = 3,
  page = 1
): Promise<Recipe[]> {
  const qs = new URLSearchParams({
    per_page: String(per_page),
    page: String(page),
  });

  const json = await apiFetch<Paginated<Recipe>>(
    `/me/favorites?${qs.toString()}`,
    {
      method: "GET",
    }
  );

  return Array.isArray(json) ? json : json.data ?? [];
}
