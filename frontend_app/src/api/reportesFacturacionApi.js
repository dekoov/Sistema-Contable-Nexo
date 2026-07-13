import apiClient from "./apiClient";
import { listarFacturas } from "./facturasApi";

const USE_MOCK_API =
  import.meta.env.VITE_USE_MOCK_API !== "false";

function extraerData(response) {
  const body = response.data;

  if (
    body &&
    typeof body === "object" &&
    Object.prototype.hasOwnProperty.call(body, "data")
  ) {
    return body.data;
  }

  return body;
}

function normalizarFilaVentasCiudad(fila) {
  /*
   * El backend puede devolver:
   *
   * ["Quito", 150.50]
   *
   * o:
   *
   * {
   *   ciudad: "Quito",
   *   total: 150.50
   * }
   */

  if (Array.isArray(fila)) {
    return {
      ciudad: String(fila[0] ?? "Sin ciudad"),
      total: Number(fila[1] ?? 0),
    };
  }

  return {
    ciudad: String(
      fila.ciudad ??
        fila.nombreCiudad ??
        fila.nombre ??
        "Sin ciudad",
    ),

    total: Number(
      fila.total ??
        fila.totalVendido ??
        fila.valorTotal ??
        fila.valor ??
        0,
    ),
  };
}

function calcularTotalFactura(factura) {
  const totalRegistrado = Number(
    factura.valorTotal,
  );

  if (Number.isFinite(totalRegistrado)) {
    return totalRegistrado;
  }

  if (!Array.isArray(factura.detalles)) {
    return 0;
  }

  return factura.detalles.reduce(
    (total, detalle) => {
      return (
        total +
        Number(detalle.cantidad || 0) *
          Number(detalle.precio || 0)
      );
    },
    0,
  );
}

function construirReporteMock(facturas) {
  const totalesPorCiudad = new Map();

  facturas.forEach((factura) => {
    const ciudad =
      factura.ciudad?.nombre?.trim() ||
      "Sin ciudad";

    const totalFactura =
      calcularTotalFactura(factura);

    const totalAcumulado =
      totalesPorCiudad.get(ciudad) ?? 0;

    totalesPorCiudad.set(
      ciudad,
      totalAcumulado + totalFactura,
    );
  });

  return Array.from(
    totalesPorCiudad.entries(),
  )
    .map(([ciudad, total]) => ({
      ciudad,
      total,
    }))
    .sort((a, b) => b.total - a.total);
}

export function obtenerMensajeReporteError(
  error,
  fallback = "No fue posible generar el reporte.",
) {
  return (
    error.response?.data?.message ||
    error.response?.data?.error ||
    error.message ||
    fallback
  );
}

export async function obtenerVentasPorCiudad() {
  if (USE_MOCK_API) {
    const facturas = await listarFacturas();

    return construirReporteMock(facturas);
  }

  try {
    const response = await apiClient.get(
      "/facturas/reportes/ventas-por-ciudad",
    );

    const data = extraerData(response);

    return Array.isArray(data)
      ? data
          .map(normalizarFilaVentasCiudad)
          .sort((a, b) => b.total - a.total)
      : [];
  } catch (error) {
    if (error.response?.status === 404) {
      return [];
    }

    throw error;
  }
}