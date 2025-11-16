import Constants from "expo-constants";

type Extra = {
  API_BASE_URL?: string;
};

// Leemos de extra en app.json / app.config, con fallback
const extra = (Constants.expoConfig?.extra || {}) as Extra;

export const API_BASE_URL =
  extra.API_BASE_URL || "http://10.0.2.2:8000";
