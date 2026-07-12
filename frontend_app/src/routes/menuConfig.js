export const menuSections = [
  {
    title: "Facturación",
    items: [
      { label: "Clientes", path: "/facturacion/clientes" },
      { label: "Ciudades", path: "/facturacion/ciudades" },
      { label: "Facturas", path: "/facturacion/facturas" },
      { label: "Ventas por ciudad", path: "/facturacion/reportes/ventas-ciudad" },
      { label: "Matriz por cliente", path: "/facturacion/reportes/matriz-clientes" },
    ],
  },
  {
    title: "Inventario",
    items: [
      { label: "Artículos", path: "/inventario/articulos" },
      { label: "Tipos de movimiento", path: "/inventario/tipos-movimiento" },
      { label: "Comprobantes", path: "/inventario/comprobantes" },
      { label: "Reporte de inventario", path: "/inventario/reportes/movimientos" },
    ],
  },
  {
    title: "Cuentas por cobrar",
    items: [
      { label: "Cobradores", path: "/cxc/cobradores" },
      { label: "Formas de pago", path: "/cxc/formas-pago" },
      { label: "Pagos", path: "/cxc/pagos" },
      { label: "Estado de cuenta", path: "/cxc/reportes/estado-cuenta" },
      { label: "Matriz de recaudación", path: "/cxc/reportes/matriz-recaudacion" },
    ],
  },
  {
    title: "Integración",
    items: [
      { label: "Cola JMS", path: "/integracion/cola" },
    ],
  },
  {
    title: "Administración",
    items: [
      {
        label: "Usuarios",
        path: "/admin/usuarios",
        roles: ["ADMIN"],
      },
    ],
  },
];
