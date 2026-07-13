import apiClient from "./apiClient";
import { listarFacturas } from "./facturasApi";
import { listarPagos } from "./pagosApi";

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

function obtenerEstadoSaldo(
  valorFactura,
  totalPagado,
  saldoPorCobrar,
) {
  if (saldoPorCobrar <= 0.001) {
    return "PAGADA";
  }

  if (totalPagado > 0) {
    return "PARCIAL";
  }

  if (valorFactura > 0) {
    return "PENDIENTE";
  }

  return "SIN_VALOR";
}

function normalizarEstadoCuenta(fila) {
  /*
   * También acepta un posible formato:
   *
   * [
   *   "FAC-001",
   *   100,
   *   40,
   *   60
   * ]
   */

  if (Array.isArray(fila)) {
    const valorFactura = Number(fila[1] ?? 0);
    const totalPagado = Number(fila[2] ?? 0);

    const saldoPorCobrar = Number(
      fila[3] ??
        Math.max(0, valorFactura - totalPagado),
    );

    return {
      idFactura: null,
      numeroFactura: String(fila[0] ?? ""),
      fecha: "",
      cliente: null,
      valorFactura,
      totalPagado,
      saldoPorCobrar,
      estado: obtenerEstadoSaldo(
        valorFactura,
        totalPagado,
        saldoPorCobrar,
      ),
    };
  }

  const valorFactura = Number(
    fila.valorFactura ??
      fila.valorTotal ??
      fila.totalFactura ??
      0,
  );

  const totalPagado = Number(
    fila.totalPagado ??
      fila.valorPagado ??
      fila.pagado ??
      0,
  );

  const saldoPorCobrar = Number(
    fila.saldoPorCobrar ??
      fila.saldo ??
      Math.max(0, valorFactura - totalPagado),
  );

  return {
    idFactura:
      fila.idFactura !== undefined
        ? Number(fila.idFactura)
        : null,

    numeroFactura: String(
      fila.numeroFactura ??
        fila.factura ??
        "",
    ),

    fecha: fila.fecha
      ? String(fila.fecha).slice(0, 10)
      : "",

    cliente: fila.cliente
      ? {
          idCliente: Number(
            fila.cliente.idCliente,
          ),

          cedula:
            fila.cliente.cedula ?? "",

          nombre:
            fila.cliente.nombre ?? "",
        }
      : fila.nombreCliente
        ? {
            idCliente: null,
            cedula:
              fila.cedulaCliente ?? "",
            nombre: fila.nombreCliente,
          }
        : null,

    valorFactura,
    totalPagado,
    saldoPorCobrar,

    estado:
      fila.estado ??
      obtenerEstadoSaldo(
        valorFactura,
        totalPagado,
        saldoPorCobrar,
      ),
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

function calcularValorFactura(factura) {
  const valorRegistrado = Number(
    factura.valorTotal,
  );

  if (Number.isFinite(valorRegistrado)) {
    return valorRegistrado;
  }

  const detalles = Array.isArray(
    factura.detalles,
  )
    ? factura.detalles
    : [];

  return detalles.reduce(
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

function construirEstadoCuentaMock(
  facturas,
  pagos,
  fechaInicio,
  fechaFin,
) {
  return facturas
    .filter((factura) =>
      fechaEstaEnRango(
        factura.fecha,
        fechaInicio,
        fechaFin,
      ),
    )
    .map((factura) => {
      const valorFactura =
        calcularValorFactura(factura);

      /*
       * Se suman todos los pagos relacionados
       * con la factura. El rango se aplica a la
       * fecha de la factura, igual que en el
       * sistema legado.
       */
      const totalPagado = pagos
        .filter(
          (pago) =>
            Number(
              pago.factura?.idFactura,
            ) ===
            Number(factura.idFactura),
        )
        .reduce(
          (total, pago) =>
            total +
            Number(pago.valor || 0),
          0,
        );

      const saldoPorCobrar = Math.max(
        0,
        valorFactura - totalPagado,
      );

      return {
        idFactura: Number(
          factura.idFactura,
        ),

        numeroFactura:
          factura.numeroFactura,

        fecha: factura.fecha,

        cliente:
          factura.cliente ?? null,

        valorFactura,
        totalPagado,
        saldoPorCobrar,

        estado: obtenerEstadoSaldo(
          valorFactura,
          totalPagado,
          saldoPorCobrar,
        ),
      };
    })
    .sort((a, b) =>
      a.numeroFactura.localeCompare(
        b.numeroFactura,
      ),
    );
}

export function obtenerMensajeReporteCxcError(
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

export async function obtenerEstadoCuenta(
  fechaInicio,
  fechaFin,
) {
  if (USE_MOCK_API) {
    const [facturas, pagos] =
      await Promise.all([
        listarFacturas(),
        listarPagos(),
      ]);

    return construirEstadoCuentaMock(
      facturas,
      pagos,
      fechaInicio,
      fechaFin,
    );
  }

  try {
    /*
     * Endpoint provisional para la futura
     * implementación REST del módulo CxC.
     */
    const response = await apiClient.get(
      "/cxc/reportes/estado-cuenta",
      {
        params: {
          fechaInicio,
          fechaFin,
        },
      },
    );

    const data = extraerData(response);

    return Array.isArray(data)
      ? data.map(normalizarEstadoCuenta)
      : [];
  } catch (error) {
    if (error.response?.status === 404) {
      return [];
    }

    throw error;
  }
}

function normalizarRegistroRecaudacion(registro) {
  if (Array.isArray(registro)) {
    return {
      idCobrador: null,
      nombreCobrador: String(
        registro[0] ?? "Sin cobrador",
      ),
      codigoFormaPago: null,
      formaPago: String(
        registro[1] ?? "Sin forma de pago",
      ),
      total: Number(registro[2] ?? 0),
    };
  }

  const cobrador =
    registro.cobrador &&
    typeof registro.cobrador === "object"
      ? registro.cobrador
      : null;

  const formaPago =
    registro.formaPago &&
    typeof registro.formaPago === "object"
      ? registro.formaPago
      : null;

  return {
    idCobrador:
      registro.idCobrador !== undefined
        ? Number(registro.idCobrador)
        : cobrador?.idCobrador !== undefined
          ? Number(cobrador.idCobrador)
          : null,

    nombreCobrador: String(
      registro.nombreCobrador ??
        cobrador?.nombre ??
        registro.cobrador ??
        "Sin cobrador",
    ),

    codigoFormaPago:
      registro.codigoFormaPago !== undefined
        ? Number(registro.codigoFormaPago)
        : formaPago?.codigo !== undefined
          ? Number(formaPago.codigo)
          : null,

    formaPago: String(
      registro.nombreFormaPago ??
        formaPago?.nombre ??
        registro.formaPago ??
        "Sin forma de pago",
    ),

    total: Number(
      registro.total ??
        registro.totalRecaudado ??
        registro.valor ??
        0,
    ),
  };
}

function convertirRespuestaMatrizRecaudacion(data) {
  const fuente =
    data &&
    typeof data === "object" &&
    Array.isArray(data.filas)
      ? data.filas
      : data;

  /*
   * Formato posible:
   *
   * [
   *   {
   *     "nombreCobrador": "Juan",
   *     "valoresPorFormaPago": {
   *       "Efectivo": 100,
   *       "Transferencia": 50
   *     },
   *     "totalRecaudado": 150
   *   }
   * ]
   */
  if (Array.isArray(fuente)) {
    return fuente.flatMap((registro) => {
      if (
        registro &&
        typeof registro === "object" &&
        registro.valoresPorFormaPago &&
        typeof registro.valoresPorFormaPago ===
          "object"
      ) {
        return Object.entries(
          registro.valoresPorFormaPago,
        ).map(([formaPago, total]) => ({
          idCobrador:
            registro.idCobrador !== undefined
              ? Number(registro.idCobrador)
              : null,

          nombreCobrador: String(
            registro.nombreCobrador ??
              "Sin cobrador",
          ),

          codigoFormaPago: null,
          formaPago,
          total: Number(total ?? 0),
        }));
      }

      return [
        normalizarRegistroRecaudacion(
          registro,
        ),
      ];
    });
  }

  /*
   * También acepta:
   *
   * {
   *   "Juan": {
   *     "Efectivo": 100,
   *     "Transferencia": 50
   *   }
   * }
   */
  if (
    fuente &&
    typeof fuente === "object"
  ) {
    return Object.entries(fuente).flatMap(
      ([nombreCobrador, valores]) => {
        if (
          !valores ||
          typeof valores !== "object"
        ) {
          return [];
        }

        return Object.entries(valores).map(
          ([formaPago, total]) => ({
            idCobrador: null,
            nombreCobrador,
            codigoFormaPago: null,
            formaPago,
            total: Number(total ?? 0),
          }),
        );
      },
    );
  }

  return [];
}

function construirMatrizRecaudacionMock(
  pagos,
  fechaInicio,
  fechaFin,
) {
  const acumulados = new Map();

  pagos
    .filter((pago) =>
      fechaEstaEnRango(
        pago.fechaPago,
        fechaInicio,
        fechaFin,
      ),
    )
    .forEach((pago) => {
      const idCobrador =
        pago.cobrador?.idCobrador !== undefined
          ? Number(
              pago.cobrador.idCobrador,
            )
          : null;

      const nombreCobrador =
        pago.cobrador?.nombre?.trim() ||
        "Sin cobrador";

      const codigoFormaPago =
        pago.formaPago?.codigo !== undefined
          ? Number(pago.formaPago.codigo)
          : null;

      const formaPago =
        pago.formaPago?.nombre?.trim() ||
        "Sin forma de pago";

      const clave = [
        idCobrador ?? nombreCobrador,
        codigoFormaPago ?? formaPago,
      ].join("::");

      const actual = acumulados.get(clave) ?? {
        idCobrador,
        nombreCobrador,
        codigoFormaPago,
        formaPago,
        total: 0,
      };

      actual.total += Number(
        pago.valor || 0,
      );

      acumulados.set(clave, actual);
    });

  return Array.from(acumulados.values()).sort(
    (a, b) => {
      const comparacionCobrador =
        a.nombreCobrador.localeCompare(
          b.nombreCobrador,
        );

      if (comparacionCobrador !== 0) {
        return comparacionCobrador;
      }

      return a.formaPago.localeCompare(
        b.formaPago,
      );
    },
  );
}

export async function obtenerMatrizRecaudacion(
  fechaInicio,
  fechaFin,
) {
  if (USE_MOCK_API) {
    const pagos = await listarPagos();

    return construirMatrizRecaudacionMock(
      pagos,
      fechaInicio,
      fechaFin,
    );
  }

  try {
    const response = await apiClient.get(
      "/cxc/reportes/matriz-recaudacion",
      {
        params: {
          fechaInicio,
          fechaFin,
        },
      },
    );

    return convertirRespuestaMatrizRecaudacion(
      extraerData(response),
    );
  } catch (error) {
    if (error.response?.status === 404) {
      return [];
    }

    throw error;
  }
}