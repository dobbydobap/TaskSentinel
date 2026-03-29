import { apiFetch, setTokens } from "./api";
import type { LoginData, PasswordChangeData, ProfileUpdateData, RegisterData, TokenResponse, User } from "./types";

export async function register(data: RegisterData): Promise<TokenResponse> {
  const response = await apiFetch<TokenResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  });
  setTokens(response.access_token, response.refresh_token);
  return response;
}

export async function login(data: LoginData): Promise<TokenResponse> {
  const response = await apiFetch<TokenResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(data),
  });
  setTokens(response.access_token, response.refresh_token);
  return response;
}

export async function getMe(): Promise<User> {
  return apiFetch<User>("/auth/me");
}

export async function updateProfile(data: ProfileUpdateData): Promise<User> {
  return apiFetch<User>("/auth/profile", {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function changePassword(data: PasswordChangeData): Promise<void> {
  await apiFetch("/auth/change-password", {
    method: "POST",
    body: JSON.stringify(data),
  });
}
