import Constants from "expo-constants";

type Extra = {
  API_BASE_URL?: string;
};

const extra = (Constants.expoConfig?.extra || {}) as Extra;

export const API_BASE_URL = "http://192.168.0.174:8000"
