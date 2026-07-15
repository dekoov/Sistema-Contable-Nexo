import { useEffect, useRef, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router";
import { useAuth } from "../../auth/AuthContext";

function loadGoogleScript() {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) {
      resolve();
      return;
    }

    const existing = document.querySelector(
      'script[src="https://accounts.google.com/gsi/client"]',
    );

    if (existing) {
      existing.addEventListener("load", resolve, { once: true });
      existing.addEventListener("error", reject, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = resolve;
    script.onerror = () => reject(new Error("No se pudo cargar Google Identity Services."));
    document.head.appendChild(script);
  });
}

export default function LoginPage() {
  const buttonRef = useRef(null);
  const renderedRef = useRef(false);
  const [error, setError] = useState("");
  const [localCreds, setLocalCreds] = useState({ email: "", password: "" });
  const { isAuthenticated, loginWithGoogle, loginWithPassword, loginMock, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const destination = location.state?.from?.pathname || "/dashboard";
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const mockEnabled = import.meta.env.VITE_ENABLE_MOCK_LOGIN === "true";

  const handleLocalLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      await loginWithPassword(localCreds.email, localCreds.password);
      navigate(destination, { replace: true });
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          requestError.message ||
          "Credenciales inválidas o error al intentar conectar.",
      );
    }
  };

  useEffect(() => {
    if (!googleClientId || googleClientId.startsWith("REEMPLAZAR_")) {
      setError("Configura VITE_GOOGLE_CLIENT_ID en el archivo .env.");
      return;
    }

    let active = true;

    loadGoogleScript()
      .then(() => {
        if (!active || renderedRef.current || !buttonRef.current) return;

        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: async ({ credential }) => {
            setError("");

            try {
              await loginWithGoogle(credential);
              navigate(destination, { replace: true });
            } catch (requestError) {
              setError(
                requestError.response?.data?.message ||
                  requestError.message ||
                  "No fue posible autenticar al usuario.",
              );
            }
          },
        });

        window.google.accounts.id.renderButton(buttonRef.current, {
          type: "standard",
          theme: "outline",
          size: "large",
          text: "signin_with",
          shape: "rectangular",
          logo_alignment: "left",
          width: "100%",
          locale: "es",
        });

        renderedRef.current = true;
      })
      .catch((scriptError) => {
        if (active) setError(scriptError.message);
      });

    return () => {
      active = false;
    };
  }, [destination, googleClientId, loginWithGoogle, navigate]);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleMockLogin = () => {
    loginMock();
    navigate(destination, { replace: true });
  };

  return (
    <div className="login-page">
      <section className="login-card shadow-lg">
        <div className="login-brand">
                    <img src="/favicon.svg" alt="Logo" style={{ width: '48px', height: '48px' }} />
          <div>
            <h1>Sistema Contable</h1>
            <p>Aplicación web distribuida</p>
          </div>
        </div>

        <div className="my-4">
          <h2 className="h4">Iniciar sesión</h2>
        </div>

        {error && <div className="alert alert-warning">{error}</div>}

        <form onSubmit={handleLocalLogin} className="mb-4">
          <div className="mb-3">
            <input
              type="text"
              className="form-control"
              placeholder="Email o usuario"
              required
              value={localCreds.email}
              onChange={(e) => setLocalCreds({...localCreds, email: e.target.value})}
              disabled={loading}
            />
          </div>
          <div className="mb-3">
            <input
              type="password"
              className="form-control"
              placeholder="Contraseña"
              required
              value={localCreds.password}
              onChange={(e) => setLocalCreds({...localCreds, password: e.target.value})}
              disabled={loading}
            />
          </div>
          <button className="btn btn-primary w-100" type="submit" disabled={loading}>
            {loading ? "Entrando..." : "Entrar con contraseña"}
          </button>
        </form>

        <div className="text-center my-3 text-secondary">o</div>

        <div
          ref={buttonRef}
          className={`google-button-container ${loading ? "opacity-50" : ""}`}
        />

        {mockEnabled && (
          <div className="mt-4 border-top pt-3">
            <button
              className="btn btn-secondary w-100"
              type="button"
              onClick={handleMockLogin}
            >
              Entrar en modo demostración
            </button>
            <small className="text-danger d-block mt-2">
              Solo desarrollo. Desactivar antes de la entrega.
            </small>
          </div>
        )}
      </section>
    </div>
  );
}
