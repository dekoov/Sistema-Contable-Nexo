import apiClient from "./apiClient";

const MOCK_STORAGE_KEY = "nexo_mock_formas_pago";

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

function normalizarFormaPago(formaPago) {
  return {
    codigo: Number(formaPago.codigo),
    nombre: formaPago.nombre ?? "",
  };
}

function leerFormasPagoMock() {
  try {
    const contenido = localStorage.getItem(
      MOCK_STORAGE_KEY,
    );

    if (!contenido) {
      return [];
    }

    const formasPago = JSON.parse(contenido);

    return Array.isArray(formasPago)
      ? formasPago.map(normalizarFormaPago)
      : [];
  } catch {
    localStorage.removeItem(MOCK_STORAGE_KEY);
    return [];
  }
}

function guardarFormasPagoMock(formasPago) {
  localStorage.setItem(
    MOCK_STORAGE_KEY,
    JSON.stringify(formasPago),
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

export function obtenerMensajeFormaPagoError(
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

export async function listarFormasPago() {
  if (USE_MOCK_API) {
    await esperar();

    return leerFormasPagoMock().sort(
      (a, b) => Number(a.codigo) - Number(b.codigo),
    );
  }

  const response = await apiClient.get(
    "/formas-pago",
  );

  const data = extraerData(response);

  return Array.isArray(data)
    ? data.map(normalizarFormaPago)
    : [];
}

export async function buscarFormasPago(valor) {
  const termino = valor.trim().toLowerCase();

  if (!termino) {
    return listarFormasPago();
  }

  /*
   * El backend no posee por ahora un endpoint
   * específico para buscar formas de pago.
   * Se obtiene la lista y se filtra en el frontend.
   */
  const formasPago = await listarFormasPago();

  return formasPago.filter((formaPago) => {
    return (
      String(formaPago.codigo).includes(termino) ||
      formaPago.nombre
        .toLowerCase()
        .includes(termino)
    );
  });
}

export async function crearFormaPago(formaPago) {
  const payload = {
    nombre: formaPago.nombre.trim(),
  };

  if (USE_MOCK_API) {
    await esperar();

    const formasPago = leerFormasPagoMock();

    const nombreRepetido = formasPago.some(
      (item) =>
        item.nombre.toLowerCase() ===
        payload.nombre.toLowerCase(),
    );

    if (nombreRepetido) {
      throw crearErrorMock(
        `Ya existe una forma de pago llamada "${payload.nombre}".`,
        409,
      );
    }

    const siguienteCodigo =
      formasPago.reduce(
        (maximo, item) =>
          Math.max(
            maximo,
            Number(item.codigo) || 0,
          ),
        0,
      ) + 1;

    const nuevaFormaPago = {
      codigo: siguienteCodigo,
      ...payload,
    };

    guardarFormasPagoMock([
      ...formasPago,
      nuevaFormaPago,
    ]);

    return nuevaFormaPago;
  }

  const response = await apiClient.post(
    "/formas-pago",
    payload,
  );

  return normalizarFormaPago(
    extraerData(response),
  );
}

export async function actualizarFormaPago(
  codigo,
  formaPago,
) {
  const payload = {
    nombre: formaPago.nombre.trim(),
  };

  if (USE_MOCK_API) {
    await esperar();

    const formasPago = leerFormasPagoMock();
    const codigoNumerico = Number(codigo);

    const indice = formasPago.findIndex(
      (item) =>
        Number(item.codigo) === codigoNumerico,
    );

    if (indice === -1) {
      throw crearErrorMock(
        "La forma de pago que intentas modificar no existe.",
        404,
      );
    }

    const nombreRepetido = formasPago.some(
      (item) =>
        item.nombre.toLowerCase() ===
          payload.nombre.toLowerCase() &&
        Number(item.codigo) !== codigoNumerico,
    );

    if (nombreRepetido) {
      throw crearErrorMock(
        `Ya existe otra forma de pago llamada "${payload.nombre}".`,
        409,
      );
    }

    const formaPagoActualizada = {
      codigo: codigoNumerico,
      ...payload,
    };

    const nuevaLista = [...formasPago];
    nuevaLista[indice] = formaPagoActualizada;

    guardarFormasPagoMock(nuevaLista);

    return formaPagoActualizada;
  }

  const response = await apiClient.put(
    `/formas-pago/${codigo}`,
    payload,
  );

  return normalizarFormaPago(
    extraerData(response),
  );
}

export async function eliminarFormaPago(codigo) {
  if (USE_MOCK_API) {
    await esperar();

    const formasPago = leerFormasPagoMock();
    const codigoNumerico = Number(codigo);

    const existe = formasPago.some(
      (item) =>
        Number(item.codigo) === codigoNumerico,
    );

    if (!existe) {
      throw crearErrorMock(
        "La forma de pago que intentas eliminar no existe.",
        404,
      );
    }

    guardarFormasPagoMock(
      formasPago.filter(
        (item) =>
          Number(item.codigo) !== codigoNumerico,
      ),
    );

    return;
  }

  await apiClient.delete(
    `/formas-pago/${codigo}`,
  );
}