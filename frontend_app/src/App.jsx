import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./auth/ProtectedRoute";
import AppLayout from "./components/layout/AppLayout";
import LoginPage from "./pages/auth/LoginPage";
import DashboardPage from "./pages/dashboard/DashboardPage";
import ClientesPage from "./pages/facturacion/ClientesPage";
import CiudadesPage from "./pages/facturacion/CiudadesPage";
import ArticulosPage from "./pages/inventario/ArticulosPage";
import ModulePlaceholderPage from "./pages/common/ModulePlaceholderPage";
import ForbiddenPage from "./pages/common/ForbiddenPage";
import NotFoundPage from "./pages/common/NotFoundPage";

const routeDefinitions = [
  [
    "/admin/usuarios",
    "Administración de usuarios",
    "CRUD de usuarios y asignación de roles.",
  ],

  [
    "/facturacion/ciudades",
    "Ciudades de entrega",
    "Mantenimiento de ciudades de entrega.",
  ],
  [
    "/facturacion/facturas",
    "Facturas",
    "Pantalla cabecera-detalle de facturación.",
  ],
  [
    "/facturacion/reportes/ventas-ciudad",
    "Ventas por ciudad",
    "Reporte de ventas agrupadas por ciudad.",
  ],
  [
    "/facturacion/reportes/matriz-clientes",
    "Matriz de ventas",
    "Reporte cruzado de artículos por cliente.",
  ],

  
  [
    "/inventario/tipos-movimiento",
    "Tipos de movimiento",
    "Mantenimiento de ingresos y egresos.",
  ],
  [
    "/inventario/comprobantes",
    "Comprobantes",
    "Pantalla cabecera-detalle de inventario.",
  ],
  [
    "/inventario/reportes/movimientos",
    "Reporte de inventario",
    "Reporte de movimientos por fechas.",
  ],

  [
    "/cxc/cobradores",
    "Cobradores",
    "Mantenimiento de cobradores.",
  ],
  [
    "/cxc/formas-pago",
    "Formas de pago",
    "Mantenimiento de formas de pago.",
  ],
  [
    "/cxc/pagos",
    "Pagos",
    "Registro de pagos asociados a facturas.",
  ],
  [
    "/cxc/reportes/estado-cuenta",
    "Estado de cuenta",
    "Reporte de saldos por factura.",
  ],
  [
    "/cxc/reportes/matriz-recaudacion",
    "Matriz de recaudación",
    "Reporte por cobrador y forma de pago.",
  ],

  [
    "/integracion/cola",
    "Integración JMS",
    "Consulta e importación de transacciones pendientes.",
  ],
];

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/403" element={<ForbiddenPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route
            index
            element={<Navigate to="/dashboard" replace />}
          />

          <Route
            path="/dashboard"
            element={<DashboardPage />}
          />

          <Route
            path="/facturacion/clientes"
            element={<ClientesPage />}
          />

          <Route
            path="/facturacion/ciudades"
            element={<CiudadesPage />}
          />

          <Route
          path="/inventario/articulos"
          element={<ArticulosPage />}
          />

          {routeDefinitions.map(([path, title, description]) => {
            const adminOnly = path === "/admin/usuarios";

            return (
              <Route
                key={path}
                path={path}
                element={
                  adminOnly ? (
                    <ProtectedRoute allowedRoles={["ADMIN"]}>
                      <ModulePlaceholderPage
                        title={title}
                        description={description}
                      />
                    </ProtectedRoute>
                  ) : (
                    <ModulePlaceholderPage
                      title={title}
                      description={description}
                    />
                  )
                }
              />
            );
          })}
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}