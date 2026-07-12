import { NavLink } from "react-router";
import { useAuth } from "../../auth/AuthContext";
import { menuSections } from "../../routes/menuConfig";

export default function Sidebar() {
  const { user } = useAuth();

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span className="brand-mark">SC</span>
        <div>
          <strong>Sistema Contable</strong>
          <small>Arquitectura distribuida</small>
        </div>
      </div>

      <nav className="sidebar-nav">
        <NavLink className="sidebar-link" to="/dashboard">
          Panel principal
        </NavLink>

        {menuSections.map((section) => {
          const visibleItems = section.items.filter(
            (item) => !item.roles || item.roles.includes(user?.role),
          );

          if (visibleItems.length === 0) return null;

          return (
            <div className="sidebar-section" key={section.title}>
              <div className="sidebar-section-title">{section.title}</div>
              {visibleItems.map((item) => (
                <NavLink className="sidebar-link" to={item.path} key={item.path}>
                  {item.label}
                </NavLink>
              ))}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
