import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { Link } from "react-router-dom";

import {
  importarMensajeCola,
  listarHistorialIntegracion,
  listarMensajesCola,
  obtenerMensajeIntegracionError,
} from "../../api/integracionApi";

function formatearDinero(valor) {
  return new Intl.NumberFormat("es-EC", {
    style: "currency",
    currency: "USD",
  }).format(Number(valor) || 0);
}

function formatearFechaHora(valor) {
  if (!valor) {
    return "Sin fecha";
  }

  const fecha = new Date(valor);

  if (
    Number.isNaN(fecha.getTime())
  ) {
    return valor;
  }

  return new Intl.DateTimeFormat(
    "es-EC",
    {
      dateStyle: "short",
      timeStyle: "medium",
    },
  ).format(fecha);
}

function obtenerTotalUnidades(mensaje) {
  const detalles = Array.isArray(
    mensaje.payload?.detalles,
  )
    ? mensaje.payload.detalles
    : [];

  return detalles.reduce(
    (total, detalle) =>
      total +
      Number(detalle.cantidad || 0),
    0,
  );
}

function obtenerTotalMensaje(mensaje) {
  const valorRegistrado = Number(
    mensaje.payload?.valorTotal,
  );

  if (
    Number.isFinite(valorRegistrado) &&
    valorRegistrado > 0
  ) {
    return valorRegistrado;
  }

  const detalles = Array.isArray(
    mensaje.payload?.detalles,
  )
    ? mensaje.payload.detalles
    : [];

  return detalles.reduce(
    (total, detalle) =>
      total +
      Number(detalle.cantidad || 0) *
        Number(detalle.precio || 0),
    0,
  );
}

function resumirId(idMensaje) {
  if (!idMensaje) {
    return "";
  }

  if (idMensaje.length <= 16) {
    return idMensaje;
  }

  return `${idMensaje.slice(
    0,
    8,
  )}…${idMensaje.slice(-6)}`;
}

export default function IntegracionColaPage() {
  const [mensajes, setMensajes] =
    useState([]);

  const [historial, setHistorial] =
    useState([]);

  const [
    idMensajeSeleccionado,
    setIdMensajeSeleccionado,
  ] = useState(null);

  const [cargando, setCargando] =
    useState(true);

  const [importandoId, setImportandoId] =
    useState(null);

  const [mensaje, setMensaje] =
    useState(null);

  const cargarDatos = useCallback(
    async () => {
      setCargando(true);

      try {
        const [
          mensajesData,
          historialData,
        ] = await Promise.all([
          listarMensajesCola(),
          listarHistorialIntegracion(),
        ]);

        setMensajes(mensajesData);
        setHistorial(historialData);

        setIdMensajeSeleccionado(
          (actual) => {
            const sigueExistiendo =
              mensajesData.some(
                (item) =>
                  item.idMensaje === actual,
              );

            if (sigueExistiendo) {
              return actual;
            }

            return (
              mensajesData[0]?.idMensaje ??
              null
            );
          },
        );
      } catch (error) {
        setMensaje({
          tipo: "danger",
          texto:
            obtenerMensajeIntegracionError(
              error,
              "No fue posible consultar la cola.",
            ),
        });
      } finally {
        setCargando(false);
      }
    },
    [],
  );

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const mensajeSeleccionado =
    useMemo(() => {
      return (
        mensajes.find(
          (item) =>
            item.idMensaje ===
            idMensajeSeleccionado,
        ) ?? null
      );
    }, [
      mensajes,
      idMensajeSeleccionado,
    ]);

  const totalUnidadesPendientes =
    useMemo(() => {
      return mensajes.reduce(
        (total, item) =>
          total +
          obtenerTotalUnidades(item),
        0,
      );
    }, [mensajes]);

  const totalPendiente = useMemo(() => {
    return mensajes.reduce(
      (total, item) =>
        total +
        obtenerTotalMensaje(item),
      0,
    );
  }, [mensajes]);

  async function importarMensaje(
    mensajeCola,
  ) {
    const confirmado = window.confirm(
      `¿Importar la factura "${mensajeCola.payload?.numeroFactura}" hacia Inventario?\n\nSe creará un comprobante de egreso y el mensaje desaparecerá de la cola.`,
    );

    if (!confirmado) {
      return;
    }

    setImportandoId(
      mensajeCola.idMensaje,
    );

    setMensaje(null);

    try {
      const resultado =
        await importarMensajeCola(
          mensajeCola.idMensaje,
        );

      await cargarDatos();

      setMensaje({
        tipo: "success",
        texto:
          `Transacción importada correctamente. Se creó el comprobante "${resultado.comprobanteGenerado?.numeroComprobante}".`,
      });
    } catch (error) {
      setMensaje({
        tipo: "danger",
        texto:
          obtenerMensajeIntegracionError(
            error,
            "No fue posible importar la transacción.",
          ),
      });
    } finally {
      setImportandoId(null);
    }
  }

  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Integración JMS</h1>

          <p>
            Cola de facturas pendientes de
            importación hacia Inventario.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-outline-primary"
          onClick={cargarDatos}
          disabled={cargando}
        >
          {cargando
            ? "Consultando..."
            : "Consultar cola"}
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

      <div className="row g-4 mb-4">
        <div className="col-12 col-md-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <p className="text-secondary mb-2">
                Mensajes pendientes
              </p>

              <h2 className="h3 mb-0">
                {mensajes.length}
              </h2>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <p className="text-secondary mb-2">
                Unidades pendientes
              </p>

              <h2 className="h3 mb-0">
                {totalUnidadesPendientes}
              </h2>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <p className="text-secondary mb-2">
                Valor pendiente
              </p>

              <h2 className="h4 mb-0">
                {formatearDinero(
                  totalPendiente,
                )}
              </h2>
            </div>
          </div>
        </div>
      </div>

      <div className="d-flex flex-wrap gap-2 mb-4">
        <Link
          to="/facturacion/facturas"
          className="btn btn-outline-primary"
        >
          Ir a Facturación
        </Link>

        <Link
          to="/inventario/comprobantes"
          className="btn btn-outline-primary"
        >
          Ir a Comprobantes
        </Link>

        <Link
          to="/inventario/reportes/movimientos"
          className="btn btn-outline-primary"
        >
          Ver stock de inventario
        </Link>
      </div>

      <div className="row g-4 mb-4">
        <div className="col-12 col-xl-8">
          <div className="card border-0 shadow-sm">
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                  <h2 className="h5 mb-1">
                    Cola de mensajes
                  </h2>

                  <small className="text-secondary">
                    jms/facturaCreadaQueue
                  </small>
                </div>

                <span className="badge text-bg-warning">
                  {mensajes.length} pendiente
                  {mensajes.length === 1
                    ? ""
                    : "s"}
                </span>
              </div>

              {cargando ? (
                <div className="text-center py-5">
                  <div
                    className="spinner-border text-primary"
                    role="status"
                  />

                  <p className="text-secondary mt-3 mb-0">
                    Consultando cola...
                  </p>
                </div>
              ) : mensajes.length === 0 ? (
                <div className="alert alert-success mb-0">
                  <strong>
                    Cola vacía.
                  </strong>{" "}
                  No existen transacciones pendientes
                  de importación.
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle">
                    <thead>
                      <tr>
                        <th>Mensaje</th>
                        <th>Factura</th>
                        <th>Publicación</th>
                        <th>Detalles</th>
                        <th>Total</th>

                        <th className="text-end">
                          Acciones
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {mensajes.map(
                        (mensajeCola) => (
                          <tr
                            key={
                              mensajeCola.idMensaje
                            }
                            className={
                              mensajeCola.idMensaje ===
                              idMensajeSeleccionado
                                ? "table-active"
                                : ""
                            }
                          >
                            <td>
                              <code
                                title={
                                  mensajeCola.idMensaje
                                }
                              >
                                {resumirId(
                                  mensajeCola.idMensaje,
                                )}
                              </code>
                            </td>

                            <td>
                              <strong>
                                {
                                  mensajeCola
                                    .payload
                                    ?.numeroFactura
                                }
                              </strong>

                              <small className="d-block text-secondary">
                                ID factura:{" "}
                                {
                                  mensajeCola
                                    .payload
                                    ?.idFactura
                                }
                              </small>
                            </td>

                            <td>
                              {formatearFechaHora(
                                mensajeCola.fechaPublicacion,
                              )}
                            </td>

                            <td>
                              {
                                mensajeCola
                                  .payload
                                  ?.detalles
                                  ?.length
                              }{" "}
                              línea
                              {mensajeCola
                                .payload
                                ?.detalles
                                ?.length === 1
                                ? ""
                                : "s"}
                            </td>

                            <td>
                              {formatearDinero(
                                obtenerTotalMensaje(
                                  mensajeCola,
                                ),
                              )}
                            </td>

                            <td>
                              <div className="d-flex justify-content-end gap-2">
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-primary"
                                  onClick={() =>
                                    setIdMensajeSeleccionado(
                                      mensajeCola.idMensaje,
                                    )
                                  }
                                >
                                  Ver
                                </button>

                                <button
                                  type="button"
                                  className="btn btn-sm btn-success"
                                  onClick={() =>
                                    importarMensaje(
                                      mensajeCola,
                                    )
                                  }
                                  disabled={
                                    importandoId ===
                                    mensajeCola.idMensaje
                                  }
                                >
                                  {importandoId ===
                                  mensajeCola.idMensaje
                                    ? "Importando..."
                                    : "Importar"}
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

        <div className="col-12 col-xl-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body p-4">
              <h2 className="h5 mb-4">
                Contenido del mensaje
              </h2>

              {!mensajeSeleccionado ? (
                <p className="text-secondary mb-0">
                  Selecciona un mensaje de la cola
                  para consultar su contenido.
                </p>
              ) : (
                <>
                  <dl className="row small">
                    <dt className="col-5">
                      Evento
                    </dt>

                    <dd className="col-7">
                      {
                        mensajeSeleccionado.tipoEvento
                      }
                    </dd>

                    <dt className="col-5">
                      Origen
                    </dt>

                    <dd className="col-7">
                      {
                        mensajeSeleccionado.origen
                      }
                    </dd>

                    <dt className="col-5">
                      Destino
                    </dt>

                    <dd className="col-7">
                      {
                        mensajeSeleccionado.destino
                      }
                    </dd>

                    <dt className="col-5">
                      Estado
                    </dt>

                    <dd className="col-7">
                      <span className="badge text-bg-warning">
                        {
                          mensajeSeleccionado.estado
                        }
                      </span>
                    </dd>
                  </dl>

                  <pre
                    className="bg-light border rounded p-3 small overflow-auto"
                    style={{
                      maxHeight: "420px",
                    }}
                  >
                    {JSON.stringify(
                      mensajeSeleccionado.payload,
                      null,
                      2,
                    )}
                  </pre>

                  <button
                    type="button"
                    className="btn btn-success w-100"
                    onClick={() =>
                      importarMensaje(
                        mensajeSeleccionado,
                      )
                    }
                    disabled={
                      importandoId ===
                      mensajeSeleccionado.idMensaje
                    }
                  >
                    {importandoId ===
                    mensajeSeleccionado.idMensaje
                      ? "Importando..."
                      : "Importar en Inventario"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-body p-4">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2 className="h5 mb-0">
              Historial de integración
            </h2>

            <span className="badge text-bg-success">
              {historial.length} procesado
              {historial.length === 1
                ? ""
                : "s"}
            </span>
          </div>

          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead>
                <tr>
                  <th>Factura</th>
                  <th>Comprobante generado</th>
                  <th>Fecha de procesamiento</th>
                  <th>Estado</th>
                </tr>
              </thead>

              <tbody>
                {historial
                  .slice(0, 20)
                  .map((registro) => (
                    <tr
                      key={
                        registro.idMensaje
                      }
                    >
                      <td>
                        {
                          registro.payload
                            ?.numeroFactura
                        }
                      </td>

                      <td>
                        {registro
                          .comprobanteGenerado
                          ?.numeroComprobante ??
                          "Sin comprobante"}
                      </td>

                      <td>
                        {formatearFechaHora(
                          registro.fechaProcesamiento,
                        )}
                      </td>

                      <td>
                        <span className="badge text-bg-success">
                          {
                            registro.estado
                          }
                        </span>
                      </td>
                    </tr>
                  ))}

                {historial.length === 0 && (
                  <tr>
                    <td
                      colSpan="4"
                      className="text-center text-secondary py-4"
                    >
                      Todavía no se han procesado
                      mensajes.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}