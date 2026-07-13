import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  actualizarFormaPago,
  buscarFormasPago,
  crearFormaPago,
  eliminarFormaPago,
  listarFormasPago,
  obtenerMensajeFormaPagoError,
} from "../../api/formasPagoApi";

const FORMULARIO_INICIAL = {
  nombre: "",
};

export default function FormasPagoPage() {
  const [formasPago, setFormasPago] =
    useState([]);

  const [formulario, setFormulario] =
    useState(FORMULARIO_INICIAL);

  const [codigoEditando, setCodigoEditando] =
    useState(null);

  const [busqueda, setBusqueda] =
    useState("");

  const [cargando, setCargando] =
    useState(true);

  const [guardando, setGuardando] =
    useState(false);

  const [eliminandoCodigo, setEliminandoCodigo] =
    useState(null);

  const [mensaje, setMensaje] =
    useState(null);

  const estaEditando = codigoEditando !== null;

  const cargarTodas = useCallback(async () => {
    setCargando(true);

    try {
      const data = await listarFormasPago();
      setFormasPago(data);
    } catch (error) {
      setMensaje({
        tipo: "danger",
        texto: obtenerMensajeFormaPagoError(
          error,
          "No fue posible cargar las formas de pago.",
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
    setCodigoEditando(null);
  }

  function iniciarNueva() {
    limpiarFormulario();
    setMensaje(null);
  }

  function seleccionarParaEditar(formaPago) {
    setCodigoEditando(formaPago.codigo);

    setFormulario({
      nombre: formaPago.nombre,
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
      return "El nombre de la forma de pago es obligatorio.";
    }

    if (nombre.length < 2) {
      return "El nombre debe contener al menos 2 caracteres.";
    }

    if (nombre.length > 50) {
      return "El nombre no puede superar los 50 caracteres.";
    }

    return null;
  }

  async function guardarFormaPago(event) {
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
        await actualizarFormaPago(
          codigoEditando,
          formulario,
        );

        setMensaje({
          tipo: "success",
          texto:
            "Forma de pago modificada correctamente.",
        });
      } else {
        await crearFormaPago(formulario);

        setMensaje({
          tipo: "success",
          texto:
            "Forma de pago registrada correctamente.",
        });
      }

      limpiarFormulario();
      await cargarTodas();
    } catch (error) {
      setMensaje({
        tipo: "danger",
        texto: obtenerMensajeFormaPagoError(
          error,
          "No fue posible guardar la forma de pago.",
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
        await buscarFormasPago(busqueda);

      setFormasPago(resultados);

      if (
        busqueda.trim() &&
        resultados.length === 0
      ) {
        setMensaje({
          tipo: "info",
          texto: `No se encontraron formas de pago que coincidan con "${busqueda.trim()}".`,
        });
      }
    } catch (error) {
      setMensaje({
        tipo: "danger",
        texto: obtenerMensajeFormaPagoError(
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

  async function confirmarEliminacion(formaPago) {
    const confirmado = window.confirm(
      `¿Eliminar la forma de pago "${formaPago.nombre}"?\n\nEsta acción no se puede deshacer.`,
    );

    if (!confirmado) {
      return;
    }

    setEliminandoCodigo(formaPago.codigo);
    setMensaje(null);

    try {
      await eliminarFormaPago(
        formaPago.codigo,
      );

      if (
        Number(codigoEditando) ===
        Number(formaPago.codigo)
      ) {
        limpiarFormulario();
      }

      setMensaje({
        tipo: "success",
        texto:
          "Forma de pago eliminada correctamente.",
      });

      await cargarTodas();
    } catch (error) {
      setMensaje({
        tipo: "danger",
        texto: obtenerMensajeFormaPagoError(
          error,
          "No fue posible eliminar la forma de pago.",
        ),
      });
    } finally {
      setEliminandoCodigo(null);
    }
  }

  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Formas de pago</h1>

          <p>
            Administración de los métodos utilizados
            para registrar pagos.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-primary"
          onClick={iniciarNueva}
        >
          Nueva forma de pago
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
                  ? `Modificar forma de pago #${codigoEditando}`
                  : "Nueva forma de pago"}
              </h2>

              <form
                onSubmit={guardarFormaPago}
                noValidate
              >
                {estaEditando && (
                  <div className="mb-3">
                    <label
                      className="form-label"
                      htmlFor="codigoFormaPago"
                    >
                      Código
                    </label>

                    <input
                      id="codigoFormaPago"
                      className="form-control"
                      value={codigoEditando}
                      disabled
                    />
                  </div>
                )}

                <div className="mb-4">
                  <label
                    className="form-label"
                    htmlFor="nombreFormaPago"
                  >
                    Nombre
                  </label>

                  <input
                    id="nombreFormaPago"
                    name="nombre"
                    type="text"
                    className="form-control"
                    value={formulario.nombre}
                    onChange={(event) =>
                      setFormulario({
                        nombre: event.target.value,
                      })
                    }
                    maxLength={50}
                    placeholder="Ej. Transferencia bancaria"
                    disabled={guardando}
                    required
                  />

                  <div className="form-text text-end">
                    {formulario.nombre.length}/50
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
                  Listado de formas de pago
                </h2>

                <span className="badge text-bg-primary">
                  {formasPago.length} registro
                  {formasPago.length === 1
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
                    placeholder="Buscar por código o nombre"
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
                    Cargando formas de pago...
                  </p>
                </div>
              ) : formasPago.length === 0 ? (
                <div className="text-center py-5">
                  <h3 className="h6">
                    No existen formas de pago
                  </h3>

                  <p className="text-secondary mb-0">
                    Registra una forma de pago o modifica
                    la búsqueda.
                  </p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle">
                    <thead>
                      <tr>
                        <th>Código</th>
                        <th>Nombre</th>

                        <th className="text-end">
                          Acciones
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {formasPago.map((formaPago) => (
                        <tr key={formaPago.codigo}>
                          <td>{formaPago.codigo}</td>
                          <td>{formaPago.nombre}</td>

                          <td>
                            <div className="d-flex justify-content-end gap-2">
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-primary"
                                onClick={() =>
                                  seleccionarParaEditar(
                                    formaPago,
                                  )
                                }
                                disabled={
                                  eliminandoCodigo ===
                                  formaPago.codigo
                                }
                              >
                                Modificar
                              </button>

                              <button
                                type="button"
                                className="btn btn-sm btn-outline-danger"
                                onClick={() =>
                                  confirmarEliminacion(
                                    formaPago,
                                  )
                                }
                                disabled={
                                  eliminandoCodigo ===
                                  formaPago.codigo
                                }
                              >
                                {eliminandoCodigo ===
                                formaPago.codigo
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