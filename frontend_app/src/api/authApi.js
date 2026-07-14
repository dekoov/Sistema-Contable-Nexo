import apiClient from "./apiClient";

function normalizeAuthResponse(payload) {
  const data = payload?.data ?? payload;

  const accessToken = data.token ?? data.accessToken;

  if (!accessToken) {
    throw new Error("El backend no devolvió un token de sesión.");
  }

  return {
    accessToken,

    user: {
      id: data.id ?? null,
      username: data.email,
      name: data.nombre ?? data.email,
      role: data.rol,
    },

    server: {
      instance: data.instancia ?? "Instancia desconocida",
      port: data.puerto ?? "N/D",
    },
  };
}

export async function authenticateWithGoogle(idToken) {
  const response = await apiClient.post("/auth/login", {
    idToken,
  });

  return normalizeAuthResponse(response.data);
}

export async function authenticateWithPassword(email, password) {
  const response = await apiClient.post("/auth/login-password", {
    email,
    password,
  });

  return normalizeAuthResponse(response.data);
}

export async function authenticateAsDevelopmentAdmin() {
  const response = await apiClient.post("/auth/login", {
    idToken: "test-admin",
  });

  return normalizeAuthResponse(response.data);
}