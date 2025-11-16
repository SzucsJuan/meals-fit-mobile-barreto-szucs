import { create } from "zustand";
import * as SecureStore from "expo-secure-store";

type User = {
  id: number;
  name: string;
  email: string;
};

type AuthState = {
  token: string | null;
  user: User | null;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setAuth: (token: string | null, user: User | null) => Promise<void>;
  logout: () => Promise<void>;
};

const TOKEN_KEY = "auth_token";
const USER_KEY = "auth_user";

export const useAuth = create<AuthState>((set) => ({
  token: null,
  user: null,
  hydrated: false,

  hydrate: async () => {
    const token = await SecureStore.getItemAsync(TOKEN_KEY);
    const userStr = await SecureStore.getItemAsync(USER_KEY);
    set({
      token: token || null,
      user: userStr ? (JSON.parse(userStr) as User) : null,
      hydrated: true,
    });
  },

  setAuth: async (token, user) => {
    if (token) {
      await SecureStore.setItemAsync(TOKEN_KEY, token);
    } else {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    }

    if (user) {
      await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
    } else {
      await SecureStore.deleteItemAsync(USER_KEY);
    }

    set({ token, user });
  },

  logout: async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
    set({ token: null, user: null });
  },
}));
