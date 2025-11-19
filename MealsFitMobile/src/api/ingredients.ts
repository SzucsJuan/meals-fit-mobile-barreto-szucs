// src/api/ingredients.ts
import { apiFetch } from "./client";

export type IngredientOption = {
  id: number;
  name: string;
  unit?: string | null;      
  unit_short?: string | null; 
};

type IngredientsResponse = {
  data: IngredientOption[];
};

export async function listIngredients(): Promise<IngredientOption[]> {
  const res = await apiFetch<IngredientsResponse>("/ingredients", {
    method: "GET",
  });

  return res?.data ?? [];
}
