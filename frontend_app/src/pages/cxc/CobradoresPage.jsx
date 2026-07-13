import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  actualizarCobrador,
  buscarCobradores,
  crearCobrador,
  eliminarCobrador,
  listarCobradores,
  obtenerMensajeCobradorError,
} from "../../api/cobradoresApi";

const FORMULARIO_INICIAL = {
  cedula: "",
  nombre: "",
  direccion: "",
};

export default function CobradoresPage() {
  const [cobradores, setCobradores] =
    useState([]);

  const [formulario, setFormulario] =
    useState(FORMULARIO_INICIAL);

  const [idEditando, setIdEditando] =
    useState(null);

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

  const estaEditando = idEditando !== null;

  const cargarTodos = useCallback(async () => {
    setCargando(true);

    try {
      const data = await listarCobradores();
      setCobradores(data);
    } catch (error) {
      setMensaje({
        tipo: "danger",
        texto: obtenerMensajeCobradorError(
          error,
          "No fue posible cargar los cobradores.",
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

  function seleccionarParaEditar(cobrador) {
    setIdEditando(cobrador.idCobrador);

    setFormulario({
      cedula: cobrador.cedula,
      nombre: cobrador.nombre,
      direccion: cobrador.direccion,
    });

    setMensaje(null);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function validarFormulario() {
    const cedula = formulario.cedula.trim();
    const nombre = formulario.nombre.trim();
    const direccion =
      formulario.direccion.trim();

    if (!cedula) {
      return "La cédula es obligatoria.";
    }

    if (!/^\d{10}$/.test(cedula)) {
      return "La cédula debe contener exactamente 10 números.";
    }

    if (!nombre) {
      return "El nombre es obligatorio.";
    }

    if (nombre.length > 100) {
      return "El nombre no puede superar los 100 caracteres.";
    }

    if (!direccion) {
      return "La dirección es obligatoria.";
    }

    if (direccion.length > 200) {
      return "La dirección no puede superar los 200 caracteres.";
    }

    return null;
  }

  async function guardarCobrador(event) {
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
        await actualizarCobrador(
          idEditando,
          formulario,
        );

        setMensaje({
          tipo: "success",
          texto:
            "Cobrador modificado correctamente.",
        });
      } else {
        await crearCobrador(formulario);

        setMensaje({
          tipo: "success",
          texto:
            "Cobrador registrado correctamente.",
        });
      }

      limpiarFormulario();
      await cargarTodos();
    } catch (error) {
      setMensaje({
        tipo: "danger",
        texto: obtenerMensajeCobradorError(
          error,
          "No fue posible guardar el cobrador.",
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
        await buscarCobradores(busqueda);

      setCobradores(resultados);

      if (
        busqueda.trim() &&
        resultados.length === 0
      ) {
        setMensaje({
          tipo: "info",
          texto: `No se encontraron cobradores que coincidan con "${busqueda.trim()}".`,
        });
      }
    } catch (error) {
      setMensaje({
        tipo: "danger",
        texto: obtenerMensajeCobradorError(
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

  async function confirmarEliminacion(cobrador) {
    const confirmado = window.confirm(
      `¿Eliminar al cobrador "${cobrador.nombre}"?\n\nEsta acción no se puede deshacer.`,
    );

    if (!confirmado) {
      return;
    }

    setEliminandoId(cobrador.idCobrador);
    setMensaje(null);

    try {
      await eliminarCobrador(
        cobrador.idCobrador,
      );

      if (
        Number(idEditando) ===
        Number(cobrador.idCobrador)
      ) {
        limpiarFormulario();
      }

      setMensaje({
        tipo: "success",
        texto:
          "Cobrador eliminado correctamente.",
      });

      await cargarTodos();
    } catch (error) {
      setMensaje({
        tipo: "danger",
        texto: obtenerMensajeCobradorError(
          error,
          "No fue posible eliminar el cobrador.",
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
          <h1>Cobradores</h1>

          <p>
            Registro y mantenimiento del personal
            encargado de realizar cobros.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-primary"
          onClick={iniciarNuevo}
        >
          Nuevo cobrador
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
                  ? `Modificar cobrador #${idEditando}`
                  : "Nuevo cobrador"}
              </h2>

              <form
                onSubmit={guardarCobrador}
                noValidate
              >
                {estaEditando && (
                  <div className="mb-3">
                    <label
                      className="form-label"
                      htmlFor="idCobrador"
                    >
                      ID
                    </label>

                    <input
                      id="idCobrador"
                      className="form-control"
                      value={idEditando}
                      disabled
                    />
                  </div>
                )}

                <div className="mb-3">
                  <label
                    className="form-label"
                    htmlFor="cedulaCobrador"
                  >
                    Cédula
                  </label>

                  <input
                    id="cedulaCobrador"
                    name="cedula"
                    type="text"
                    inputMode="numeric"
                    className="form-control"
                    value={formulario.cedula}
                    onChange={actualizarCampo}
                    maxLength={10}
                    placeholder="Ej. 1712345678"
                    disabled={guardando}
                    required
                  />

                  <div className="form-text">
                    Ingrese exactamente 10 números.
                  </div>
                </div>

                <div className="mb-3">
                  <label
                    className="form-label"
                    htmlFor="nombreCobrador"
                  >
                    Nombre
                  </label>

                  <input
                    id="nombreCobrador"
                    name="nombre"
                    type="text"
                    className="form-control"
                    value={formulario.nombre}
                    onChange={actualizarCampo}
                    maxLength={100}
                    placeholder="Nombre completo"
                    disabled={guardando}
                    required
                  />
                </div>

                <div className="mb-4">
                  <label
                    className="form-label"
                    htmlFor="direccionCobrador"
                  >
                    Dirección
                  </label>

                  <textarea
                    id="direccionCobrador"
                    name="direccion"
                    className="form-control"
                    value={formulario.direccion}
                    onChange={actualizarCampo}
                    maxLength={200}
                    rows={3}
                    placeholder="Dirección domiciliaria"
                    disabled={guardando}
                    required
                  />

                  <div className="form-text text-end">
                    {formulario.direccion.length}/200
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
                  Listado de cobradores
                </h2>

                <span className="badge text-bg-primary">
                  {cobradores.length} registro
                  {cobradores.length === 1
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
                    placeholder="Buscar por cédula, nombre o dirección"
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
                    Cargando cobradores...
                  </p>
                </div>
              ) : cobradores.length === 0 ? (
                <div className="text-center py-5">
                  <h3 className="h6">
                    No existen cobradores
                  </h3>

                  <p className="text-secondary mb-0">
                    Registra un cobrador o modifica
                    la búsqueda.
                  </p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Cédula</th>
                        <th>Nombre</th>
                        <th>Dirección</th>

                        <th className="text-end">
                          Acciones
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {cobradores.map((cobrador) => (
                        <tr
                          key={cobrador.idCobrador}
                        >
                          <td>
                            {cobrador.idCobrador}
                          </td>

                          <td>{cobrador.cedula}</td>

                          <td>{cobrador.nombre}</td>

                          <td>
                            {cobrador.direccion}
                          </td>

                          <td>
                            <div className="d-flex justify-content-end gap-2">
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-primary"
                                onClick={() =>
                                  seleccionarParaEditar(
                                    cobrador,
                                  )
                                }
                                disabled={
                                  eliminandoId ===
                                  cobrador.idCobrador
                                }
                              >
                                Modificar
                              </button>

                              <button
                                type="button"
                                className="btn btn-sm btn-outline-danger"
                                onClick={() =>
                                  confirmarEliminacion(
                                    cobrador,
                                  )
                                }
                                disabled={
                                  eliminandoId ===
                                  cobrador.idCobrador
                                }
                              >
                                {eliminandoId ===
                                cobrador.idCobrador
                                  ? "Eliminando..."
                                  : "Eliminar"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
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