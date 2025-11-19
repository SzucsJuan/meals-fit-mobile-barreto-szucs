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

export type RegisterInput = {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
};

export async function login(email: string, password: string) {
  const data = await apiFetch<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  await useAuth.getState().setAuth(data.token, data.user);
  return data.user;
}

export async function register(input: RegisterInput) {
  return apiFetch<any>("/register", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function fetchMe() {
  return apiFetch("/user", { method: "GET" });
}

export async function logoutApi() {
  try {
    await apiFetch("/auth/logout", { method: "POST" });
  } catch {
  }
  await useAuth.getState().logout();
}
