import { useCallback, useEffect, useState } from "react";
import {
  actualizarCiudad,
  buscarCiudades,
  crearCiudad,
  eliminarCiudad,
  listarCiudades,
  obtenerMensajeCiudadError,
} from "../../api/ciudadesApi";

const FORMULARIO_INICIAL = {
  nombre: "",
};

export default function CiudadesPage() {
  const [ciudades, setCiudades] = useState([]);
  const [formulario, setFormulario] = useState(
    FORMULARIO_INICIAL,
  );
  const [idEditando, setIdEditando] = useState(null);
  const [busqueda, setBusqueda] = useState("");

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [eliminandoId, setEliminandoId] = useState(null);
  const [mensaje, setMensaje] = useState(null);

  const estaEditando = idEditando !== null;

  const cargarTodas = useCallback(async () => {
    setCargando(true);

    try {
      const data = await listarCiudades();
      setCiudades(data);
    } catch (error) {
      setMensaje({
        tipo: "danger",
        texto: obtenerMensajeCiudadError(
          error,
          "No fue posible cargar las ciudades.",
        ),
      });
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarTodas();
  }, [cargarTodas]);

  function limpiarFormulario() {
    setFormulario(FORMULARIO_INICIAL);
    setIdEditando(null);
  }

  function iniciarNueva() {
    limpiarFormulario();
    setMensaje(null);
  }

  function seleccionarParaEditar(ciudad) {
    setIdEditando(ciudad.idCiudad);

    setFormulario({
      nombre: ciudad.nombre,
    });

    setMensaje(null);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function validarFormulario() {
    const nombre = formulario.nombre.trim();

    if (!nombre) {
      return "El nombre de la ciudad es obligatorio.";
    }

    if (nombre.length < 2) {
      return "El nombre debe tener al menos 2 caracteres.";
    }

    if (nombre.length > 100) {
      return "El nombre no puede superar los 100 caracteres.";
    }

    return null;
  }

  async function guardarCiudad(event) {
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
        await actualizarCiudad(
          idEditando,
          formulario,
        );

        setMensaje({
          tipo: "success",
          texto: "Ciudad modificada correctamente.",
        });
      } else {
        await crearCiudad(formulario);

        setMensaje({
          tipo: "success",
          texto: "Ciudad registrada correctamente.",
        });
      }

      limpiarFormulario();
      await cargarTodas();
    } catch (error) {
      setMensaje({
        tipo: "danger",
        texto: obtenerMensajeCiudadError(
          error,
          "No fue posible guardar la ciudad.",
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
        ? await buscarCiudades(termino)
        : await listarCiudades();

      setCiudades(resultados);

      if (termino && resultados.length === 0) {
        setMensaje({
          tipo: "info",
          texto: `No se encontraron ciudades que coincidan con "${termino}".`,
        });
      }
    } catch (error) {
      setMensaje({
        tipo: "danger",
        texto: obtenerMensajeCiudadError(
          error,
          "No fue posible realizar la búsqueda.",
        ),
      });
    } finally {
      setCargando(false);
    }
  }

  async function mostrarTodas() {
    setBusqueda("");
    setMensaje(null);
    await cargarTodas();
  }

  async function confirmarEliminacion(ciudad) {
    const confirmado = window.confirm(
      `¿Eliminar la ciudad "${ciudad.nombre}"?\n\nEsta acción no se puede deshacer.`,
    );

    if (!confirmado) {
      return;
    }

    setEliminandoId(ciudad.idCiudad);
    setMensaje(null);

    try {
      await eliminarCiudad(ciudad.idCiudad);

      if (Number(idEditando) === Number(ciudad.idCiudad)) {
        limpiarFormulario();
      }

      setMensaje({
        tipo: "success",
        texto: "Ciudad eliminada correctamente.",
      });

      await cargarTodas();
    } catch (error) {
      setMensaje({
        tipo: "danger",
        texto: obtenerMensajeCiudadError(
          error,
          "No fue posible eliminar la ciudad.",
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
          <h1>Ciudades de entrega</h1>
          <p>
            Registro y mantenimiento de ciudades utilizadas
            en facturación.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-primary"
          onClick={iniciarNueva}
        >
          Nueva ciudad
        </button>
      </div>

      {mensaje && (
        <div
          className={`alert alert-${mensaje.tipo} alert-dismissible`}
          role="alert"
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
                  ? `Modificar ciudad #${idEditando}`
                  : "Nueva ciudad"}
              </h2>

              <form onSubmit={guardarCiudad} noValidate>
                {estaEditando && (
                  <div className="mb-3">
                    <label
                      className="form-label"
                      htmlFor="idCiudad"
                    >
                      ID
                    </label>

                    <input
                      id="idCiudad"
                      className="form-control"
                      value={idEditando}
                      disabled
                    />
                  </div>
                )}

                <div className="mb-4">
                  <label
                    className="form-label"
                    htmlFor="nombreCiudad"
                  >
                    Nombre
                  </label>

                  <input
                    id="nombreCiudad"
                    name="nombre"
                    type="text"
                    className="form-control"
                    value={formulario.nombre}
                    onChange={(event) =>
                      setFormulario({
                        nombre: event.target.value,
                      })
                    }
                    maxLength={100}
                    placeholder="Ej. Quito"
                    disabled={guardando}
                    required
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
              <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                  <h2 className="h5 mb-1">
                    Listado de ciudades
                  </h2>

                  <span className="badge text-bg-primary">
                    {ciudades.length} registro
                    {ciudades.length === 1 ? "" : "s"}
                  </span>
                </div>
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
                      setBusqueda(event.target.value)
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
                    onClick={mostrarTodas}
                    disabled={cargando}
                  >
                    Mostrar todas
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
                    Cargando ciudades...
                  </p>
                </div>
              ) : ciudades.length === 0 ? (
                <div className="text-center py-5">
                  <h3 className="h6">
                    No existen ciudades para mostrar
                  </h3>

                  <p className="text-secondary mb-0">
                    Registra una ciudad o cambia la búsqueda.
                  </p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Nombre</th>
                        <th className="text-end">
                          Acciones
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {ciudades.map((ciudad) => (
                        <tr key={ciudad.idCiudad}>
                          <td>{ciudad.idCiudad}</td>
                          <td>{ciudad.nombre}</td>

                          <td>
                            <div className="d-flex justify-content-end gap-2">
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-primary"
                                onClick={() =>
                                  seleccionarParaEditar(ciudad)
                                }
                                disabled={
                                  eliminandoId === ciudad.idCiudad
                                }
                              >
                                Modificar
                              </button>

                              <button
                                type="button"
                                className="btn btn-sm btn-outline-danger"
                                onClick={() =>
                                  confirmarEliminacion(ciudad)
                                }
                                disabled={
                                  eliminandoId === ciudad.idCiudad
                                }
                              >
                                {eliminandoId === ciudad.idCiudad
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