import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useAuth } from "../../auth/AuthContext";

import {
  actualizarUsuario,
  buscarUsuarios,
  crearUsuario,
  eliminarUsuario,
  listarUsuarios,
  obtenerMensajeUsuarioError,
} from "../../api/usuariosApi";

const FORMULARIO_INICIAL = {
  username: "",
  rol: "USER",
};

function formatearFecha(fecha) {
  if (!fecha) {
    return "Sin fecha";
  }

  const partes = String(fecha)
    .slice(0, 10)
    .split("-");

  if (partes.length !== 3) {
    return fecha;
  }

  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function normalizarRol(rol) {
  const valor = String(rol ?? "")
    .trim()
    .toUpperCase();

  return valor === "USUARIO"
    ? "USER"
    : valor;
}

function obtenerNombreRol(rol) {
  return normalizarRol(rol) === "ADMIN"
    ? "Administrador"
    : "Usuario";
}

function obtenerClaseRol(rol) {
  return normalizarRol(rol) === "ADMIN"
    ? "text-bg-danger"
    : "text-bg-primary";
}

export default function UsuariosPage() {
  const { user: usuarioSesion } = useAuth();

  const [usuarios, setUsuarios] =
    useState([]);

  const [formulario, setFormulario] =
    useState(FORMULARIO_INICIAL);

  const [
    idUsuarioEditando,
    setIdUsuarioEditando,
  ] = useState(null);

  const [busqueda, setBusqueda] =
    useState("");

  const [cargando, setCargando] =
    useState(true);

  const [guardando, setGuardando] =
    useState(false);

  const [eliminandoId, setEliminandoId] =
    useState(null);

  const [mensaje, setMensaje] =
    useState(null);

  const estaEditando =
    idUsuarioEditando !== null;

  const cargarUsuarios =
    useCallback(async () => {
      setCargando(true);

      try {
        const data = await listarUsuarios();
        setUsuarios(data);
      } catch (error) {
        setMensaje({
          tipo: "danger",
          texto: obtenerMensajeUsuarioError(
            error,
            "No fue posible cargar los usuarios.",
          ),
        });
      } finally {
        setCargando(false);
      }
    }, []);

  useEffect(() => {
    cargarUsuarios();
  }, [cargarUsuarios]);

  const totalAdministradores = useMemo(() => {
    return usuarios.filter(
      (usuario) =>
        normalizarRol(usuario.rol) ===
        "ADMIN",
    ).length;
  }, [usuarios]);

  const totalUsuarios = useMemo(() => {
    return usuarios.filter(
      (usuario) =>
        normalizarRol(usuario.rol) !==
        "ADMIN",
    ).length;
  }, [usuarios]);

  function esUsuarioActual(usuario) {
    const idSesion = Number(
      usuarioSesion?.idUsuario ??
        usuarioSesion?.id,
    );

    const mismoId =
      Number.isFinite(idSesion) &&
      idSesion > 0 &&
      Number(usuario.idUsuario) ===
        idSesion;

    const usernameSesion = String(
      usuarioSesion?.username ??
        usuarioSesion?.email ??
        "",
    ).toLowerCase();

    const mismoUsername =
      usernameSesion &&
      usuario.username.toLowerCase() ===
        usernameSesion;

    return mismoId || mismoUsername;
  }

  function actualizarCampo(event) {
    const { name, value } = event.target;

    setFormulario((actual) => ({
      ...actual,
      [name]: value,
    }));
  }

  function limpiarFormulario() {
    setFormulario(FORMULARIO_INICIAL);
    setIdUsuarioEditando(null);
  }

  function iniciarNuevo() {
    limpiarFormulario();
    setMensaje(null);
  }

  function seleccionarParaEditar(usuario) {
    setIdUsuarioEditando(
      usuario.idUsuario,
    );

    setFormulario({
      username: usuario.username,
      rol: normalizarRol(usuario.rol),
    });

    setMensaje(null);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function validarFormulario() {
    const username =
      formulario.username.trim();

    if (!username) {
      return "El nombre de usuario o correo es obligatorio.";
    }

    if (username.length < 3) {
      return "El identificador debe contener al menos 3 caracteres.";
    }

    if (username.length > 50) {
      return "El identificador no puede superar los 50 caracteres.";
    }

    if (
      !["ADMIN", "USER"].includes(
        normalizarRol(formulario.rol),
      )
    ) {
      return "Seleccione un rol válido.";
    }

    return null;
  }

  async function guardarUsuario(event) {
    event.preventDefault();

    const errorValidacion =
      validarFormulario();

    if (errorValidacion) {
      setMensaje({
        tipo: "warning",
        texto: errorValidacion,
      });

      return;
    }

    setGuardando(true);
    setMensaje(null);

    try {
      if (estaEditando) {
        await actualizarUsuario(
          idUsuarioEditando,
          formulario,
        );

        setMensaje({
          tipo: "success",
          texto:
            "Usuario modificado correctamente.",
        });
      } else {
        await crearUsuario(formulario);

        setMensaje({
          tipo: "success",
          texto:
            "Usuario registrado correctamente.",
        });
      }

      limpiarFormulario();
      await cargarUsuarios();
    } catch (error) {
      setMensaje({
        tipo: "danger",
        texto: obtenerMensajeUsuarioError(
          error,
          "No fue posible guardar el usuario.",
        ),
      });
    } finally {
      setGuardando(false);
    }
  }

  async function ejecutarBusqueda(event) {
    event.preventDefault();

    setCargando(true);
    setMensaje(null);

    try {
      const resultados =
        await buscarUsuarios(busqueda);

      setUsuarios(resultados);

      if (
        busqueda.trim() &&
        resultados.length === 0
      ) {
        setMensaje({
          tipo: "info",
          texto: `No se encontraron usuarios que coincidan con "${busqueda.trim()}".`,
        });
      }
    } catch (error) {
      setMensaje({
        tipo: "danger",
        texto: obtenerMensajeUsuarioError(
          error,
          "No fue posible realizar la búsqueda.",
        ),
      });
    } finally {
      setCargando(false);
    }
  }

  async function mostrarTodos() {
    setBusqueda("");
    setMensaje(null);

    await cargarUsuarios();
  }

  async function confirmarEliminacion(usuario) {
    if (esUsuarioActual(usuario)) {
      setMensaje({
        tipo: "warning",
        texto:
          "No puedes eliminar el usuario con el que has iniciado sesión.",
      });

      return;
    }

    const confirmado = window.confirm(
      `¿Eliminar al usuario "${usuario.username}"?\n\nEsta acción no se puede deshacer.`,
    );

    if (!confirmado) {
      return;
    }

    setEliminandoId(usuario.idUsuario);
    setMensaje(null);

    try {
      await eliminarUsuario(
        usuario.idUsuario,
      );

      if (
        Number(idUsuarioEditando) ===
        Number(usuario.idUsuario)
      ) {
        limpiarFormulario();
      }

      setMensaje({
        tipo: "success",
        texto:
          "Usuario eliminado correctamente.",
      });

      await cargarUsuarios();
    } catch (error) {
      setMensaje({
        tipo: "danger",
        texto: obtenerMensajeUsuarioError(
          error,
          "No fue posible eliminar el usuario.",
        ),
      });
    } finally {
      setEliminandoId(null);
    }
  }

  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Administración de usuarios</h1>

          <p>
            Gestión de usuarios autorizados y
            asignación de roles del sistema.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-primary"
          onClick={iniciarNuevo}
        >
          Nuevo usuario
        </button>
      </div>

      {mensaje && (
        <div
          className={`alert alert-${mensaje.tipo} alert-dismissible`}
          role="alert"
          aria-live="polite"
        >
          {mensaje.texto}

          <button
            type="button"
            className="btn-close"
            aria-label="Cerrar"
            onClick={() => setMensaje(null)}
          />
        </div>
      )}

      <div className="row g-4 mb-4">
        <div className="col-12 col-md-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <p className="text-secondary mb-2">
                Total de usuarios
              </p>

              <h2 className="h3 mb-0">
                {usuarios.length}
              </h2>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <p className="text-secondary mb-2">
                Administradores
              </p>

              <h2 className="h3 mb-0 text-danger">
                {totalAdministradores}
              </h2>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <p className="text-secondary mb-2">
                Usuarios estándar
              </p>

              <h2 className="h3 mb-0 text-primary">
                {totalUsuarios}
              </h2>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4">
        <div className="col-12 col-xl-4">
          <div className="card border-0 shadow-sm">
            <div className="card-body p-4">
              <h2 className="h5 mb-4">
                {estaEditando
                  ? `Modificar usuario #${idUsuarioEditando}`
                  : "Nuevo usuario"}
              </h2>

              <form
                onSubmit={guardarUsuario}
                noValidate
              >
                {estaEditando && (
                  <div className="mb-3">
                    <label
                      className="form-label"
                      htmlFor="idUsuario"
                    >
                      ID
                    </label>

                    <input
                      id="idUsuario"
                      className="form-control"
                      value={
                        idUsuarioEditando
                      }
                      disabled
                    />
                  </div>
                )}

                <div className="mb-3">
                  <label
                    className="form-label"
                    htmlFor="username"
                  >
                    Usuario o correo OAuth
                  </label>

                  <input
                    id="username"
                    name="username"
                    type="text"
                    className="form-control"
                    value={
                      formulario.username
                    }
                    onChange={actualizarCampo}
                    maxLength={50}
                    placeholder="usuario@correo.com"
                    disabled={guardando}
                    required
                  />

                  <div className="form-text">
                    Debe coincidir con la cuenta
                    autorizada para iniciar sesión.
                  </div>
                </div>

                <div className="mb-4">
                  <label
                    className="form-label"
                    htmlFor="rolUsuario"
                  >
                    Rol
                  </label>

                  <select
                    id="rolUsuario"
                    name="rol"
                    className="form-select"
                    value={formulario.rol}
                    onChange={actualizarCampo}
                    disabled={guardando}
                  >
                    <option value="USER">
                      Usuario
                    </option>

                    <option value="ADMIN">
                      Administrador
                    </option>
                  </select>

                  <div className="form-text">
                    Los administradores pueden
                    gestionar otros usuarios.
                  </div>
                </div>

                <div className="d-flex flex-wrap gap-2">
                  <button
                    type="submit"
                    className="btn btn-success"
                    disabled={guardando}
                  >
                    {guardando
                      ? "Guardando..."
                      : estaEditando
                        ? "Guardar cambios"
                        : "Registrar"}
                  </button>

                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={limpiarFormulario}
                    disabled={guardando}
                  >
                    Limpiar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        <div className="col-12 col-xl-8">
          <div className="card border-0 shadow-sm">
            <div className="card-body p-4">
              <div className="mb-4">
                <h2 className="h5 mb-1">
                  Usuarios registrados
                </h2>

                <span className="badge text-bg-primary">
                  {usuarios.length} registro
                  {usuarios.length === 1
                    ? ""
                    : "s"}
                </span>
              </div>

              <form
                className="row g-2 mb-4"
                onSubmit={ejecutarBusqueda}
              >
                <div className="col-12 col-md">
                  <input
                    type="search"
                    className="form-control"
                    value={busqueda}
                    onChange={(event) =>
                      setBusqueda(
                        event.target.value,
                      )
                    }
                    placeholder="Buscar por ID, usuario o rol"
                    disabled={cargando}
                  />
                </div>

                <div className="col-6 col-md-auto">
                  <button
                    type="submit"
                    className="btn btn-primary w-100"
                    disabled={cargando}
                  >
                    Buscar
                  </button>
                </div>

                <div className="col-6 col-md-auto">
                  <button
                    type="button"
                    className="btn btn-outline-primary w-100"
                    onClick={mostrarTodos}
                    disabled={cargando}
                  >
                    Mostrar todos
                  </button>
                </div>
              </form>

              {cargando ? (
                <div className="text-center py-5">
                  <div
                    className="spinner-border text-primary"
                    role="status"
                  />

                  <p className="text-secondary mt-3 mb-0">
                    Cargando usuarios...
                  </p>
                </div>
              ) : usuarios.length === 0 ? (
                <div className="text-center py-5">
                  <h3 className="h6">
                    No existen usuarios
                  </h3>

                  <p className="text-secondary mb-0">
                    Registra un usuario o modifica
                    la búsqueda.
                  </p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Usuario</th>
                        <th>Rol</th>
                        <th>Fecha de creación</th>

                        <th className="text-end">
                          Acciones
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {usuarios.map((usuario) => {
                        const usuarioActual =
                          esUsuarioActual(usuario);

                        return (
                          <tr
                            key={
                              usuario.idUsuario
                            }
                          >
                            <td>
                              {
                                usuario.idUsuario
                              }
                            </td>

                            <td>
                              <strong>
                                {
                                  usuario.username
                                }
                              </strong>

                              {usuarioActual && (
                                <span className="badge text-bg-success ms-2">
                                  Sesión actual
                                </span>
                              )}
                            </td>

                            <td>
                              <span
                                className={`badge ${obtenerClaseRol(
                                  usuario.rol,
                                )}`}
                              >
                                {obtenerNombreRol(
                                  usuario.rol,
                                )}
                              </span>
                            </td>

                            <td>
                              {formatearFecha(
                                usuario.fechaCreacion,
                              )}
                            </td>

                            <td>
                              <div className="d-flex justify-content-end gap-2">
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-primary"
                                  onClick={() =>
                                    seleccionarParaEditar(
                                      usuario,
                                    )
                                  }
                                  disabled={
                                    eliminandoId ===
                                    usuario.idUsuario
                                  }
                                >
                                  Modificar
                                </button>

                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-danger"
                                  onClick={() =>
                                    confirmarEliminacion(
                                      usuario,
                                    )
                                  }
                                  disabled={
                                    usuarioActual ||
                                    eliminandoId ===
                                      usuario.idUsuario
                                  }
                                  title={
                                    usuarioActual
                                      ? "No puedes eliminar tu propia sesión"
                                      : ""
                                  }
                                >
                                  {eliminandoId ===
                                  usuario.idUsuario
                                    ? "Eliminando..."
                                    : "Eliminar"}
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}