import apiClient from "./apiClient";

const MOCK_STORAGE_KEY = "nexo_mock_pagos";

const USE_MOCK_API =
  import.meta.env.VITE_USE_MOCK_API === "true";

function esperar(milliseconds = 250) {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

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

function normalizarPago(pago) {
  return {
    idPagoDetalle: Number(pago.idPagoDetalle),

    fechaPago: pago.fechaPago
      ? String(pago.fechaPago).slice(0, 10)
      : "",

    valor: Number(pago.valor ?? 0),

    cobrador: pago.cobrador
      ? {
          idCobrador: Number(
            pago.cobrador.idCobrador,
          ),
          cedula: pago.cobrador.cedula ?? "",
          nombre: pago.cobrador.nombre ?? "",
          direccion:
            pago.cobrador.direccion ?? "",
        }
      : null,

    formaPago: pago.formaPago
      ? {
          codigo: Number(
            pago.formaPago.codigo,
          ),
          nombre:
            pago.formaPago.nombre ?? "",
        }
      : null,

    factura: pago.factura
      ? {
          idFactura: Number(
            pago.factura.idFactura,
          ),
          numeroFactura:
            pago.factura.numeroFactura ?? "",
          valorTotal: Number(
            pago.factura.valorTotal ?? 0,
          ),
          cliente:
            pago.factura.cliente ?? null,
        }
      : null,
  };
}

function leerPagosMock() {
  try {
    const contenido = localStorage.getItem(
      MOCK_STORAGE_KEY,
    );

    if (!contenido) {
      return [];
    }

    const pagos = JSON.parse(contenido);

    return Array.isArray(pagos)
      ? pagos.map(normalizarPago)
      : [];
  } catch {
    localStorage.removeItem(MOCK_STORAGE_KEY);
    return [];
  }
}

function guardarPagosMock(pagos) {
  localStorage.setItem(
    MOCK_STORAGE_KEY,
    JSON.stringify(pagos),
  );
}

function crearErrorMock(message, status = 400) {
  const error = new Error(message);

  error.response = {
    status,
    data: {
      status,
      message,
      data: null,
    },
  };

  return error;
}

function obtenerTotalPagado(
  pagos,
  idFactura,
  idPagoExcluir = null,
) {
  return pagos
    .filter((pago) => {
      const perteneceFactura =
        Number(pago.factura?.idFactura) ===
        Number(idFactura);

      const esPagoExcluido =
        idPagoExcluir !== null &&
        Number(pago.idPagoDetalle) ===
          Number(idPagoExcluir);

      return perteneceFactura && !esPagoExcluido;
    })
    .reduce(
      (total, pago) =>
        total + Number(pago.valor || 0),
      0,
    );
}

function validarSaldo(
  pagos,
  pago,
  idPagoExcluir = null,
) {
  const totalFactura = Number(
    pago.factura?.valorTotal ?? 0,
  );

  const totalPagado = obtenerTotalPagado(
    pagos,
    pago.factura?.idFactura,
    idPagoExcluir,
  );

  const saldoDisponible =
    totalFactura - totalPagado;

  if (Number(pago.valor) > saldoDisponible + 0.001) {
    throw crearErrorMock(
      `El valor supera el saldo pendiente de $${saldoDisponible.toFixed(
        2,
      )}.`,
      409,
    );
  }
}

export function obtenerMensajePagoError(
  error,
  fallback = "Ocurrió un error inesperado.",
) {
  return (
    error.response?.data?.message ||
    error.response?.data?.error ||
    error.message ||
    fallback
  );
}

export async function listarPagos() {
  if (USE_MOCK_API) {
    await esperar();

    return leerPagosMock().sort(
      (a, b) =>
        new Date(b.fechaPago).getTime() -
        new Date(a.fechaPago).getTime(),
    );
  }

  try {
    const response = await apiClient.get(
      "/pagos",
    );

    const data = extraerData(response);

    return Array.isArray(data)
      ? data.map(normalizarPago)
      : [];
  } catch (error) {
    if (error.response?.status === 404) {
      return [];
    }

    throw error;
  }
}

export async function crearPago(pago) {
  const payload = {
    fechaPago: pago.fechaPago,
    valor: Number(pago.valor),

    cobrador: {
      idCobrador: Number(
        pago.cobrador.idCobrador,
      ),
    },

    formaPago: {
      codigo: Number(
        pago.formaPago.codigo,
      ),
    },

    factura: {
      idFactura: Number(
        pago.factura.idFactura,
      ),
    },
  };

  if (USE_MOCK_API) {
    await esperar();

    const pagos = leerPagosMock();

    validarSaldo(pagos, pago);

    const siguienteId =
      pagos.reduce(
        (maximo, item) =>
          Math.max(
            maximo,
            Number(item.idPagoDetalle) || 0,
          ),
        0,
      ) + 1;

    const nuevoPago = {
      idPagoDetalle: siguienteId,
      fechaPago: payload.fechaPago,
      valor: payload.valor,
      cobrador: pago.cobrador,
      formaPago: pago.formaPago,
      factura: pago.factura,
    };

    guardarPagosMock([
      ...pagos,
      nuevoPago,
    ]);

    return normalizarPago(nuevoPago);
  }

  const response = await apiClient.post(
    "/pagos",
    payload,
  );

  return normalizarPago(
    extraerData(response),
  );
}

export async function actualizarPago(
  idPagoDetalle,
  pago,
) {
  const payload = {
    fechaPago: pago.fechaPago,
    valor: Number(pago.valor),

    cobrador: {
      idCobrador: Number(
        pago.cobrador.idCobrador,
      ),
    },

    formaPago: {
      codigo: Number(
        pago.formaPago.codigo,
      ),
    },

    factura: {
      idFactura: Number(
        pago.factura.idFactura,
      ),
    },
  };

  if (USE_MOCK_API) {
    await esperar();

    const pagos = leerPagosMock();
    const idNumerico = Number(idPagoDetalle);

    const indice = pagos.findIndex(
      (item) =>
        Number(item.idPagoDetalle) ===
        idNumerico,
    );

    if (indice === -1) {
      throw crearErrorMock(
        "El pago que intentas modificar no existe.",
        404,
      );
    }

    validarSaldo(
      pagos,
      pago,
      idNumerico,
    );

    const pagoActualizado = {
      idPagoDetalle: idNumerico,
      fechaPago: payload.fechaPago,
      valor: payload.valor,
      cobrador: pago.cobrador,
      formaPago: pago.formaPago,
      factura: pago.factura,
    };

    const nuevaLista = [...pagos];
    nuevaLista[indice] = pagoActualizado;

    guardarPagosMock(nuevaLista);

    return normalizarPago(
      pagoActualizado,
    );
  }

  const response = await apiClient.put(
    `/pagos/${idPagoDetalle}`,
    payload,
  );

  return normalizarPago(
    extraerData(response),
  );
}

export async function eliminarPago(
  idPagoDetalle,
) {
  if (USE_MOCK_API) {
    await esperar();

    const pagos = leerPagosMock();
    const idNumerico = Number(idPagoDetalle);

    const existe = pagos.some(
      (item) =>
        Number(item.idPagoDetalle) ===
        idNumerico,
    );

    if (!existe) {
      throw crearErrorMock(
        "El pago que intentas eliminar no existe.",
        404,
      );
    }

    guardarPagosMock(
      pagos.filter(
        (item) =>
          Number(item.idPagoDetalle) !==
          idNumerico,
      ),
    );

    return;
  }

  await apiClient.delete(
    `/pagos/${idPagoDetalle}`,
  );
}