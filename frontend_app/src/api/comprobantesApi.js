import apiClient from "./apiClient";

const MOCK_STORAGE_KEY = "nexo_mock_comprobantes";

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

function normalizarTipoMovimiento(valor) {
  if (valor && typeof valor === "object") {
    return {
      idTipoMovimiento: Number(
        valor.idTipoMovimiento,
      ),
      nombre: valor.nombre ?? "",
      tipo: String(valor.tipo ?? "")
        .trim()
        .toUpperCase(),
    };
  }

  return {
    idTipoMovimiento: Number(valor),
    nombre: "",
    tipo: "",
  };
}

function normalizarArticulo(valor, nombreAlternativo = "") {
  if (valor && typeof valor === "object") {
    return {
      idArticulo: Number(valor.idArticulo),
      nombre: valor.nombre ?? nombreAlternativo,
      precio: Number(valor.precio ?? 0),
    };
  }

  return {
    idArticulo: Number(valor),
    nombre: nombreAlternativo,
    precio: 0,
  };
}

function normalizarDetalle(detalle) {
  const articulo = normalizarArticulo(
    detalle.idArticulo,
    detalle.nombreArticulo ?? "",
  );

  return {
    idComprobanteDet: Number(
      detalle.idComprobanteDet,
    ),
    idArticulo: articulo.idArticulo,
    nombreArticulo: articulo.nombre,
    cantidad: Number(detalle.cantidad ?? 0),
    precio: Number(detalle.precio ?? 0),
  };
}

function normalizarComprobante(comprobante) {
  const detallesOriginales =
    comprobante.detalles ??
    comprobante.comprobanteDetalleCollection ??
    [];

  const tipoMovimiento = normalizarTipoMovimiento(
    comprobante.idTipoMovimiento ??
      comprobante.tipoMovimiento,
  );

  return {
    idComprobante: Number(
      comprobante.idComprobante,
    ),
    numeroComprobante:
      comprobante.numeroComprobante ?? "",
    fecha: comprobante.fecha
      ? String(comprobante.fecha).slice(0, 10)
      : "",
    idTipoMovimiento: tipoMovimiento,
    detalles: Array.isArray(detallesOriginales)
      ? detallesOriginales.map(normalizarDetalle)
      : [],
  };
}

function leerComprobantesMock() {
  try {
    const contenido = localStorage.getItem(
      MOCK_STORAGE_KEY,
    );

    if (!contenido) {
      return [];
    }

    const comprobantes = JSON.parse(contenido);

    return Array.isArray(comprobantes)
      ? comprobantes.map(normalizarComprobante)
      : [];
  } catch {
    localStorage.removeItem(MOCK_STORAGE_KEY);
    return [];
  }
}

function guardarComprobantesMock(comprobantes) {
  localStorage.setItem(
    MOCK_STORAGE_KEY,
    JSON.stringify(comprobantes),
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

function obtenerSiguienteIdComprobante(comprobantes) {
  return (
    comprobantes.reduce(
      (maximo, comprobante) =>
        Math.max(
          maximo,
          Number(comprobante.idComprobante) || 0,
        ),
      0,
    ) + 1
  );
}

function obtenerSiguienteIdDetalle(comprobantes) {
  const idMaximo = comprobantes.reduce(
    (maximoGeneral, comprobante) => {
      const maximoComprobante =
        comprobante.detalles.reduce(
          (maximoDetalle, detalle) =>
            Math.max(
              maximoDetalle,
              Number(detalle.idComprobanteDet) || 0,
            ),
          0,
        );

      return Math.max(
        maximoGeneral,
        maximoComprobante,
      );
    },
    0,
  );

  return idMaximo + 1;
}

function construirPayload(comprobante) {
  return {
    cabecera: {
      numeroComprobante:
        comprobante.numeroComprobante.trim(),
      fecha: comprobante.fecha,
      idTipoMovimiento: {
        idTipoMovimiento: Number(
          comprobante.idTipoMovimiento
            .idTipoMovimiento,
        ),
      },
    },

    detalles: comprobante.detalles.map(
      (detalle) => {
        const payloadDetalle = {
          idArticulo: {
            idArticulo: Number(
              detalle.idArticulo,
            ),
          },
          cantidad: Number(detalle.cantidad),
          precio: Number(detalle.precio),
        };

        if (detalle.idComprobanteDet) {
          payloadDetalle.idComprobanteDet =
            Number(detalle.idComprobanteDet);
        }

        return payloadDetalle;
      },
    ),
  };
}

export function obtenerMensajeComprobanteError(
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

export async function listarComprobantes() {
  if (USE_MOCK_API) {
    await esperar();

    return leerComprobantesMock().sort(
      (a, b) =>
        new Date(b.fecha).getTime() -
        new Date(a.fecha).getTime(),
    );
  }

  try {
    const response = await apiClient.get(
      "/comprobantes",
    );

    const data = extraerData(response);

    return Array.isArray(data)
      ? data.map(normalizarComprobante)
      : [];
  } catch (error) {
    if (error.response?.status === 404) {
      return [];
    }

    throw error;
  }
}

export async function crearComprobante(
  comprobante,
) {
  const payload = construirPayload(comprobante);

  if (USE_MOCK_API) {
    await esperar();

    const comprobantes =
      leerComprobantesMock();

    const numeroRepetido = comprobantes.some(
      (item) =>
        item.numeroComprobante.toLowerCase() ===
        payload.cabecera.numeroComprobante.toLowerCase(),
    );

    if (numeroRepetido) {
      throw crearErrorMock(
        `Ya existe el comprobante "${payload.cabecera.numeroComprobante}".`,
        409,
      );
    }

    const siguienteIdComprobante =
      obtenerSiguienteIdComprobante(
        comprobantes,
      );

    const siguienteIdDetalle =
      obtenerSiguienteIdDetalle(comprobantes);

    const detallesConId =
      comprobante.detalles.map(
        (detalle, indice) => ({
          idComprobanteDet:
            siguienteIdDetalle + indice,
          idArticulo: Number(
            detalle.idArticulo,
          ),
          nombreArticulo:
            detalle.nombreArticulo ?? "",
          cantidad: Number(detalle.cantidad),
          precio: Number(detalle.precio),
        }),
      );

    const nuevoComprobante = {
      idComprobante:
        siguienteIdComprobante,
      numeroComprobante:
        payload.cabecera.numeroComprobante,
      fecha: payload.cabecera.fecha,
      idTipoMovimiento:
        comprobante.idTipoMovimiento,
      detalles: detallesConId,
    };

    guardarComprobantesMock([
      ...comprobantes,
      nuevoComprobante,
    ]);

    return normalizarComprobante(
      nuevoComprobante,
    );
  }

  const response = await apiClient.post(
    "/comprobantes",
    payload,
  );

  return normalizarComprobante(
    extraerData(response),
  );
}

export async function actualizarComprobante(
  idComprobante,
  comprobante,
) {
  const payload = construirPayload(comprobante);

  if (USE_MOCK_API) {
    await esperar();

    const comprobantes =
      leerComprobantesMock();

    const idNumerico = Number(
      idComprobante,
    );

    const indiceComprobante =
      comprobantes.findIndex(
        (item) =>
          Number(item.idComprobante) ===
          idNumerico,
      );

    if (indiceComprobante === -1) {
      throw crearErrorMock(
        "El comprobante que intentas modificar no existe.",
        404,
      );
    }

    const numeroRepetido = comprobantes.some(
      (item) =>
        item.numeroComprobante.toLowerCase() ===
          payload.cabecera.numeroComprobante.toLowerCase() &&
        Number(item.idComprobante) !==
          idNumerico,
    );

    if (numeroRepetido) {
      throw crearErrorMock(
        `Ya existe otro comprobante llamado "${payload.cabecera.numeroComprobante}".`,
        409,
      );
    }

    let siguienteIdDetalle =
      obtenerSiguienteIdDetalle(comprobantes);

    const detallesActualizados =
      comprobante.detalles.map((detalle) => {
        const idDetalle =
          Number(detalle.idComprobanteDet) ||
          siguienteIdDetalle++;

        return {
          idComprobanteDet: idDetalle,
          idArticulo: Number(
            detalle.idArticulo,
          ),
          nombreArticulo:
            detalle.nombreArticulo ?? "",
          cantidad: Number(detalle.cantidad),
          precio: Number(detalle.precio),
        };
      });

    const comprobanteActualizado = {
      idComprobante: idNumerico,
      numeroComprobante:
        payload.cabecera.numeroComprobante,
      fecha: payload.cabecera.fecha,
      idTipoMovimiento:
        comprobante.idTipoMovimiento,
      detalles: detallesActualizados,
    };

    const nuevaLista = [...comprobantes];

    nuevaLista[indiceComprobante] =
      comprobanteActualizado;

    guardarComprobantesMock(nuevaLista);

    return normalizarComprobante(
      comprobanteActualizado,
    );
  }

  const response = await apiClient.put(
    `/comprobantes/${idComprobante}`,
    payload,
  );

  return normalizarComprobante(
    extraerData(response),
  );
}

export async function eliminarComprobante(
  idComprobante,
) {
  if (USE_MOCK_API) {
    await esperar();

    const comprobantes =
      leerComprobantesMock();

    const idNumerico = Number(
      idComprobante,
    );

    const existe = comprobantes.some(
      (item) =>
        Number(item.idComprobante) ===
        idNumerico,
    );

    if (!existe) {
      throw crearErrorMock(
        "El comprobante que intentas eliminar no existe.",
        404,
      );
    }

    guardarComprobantesMock(
      comprobantes.filter(
        (item) =>
          Number(item.idComprobante) !==
          idNumerico,
      ),
    );

    return;
  }

  await apiClient.delete(
    `/comprobantes/${idComprobante}`,
  );
}