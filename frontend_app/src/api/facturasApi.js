import apiClient from "./apiClient";
import {  publicarFacturaEnColaMock,} from "./integracionApi";

const MOCK_STORAGE_KEY = "nexo_mock_facturas";

const USE_MOCK_API =
  import.meta.env.VITE_USE_MOCK_API !== "false";

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

function calcularTotal(detalles = []) {
  return detalles.reduce((total, detalle) => {
    return (
      total +
      Number(detalle.cantidad || 0) *
        Number(detalle.precio || 0)
    );
  }, 0);
}

function normalizarFactura(factura) {
  const detalles = Array.isArray(factura.detalles)
    ? factura.detalles.map((detalle) => ({
        idFacturaDet: Number(detalle.idFacturaDet),
        idArticulo: Number(detalle.idArticulo),
        nombreArticulo:
          detalle.nombreArticulo ?? "",
        cantidad: Number(detalle.cantidad ?? 0),
        precio: Number(detalle.precio ?? 0),
      }))
    : [];

  return {
    idFactura: Number(factura.idFactura),
    numeroFactura: factura.numeroFactura ?? "",
    fecha: factura.fecha ?? "",
    cliente: factura.cliente
      ? {
          idCliente: Number(
            factura.cliente.idCliente,
          ),
          cedula: factura.cliente.cedula ?? "",
          nombre: factura.cliente.nombre ?? "",
          direccion:
            factura.cliente.direccion ?? "",
        }
      : null,
    ciudad: factura.ciudad
      ? {
          idCiudad: Number(
            factura.ciudad.idCiudad,
          ),
          nombre: factura.ciudad.nombre ?? "",
        }
      : null,
    valorTotal: Number(
      factura.valorTotal ??
        calcularTotal(detalles),
    ),
    detalles,
  };
}

function leerFacturasMock() {
  try {
    const contenido = localStorage.getItem(
      MOCK_STORAGE_KEY,
    );

    if (!contenido) {
      return [];
    }

    const facturas = JSON.parse(contenido);

    return Array.isArray(facturas)
      ? facturas.map(normalizarFactura)
      : [];
  } catch {
    localStorage.removeItem(MOCK_STORAGE_KEY);
    return [];
  }
}

function guardarFacturasMock(facturas) {
  localStorage.setItem(
    MOCK_STORAGE_KEY,
    JSON.stringify(facturas),
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

function construirPayload(factura) {
  const detalles = factura.detalles.map(
    (detalle) => ({
      idArticulo: Number(detalle.idArticulo),
      cantidad: Number(detalle.cantidad),
      precio: Number(detalle.precio),
      nombreArticulo:
        detalle.nombreArticulo ?? "",
    }),
  );

  return {
    numeroFactura: factura.numeroFactura.trim(),
    fecha: factura.fecha,
    cliente: {
      idCliente: Number(
        factura.cliente.idCliente,
      ),
    },
    ciudad: {
      idCiudad: Number(
        factura.ciudad.idCiudad,
      ),
    },
    valorTotal: calcularTotal(detalles),
    detalles,
  };
}

export function obtenerMensajeFacturaError(
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

export async function listarFacturas() {
  if (USE_MOCK_API) {
    await esperar();

    return leerFacturasMock().sort((a, b) => {
      return (
        new Date(b.fecha).getTime() -
        new Date(a.fecha).getTime()
      );
    });
  }

  try {
    const response = await apiClient.get(
      "/facturas",
    );

    const data = extraerData(response);

    return Array.isArray(data)
      ? data.map(normalizarFactura)
      : [];
  } catch (error) {
    if (error.response?.status === 404) {
      return [];
    }

    throw error;
  }
}

export async function crearFactura(factura) {
  const payload = construirPayload(factura);

  if (USE_MOCK_API) {
    await esperar();

    const facturas = leerFacturasMock();

    const numeroRepetido = facturas.some(
      (item) =>
        item.numeroFactura.toLowerCase() ===
        payload.numeroFactura.toLowerCase(),
    );

    if (numeroRepetido) {
      throw crearErrorMock(
        `Ya existe la factura "${payload.numeroFactura}".`,
        409,
      );
    }

    const siguienteIdFactura =
      facturas.reduce(
        (maximo, item) =>
          Math.max(
            maximo,
            Number(item.idFactura) || 0,
          ),
        0,
      ) + 1;

    const siguienteIdDetalle =
      facturas.reduce((maximo, facturaActual) => {
        const maximoFactura =
          facturaActual.detalles.reduce(
            (maximoDetalle, detalle) =>
              Math.max(
                maximoDetalle,
                Number(detalle.idFacturaDet) ||
                  0,
              ),
            0,
          );

        return Math.max(
          maximo,
          maximoFactura,
        );
      }, 0) + 1;

    const detallesConId =
      factura.detalles.map(
        (detalle, indice) => ({
          idFacturaDet:
            siguienteIdDetalle + indice,
          idArticulo: Number(
            detalle.idArticulo,
          ),
          nombreArticulo:
            detalle.nombreArticulo,
          cantidad: Number(detalle.cantidad),
          precio: Number(detalle.precio),
        }),
      );

    const nuevaFactura = {
      idFactura: siguienteIdFactura,
      numeroFactura: payload.numeroFactura,
      fecha: payload.fecha,
      cliente: factura.cliente,
      ciudad: factura.ciudad,
      valorTotal:
        calcularTotal(detallesConId),
      detalles: detallesConId,
    };

    guardarFacturasMock([
        ...facturas,
        nuevaFactura,
    ]);

    publicarFacturaEnColaMock(
        nuevaFactura,
    );

    return normalizarFactura(nuevaFactura);
  }

  const response = await apiClient.post(
    "/facturas",
    payload,
  );

  return normalizarFactura(
    extraerData(response),
  );
}

export async function actualizarDetalleFactura(
  idDetalle,
  detalle,
) {
  const payload = {
    cantidad: Number(detalle.cantidad),
    precio: Number(detalle.precio),
  };

  if (USE_MOCK_API) {
    await esperar();

    const facturas = leerFacturasMock();
    const idNumerico = Number(idDetalle);

    let encontrado = false;

    const facturasActualizadas =
      facturas.map((factura) => {
        const detallesActualizados =
          factura.detalles.map(
            (detalleActual) => {
              if (
                Number(
                  detalleActual.idFacturaDet,
                ) !== idNumerico
              ) {
                return detalleActual;
              }

              encontrado = true;

              return {
                ...detalleActual,
                cantidad: payload.cantidad,
                precio: payload.precio,
              };
            },
          );

        return {
          ...factura,
          detalles: detallesActualizados,
          valorTotal: calcularTotal(
            detallesActualizados,
          ),
        };
      });

    if (!encontrado) {
      throw crearErrorMock(
        "El detalle que intentas modificar no existe.",
        404,
      );
    }

    guardarFacturasMock(
      facturasActualizadas,
    );

    return;
  }

  await apiClient.put(
    `/facturas/detalle/${idDetalle}`,
    payload,
  );
}

export async function eliminarDetalleFactura(
  idDetalle,
) {
  if (USE_MOCK_API) {
    await esperar();

    const facturas = leerFacturasMock();
    const idNumerico = Number(idDetalle);

    let encontrado = false;

    const facturasActualizadas =
      facturas.map((factura) => {
        const detallesActualizados =
          factura.detalles.filter(
            (detalle) => {
              const conservar =
                Number(
                  detalle.idFacturaDet,
                ) !== idNumerico;

              if (!conservar) {
                encontrado = true;
              }

              return conservar;
            },
          );

        return {
          ...factura,
          detalles: detallesActualizados,
          valorTotal: calcularTotal(
            detallesActualizados,
          ),
        };
      });

    if (!encontrado) {
      throw crearErrorMock(
        "El detalle que intentas eliminar no existe.",
        404,
      );
    }

    guardarFacturasMock(
      facturasActualizadas,
    );

    return;
  }

  await apiClient.delete(
    `/facturas/detalle/${idDetalle}`,
  );
}

export async function eliminarFactura(idFactura) {
  if (USE_MOCK_API) {
    await esperar();

    const facturas = leerFacturasMock();
    const idNumerico = Number(idFactura);

    const existe = facturas.some(
      (factura) =>
        Number(factura.idFactura) ===
        idNumerico,
    );

    if (!existe) {
      throw crearErrorMock(
        "La factura que intentas eliminar no existe.",
        404,
      );
    }

    guardarFacturasMock(
      facturas.filter(
        (factura) =>
          Number(factura.idFactura) !==
          idNumerico,
      ),
    );

    return;
  }

  await apiClient.delete(
    `/facturas/${idFactura}`,
  );
}