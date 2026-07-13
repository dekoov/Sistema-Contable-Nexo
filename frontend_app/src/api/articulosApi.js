import apiClient from "./apiClient";

const MOCK_STORAGE_KEY = "nexo_mock_articulos";
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

function normalizarArticulo(articulo) {
  return {
    idArticulo: Number(articulo.idArticulo),
    nombre: articulo.nombre ?? "",
    precio: Number(articulo.precio ?? 0),
    fechaCreacion: articulo.fechaCreacion ?? null,
  };
}

function leerArticulosMock() {
  try {
    const contenido = localStorage.getItem(MOCK_STORAGE_KEY);

    if (!contenido) {
      return [];
    }

    const articulos = JSON.parse(contenido);

    return Array.isArray(articulos)
      ? articulos.map(normalizarArticulo)
      : [];
  } catch {
    localStorage.removeItem(MOCK_STORAGE_KEY);
    return [];
  }
}

function guardarArticulosMock(articulos) {
  localStorage.setItem(
    MOCK_STORAGE_KEY,
    JSON.stringify(articulos),
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

export function obtenerMensajeArticuloError(
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

export async function listarArticulos() {
  if (USE_MOCK_API) {
    await esperar();

    return leerArticulosMock().sort(
      (a, b) => a.idArticulo - b.idArticulo,
    );
  }

  try {
    const response = await apiClient.get("/articulos");
    const data = extraerData(response);

    return Array.isArray(data)
      ? data.map(normalizarArticulo)
      : [];
  } catch (error) {
    if (error.response?.status === 404) {
      return [];
    }

    throw error;
  }
}

export async function buscarArticulos(nombre) {
  const termino = nombre.trim();

  if (!termino) {
    return listarArticulos();
  }

  if (USE_MOCK_API) {
    await esperar();

    const terminoNormalizado = termino.toLowerCase();

    return leerArticulosMock().filter((articulo) =>
      articulo.nombre
        .toLowerCase()
        .includes(terminoNormalizado),
    );
  }

  try {
    const response = await apiClient.get("/articulos", {
      params: {
        nombre: termino,
      },
    });

    const data = extraerData(response);

    return Array.isArray(data)
      ? data.map(normalizarArticulo)
      : [];
  } catch (error) {
    if (error.response?.status === 404) {
      return [];
    }

    throw error;
  }
}

export async function crearArticulo(articulo) {
  const payload = {
    nombre: articulo.nombre.trim(),
    precio: Number(articulo.precio),
    fechaCreacion: new Date().toISOString(),
  };

  if (USE_MOCK_API) {
    await esperar();

    const articulos = leerArticulosMock();

    const nombreRepetido = articulos.some(
      (item) =>
        item.nombre.toLowerCase() ===
        payload.nombre.toLowerCase(),
    );

    if (nombreRepetido) {
      throw crearErrorMock(
        `Ya existe un artículo llamado "${payload.nombre}".`,
        409,
      );
    }

    const siguienteId =
      articulos.reduce(
        (maximo, item) =>
          Math.max(maximo, Number(item.idArticulo) || 0),
        0,
      ) + 1;

    const nuevoArticulo = {
      idArticulo: siguienteId,
      ...payload,
    };

    guardarArticulosMock([
      ...articulos,
      nuevoArticulo,
    ]);

    return nuevoArticulo;
  }

  const response = await apiClient.post(
    "/articulos",
    payload,
  );

  return normalizarArticulo(extraerData(response));
}

export async function actualizarArticulo(
  idArticulo,
  articulo,
) {
  const payload = {
    nombre: articulo.nombre.trim(),
    precio: Number(articulo.precio),
  };

  if (USE_MOCK_API) {
    await esperar();

    const articulos = leerArticulosMock();
    const idNumerico = Number(idArticulo);

    const indice = articulos.findIndex(
      (item) =>
        Number(item.idArticulo) === idNumerico,
    );

    if (indice === -1) {
      throw crearErrorMock(
        "El artículo que intentas modificar no existe.",
        404,
      );
    }

    const nombreRepetido = articulos.some(
      (item) =>
        item.nombre.toLowerCase() ===
          payload.nombre.toLowerCase() &&
        Number(item.idArticulo) !== idNumerico,
    );

    if (nombreRepetido) {
      throw crearErrorMock(
        `Ya existe otro artículo llamado "${payload.nombre}".`,
        409,
      );
    }

    const articuloActualizado = {
      ...articulos[indice],
      ...payload,
      idArticulo: idNumerico,
    };

    const nuevaLista = [...articulos];
    nuevaLista[indice] = articuloActualizado;

    guardarArticulosMock(nuevaLista);

    return articuloActualizado;
  }

  const response = await apiClient.put(
    `/articulos/${idArticulo}`,
    payload,
  );

  return normalizarArticulo(extraerData(response));
}

export async function eliminarArticulo(idArticulo) {
  if (USE_MOCK_API) {
    await esperar();

    const articulos = leerArticulosMock();
    const idNumerico = Number(idArticulo);

    const existe = articulos.some(
      (item) =>
        Number(item.idArticulo) === idNumerico,
    );

    if (!existe) {
      throw crearErrorMock(
        "El artículo que intentas eliminar no existe.",
        404,
      );
    }

    guardarArticulosMock(
      articulos.filter(
        (item) =>
          Number(item.idArticulo) !== idNumerico,
      ),
    );

    return;
  }

  await apiClient.delete(
    `/articulos/${idArticulo}`,
  );
}