import { NavLink } from "react-router";
import { useAuth } from "../../auth/AuthContext";
import { menuSections } from "../../routes/menuConfig";
import { NAVIGATION_CONFIG } from "../../utils/navigationConfig";

export default function Sidebar() {
  const { user } = useAuth();

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
                <img src="/favicon.svg" alt="Logo" style={{ width: '32px', height: '32px' }} />
        <div>
          <strong>Sistema Contable</strong>
          <small>Nexo</small>
        </div>
      </div>

      <nav className="sidebar-nav">
        <NavLink className="sidebar-link" to="/dashboard">Panel principal</NavLink>

        {menuSections.map((section) => {
          const config = NAVIGATION_CONFIG[section.title];
          const visibleItems = section.items.filter(
            (item) => !item.roles || item.roles.includes(user?.role),
          );

          if (visibleItems.length === 0 || !config) return null;

          const IconComponent = config.icon;

          return (
            <div className="sidebar-section" key={section.title}>
              <div className="sidebar-section-title" style={{ color: config.color }}>
                <IconComponent size={14} className="me-2" />
                {section.title}
              </div>
              
              {visibleItems.map((item) => {
                const itemConfig = config.items[item.label];
                const ItemIcon = itemConfig?.icon;
                
                return (
                  <NavLink className="sidebar-link d-flex align-items-center" to={item.path} key={item.path}>
                    {ItemIcon && <ItemIcon size={16} className="me-2 opacity-50" />}
                    {item.label}
                    {itemConfig?.type === 'reporte' && <span className="badge ms-auto bg-light text-dark" style={{fontSize: '0.65rem'}}>REP</span>}
                  </NavLink>
                );
              })}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
