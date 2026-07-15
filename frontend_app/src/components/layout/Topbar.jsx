import { useAuth } from "../../auth/AuthContext";
import ServerInstanceBadge from "../system/ServerInstanceBadge";
import { LogOut } from "lucide-react";

export default function Topbar() {
  const { user, logout } = useAuth();

  const initials = (user?.name || user?.username || 'U').substring(0, 2).toUpperCase();

  return (
    <header className="topbar bg-white px-4">
      <ServerInstanceBadge />

      <div className="d-flex align-items-center gap-3">
        <div className="d-flex align-items-center gap-2">
          <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center" 
               style={{ width: 36, height: 36, fontSize: '0.8rem', fontWeight: 'bold' }}>
            {initials}
          </div>
          <div className="text-start">
            <div className="fw-bold" style={{ fontSize: '0.9rem' }}>{user?.name || user?.username}</div>
            <div className="text-secondary" style={{ fontSize: '0.75rem' }}>{user?.role}</div>
          </div>
        </div>

        <div className="vr" style={{ height: '30px' }} />

        <button className="btn btn-link text-danger d-flex align-items-center gap-2 p-0" onClick={logout}>
          <LogOut size={16} />
          <span style={{ fontSize: '0.85rem' }}>Salir</span>
        </button>
      </div>
    </header>
  );
}
