import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./auth/ProtectedRoute";
import AppLayout from "./components/layout/AppLayout";
import LoginPage from "./pages/auth/LoginPage";
import DashboardPage from "./pages/dashboard/DashboardPage";
import ClientesPage from "./pages/facturacion/ClientesPage";
import CiudadesPage from "./pages/facturacion/CiudadesPage";
import FacturasPage from "./pages/facturacion/FacturasPage";
import VentasCiudadPage from "./pages/facturacion/reportes/VentasCiudadPage";
import MatrizClientesPage from "./pages/facturacion/reportes/MatrizClientesPage";
import ArticulosPage from "./pages/inventario/ArticulosPage";
import TiposMovimientoPage from "./pages/inventario/TiposMovimientoPage";
import ComprobantesPage from "./pages/inventario/ComprobantesPage";
import MovimientosInventarioPage from "./pages/inventario/reportes/MovimientosInventarioPage";
import CobradoresPage from "./pages/cxc/CobradoresPage";
import FormasPagoPage from "./pages/cxc/FormasPagoPage";
import PagosPage from "./pages/cxc/PagosPage";
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
            path="/facturacion/facturas"
            element={<FacturasPage />}
          />

          <Route
            path="/facturacion/reportes/ventas-ciudad"
            element={<VentasCiudadPage />}
          />

          <Route
            path="/facturacion/reportes/matriz-clientes"
            element={<MatrizClientesPage />}
          />

          <Route
          path="/inventario/articulos"
          element={<ArticulosPage />}
          />

          <Route
            path="/inventario/tipos-movimiento"
            element={<TiposMovimientoPage />}
          />

          <Route
            path="/inventario/comprobantes"
            element={<ComprobantesPage />}
          />

          <Route
            path="/inventario/reportes/movimientos"
            element={<MovimientosInventarioPage />}
          />

          <Route
            path="/cxc/cobradores"
            element={<CobradoresPage />}
          />

          <Route
            path="/cxc/formas-pago"
            element={<FormasPagoPage />}
          />

          <Route
            path="/cxc/pagos"
            element={<PagosPage />}
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