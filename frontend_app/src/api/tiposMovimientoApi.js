import apiClient from "./apiClient";

const MOCK_STORAGE_KEY = "nexo_mock_tipos_movimiento";

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

function normalizarTipoMovimiento(tipoMovimiento) {
  return {
    idTipoMovimiento: Number(
      tipoMovimiento.idTipoMovimiento,
    ),
    nombre: tipoMovimiento.nombre ?? "",
    tipo: String(tipoMovimiento.tipo ?? "")
      .trim()
      .toUpperCase(),
  };
}

function leerTiposMock() {
  try {
    const contenido = localStorage.getItem(
      MOCK_STORAGE_KEY,
    );

    if (!contenido) {
      return [];
    }

    const tipos = JSON.parse(contenido);

    return Array.isArray(tipos)
      ? tipos.map(normalizarTipoMovimiento)
      : [];
  } catch {
    localStorage.removeItem(MOCK_STORAGE_KEY);
    return [];
  }
}

function guardarTiposMock(tipos) {
  localStorage.setItem(
    MOCK_STORAGE_KEY,
    JSON.stringify(tipos),
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

export function obtenerMensajeTipoMovimientoError(
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

export async function listarTiposMovimiento() {
  if (USE_MOCK_API) {
    await esperar();

    return leerTiposMock().sort(
      (a, b) =>
        Number(a.idTipoMovimiento) -
        Number(b.idTipoMovimiento),
    );
  }

  try {
    const response = await apiClient.get(
      "/tipos-movimiento",
    );

    const data = extraerData(response);

    return Array.isArray(data)
      ? data.map(normalizarTipoMovimiento)
      : [];
  } catch (error) {
    if (error.response?.status === 404) {
      return [];
    }

    throw error;
  }
}

export async function buscarTiposMovimiento(nombre) {
  const termino = nombre.trim();

  if (!termino) {
    return listarTiposMovimiento();
  }

  if (USE_MOCK_API) {
    await esperar();

    const terminoNormalizado = termino.toLowerCase();

    return leerTiposMock().filter((item) =>
      item.nombre
        .toLowerCase()
        .includes(terminoNormalizado),
    );
  }

  try {
    const response = await apiClient.get(
      "/tipos-movimiento",
      {
        params: {
          nombre: termino,
        },
      },
    );

    const data = extraerData(response);

    return Array.isArray(data)
      ? data.map(normalizarTipoMovimiento)
      : [];
  } catch (error) {
    if (error.response?.status === 404) {
      return [];
    }

    throw error;
  }
}

export async function crearTipoMovimiento(
  tipoMovimiento,
) {
  const payload = {
    nombre: tipoMovimiento.nombre.trim(),
    tipo: tipoMovimiento.tipo
      .trim()
      .toUpperCase(),
  };

  if (USE_MOCK_API) {
    await esperar();

    const tipos = leerTiposMock();

    const registroRepetido = tipos.some(
      (item) =>
        item.nombre.toLowerCase() ===
          payload.nombre.toLowerCase() &&
        item.tipo === payload.tipo,
    );

    if (registroRepetido) {
      throw crearErrorMock(
        `Ya existe el tipo de movimiento "${payload.nombre}".`,
        409,
      );
    }

    const siguienteId =
      tipos.reduce(
        (maximo, item) =>
          Math.max(
            maximo,
            Number(item.idTipoMovimiento) || 0,
          ),
        0,
      ) + 1;

    const nuevoTipo = {
      idTipoMovimiento: siguienteId,
      ...payload,
    };

    guardarTiposMock([
      ...tipos,
      nuevoTipo,
    ]);

    return nuevoTipo;
  }

  const response = await apiClient.post(
    "/tipos-movimiento",
    payload,
  );

  return normalizarTipoMovimiento(
    extraerData(response),
  );
}

export async function actualizarTipoMovimiento(
  idTipoMovimiento,
  tipoMovimiento,
) {
  const payload = {
    nombre: tipoMovimiento.nombre.trim(),
    tipo: tipoMovimiento.tipo
      .trim()
      .toUpperCase(),
  };

  if (USE_MOCK_API) {
    await esperar();

    const tipos = leerTiposMock();
    const idNumerico = Number(idTipoMovimiento);

    const indice = tipos.findIndex(
      (item) =>
        Number(item.idTipoMovimiento) ===
        idNumerico,
    );

    if (indice === -1) {
      throw crearErrorMock(
        "El tipo de movimiento no existe.",
        404,
      );
    }

    const registroRepetido = tipos.some(
      (item) =>
        item.nombre.toLowerCase() ===
          payload.nombre.toLowerCase() &&
        item.tipo === payload.tipo &&
        Number(item.idTipoMovimiento) !==
          idNumerico,
    );

    if (registroRepetido) {
      throw crearErrorMock(
        `Ya existe otro tipo de movimiento llamado "${payload.nombre}".`,
        409,
      );
    }

    const tipoActualizado = {
      idTipoMovimiento: idNumerico,
      ...payload,
    };

    const nuevaLista = [...tipos];
    nuevaLista[indice] = tipoActualizado;

    guardarTiposMock(nuevaLista);

    return tipoActualizado;
  }

  const response = await apiClient.put(
    `/tipos-movimiento/${idTipoMovimiento}`,
    payload,
  );

  return normalizarTipoMovimiento(
    extraerData(response),
  );
}

export async function eliminarTipoMovimiento(
  idTipoMovimiento,
) {
  if (USE_MOCK_API) {
    await esperar();

    const tipos = leerTiposMock();
    const idNumerico = Number(idTipoMovimiento);

    const existe = tipos.some(
      (item) =>
        Number(item.idTipoMovimiento) ===
        idNumerico,
    );

    if (!existe) {
      throw crearErrorMock(
        "El tipo de movimiento no existe.",
        404,
      );
    }

    guardarTiposMock(
      tipos.filter(
        (item) =>
          Number(item.idTipoMovimiento) !==
          idNumerico,
      ),
    );

    return;
  }

  await apiClient.delete(
    `/tipos-movimiento/${idTipoMovimiento}`,
  );
}