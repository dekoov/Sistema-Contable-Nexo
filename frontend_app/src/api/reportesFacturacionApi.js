import apiClient from "./apiClient";
import { listarFacturas } from "./facturasApi";

const USE_MOCK_API =
  import.meta.env.VITE_USE_MOCK_API === "true";

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

function normalizarRegistroMatriz(registro) {
  if (Array.isArray(registro)) {
    return {
      idArticulo: Number(registro[0]),
      idCliente: Number(registro[1]),
      total: Number(registro[2] ?? 0),
    };
  }

  return {
    idArticulo: Number(
      registro.idArticulo ??
        registro.articuloId ??
        registro.articulo,
    ),

    idCliente: Number(
      registro.idCliente ??
        registro.clienteId ??
        registro.cliente,
    ),

    total: Number(
      registro.total ??
        registro.totalVendido ??
        registro.valor ??
        0,
    ),
  };
}

function convertirRespuestaMatriz(data) {
  /*
   * Formato posible 1:
   *
   * [
   *   {
   *     idArticulo: 1,
   *     idCliente: 2,
   *     total: 50
   *   }
   * ]
   */

  if (Array.isArray(data)) {
    return data
      .map(normalizarRegistroMatriz)
      .filter(
        (registro) =>
          Number.isFinite(registro.idArticulo) &&
          Number.isFinite(registro.idCliente),
      );
  }

  /*
   * Formato posible 2, correspondiente al
   * Map<Integer, Map<Integer, Double>> de Java:
   *
   * {
   *   "1": {
   *     "2": 50,
   *     "3": 30
   *   }
   * }
   */

  if (data && typeof data === "object") {
    return Object.entries(data).flatMap(
      ([idArticulo, clientes]) => {
        if (
          !clientes ||
          typeof clientes !== "object"
        ) {
          return [];
        }

        return Object.entries(clientes).map(
          ([idCliente, total]) => ({
            idArticulo: Number(idArticulo),
            idCliente: Number(idCliente),
            total: Number(total ?? 0),
          }),
        );
      },
    );
  }

  return [];
}

function construirMatrizVentasMock(facturas) {
  const acumulados = new Map();

  facturas.forEach((factura) => {
    const idCliente = Number(
      factura.cliente?.idCliente,
    );

    if (!Number.isFinite(idCliente)) {
      return;
    }

    const detalles = Array.isArray(
      factura.detalles,
    )
      ? factura.detalles
      : [];

    detalles.forEach((detalle) => {
      const idArticulo = Number(
        detalle.idArticulo,
      );

      if (!Number.isFinite(idArticulo)) {
        return;
      }

      const totalDetalle =
        Number(detalle.cantidad || 0) *
        Number(detalle.precio || 0);

      const clave = `${idArticulo}-${idCliente}`;

      const totalActual =
        acumulados.get(clave)?.total ?? 0;

      acumulados.set(clave, {
        idArticulo,
        idCliente,
        total: totalActual + totalDetalle,
      });
    });
  });

  return Array.from(acumulados.values()).sort(
    (a, b) => {
      if (a.idArticulo !== b.idArticulo) {
        return a.idArticulo - b.idArticulo;
      }

      return a.idCliente - b.idCliente;
    },
  );
}

export async function obtenerMatrizVentas() {
  if (USE_MOCK_API) {
    const facturas = await listarFacturas();

    return construirMatrizVentasMock(
      facturas,
    );
  }

  try {
    const response = await apiClient.get(
      "/facturas/reportes/matriz-ventas",
    );

    const data = extraerData(response);

    return convertirRespuestaMatriz(data);
  } catch (error) {
    if (error.response?.status === 404) {
      return [];
    }

    throw error;
  }
}