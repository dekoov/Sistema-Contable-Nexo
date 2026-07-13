import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  actualizarTipoMovimiento,
  buscarTiposMovimiento,
  crearTipoMovimiento,
  eliminarTipoMovimiento,
  listarTiposMovimiento,
  obtenerMensajeTipoMovimientoError,
} from "../../api/tiposMovimientoApi";

const FORMULARIO_INICIAL = {
  nombre: "",
  tipo: "I",
};

function obtenerNombreTipo(tipo) {
  if (tipo === "I") {
    return "Ingreso";
  }

  if (tipo === "E") {
    return "Egreso";
  }

  return "Desconocido";
}

function obtenerClaseTipo(tipo) {
  return tipo === "I"
    ? "text-bg-success"
    : "text-bg-danger";
}

export default function TiposMovimientoPage() {
  const [tiposMovimiento, setTiposMovimiento] =
    useState([]);

  const [formulario, setFormulario] = useState(
    FORMULARIO_INICIAL,
  );

  const [idEditando, setIdEditando] =
    useState(null);

  const [busqueda, setBusqueda] = useState("");

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] =
    useState(false);

  const [eliminandoId, setEliminandoId] =
    useState(null);

  const [mensaje, setMensaje] = useState(null);

  const estaEditando = idEditando !== null;

  const cargarTodos = useCallback(async () => {
    setCargando(true);

    try {
      const data =
        await listarTiposMovimiento();

      setTiposMovimiento(data);
    } catch (error) {
      setMensaje({
        tipo: "danger",
        texto: obtenerMensajeTipoMovimientoError(
          error,
          "No fue posible cargar los tipos de movimiento.",
        ),
      });
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarTodos();
  }, [cargarTodos]);

  function actualizarCampo(event) {
    const { name, value } = event.target;

    setFormulario((actual) => ({
      ...actual,
      [name]: value,
    }));
  }

  function limpiarFormulario() {
    setFormulario(FORMULARIO_INICIAL);
    setIdEditando(null);
  }

  function iniciarNuevo() {
    limpiarFormulario();
    setMensaje(null);
  }

  function seleccionarParaEditar(tipoMovimiento) {
    setIdEditando(
      tipoMovimiento.idTipoMovimiento,
    );

    setFormulario({
      nombre: tipoMovimiento.nombre,
      tipo: tipoMovimiento.tipo,
    });

    setMensaje(null);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function validarFormulario() {
    const nombre = formulario.nombre.trim();
    const tipo = formulario.tipo
      .trim()
      .toUpperCase();

    if (!nombre) {
      return "El nombre es obligatorio.";
    }

    if (nombre.length < 2) {
      return "El nombre debe tener al menos 2 caracteres.";
    }

    if (tipo !== "I" && tipo !== "E") {
      return "Seleccione Ingreso o Egreso.";
    }

    return null;
  }

  async function guardarTipoMovimiento(event) {
    event.preventDefault();

    const errorValidacion = validarFormulario();

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
        await actualizarTipoMovimiento(
          idEditando,
          formulario,
        );

        setMensaje({
          tipo: "success",
          texto:
            "Tipo de movimiento modificado correctamente.",
        });
      } else {
        await crearTipoMovimiento(formulario);

        setMensaje({
          tipo: "success",
          texto:
            "Tipo de movimiento registrado correctamente.",
        });
      }

      limpiarFormulario();
      await cargarTodos();
    } catch (error) {
      setMensaje({
        tipo: "danger",
        texto: obtenerMensajeTipoMovimientoError(
          error,
          "No fue posible guardar el tipo de movimiento.",
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
      const termino = busqueda.trim();

      const resultados = termino
        ? await buscarTiposMovimiento(termino)
        : await listarTiposMovimiento();

      setTiposMovimiento(resultados);

      if (
        termino &&
        resultados.length === 0
      ) {
        setMensaje({
          tipo: "info",
          texto: `No se encontraron tipos de movimiento que coincidan con "${termino}".`,
        });
      }
    } catch (error) {
      setMensaje({
        tipo: "danger",
        texto: obtenerMensajeTipoMovimientoError(
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

    await cargarTodos();
  }

  async function confirmarEliminacion(
    tipoMovimiento,
  ) {
    const confirmado = window.confirm(
      `¿Eliminar el tipo de movimiento "${tipoMovimiento.nombre}"?\n\nEsta acción no se puede deshacer.`,
    );

    if (!confirmado) {
      return;
    }

    setEliminandoId(
      tipoMovimiento.idTipoMovimiento,
    );

    setMensaje(null);

    try {
      await eliminarTipoMovimiento(
        tipoMovimiento.idTipoMovimiento,
      );

      if (
        Number(idEditando) ===
        Number(
          tipoMovimiento.idTipoMovimiento,
        )
      ) {
        limpiarFormulario();
      }

      setMensaje({
        tipo: "success",
        texto:
          "Tipo de movimiento eliminado correctamente.",
      });

      await cargarTodos();
    } catch (error) {
      setMensaje({
        tipo: "danger",
        texto: obtenerMensajeTipoMovimientoError(
          error,
          "No fue posible eliminar el tipo de movimiento.",
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
          <h1>Tipos de movimiento</h1>

          <p>
            Administración de ingresos y egresos
            de inventario.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-primary"
          onClick={iniciarNuevo}
        >
          Nuevo tipo
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

      <div className="row g-4">
        <div className="col-12 col-xl-4">
          <div className="card border-0 shadow-sm">
            <div className="card-body p-4">
              <h2 className="h5 mb-4">
                {estaEditando
                  ? `Modificar tipo #${idEditando}`
                  : "Nuevo tipo de movimiento"}
              </h2>

              <form
                onSubmit={
                  guardarTipoMovimiento
                }
                noValidate
              >
                {estaEditando && (
                  <div className="mb-3">
                    <label
                      className="form-label"
                      htmlFor="idTipoMovimiento"
                    >
                      ID
                    </label>

                    <input
                      id="idTipoMovimiento"
                      className="form-control"
                      value={idEditando}
                      disabled
                    />
                  </div>
                )}

                <div className="mb-3">
                  <label
                    className="form-label"
                    htmlFor="nombreTipoMovimiento"
                  >
                    Nombre
                  </label>

                  <input
                    id="nombreTipoMovimiento"
                    name="nombre"
                    type="text"
                    className="form-control"
                    value={formulario.nombre}
                    onChange={actualizarCampo}
                    placeholder="Ej. Compra a proveedor"
                    disabled={guardando}
                    required
                  />
                </div>

                <div className="mb-4">
                  <label
                    className="form-label"
                    htmlFor="tipoMovimiento"
                  >
                    Tipo
                  </label>

                  <select
                    id="tipoMovimiento"
                    name="tipo"
                    className="form-select"
                    value={formulario.tipo}
                    onChange={actualizarCampo}
                    disabled={guardando}
                  >
                    <option value="I">
                      Ingreso
                    </option>

                    <option value="E">
                      Egreso
                    </option>
                  </select>

                  <div className="form-text">
                    Ingreso aumenta existencias;
                    egreso las disminuye.
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
                    onClick={
                      limpiarFormulario
                    }
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
                  Listado de tipos
                </h2>

                <span className="badge text-bg-primary">
                  {tiposMovimiento.length}{" "}
                  registro
                  {tiposMovimiento.length === 1
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
                    placeholder="Buscar por nombre"
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
                    Cargando tipos de
                    movimiento...
                  </p>
                </div>
              ) : tiposMovimiento.length === 0 ? (
                <div className="text-center py-5">
                  <h3 className="h6">
                    No existen registros
                  </h3>

                  <p className="text-secondary mb-0">
                    Registra un tipo de movimiento
                    o cambia la búsqueda.
                  </p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Nombre</th>
                        <th>Tipo</th>

                        <th className="text-end">
                          Acciones
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {tiposMovimiento.map(
                        (tipoMovimiento) => (
                          <tr
                            key={
                              tipoMovimiento.idTipoMovimiento
                            }
                          >
                            <td>
                              {
                                tipoMovimiento.idTipoMovimiento
                              }
                            </td>

                            <td>
                              {
                                tipoMovimiento.nombre
                              }
                            </td>

                            <td>
                              <span
                                className={`badge ${obtenerClaseTipo(
                                  tipoMovimiento.tipo,
                                )}`}
                              >
                                {obtenerNombreTipo(
                                  tipoMovimiento.tipo,
                                )}
                              </span>
                            </td>

                            <td>
                              <div className="d-flex justify-content-end gap-2">
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-primary"
                                  onClick={() =>
                                    seleccionarParaEditar(
                                      tipoMovimiento,
                                    )
                                  }
                                  disabled={
                                    eliminandoId ===
                                    tipoMovimiento.idTipoMovimiento
                                  }
                                >
                                  Modificar
                                </button>

                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-danger"
                                  onClick={() =>
                                    confirmarEliminacion(
                                      tipoMovimiento,
                                    )
                                  }
                                  disabled={
                                    eliminandoId ===
                                    tipoMovimiento.idTipoMovimiento
                                  }
                                >
                                  {eliminandoId ===
                                  tipoMovimiento.idTipoMovimiento
                                    ? "Eliminando..."
                                    : "Eliminar"}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ),
                      )}
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