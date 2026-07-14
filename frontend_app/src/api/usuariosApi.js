import apiClient from "./apiClient";

const MOCK_STORAGE_KEY = "nexo_mock_usuarios";

const USE_MOCK_API =
  import.meta.env.VITE_USE_MOCK_API === "true";

function esperar(milliseconds = 250) {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

function obtenerFechaActual() {
  return new Date().toISOString().slice(0, 10);
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

function normalizarRol(rol) {
  const valor = String(rol ?? "")
    .trim()
    .toUpperCase();

  /*
   * El sistema legado utilizaba "USUARIO",
   * mientras que el contrato REST utiliza "USER".
   */
  if (valor === "USUARIO") {
    return "USER";
  }

  return valor || "USER";
}

function normalizarUsuario(usuario) {
  return {
    idUsuario: Number(
      usuario.idUsuario ?? usuario.id,
    ),

    username:
      usuario.username ??
      usuario.email ??
      "",
    
    email: usuario.email ?? usuario.username ?? "",
    nombre: usuario.nombre ?? "",

    rol: normalizarRol(
      usuario.rol ?? usuario.role,
    ),

    fechaCreacion: usuario.fechaCreacion
      ? String(usuario.fechaCreacion).slice(0, 10)
      : obtenerFechaActual(),
  };
}

function obtenerUsuarioSesion() {
  try {
    const contenido = sessionStorage.getItem(
      "currentUser",
    );

    if (!contenido) {
      return null;
    }

    return normalizarUsuario(
      JSON.parse(contenido),
    );
  } catch {
    return null;
  }
}

function obtenerUsuariosIniciales() {
  const usuarioSesion =
    obtenerUsuarioSesion();

  if (usuarioSesion?.username) {
    return [
      {
        idUsuario:
          usuarioSesion.idUsuario || 1,

        username:
          usuarioSesion.username,

        rol: usuarioSesion.rol || "ADMIN",

        fechaCreacion:
          usuarioSesion.fechaCreacion ||
          obtenerFechaActual(),
      },
    ];
  }

  return [
    {
      idUsuario: 1,
      username: "admin@demo.local",
      rol: "ADMIN",
      fechaCreacion: obtenerFechaActual(),
    },
  ];
}

function leerUsuariosMock() {
  try {
    const contenido = localStorage.getItem(
      MOCK_STORAGE_KEY,
    );

    if (!contenido) {
      const iniciales =
        obtenerUsuariosIniciales();

      guardarUsuariosMock(iniciales);

      return iniciales;
    }

    const usuarios = JSON.parse(contenido);

    if (!Array.isArray(usuarios)) {
      return [];
    }

    return usuarios.map(normalizarUsuario);
  } catch {
    localStorage.removeItem(MOCK_STORAGE_KEY);

    const iniciales =
      obtenerUsuariosIniciales();

    guardarUsuariosMock(iniciales);

    return iniciales;
  }
}

function guardarUsuariosMock(usuarios) {
  localStorage.setItem(
    MOCK_STORAGE_KEY,
    JSON.stringify(usuarios),
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

function contarAdministradores(
  usuarios,
  idExcluir = null,
) {
  return usuarios.filter((usuario) => {
    const esAdministrador =
      normalizarRol(usuario.rol) === "ADMIN";

    const estaExcluido =
      idExcluir !== null &&
      Number(usuario.idUsuario) ===
        Number(idExcluir);

    return esAdministrador && !estaExcluido;
  }).length;
}

export function obtenerMensajeUsuarioError(
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

export async function listarUsuarios() {
  if (USE_MOCK_API) {
    await esperar();

    return leerUsuariosMock().sort((a, b) =>
      a.username.localeCompare(b.username),
    );
  }

  try {
    const response = await apiClient.get(
      "/usuarios",
    );

    const data = extraerData(response);

    return Array.isArray(data)
      ? data.map(normalizarUsuario)
      : [];
  } catch (error) {
    if (error.response?.status === 404) {
      return [];
    }

    throw error;
  }
}

export async function buscarUsuarios(valor) {
  const termino = valor
    .trim()
    .toLowerCase();

  const usuarios = await listarUsuarios();

  if (!termino) {
    return usuarios;
  }

  return usuarios.filter((usuario) => {
    return (
      usuario.username
        .toLowerCase()
        .includes(termino) ||
      usuario.rol
        .toLowerCase()
        .includes(termino) ||
      String(usuario.idUsuario).includes(
        termino,
      )
    );
  });
}

export async function crearUsuario(usuario) {
  const payload = {
    email: (usuario.email ?? "").trim(),
    nombre: (usuario.nombre ?? "").trim(),
    rol: normalizarRol(usuario.rol),
  };

  if (USE_MOCK_API) {
    await esperar();

    const usuarios = leerUsuariosMock();

    const emailRepetido = usuarios.some(
      (item) =>
        item.username.toLowerCase() ===
        payload.email.toLowerCase(),
    );

    if (emailRepetido) {
      throw crearErrorMock(
        `Ya existe un usuario con el email "${payload.email}".`,
        409,
      );
    }

    const siguienteId =
      usuarios.reduce(
        (maximo, item) =>
          Math.max(
            maximo,
            Number(item.idUsuario) || 0,
          ),
        0,
      ) + 1;

    const nuevoUsuario = {
      idUsuario: siguienteId,
      username: payload.email,
      nombre: payload.nombre,
      rol: payload.rol,
      fechaCreacion: obtenerFechaActual(),
    };

    guardarUsuariosMock([
      ...usuarios,
      nuevoUsuario,
    ]);

    return nuevoUsuario;
  }

  const response = await apiClient.post(
    "/usuarios",
    payload,
  );

  return normalizarUsuario(
    extraerData(response),
  );
}

export async function actualizarUsuario(
  idUsuario,
  usuario,
) {
  const payload = {
    email: (usuario.email ?? "").trim(),
    nombre: (usuario.nombre ?? "").trim(),
    rol: normalizarRol(usuario.rol),
  };

  if (USE_MOCK_API) {
    await esperar();

    const usuarios = leerUsuariosMock();
    const idNumerico = Number(idUsuario);

    const indice = usuarios.findIndex(
      (item) =>
        Number(item.idUsuario) ===
        idNumerico,
    );

    if (indice === -1) {
      throw crearErrorMock(
        "El usuario que intentas modificar no existe.",
        404,
      );
    }

    const emailRepetido = usuarios.some(
      (item) =>
        item.username.toLowerCase() ===
          payload.email.toLowerCase() &&
        Number(item.idUsuario) !==
          idNumerico,
    );

    if (emailRepetido) {
      throw crearErrorMock(
        `Ya existe otro usuario con el email "${payload.email}".`,
        409,
      );
    }

    const usuarioActual = usuarios[indice];

    const eliminaUltimoAdmin =
      usuarioActual.rol === "ADMIN" &&
      payload.rol !== "ADMIN" &&
      contarAdministradores(
        usuarios,
        idNumerico,
      ) === 0;

    if (eliminaUltimoAdmin) {
      throw crearErrorMock(
        "No se puede cambiar el rol del último administrador.",
        409,
      );
    }

    const usuarioActualizado = {
      ...usuarioActual,
      username: payload.email,
      nombre: payload.nombre,
      rol: payload.rol,
    };

    const nuevaLista = [...usuarios];
    nuevaLista[indice] =
      usuarioActualizado;

    guardarUsuariosMock(nuevaLista);

    return normalizarUsuario(
      usuarioActualizado,
    );
  }

  const response = await apiClient.put(
    `/usuarios/${idUsuario}`,
    payload,
  );

  return normalizarUsuario(
    extraerData(response),
  );
}

export async function eliminarUsuario(idUsuario) {
  if (USE_MOCK_API) {
    await esperar();

    const usuarios = leerUsuariosMock();
    const idNumerico = Number(idUsuario);

    const usuario = usuarios.find(
      (item) =>
        Number(item.idUsuario) ===
        idNumerico,
    );

    if (!usuario) {
      throw crearErrorMock(
        "El usuario que intentas eliminar no existe.",
        404,
      );
    }

    const usuarioSesion =
      obtenerUsuarioSesion();

    const esUsuarioActual =
      Number(usuarioSesion?.idUsuario) ===
        idNumerico ||
      usuarioSesion?.username
        ?.toLowerCase() ===
        usuario.username.toLowerCase();

    if (esUsuarioActual) {
      throw crearErrorMock(
        "No puedes eliminar el usuario con el que has iniciado sesión.",
        409,
      );
    }

    const eliminaUltimoAdmin =
      usuario.rol === "ADMIN" &&
      contarAdministradores(
        usuarios,
        idNumerico,
      ) === 0;

    if (eliminaUltimoAdmin) {
      throw crearErrorMock(
        "No se puede eliminar el último administrador.",
        409,
      );
    }

    guardarUsuariosMock(
      usuarios.filter(
        (item) =>
          Number(item.idUsuario) !==
          idNumerico,
      ),
    );

    return;
  }

  await apiClient.delete(
    `/usuarios/${idUsuario}`,
  );
}