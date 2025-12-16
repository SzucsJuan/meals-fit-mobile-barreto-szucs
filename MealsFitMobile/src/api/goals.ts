import { apiFetch } from "./client";

export type Plan = {
  id: number;
  mode: "maintenance" | "gain" | "loss";
  experience: "beginner" | "advanced" | "professional";
  activity_level: "sedentary" | "light" | "moderate" | "high" | "athlete";
  bmr: number;
  tdee: number;
  calorie_target: number;
  protein_g: number;
  fat_g: number;
  carbs_g: number;
  fiber_g: number;
  water_l: number;
  version?: number;
};

type LatestPlanResponse = { plan?: Plan | null } | Plan | null;

export async function getLatestPlan(): Promise<Plan | null> {
  const json = await apiFetch<LatestPlanResponse>("/me/goals/latest", {
    method: "GET",
  });

  if (!json) return null;
  if (typeof json === "object" && "plan" in (json as any))
    return (json as any).plan ?? null;
  return json as any;
}

export async function saveGoals(input: {
  mode: "maintenance" | "loss" | "gain";
  experience: "beginner" | "advanced" | "professional";
  activity_level: "sedentary" | "light" | "moderate" | "high" | "athlete";
  age: number;
  weight: number;
  height: number;
}) {
  return apiFetch<{ plan?: Plan }>(`/me/goals?source=ai`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}
