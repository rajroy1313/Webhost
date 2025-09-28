import { apiRequest } from "./queryClient";

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
}

export async function login(data: LoginData) {
  const response = await apiRequest("POST", "/api/auth/login", data);
  return response.json();
}

export async function register(data: RegisterData) {
  const response = await apiRequest("POST", "/api/auth/register", data);
  return response.json();
}

export async function logout() {
  const response = await apiRequest("POST", "/api/auth/logout");
  return response.json();
}

export async function getCurrentUser() {
  const response = await fetch("/api/auth/me", { credentials: "include" });
  if (!response.ok) throw new Error("Not authenticated");
  return response.json();
}
