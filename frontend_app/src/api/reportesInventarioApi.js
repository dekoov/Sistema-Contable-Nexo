import apiClient from "./apiClient";
import { listarArticulos } from "./articulosApi";
import { listarComprobantes } from "./comprobantesApi";

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

function normalizarMovimiento(fila) {
  /*
   * Formato posible del backend:
   *
   * [
   *   "Teclado",
   *   "Compra a proveedor",
   *   "I",
   *   10
   * ]
   */

  if (Array.isArray(fila)) {
    return {
      idArticulo: null,
      articulo: String(fila[0] ?? "Sin artículo"),
      movimiento: String(
        fila[1] ?? "Sin movimiento",
      ),
      tipo: String(fila[2] ?? "")
        .trim()
        .toUpperCase(),
      cantidad: Number(fila[3] ?? 0),
    };
  }

  return {
    idArticulo:
      fila.idArticulo !== undefined
        ? Number(fila.idArticulo)
        : null,

    articulo: String(
      fila.articulo ??
        fila.nombreArticulo ??
        fila.producto ??
        "Sin artículo",
    ),

    movimiento: String(
      fila.movimiento ??
        fila.nombreMovimiento ??
        fila.tipoMovimiento ??
        "Sin movimiento",
    ),

    tipo: String(
      fila.tipo ??
        fila.codigoTipo ??
        "",
    )
      .trim()
      .toUpperCase(),

    cantidad: Number(
      fila.cantidad ??
        fila.totalCantidad ??
        fila.total ??
        0,
    ),
  };
}

function normalizarStock(articulo, valorStock) {
  const data =
    valorStock &&
    typeof valorStock === "object"
      ? valorStock
      : {};

  const stock =
    typeof valorStock === "number"
      ? valorStock
      : Number(
          data.stock ??
            data.saldo ??
            data.cantidad ??
            data.stockActual ??
            0,
        );

  return {
    idArticulo: Number(articulo.idArticulo),
    articulo: articulo.nombre ?? "",
    precio: Number(articulo.precio ?? 0),
    ingresos: Number(data.ingresos ?? 0),
    egresos: Number(data.egresos ?? 0),
    stock: Number(stock),
  };
}

function fechaEstaEnRango(
  fecha,
  fechaInicio,
  fechaFin,
) {
  if (!fecha) {
    return false;
  }

  const fechaNormalizada = String(fecha).slice(
    0,
    10,
  );

  return (
    fechaNormalizada >= fechaInicio &&
    fechaNormalizada <= fechaFin
  );
}

function obtenerTipoComprobante(comprobante) {
  return String(
    comprobante.idTipoMovimiento?.tipo ??
      comprobante.tipoMovimiento?.tipo ??
      "",
  )
    .trim()
    .toUpperCase();
}

function obtenerNombreMovimiento(comprobante) {
  return (
    comprobante.idTipoMovimiento?.nombre ??
    comprobante.tipoMovimiento?.nombre ??
    "Sin movimiento"
  );
}

function construirMovimientosMock(
  comprobantes,
  fechaInicio,
  fechaFin,
) {
  const acumulados = new Map();

  comprobantes
    .filter((comprobante) =>
      fechaEstaEnRango(
        comprobante.fecha,
        fechaInicio,
        fechaFin,
      ),
    )
    .forEach((comprobante) => {
      const tipo =
        obtenerTipoComprobante(comprobante);

      const movimiento =
        obtenerNombreMovimiento(comprobante);

      const detalles = Array.isArray(
        comprobante.detalles,
      )
        ? comprobante.detalles
        : [];

      detalles.forEach((detalle) => {
        const idArticulo = Number(
          detalle.idArticulo,
        );

        const articulo =
          detalle.nombreArticulo ||
          `Artículo #${idArticulo}`;

        const clave = [
          idArticulo,
          movimiento.toLowerCase(),
          tipo,
        ].join("-");

        const actual = acumulados.get(clave) ?? {
          idArticulo,
          articulo,
          movimiento,
          tipo,
          cantidad: 0,
        };

        actual.cantidad += Number(
          detalle.cantidad || 0,
        );

        acumulados.set(clave, actual);
      });
    });

  return Array.from(acumulados.values()).sort(
    (a, b) => {
      const comparacionArticulo =
        a.articulo.localeCompare(b.articulo);

      if (comparacionArticulo !== 0) {
        return comparacionArticulo;
      }

      return a.movimiento.localeCompare(
        b.movimiento,
      );
    },
  );
}

function construirStockMock(
  comprobantes,
  articulos,
) {
  const stockPorArticulo = new Map();

  articulos.forEach((articulo) => {
    stockPorArticulo.set(
      Number(articulo.idArticulo),
      {
        idArticulo: Number(
          articulo.idArticulo,
        ),
        articulo: articulo.nombre ?? "",
        precio: Number(
          articulo.precio ?? 0,
        ),
        ingresos: 0,
        egresos: 0,
        stock: 0,
      },
    );
  });

  comprobantes.forEach((comprobante) => {
    const tipo =
      obtenerTipoComprobante(comprobante);

    const detalles = Array.isArray(
      comprobante.detalles,
    )
      ? comprobante.detalles
      : [];

    detalles.forEach((detalle) => {
      const idArticulo = Number(
        detalle.idArticulo,
      );

      if (!stockPorArticulo.has(idArticulo)) {
        stockPorArticulo.set(idArticulo, {
          idArticulo,
          articulo:
            detalle.nombreArticulo ||
            `Artículo #${idArticulo}`,
          precio: Number(
            detalle.precio ?? 0,
          ),
          ingresos: 0,
          egresos: 0,
          stock: 0,
        });
      }

      const fila =
        stockPorArticulo.get(idArticulo);

      const cantidad = Number(
        detalle.cantidad || 0,
      );

      if (tipo === "I") {
        fila.ingresos += cantidad;
      } else {
        fila.egresos += cantidad;
      }

      fila.stock =
        fila.ingresos - fila.egresos;
    });
  });

  return Array.from(
    stockPorArticulo.values(),
  ).sort((a, b) =>
    a.articulo.localeCompare(b.articulo),
  );
}

export function obtenerMensajeReporteInventarioError(
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

export async function obtenerMovimientosInventario(
  fechaInicio,
  fechaFin,
) {
  if (USE_MOCK_API) {
    const comprobantes =
      await listarComprobantes();

    return construirMovimientosMock(
      comprobantes,
      fechaInicio,
      fechaFin,
    );
  }

  try {
    const response = await apiClient.get(
      "/inventario/reportes/movimientos",
      {
        params: {
          fechaInicio,
          fechaFin,
        },
      },
    );

    const data = extraerData(response);

    return Array.isArray(data)
      ? data.map(normalizarMovimiento)
      : [];
  } catch (error) {
    if (error.response?.status === 404) {
      return [];
    }

    throw error;
  }
}

export async function obtenerStockArticulos() {
  const articulos = await listarArticulos();

  if (USE_MOCK_API) {
    const comprobantes =
      await listarComprobantes();

    return construirStockMock(
      comprobantes,
      articulos,
    );
  }

  const resultados = await Promise.all(
    articulos.map(async (articulo) => {
      try {
        const response = await apiClient.get(
          `/articulos/${articulo.idArticulo}/stock`,
        );

        return normalizarStock(
          articulo,
          extraerData(response),
        );
      } catch (error) {
        if (error.response?.status === 404) {
          return normalizarStock(
            articulo,
            0,
          );
        }

        throw error;
      }
    }),
  );

  return resultados.sort((a, b) =>
    a.articulo.localeCompare(b.articulo),
  );
}