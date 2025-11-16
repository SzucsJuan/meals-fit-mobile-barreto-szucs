import { apiFetch } from "./client";
import { useAuth } from "../store/auth";

type LoginResponse = {
  token: string;
  user: {
    id: number;
    name: string;
    email: string;
  };
};

export async function login(email: string, password: string) {
  const data = await apiFetch<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  await useAuth.getState().setAuth(data.token, data.user);
  return data.user;
}

export async function fetchMe() {
  return apiFetch("/user", { method: "GET" });
}

export async function logoutApi() {
  try {
    await apiFetch("/auth/logout", { method: "POST" });
  } catch {
    // ignoramos error del backend
  }
  await useAuth.getState().logout();
}
