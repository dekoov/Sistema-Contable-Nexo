import apiClient from "./apiClient";

const MOCK_STORAGE_KEY = "nexo_mock_cobradores";

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

function normalizarCobrador(cobrador) {
  return {
    idCobrador: Number(cobrador.idCobrador),
    cedula: cobrador.cedula ?? "",
    nombre: cobrador.nombre ?? "",
    direccion: cobrador.direccion ?? "",
  };
}

function leerCobradoresMock() {
  try {
    const contenido = localStorage.getItem(
      MOCK_STORAGE_KEY,
    );

    if (!contenido) {
      return [];
    }

    const cobradores = JSON.parse(contenido);

    return Array.isArray(cobradores)
      ? cobradores.map(normalizarCobrador)
      : [];
  } catch {
    localStorage.removeItem(MOCK_STORAGE_KEY);
    return [];
  }
}

function guardarCobradoresMock(cobradores) {
  localStorage.setItem(
    MOCK_STORAGE_KEY,
    JSON.stringify(cobradores),
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

export function obtenerMensajeCobradorError(
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

export async function listarCobradores() {
  if (USE_MOCK_API) {
    await esperar();

    return leerCobradoresMock().sort((a, b) =>
      a.nombre.localeCompare(b.nombre),
    );
  }

  const response = await apiClient.get(
    "/cobradores",
  );

  const data = extraerData(response);

  return Array.isArray(data)
    ? data.map(normalizarCobrador)
    : [];
}

export async function buscarCobradores(valor) {
  const termino = valor.trim().toLowerCase();

  if (!termino) {
    return listarCobradores();
  }

  /*
   * El backend todavía no tiene un endpoint específico
   * de búsqueda para cobradores. Por eso obtenemos la lista
   * y filtramos en el frontend.
   */
  const cobradores = await listarCobradores();

  return cobradores.filter((cobrador) => {
    return (
      cobrador.cedula
        .toLowerCase()
        .includes(termino) ||
      cobrador.nombre
        .toLowerCase()
        .includes(termino) ||
      cobrador.direccion
        .toLowerCase()
        .includes(termino)
    );
  });
}

export async function crearCobrador(cobrador) {
  const payload = {
    cedula: cobrador.cedula.trim(),
    nombre: cobrador.nombre.trim(),
    direccion: cobrador.direccion.trim(),
  };

  if (USE_MOCK_API) {
    await esperar();

    const cobradores = leerCobradoresMock();

    const cedulaRepetida = cobradores.some(
      (item) => item.cedula === payload.cedula,
    );

    if (cedulaRepetida) {
      throw crearErrorMock(
        `Ya existe un cobrador con la cédula ${payload.cedula}.`,
        409,
      );
    }

    const siguienteId =
      cobradores.reduce(
        (maximo, item) =>
          Math.max(
            maximo,
            Number(item.idCobrador) || 0,
          ),
        0,
      ) + 1;

    const nuevoCobrador = {
      idCobrador: siguienteId,
      ...payload,
    };

    guardarCobradoresMock([
      ...cobradores,
      nuevoCobrador,
    ]);

    return nuevoCobrador;
  }

  const response = await apiClient.post(
    "/cobradores",
    payload,
  );

  return normalizarCobrador(
    extraerData(response),
  );
}

export async function actualizarCobrador(
  idCobrador,
  cobrador,
) {
  const payload = {
    cedula: cobrador.cedula.trim(),
    nombre: cobrador.nombre.trim(),
    direccion: cobrador.direccion.trim(),
  };

  if (USE_MOCK_API) {
    await esperar();

    const cobradores = leerCobradoresMock();
    const idNumerico = Number(idCobrador);

    const indice = cobradores.findIndex(
      (item) =>
        Number(item.idCobrador) === idNumerico,
    );

    if (indice === -1) {
      throw crearErrorMock(
        "El cobrador que intentas modificar no existe.",
        404,
      );
    }

    const cedulaRepetida = cobradores.some(
      (item) =>
        item.cedula === payload.cedula &&
        Number(item.idCobrador) !== idNumerico,
    );

    if (cedulaRepetida) {
      throw crearErrorMock(
        `Ya existe otro cobrador con la cédula ${payload.cedula}.`,
        409,
      );
    }

    const cobradorActualizado = {
      idCobrador: idNumerico,
      ...payload,
    };

    const nuevaLista = [...cobradores];
    nuevaLista[indice] = cobradorActualizado;

    guardarCobradoresMock(nuevaLista);

    return cobradorActualizado;
  }

  const response = await apiClient.put(
    `/cobradores/${idCobrador}`,
    payload,
  );

  return normalizarCobrador(
    extraerData(response),
  );
}

export async function eliminarCobrador(
  idCobrador,
) {
  if (USE_MOCK_API) {
    await esperar();

    const cobradores = leerCobradoresMock();
    const idNumerico = Number(idCobrador);

    const existe = cobradores.some(
      (item) =>
        Number(item.idCobrador) === idNumerico,
    );

    if (!existe) {
      throw crearErrorMock(
        "El cobrador que intentas eliminar no existe.",
        404,
      );
    }

    guardarCobradoresMock(
      cobradores.filter(
        (item) =>
          Number(item.idCobrador) !== idNumerico,
      ),
    );

    return;
  }

  await apiClient.delete(
    `/cobradores/${idCobrador}`,
  );
}