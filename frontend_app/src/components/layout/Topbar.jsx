import { useAuth } from "../../auth/AuthContext";
import ServerInstanceBadge from "../system/ServerInstanceBadge";

export default function Topbar() {
  const { user, logout } = useAuth();

  return (
    <header className="topbar">
      <ServerInstanceBadge />

      <div className="d-flex align-items-center gap-3">
        <div className="text-end d-none d-md-block">
          <strong className="d-block">{user?.name || user?.username}</strong>
          <small className="text-secondary">Rol: {user?.role}</small>
        </div>

        <button className="btn btn-outline-danger btn-sm" onClick={logout}>
          Cerrar sesión
        </button>
      </div>
    </header>
  );
}
