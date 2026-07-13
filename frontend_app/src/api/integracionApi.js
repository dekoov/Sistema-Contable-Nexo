import apiClient from "./apiClient";

const COLA_STORAGE_KEY =
  "nexo_mock_cola_facturas";

const HISTORIAL_STORAGE_KEY =
  "nexo_mock_integracion_historial";

const COMPROBANTES_STORAGE_KEY =
  "nexo_mock_comprobantes";

const TIPOS_MOVIMIENTO_STORAGE_KEY =
  "nexo_mock_tipos_movimiento";

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
    Object.prototype.hasOwnProperty.call(
      body,
      "data",
    )
  ) {
    return body.data;
  }

  return body;
}

function leerListaLocalStorage(clave) {
  try {
    const contenido =
      localStorage.getItem(clave);

    if (!contenido) {
      return [];
    }

    const lista = JSON.parse(contenido);

    return Array.isArray(lista)
      ? lista
      : [];
  } catch {
    localStorage.removeItem(clave);
    return [];
  }
}

function guardarListaLocalStorage(
  clave,
  lista,
) {
  localStorage.setItem(
    clave,
    JSON.stringify(lista),
  );
}

function crearIdMensaje() {
  if (
    globalThis.crypto &&
    typeof globalThis.crypto.randomUUID ===
      "function"
  ) {
    return globalThis.crypto.randomUUID();
  }

  return `MSG-${Date.now()}-${Math.random()
    .toString(16)
    .slice(2)}`;
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

function convertirPayload(valor) {
  if (!valor) {
    return {};
  }

  if (typeof valor === "string") {
    try {
      return JSON.parse(valor);
    } catch {
      return {
        textoOriginal: valor,
      };
    }
  }

  return valor;
}

function normalizarMensaje(mensaje) {
  const payload = convertirPayload(
    mensaje.payload ??
      mensaje.contenido ??
      mensaje.data,
  );

  return {
    idMensaje: String(
      mensaje.idMensaje ??
        mensaje.jmsMessageId ??
        mensaje.messageId ??
        "",
    ),

    tipoEvento:
      mensaje.tipoEvento ??
      mensaje.tipo ??
      "FACTURA_CREADA",

    origen:
      mensaje.origen ??
      "FACTURACION",

    destino:
      mensaje.destino ??
      "INVENTARIO",

    estado:
      mensaje.estado ??
      "PENDIENTE",

    fechaPublicacion:
      mensaje.fechaPublicacion ??
      mensaje.timestamp ??
      new Date().toISOString(),

    fechaProcesamiento:
      mensaje.fechaProcesamiento ??
      null,

    intentos: Number(
      mensaje.intentos ?? 0,
    ),

    payload,

    comprobanteGenerado:
      mensaje.comprobanteGenerado ??
      null,
  };
}

function obtenerSiguienteId(
  lista,
  propiedad,
) {
  return (
    lista.reduce(
      (maximo, elemento) =>
        Math.max(
          maximo,
          Number(elemento[propiedad]) || 0,
        ),
      0,
    ) + 1
  );
}

function obtenerSiguienteIdDetalle(
  comprobantes,
) {
  return (
    comprobantes.reduce(
      (maximoGeneral, comprobante) => {
        const detalles = Array.isArray(
          comprobante.detalles,
        )
          ? comprobante.detalles
          : [];

        const maximoComprobante =
          detalles.reduce(
            (maximoDetalle, detalle) =>
              Math.max(
                maximoDetalle,
                Number(
                  detalle.idComprobanteDet,
                ) || 0,
              ),
            0,
          );

        return Math.max(
          maximoGeneral,
          maximoComprobante,
        );
      },
      0,
    ) + 1
  );
}

export function obtenerMensajeIntegracionError(
  error,
  fallback = "Ocurrió un error en la integración.",
) {
  return (
    error.response?.data?.message ||
    error.response?.data?.error ||
    error.message ||
    fallback
  );
}

/*
 * Esta función es utilizada por facturasApi.js
 * únicamente cuando está activo el modo mock.
 */
export function publicarFacturaEnColaMock(
  factura,
) {
  if (!USE_MOCK_API) {
    return null;
  }

  const cola = leerListaLocalStorage(
    COLA_STORAGE_KEY,
  ).map(normalizarMensaje);

  const historial = leerListaLocalStorage(
    HISTORIAL_STORAGE_KEY,
  ).map(normalizarMensaje);

  const facturaYaPublicada = [
    ...cola,
    ...historial,
  ].some(
    (mensaje) =>
      Number(mensaje.payload?.idFactura) ===
      Number(factura.idFactura),
  );

  if (facturaYaPublicada) {
    return null;
  }

  const detalles = Array.isArray(
    factura.detalles,
  )
    ? factura.detalles.map((detalle) => ({
        idArticulo: Number(
          detalle.idArticulo,
        ),

        nombreArticulo:
          detalle.nombreArticulo ?? "",

        cantidad: Number(
          detalle.cantidad,
        ),

        precio: Number(detalle.precio),
      }))
    : [];

  const mensaje = {
    idMensaje: crearIdMensaje(),
    tipoEvento: "FACTURA_CREADA",
    origen: "FACTURACION",
    destino: "INVENTARIO",
    estado: "PENDIENTE",
    fechaPublicacion:
      new Date().toISOString(),
    fechaProcesamiento: null,
    intentos: 0,

    payload: {
      idFactura: Number(
        factura.idFactura,
      ),

      numeroFactura:
        factura.numeroFactura,

      fecha: factura.fecha,

      valorTotal: Number(
        factura.valorTotal ?? 0,
      ),

      detalles,
    },
  };

  guardarListaLocalStorage(
    COLA_STORAGE_KEY,
    [...cola, mensaje],
  );

  return mensaje;
}

export async function listarMensajesCola() {
  if (USE_MOCK_API) {
    await esperar();

    return leerListaLocalStorage(
      COLA_STORAGE_KEY,
    )
      .map(normalizarMensaje)
      .filter(
        (mensaje) =>
          mensaje.estado === "PENDIENTE",
      )
      .sort(
        (a, b) =>
          new Date(
            a.fechaPublicacion,
          ).getTime() -
          new Date(
            b.fechaPublicacion,
          ).getTime(),
      );
  }

  try {
    const response = await apiClient.get(
      "/integracion/cola",
    );

    const data = extraerData(response);

    return Array.isArray(data)
      ? data.map(normalizarMensaje)
      : [];
  } catch (error) {
    if (error.response?.status === 404) {
      return [];
    }

    throw error;
  }
}

export async function listarHistorialIntegracion() {
  if (USE_MOCK_API) {
    await esperar(100);

    return leerListaLocalStorage(
      HISTORIAL_STORAGE_KEY,
    )
      .map(normalizarMensaje)
      .sort(
        (a, b) =>
          new Date(
            b.fechaProcesamiento ??
              b.fechaPublicacion,
          ).getTime() -
          new Date(
            a.fechaProcesamiento ??
              a.fechaPublicacion,
          ).getTime(),
      );
  }

  try {
    const response = await apiClient.get(
      "/integracion/historial",
    );

    const data = extraerData(response);

    return Array.isArray(data)
      ? data.map(normalizarMensaje)
      : [];
  } catch (error) {
    if (error.response?.status === 404) {
      return [];
    }

    throw error;
  }
}

export async function importarMensajeCola(
  idMensaje,
) {
  if (!USE_MOCK_API) {
    const response = await apiClient.post(
      `/integracion/cola/${encodeURIComponent(
        idMensaje,
      )}/importar`,
    );

    return normalizarMensaje(
      extraerData(response),
    );
  }

  await esperar(400);

  const cola = leerListaLocalStorage(
    COLA_STORAGE_KEY,
  ).map(normalizarMensaje);

  const indiceMensaje = cola.findIndex(
    (mensaje) =>
      mensaje.idMensaje ===
      String(idMensaje),
  );

  if (indiceMensaje === -1) {
    throw crearErrorMock(
      "El mensaje ya no se encuentra en la cola.",
      404,
    );
  }

  const mensaje = cola[indiceMensaje];
  const factura = mensaje.payload;

  if (
    !factura ||
    !Array.isArray(factura.detalles) ||
    factura.detalles.length === 0
  ) {
    throw crearErrorMock(
      "El mensaje no contiene detalles de factura válidos.",
      400,
    );
  }

  const tiposMovimiento =
    leerListaLocalStorage(
      TIPOS_MOVIMIENTO_STORAGE_KEY,
    );

  const tipoEgreso =
    tiposMovimiento.find(
      (tipoMovimiento) =>
        String(
          tipoMovimiento.tipo ?? "",
        )
          .trim()
          .toUpperCase() === "E",
    );

  if (!tipoEgreso) {
    throw crearErrorMock(
      "No existe un tipo de movimiento de Egreso. Registra uno antes de importar la factura.",
      409,
    );
  }

  const comprobantes =
    leerListaLocalStorage(
      COMPROBANTES_STORAGE_KEY,
    );

  const numeroComprobante =
    `VEN-${factura.idFactura}`;

  const comprobanteYaExiste =
    comprobantes.some(
      (comprobante) =>
        comprobante.numeroComprobante ===
        numeroComprobante,
    );

  if (comprobanteYaExiste) {
    throw crearErrorMock(
      `La factura ya fue importada como comprobante "${numeroComprobante}".`,
      409,
    );
  }

  const siguienteIdComprobante =
    obtenerSiguienteId(
      comprobantes,
      "idComprobante",
    );

  const siguienteIdDetalle =
    obtenerSiguienteIdDetalle(
      comprobantes,
    );

  const detalles = factura.detalles.map(
    (detalle, indice) => ({
      idComprobanteDet:
        siguienteIdDetalle + indice,

      idArticulo: Number(
        detalle.idArticulo,
      ),

      nombreArticulo:
        detalle.nombreArticulo ?? "",

      cantidad: Number(
        detalle.cantidad,
      ),

      precio: Number(detalle.precio),
    }),
  );

  const nuevoComprobante = {
    idComprobante:
      siguienteIdComprobante,

    numeroComprobante,

    fecha: factura.fecha,

    idTipoMovimiento: {
      idTipoMovimiento: Number(
        tipoEgreso.idTipoMovimiento,
      ),

      nombre:
        tipoEgreso.nombre ??
        "Egreso por venta",

      tipo: "E",
    },

    detalles,
  };

  guardarListaLocalStorage(
    COMPROBANTES_STORAGE_KEY,
    [...comprobantes, nuevoComprobante],
  );

  const mensajeProcesado = {
    ...mensaje,
    estado: "PROCESADO",
    intentos: mensaje.intentos + 1,
    fechaProcesamiento:
      new Date().toISOString(),

    comprobanteGenerado: {
      idComprobante:
        nuevoComprobante.idComprobante,

      numeroComprobante:
        nuevoComprobante.numeroComprobante,
    },
  };

  guardarListaLocalStorage(
    COLA_STORAGE_KEY,
    cola.filter(
      (_, indice) =>
        indice !== indiceMensaje,
    ),
  );

  const historial =
    leerListaLocalStorage(
      HISTORIAL_STORAGE_KEY,
    );

  guardarListaLocalStorage(
    HISTORIAL_STORAGE_KEY,
    [...historial, mensajeProcesado],
  );

  return normalizarMensaje(
    mensajeProcesado,
  );
}