import apiClient from "./apiClient";

const MOCK_STORAGE_KEY = "nexo_mock_ciudades";
const USE_MOCK_API =
  import.meta.env.VITE_USE_MOCK_API !== "false";

function esperar(milliseconds = 250) {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

function normalizarCiudad(ciudad) {
  return {
    idCiudad: Number(ciudad.idCiudad),
    nombre: ciudad.nombre ?? "",
  };
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

function leerCiudadesMock() {
  try {
    const storedValue = localStorage.getItem(MOCK_STORAGE_KEY);

    if (!storedValue) {
      return [];
    }

    const ciudades = JSON.parse(storedValue);

    return Array.isArray(ciudades)
      ? ciudades.map(normalizarCiudad)
      : [];
  } catch {
    localStorage.removeItem(MOCK_STORAGE_KEY);
    return [];
  }
}

function guardarCiudadesMock(ciudades) {
  localStorage.setItem(
    MOCK_STORAGE_KEY,
    JSON.stringify(ciudades),
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

export function obtenerMensajeCiudadError(
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

export async function listarCiudades() {
  if (USE_MOCK_API) {
    await esperar();

    return leerCiudadesMock().sort((a, b) =>
      a.nombre.localeCompare(b.nombre),
    );
  }

  const response = await apiClient.get("/ciudades");
  const data = extraerData(response);

  return Array.isArray(data)
    ? data.map(normalizarCiudad)
    : [];
}

export async function buscarCiudades(nombre) {
  const termino = nombre.trim();

  if (!termino) {
    return listarCiudades();
  }

  if (USE_MOCK_API) {
    await esperar();

    const terminoNormalizado = termino.toLowerCase();

    return leerCiudadesMock().filter((ciudad) =>
      ciudad.nombre.toLowerCase().includes(terminoNormalizado),
    );
  }

  try {
    const response = await apiClient.get("/ciudades", {
      params: {
        nombre: termino,
      },
    });

    const data = extraerData(response);

    return Array.isArray(data)
      ? data.map(normalizarCiudad)
      : [];
  } catch (error) {
    if (error.response?.status === 404) {
      return [];
    }

    throw error;
  }
}

export async function crearCiudad(ciudad) {
  const payload = {
    nombre: ciudad.nombre.trim(),
  };

  if (USE_MOCK_API) {
    await esperar();

    const ciudades = leerCiudadesMock();

    const nombreRepetido = ciudades.some(
      (item) =>
        item.nombre.toLowerCase() ===
        payload.nombre.toLowerCase(),
    );

    if (nombreRepetido) {
      throw crearErrorMock(
        `Ya existe una ciudad llamada "${payload.nombre}".`,
        409,
      );
    }

    const siguienteId =
      ciudades.reduce(
        (maximo, item) =>
          Math.max(maximo, Number(item.idCiudad) || 0),
        0,
      ) + 1;

    const nuevaCiudad = {
      idCiudad: siguienteId,
      ...payload,
    };

    guardarCiudadesMock([...ciudades, nuevaCiudad]);

    return nuevaCiudad;
  }

  const response = await apiClient.post(
    "/ciudades",
    payload,
  );

  return normalizarCiudad(extraerData(response));
}

export async function actualizarCiudad(idCiudad, ciudad) {
  const payload = {
    nombre: ciudad.nombre.trim(),
  };

  if (USE_MOCK_API) {
    await esperar();

    const ciudades = leerCiudadesMock();
    const idNumerico = Number(idCiudad);

    const indice = ciudades.findIndex(
      (item) => Number(item.idCiudad) === idNumerico,
    );

    if (indice === -1) {
      throw crearErrorMock(
        "La ciudad que intentas modificar no existe.",
        404,
      );
    }

    const nombreRepetido = ciudades.some(
      (item) =>
        item.nombre.toLowerCase() ===
          payload.nombre.toLowerCase() &&
        Number(item.idCiudad) !== idNumerico,
    );

    if (nombreRepetido) {
      throw crearErrorMock(
        `Ya existe otra ciudad llamada "${payload.nombre}".`,
        409,
      );
    }

    const ciudadActualizada = {
      idCiudad: idNumerico,
      ...payload,
    };

    const nuevaLista = [...ciudades];
    nuevaLista[indice] = ciudadActualizada;

    guardarCiudadesMock(nuevaLista);

    return ciudadActualizada;
  }

  const response = await apiClient.put(
    `/ciudades/${idCiudad}`,
    payload,
  );

  return normalizarCiudad(extraerData(response));
}

export async function eliminarCiudad(idCiudad) {
  if (USE_MOCK_API) {
    await esperar();

    const ciudades = leerCiudadesMock();
    const idNumerico = Number(idCiudad);

    const ciudadExiste = ciudades.some(
      (item) => Number(item.idCiudad) === idNumerico,
    );

    if (!ciudadExiste) {
      throw crearErrorMock(
        "La ciudad que intentas eliminar no existe.",
        404,
      );
    }

    guardarCiudadesMock(
      ciudades.filter(
        (item) => Number(item.idCiudad) !== idNumerico,
      ),
    );

    return;
  }

  await apiClient.delete(`/ciudades/${idCiudad}`);
}