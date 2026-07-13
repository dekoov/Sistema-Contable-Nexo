import { useCallback, useEffect, useState } from "react";
import {
  actualizarArticulo,
  buscarArticulos,
  crearArticulo,
  eliminarArticulo,
  listarArticulos,
  obtenerMensajeArticuloError,
} from "../../api/articulosApi";

const FORMULARIO_INICIAL = {
  nombre: "",
  precio: "",
};

function formatearPrecio(valor) {
  const numero = Number(valor);

  return new Intl.NumberFormat("es-EC", {
    style: "currency",
    currency: "USD",
  }).format(Number.isFinite(numero) ? numero : 0);
}

function formatearFecha(fecha) {
  if (!fecha) {
    return "No registrada";
  }

  const valor = new Date(fecha);

  if (Number.isNaN(valor.getTime())) {
    return "No registrada";
  }

  return valor.toLocaleDateString("es-EC", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export default function ArticulosPage() {
  const [articulos, setArticulos] = useState([]);
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

  const cargarTodos = useCallback(async () => {
    setCargando(true);

    try {
      const data = await listarArticulos();
      setArticulos(data);
    } catch (error) {
      setMensaje({
        tipo: "danger",
        texto: obtenerMensajeArticuloError(
          error,
          "No fue posible cargar los artículos.",
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

  function seleccionarParaEditar(articulo) {
    setIdEditando(articulo.idArticulo);

    setFormulario({
      nombre: articulo.nombre,
      precio: String(articulo.precio),
    });

    setMensaje(null);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function validarFormulario() {
    const nombre = formulario.nombre.trim();
    const precio = Number(formulario.precio);

    if (!nombre) {
      return "El nombre del artículo es obligatorio.";
    }

    if (nombre.length > 100) {
      return "El nombre no puede superar los 100 caracteres.";
    }

    if (
      formulario.precio === "" ||
      !Number.isFinite(precio)
    ) {
      return "Ingrese un precio válido.";
    }

    if (precio <= 0) {
      return "El precio debe ser mayor que cero.";
    }

    if (precio > 999999999) {
      return "El precio ingresado es demasiado alto.";
    }

    return null;
  }

  async function guardarArticulo(event) {
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
        await actualizarArticulo(
          idEditando,
          formulario,
        );

        setMensaje({
          tipo: "success",
          texto: "Artículo modificado correctamente.",
        });
      } else {
        await crearArticulo(formulario);

        setMensaje({
          tipo: "success",
          texto: "Artículo registrado correctamente.",
        });
      }

      limpiarFormulario();
      await cargarTodos();
    } catch (error) {
      setMensaje({
        tipo: "danger",
        texto: obtenerMensajeArticuloError(
          error,
          "No fue posible guardar el artículo.",
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
        ? await buscarArticulos(termino)
        : await listarArticulos();

      setArticulos(resultados);

      if (termino && resultados.length === 0) {
        setMensaje({
          tipo: "info",
          texto: `No se encontraron artículos que coincidan con "${termino}".`,
        });
      }
    } catch (error) {
      setMensaje({
        tipo: "danger",
        texto: obtenerMensajeArticuloError(
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

  async function confirmarEliminacion(articulo) {
    const confirmado = window.confirm(
      `¿Eliminar el artículo "${articulo.nombre}"?\n\nEsta acción no se puede deshacer.`,
    );

    if (!confirmado) {
      return;
    }

    setEliminandoId(articulo.idArticulo);
    setMensaje(null);

    try {
      await eliminarArticulo(articulo.idArticulo);

      if (
        Number(idEditando) ===
        Number(articulo.idArticulo)
      ) {
        limpiarFormulario();
      }

      setMensaje({
        tipo: "success",
        texto: "Artículo eliminado correctamente.",
      });

      await cargarTodos();
    } catch (error) {
      setMensaje({
        tipo: "danger",
        texto: obtenerMensajeArticuloError(
          error,
          "No fue posible eliminar el artículo.",
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
          <h1>Artículos</h1>
          <p>
            Registro y mantenimiento de productos del
            inventario.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-primary"
          onClick={iniciarNuevo}
        >
          Nuevo artículo
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
                  ? `Modificar artículo #${idEditando}`
                  : "Nuevo artículo"}
              </h2>

              <form
                onSubmit={guardarArticulo}
                noValidate
              >
                {estaEditando && (
                  <div className="mb-3">
                    <label
                      className="form-label"
                      htmlFor="idArticulo"
                    >
                      ID
                    </label>

                    <input
                      id="idArticulo"
                      className="form-control"
                      value={idEditando}
                      disabled
                    />
                  </div>
                )}

                <div className="mb-3">
                  <label
                    className="form-label"
                    htmlFor="nombreArticulo"
                  >
                    Nombre
                  </label>

                  <input
                    id="nombreArticulo"
                    name="nombre"
                    type="text"
                    className="form-control"
                    value={formulario.nombre}
                    onChange={actualizarCampo}
                    maxLength={100}
                    placeholder="Ej. Teclado mecánico"
                    disabled={guardando}
                    required
                  />
                </div>

                <div className="mb-4">
                  <label
                    className="form-label"
                    htmlFor="precioArticulo"
                  >
                    Precio
                  </label>

                  <div className="input-group">
                    <span className="input-group-text">
                      $
                    </span>

                    <input
                      id="precioArticulo"
                      name="precio"
                      type="number"
                      className="form-control"
                      value={formulario.precio}
                      onChange={actualizarCampo}
                      min="0.01"
                      step="0.01"
                      placeholder="0.00"
                      disabled={guardando}
                      required
                    />
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
                  Listado de artículos
                </h2>

                <span className="badge text-bg-primary">
                  {articulos.length} registro
                  {articulos.length === 1 ? "" : "s"}
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
                      setBusqueda(event.target.value)
                    }
                    placeholder="Buscar artículo por nombre"
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
                    Cargando artículos...
                  </p>
                </div>
              ) : articulos.length === 0 ? (
                <div className="text-center py-5">
                  <h3 className="h6">
                    No existen artículos para mostrar
                  </h3>

                  <p className="text-secondary mb-0">
                    Registra un artículo o cambia la búsqueda.
                  </p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Nombre</th>
                        <th>Precio</th>
                        <th>Fecha</th>
                        <th className="text-end">
                          Acciones
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {articulos.map((articulo) => (
                        <tr key={articulo.idArticulo}>
                          <td>{articulo.idArticulo}</td>
                          <td>{articulo.nombre}</td>
                          <td>
                            {formatearPrecio(
                              articulo.precio,
                            )}
                          </td>
                          <td>
                            {formatearFecha(
                              articulo.fechaCreacion,
                            )}
                          </td>

                          <td>
                            <div className="d-flex justify-content-end gap-2">
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-primary"
                                onClick={() =>
                                  seleccionarParaEditar(
                                    articulo,
                                  )
                                }
                                disabled={
                                  eliminandoId ===
                                  articulo.idArticulo
                                }
                              >
                                Modificar
                              </button>

                              <button
                                type="button"
                                className="btn btn-sm btn-outline-danger"
                                onClick={() =>
                                  confirmarEliminacion(
                                    articulo,
                                  )
                                }
                                disabled={
                                  eliminandoId ===
                                  articulo.idArticulo
                                }
                              >
                                {eliminandoId ===
                                articulo.idArticulo
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