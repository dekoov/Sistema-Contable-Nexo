import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { authenticateWithGoogle, authenticateWithPassword } from "../api/authApi";

const AuthContext = createContext(null);

function readStoredUser() {
  try {
    const value = sessionStorage.getItem("currentUser");
    return value ? JSON.parse(value) : null;
  } catch {
    sessionStorage.removeItem("currentUser");
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser);
  const [loading, setLoading] = useState(false);

  const saveSession = (accessToken, authenticatedUser) => {
    sessionStorage.setItem("accessToken", accessToken);
    sessionStorage.setItem("currentUser", JSON.stringify(authenticatedUser));
    setUser(authenticatedUser);
  };

  const loginWithGoogle = async (credential) => {
    setLoading(true);

    try {
      const data = await authenticateWithGoogle(credential);
      const accessToken = data.accessToken ?? data.token;
      const authenticatedUser = data.user;

      if (!accessToken || !authenticatedUser) {
        throw new Error("El backend no devolvió accessToken y user.");
      }

      saveSession(accessToken, authenticatedUser);
      return authenticatedUser;
    } finally {
      setLoading(false);
    }
  };

  const loginWithPassword = async (email, password) => {
    setLoading(true);

    try {
      const data = await authenticateWithPassword(email, password);
      const accessToken = data.accessToken ?? data.token;
      const authenticatedUser = data.user;

      if (!accessToken || !authenticatedUser) {
        throw new Error("El backend no devolvió accessToken y user.");
      }

      saveSession(accessToken, authenticatedUser);
      return authenticatedUser;
    } finally {
      setLoading(false);
    }
  };

  const loginMock = () => {
    const mockUser = {
      id: 1,
      username: "admin@demo.local",
      name: "Administrador de demostración",
      role: "ADMIN",
    };

    saveSession("TOKEN_MOCK_NO_USAR_EN_PRODUCCION", mockUser);
  };

  const logout = () => {
    sessionStorage.removeItem("accessToken");
    sessionStorage.removeItem("currentUser");
    setUser(null);

    if (window.google?.accounts?.id) {
      window.google.accounts.id.disableAutoSelect();
    }
  };

  useEffect(() => {
    const handleExpiredSession = () => setUser(null);
    window.addEventListener("auth:expired", handleExpiredSession);

    return () => {
      window.removeEventListener("auth:expired", handleExpiredSession);
    };
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      loginWithGoogle,
      loginWithPassword,
      loginMock,
      logout,
    }),
    [user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth debe usarse dentro de AuthProvider.");
  }

  return context;
}
