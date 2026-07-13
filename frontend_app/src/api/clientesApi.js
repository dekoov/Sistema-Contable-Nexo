import apiClient from "./apiClient";

const MOCK_STORAGE_KEY = "nexo_mock_clientes";
const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API === "true";

function esperar(milliseconds = 250) {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

function normalizarCliente(cliente) {
  return {
    idCliente: Number(cliente.idCliente),
    cedula: cliente.cedula ?? "",
    nombre: cliente.nombre ?? "",
    direccion: cliente.direccion ?? "",
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

function leerClientesMock() {
  try {
    const storedValue = localStorage.getItem(MOCK_STORAGE_KEY);

    if (!storedValue) {
      return [];
    }

    const clientes = JSON.parse(storedValue);

    return Array.isArray(clientes)
      ? clientes.map(normalizarCliente)
      : [];
  } catch {
    localStorage.removeItem(MOCK_STORAGE_KEY);
    return [];
  }
}

function guardarClientesMock(clientes) {
  localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(clientes));
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

export function obtenerMensajeApiError(
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

export async function listarClientes() {
  if (USE_MOCK_API) {
    await esperar();
    return leerClientesMock();
  }

  const response = await apiClient.get("/clientes");
  const data = extraerData(response);

  return Array.isArray(data)
    ? data.map(normalizarCliente)
    : [];
}

export async function buscarClientes(valor) {
  const termino = valor.trim();

  if (!termino) {
    return listarClientes();
  }

  if (USE_MOCK_API) {
    await esperar();

    const terminoNormalizado = termino.toLowerCase();

    return leerClientesMock().filter((cliente) => {
      return (
        cliente.cedula.toLowerCase().includes(terminoNormalizado) ||
        cliente.nombre.toLowerCase().includes(terminoNormalizado) ||
        cliente.direccion.toLowerCase().includes(terminoNormalizado)
      );
    });
  }

  try {
    const response = await apiClient.get("/clientes/buscar", {
      params: {
        valor: termino,
      },
    });

    const data = extraerData(response);

    return Array.isArray(data)
      ? data.map(normalizarCliente)
      : [];
  } catch (error) {
    // El backend devuelve 404 cuando una búsqueda no encuentra resultados.
    if (error.response?.status === 404) {
      return [];
    }

    throw error;
  }
}

export async function crearCliente(cliente) {
  const payload = {
    cedula: cliente.cedula.trim(),
    nombre: cliente.nombre.trim(),
    direccion: cliente.direccion.trim(),
  };

  if (USE_MOCK_API) {
    await esperar();

    const clientes = leerClientesMock();

    const cedulaRepetida = clientes.some(
      (item) => item.cedula === payload.cedula,
    );

    if (cedulaRepetida) {
      throw crearErrorMock(
        `Ya existe un cliente con la cédula ${payload.cedula}.`,
        409,
      );
    }

    const siguienteId =
      clientes.reduce(
        (maximo, item) => Math.max(maximo, Number(item.idCliente) || 0),
        0,
      ) + 1;

    const nuevoCliente = {
      idCliente: siguienteId,
      ...payload,
    };

    guardarClientesMock([...clientes, nuevoCliente]);

    return nuevoCliente;
  }

  const response = await apiClient.post("/clientes", payload);

  return normalizarCliente(extraerData(response));
}

export async function actualizarCliente(idCliente, cliente) {
  const payload = {
    cedula: cliente.cedula.trim(),
    nombre: cliente.nombre.trim(),
    direccion: cliente.direccion.trim(),
  };

  if (USE_MOCK_API) {
    await esperar();

    const clientes = leerClientesMock();
    const idNumerico = Number(idCliente);

    const indice = clientes.findIndex(
      (item) => Number(item.idCliente) === idNumerico,
    );

    if (indice === -1) {
      throw crearErrorMock("El cliente que intentas modificar no existe.", 404);
    }

    const cedulaRepetida = clientes.some(
      (item) =>
        item.cedula === payload.cedula &&
        Number(item.idCliente) !== idNumerico,
    );

    if (cedulaRepetida) {
      throw crearErrorMock(
        `Ya existe otro cliente con la cédula ${payload.cedula}.`,
        409,
      );
    }

    const clienteActualizado = {
      idCliente: idNumerico,
      ...payload,
    };

    const nuevaLista = [...clientes];
    nuevaLista[indice] = clienteActualizado;

    guardarClientesMock(nuevaLista);

    return clienteActualizado;
  }

  const response = await apiClient.put(
    `/clientes/${idCliente}`,
    payload,
  );

  return normalizarCliente(extraerData(response));
}

export async function eliminarCliente(idCliente) {
  if (USE_MOCK_API) {
    await esperar();

    const clientes = leerClientesMock();
    const idNumerico = Number(idCliente);

    const clienteExiste = clientes.some(
      (item) => Number(item.idCliente) === idNumerico,
    );

    if (!clienteExiste) {
      throw crearErrorMock("El cliente que intentas eliminar no existe.", 404);
    }

    guardarClientesMock(
      clientes.filter(
        (item) => Number(item.idCliente) !== idNumerico,
      ),
    );

    return;
  }

  await apiClient.delete(`/clientes/${idCliente}`);
}