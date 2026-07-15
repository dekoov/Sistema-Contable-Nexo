import { Link } from "react-router";
import { useAuth } from "../../auth/AuthContext";
import { menuSections } from "../../routes/menuConfig";
import { NAVIGATION_CONFIG } from "../../utils/navigationConfig";
import { useState, useEffect } from "react";
import { listarUsuarios } from "../../api/usuariosApi";
import { listarMensajesCola } from "../../api/integracionApi";
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react";

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ usuarios: null, cola: null, loading: true });

  useEffect(() => {
    async function fetchData() {
      try {
        const [usuarios, cola] = await Promise.all([listarUsuarios(), listarMensajesCola()]);
        setStats({
          usuarios: {
            total: usuarios.length,
            admins: usuarios.filter(u => u.rol === 'ADMIN').length,
          },
          cola: {
            pendientes: cola.length,
            unidades: cola.reduce((sum, msg) => sum + (msg.payload?.detalles?.reduce((s, d) => s + (Number(d.cantidad) || 0), 0) || 0), 0)
          },
          loading: false
        });
      } catch {
        setStats({ usuarios: null, cola: null, loading: false });
      }
    }
    fetchData();
  }, []);

  const getFilteredItems = (section) => 
    section.items.filter((item) => !item.roles || item.roles.includes(user?.role));

  const specialSections = ["Administración", "Integración"];
  
  const specialModules = menuSections.filter(s => specialSections.includes(s.title));
  const functionalModules = menuSections.filter(s => !specialSections.includes(s.title));

  return (
    <>
      <div className="page-heading mb-4">
        <div>
          <h1>Panel de navegación</h1>
          <p>Bienvenido, {user?.name || user?.username}. ¿Qué deseas gestionar hoy?</p>
        </div>
      </div>

      <div className="row g-4 mb-5">
        {specialModules.map(section => {
          const config = NAVIGATION_CONFIG[section.title];
          const IconModule = config.icon;
          const isCola = section.title === "Integración";
          const data = isCola ? stats.cola : stats.usuarios;

          return (
            <div className="col-12 col-md-6" key={section.title}>
              <div className="card h-100 border-0 shadow-sm" style={{ borderLeft: `6px solid ${config.color}` }}>
                <div className="card-body p-4 d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center">
                    <div className="p-3 rounded me-4" style={{ backgroundColor: `${config.color}15`, color: config.color }}>
                      <IconModule size={32} />
                    </div>
                    <div>
                      <h3 className="h5 mb-1">{section.title}</h3>
                      {stats.loading ? <Loader2 className="animate-spin" size={16}/> : data ? (
                        <p className="text-muted mb-0 small">
                          {isCola 
                            ? (data.pendientes === 0 ? <span className="text-success"><CheckCircle size={14}/> Cola vacía</span> : `${data.pendientes} mensajes · ${data.unidades} unidades`)
                            : `${data.total} usuarios · ${data.admins} admin`}
                        </p>
                      ) : <span className="text-danger small"><AlertCircle size={14}/> Error al cargar</span>}
                    </div>
                  </div>
                  <Link to={section.items[0].path} className="btn btn-outline-primary btn-sm rounded-pill px-3">
                    {isCola ? "Ver cola" : "Gestionar"} →
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="row g-4">
        {functionalModules.map((section) => {
          const config = NAVIGATION_CONFIG[section.title];
          const items = getFilteredItems(section);
          if (items.length === 0 || !config) return null;

          const IconModule = config.icon;
          const formularios = items.filter(i => config.items[i.label]?.type === 'formulario');
          const reportes = items.filter(i => config.items[i.label]?.type === 'reporte');

          return (
            <div className="col-12 col-md-6 col-lg-4" key={section.title}>
              <div className="card h-100 border-0 shadow-sm" style={{ borderLeft: `4px solid ${config.color}` }}>
                <div className="card-body p-4">
                  <div className="d-flex align-items-center mb-3">
                    <div className="p-2 rounded me-3" style={{ backgroundColor: `${config.color}15`, color: config.color }}>
                      <IconModule size={20} />
                    </div>
                    <h3 className="h5 m-0">{section.title}</h3>
                  </div>

                  {formularios.length > 0 && (
                    <div className="mb-3">
                      <div className="row g-2">
                        {formularios.map(item => {
                          const itemConfig = config.items[item.label];
                          const ItemIcon = itemConfig?.icon;
                          return (
                            <div className="col-12" key={item.path}>
                              <Link to={item.path} className="text-decoration-none d-flex align-items-center p-2 rounded hover-bg">
                                <div className="p-2 rounded me-3 bg-light"><ItemIcon size={16} color={config.color}/></div>
                                <div>
                                  <div className="fw-bold text-dark" style={{fontSize: '0.85rem'}}>{item.label}</div>
                                </div>
                              </Link>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {reportes.length > 0 && (
                    <div>
                      <small className="text-uppercase text-muted fw-bold" style={{ fontSize: '0.7rem' }}>Reportes</small>
                      <div className="row g-2 mt-1">
                        {reportes.map(item => {
                          const itemConfig = config.items[item.label];
                          const ItemIcon = itemConfig?.icon;
                          return (
                            <div className="col-6" key={item.path}>
                              <Link to={item.path} className="text-decoration-none d-flex align-items-center p-2 rounded hover-bg">
                                <ItemIcon size={14} className="me-2 text-secondary" />
                                <span className="text-dark" style={{fontSize: '0.8rem'}}>{item.label}</span>
                              </Link>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
