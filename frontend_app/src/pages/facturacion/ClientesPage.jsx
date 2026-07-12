import { useCallback, useEffect, useMemo, useState } from "react";
import {
  actualizarCliente,
  buscarClientes,
  crearCliente,
  eliminarCliente,
  listarClientes,
  obtenerMensajeApiError,
} from "../../api/clientesApi";

const FORMULARIO_INICIAL = {
  cedula: "",
  nombre: "",
  direccion: "",
};

export default function ClientesPage() {
  const [clientes, setClientes] = useState([]);
  const [formulario, setFormulario] = useState(FORMULARIO_INICIAL);
  const [idEditando, setIdEditando] = useState(null);
  const [busqueda, setBusqueda] = useState("");

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [eliminandoId, setEliminandoId] = useState(null);

  const [mensaje, setMensaje] = useState(null);

  const estaEditando = idEditando !== null;

  const tituloFormulario = estaEditando
    ? `Modificar cliente #${idEditando}`
    : "Nuevo cliente";

  const cantidadClientes = useMemo(
    () => clientes.length,
    [clientes],
  );

  const cargarTodos = useCallback(async () => {
    setCargando(true);

    try {
      const data = await listarClientes();
      setClientes(data);
    } catch (error) {
      setMensaje({
        tipo: "danger",
        texto: obtenerMensajeApiError(
          error,
          "No fue posible cargar los clientes.",
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

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function seleccionarParaEditar(cliente) {
    setIdEditando(cliente.idCliente);

    setFormulario({
      cedula: cliente.cedula,
      nombre: cliente.nombre,
      direccion: cliente.direccion ?? "",
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
    const direccion = formulario.direccion.trim();

    if (!cedula) {
      return "La cédula es obligatoria.";
    }

    if (!/^\d+$/.test(cedula)) {
      return "La cédula solo puede contener números.";
    }

    if (cedula.length !== 10 && cedula.length !== 13) {
      return "La cédula debe tener 10 dígitos o el RUC debe tener 13.";
    }

    if (!nombre) {
      return "El nombre es obligatorio.";
    }

    if (nombre.length > 100) {
      return "El nombre no puede superar los 100 caracteres.";
    }

    if (direccion.length > 4000) {
      return "La dirección no puede superar los 4000 caracteres.";
    }

    return null;
  }

  async function guardarCliente(event) {
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
        await actualizarCliente(idEditando, formulario);

        setMensaje({
          tipo: "success",
          texto: "Cliente modificado correctamente.",
        });
      } else {
        await crearCliente(formulario);

        setMensaje({
          tipo: "success",
          texto: "Cliente registrado correctamente.",
        });
      }

      limpiarFormulario();
      await cargarTodos();
    } catch (error) {
      setMensaje({
        tipo: "danger",
        texto: obtenerMensajeApiError(
          error,
          "No fue posible guardar el cliente.",
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
        ? await buscarClientes(termino)
        : await listarClientes();

      setClientes(resultados);

      if (termino && resultados.length === 0) {
        setMensaje({
          tipo: "info",
          texto: `No se encontraron clientes que coincidan con "${termino}".`,
        });
      }
    } catch (error) {
      setMensaje({
        tipo: "danger",
        texto: obtenerMensajeApiError(
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

  async function confirmarEliminacion(cliente) {
    const confirmado = window.confirm(
      `¿Eliminar al cliente "${cliente.nombre}"?\n\nEsta acción no se puede deshacer.`,
    );

    if (!confirmado) {
      return;
    }

    setEliminandoId(cliente.idCliente);
    setMensaje(null);

    try {
      await eliminarCliente(cliente.idCliente);

      if (Number(idEditando) === Number(cliente.idCliente)) {
        limpiarFormulario();
      }

      setMensaje({
        tipo: "success",
        texto: "Cliente eliminado correctamente.",
      });

      await cargarTodos();
    } catch (error) {
      setMensaje({
        tipo: "danger",
        texto: obtenerMensajeApiError(
          error,
          "No fue posible eliminar el cliente.",
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
          <h1>Clientes</h1>
          <p>
            Registro, consulta, modificación y eliminación de clientes.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-primary"
          onClick={iniciarNuevo}
        >
          Nuevo cliente
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
              <h2 className="h5 mb-4">{tituloFormulario}</h2>

              <form onSubmit={guardarCliente} noValidate>
                {estaEditando && (
                  <div className="mb-3">
                    <label className="form-label" htmlFor="idCliente">
                      ID
                    </label>

                    <input
                      id="idCliente"
                      className="form-control"
                      value={idEditando}
                      disabled
                    />
                  </div>
                )}

                <div className="mb-3">
                  <label className="form-label" htmlFor="cedula">
                    Cédula o RUC
                  </label>

                  <input
                    id="cedula"
                    name="cedula"
                    type="text"
                    inputMode="numeric"
                    className="form-control"
                    value={formulario.cedula}
                    onChange={actualizarCampo}
                    maxLength={13}
                    placeholder="Ej. 1712345678"
                    disabled={guardando}
                    required
                  />

                  <div className="form-text">
                    Ingrese 10 dígitos para cédula o 13 para RUC.
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label" htmlFor="nombre">
                    Nombre
                  </label>

                  <input
                    id="nombre"
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
                  <label className="form-label" htmlFor="direccion">
                    Dirección
                  </label>

                  <textarea
                    id="direccion"
                    name="direccion"
                    className="form-control"
                    value={formulario.direccion}
                    onChange={actualizarCampo}
                    rows={4}
                    maxLength={4000}
                    placeholder="Dirección del cliente"
                    disabled={guardando}
                  />
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
              <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
                <div>
                  <h2 className="h5 mb-1">Listado de clientes</h2>
                  <span className="badge text-bg-primary">
                    {cantidadClientes} registro
                    {cantidadClientes === 1 ? "" : "s"}
                  </span>
                </div>
              </div>

              <form
                className="row g-2 mb-4"
                onSubmit={ejecutarBusqueda}
              >
                <div className="col-12 col-md">
                  <label
                    className="visually-hidden"
                    htmlFor="buscarCliente"
                  >
                    Buscar cliente
                  </label>

                  <input
                    id="buscarCliente"
                    type="search"
                    className="form-control"
                    value={busqueda}
                    onChange={(event) => setBusqueda(event.target.value)}
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
                    Cargando clientes...
                  </p>
                </div>
              ) : clientes.length === 0 ? (
                <div className="text-center py-5">
                  <h3 className="h6">No existen clientes para mostrar</h3>

                  <p className="text-secondary mb-0">
                    Registra un cliente o modifica el criterio de búsqueda.
                  </p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle">
                    <thead>
                      <tr>
                        <th scope="col">ID</th>
                        <th scope="col">Cédula/RUC</th>
                        <th scope="col">Nombre</th>
                        <th scope="col">Dirección</th>
                        <th scope="col" className="text-end">
                          Acciones
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {clientes.map((cliente) => (
                        <tr key={cliente.idCliente}>
                          <td>{cliente.idCliente}</td>
                          <td>{cliente.cedula}</td>
                          <td>{cliente.nombre}</td>
                          <td>{cliente.direccion || "Sin dirección"}</td>

                          <td>
                            <div className="d-flex justify-content-end gap-2">
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-primary"
                                onClick={() =>
                                  seleccionarParaEditar(cliente)
                                }
                                disabled={
                                  eliminandoId === cliente.idCliente
                                }
                              >
                                Modificar
                              </button>

                              <button
                                type="button"
                                className="btn btn-sm btn-outline-danger"
                                onClick={() =>
                                  confirmarEliminacion(cliente)
                                }
                                disabled={
                                  eliminandoId === cliente.idCliente
                                }
                              >
                                {eliminandoId === cliente.idCliente
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