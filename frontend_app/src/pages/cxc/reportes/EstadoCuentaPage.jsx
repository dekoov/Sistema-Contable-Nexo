import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  obtenerEstadoCuenta,
  obtenerMensajeReporteCxcError,
} from "../../../api/reportesCxcApi";

function formatearFechaInput(fecha) {
  const anio = fecha.getFullYear();

  const mes = String(
    fecha.getMonth() + 1,
  ).padStart(2, "0");

  const dia = String(
    fecha.getDate(),
  ).padStart(2, "0");

  return `${anio}-${mes}-${dia}`;
}

function obtenerRangoInicial() {
  const hoy = new Date();

  const inicio = new Date(
    hoy.getFullYear(),
    hoy.getMonth(),
    1,
  );

  return {
    inicio: formatearFechaInput(inicio),
    fin: formatearFechaInput(hoy),
  };
}

const RANGO_INICIAL = obtenerRangoInicial();

function formatearDinero(valor) {
  return new Intl.NumberFormat("es-EC", {
    style: "currency",
    currency: "USD",
  }).format(Number(valor) || 0);
}

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

function obtenerPresentacionEstado(estado) {
  switch (estado) {
    case "PAGADA":
      return {
        texto: "Pagada",
        clase: "text-bg-success",
      };

    case "PARCIAL":
      return {
        texto: "Pago parcial",
        clase: "text-bg-warning",
      };

    case "PENDIENTE":
      return {
        texto: "Pendiente",
        clase: "text-bg-danger",
      };

    default:
      return {
        texto: "Sin valor",
        clase: "text-bg-secondary",
      };
  }
}

function escaparCsv(valor) {
  const texto = String(valor ?? "");

  return `"${texto.replaceAll('"', '""')}"`;
}

export default function EstadoCuentaPage() {
  const [fechaInicio, setFechaInicio] =
    useState(RANGO_INICIAL.inicio);

  const [fechaFin, setFechaFin] =
    useState(RANGO_INICIAL.fin);

  const [estadoCuenta, setEstadoCuenta] =
    useState([]);

  const [busqueda, setBusqueda] =
    useState("");

  const [filtroEstado, setFiltroEstado] =
    useState("TODOS");

  const [cargando, setCargando] =
    useState(true);

  const [mensaje, setMensaje] =
    useState(null);

  const cargarReporte = useCallback(async () => {
    if (!fechaInicio || !fechaFin) {
      setMensaje({
        tipo: "warning",
        texto:
          "Debe seleccionar la fecha inicial y la fecha final.",
      });

      return;
    }

    if (fechaInicio > fechaFin) {
      setMensaje({
        tipo: "warning",
        texto:
          "La fecha inicial no puede ser posterior a la fecha final.",
      });

      return;
    }

    setCargando(true);
    setMensaje(null);

    try {
      const data = await obtenerEstadoCuenta(
        fechaInicio,
        fechaFin,
      );

      setEstadoCuenta(data);
    } catch (error) {
      setMensaje({
        tipo: "danger",

        texto:
          obtenerMensajeReporteCxcError(
            error,
            "No fue posible obtener el estado de cuenta.",
          ),
      });
    } finally {
      setCargando(false);
    }
  }, [fechaInicio, fechaFin]);

  useEffect(() => {
    cargarReporte();
  }, [cargarReporte]);

  const registrosFiltrados = useMemo(() => {
    const termino = busqueda
      .trim()
      .toLowerCase();

    return estadoCuenta.filter((fila) => {
      const coincideBusqueda =
        !termino ||
        fila.numeroFactura
          .toLowerCase()
          .includes(termino) ||
        fila.cliente?.nombre
          ?.toLowerCase()
          .includes(termino) ||
        fila.cliente?.cedula
          ?.toLowerCase()
          .includes(termino);

      const coincideEstado =
        filtroEstado === "TODOS" ||
        fila.estado === filtroEstado;

      return (
        coincideBusqueda &&
        coincideEstado
      );
    });
  }, [
    estadoCuenta,
    busqueda,
    filtroEstado,
  ]);

  const totalFacturado = useMemo(() => {
    return estadoCuenta.reduce(
      (total, fila) =>
        total +
        Number(fila.valorFactura || 0),
      0,
    );
  }, [estadoCuenta]);

  const totalPagado = useMemo(() => {
    return estadoCuenta.reduce(
      (total, fila) =>
        total +
        Number(fila.totalPagado || 0),
      0,
    );
  }, [estadoCuenta]);

  const totalPendiente = useMemo(() => {
    return estadoCuenta.reduce(
      (total, fila) =>
        total +
        Number(fila.saldoPorCobrar || 0),
      0,
    );
  }, [estadoCuenta]);

  const facturasPendientes = useMemo(() => {
    return estadoCuenta.filter(
      (fila) => fila.saldoPorCobrar > 0.001,
    ).length;
  }, [estadoCuenta]);

  const porcentajeCobrado =
    totalFacturado > 0
      ? (totalPagado / totalFacturado) * 100
      : 0;

  function exportarCsv() {
    if (registrosFiltrados.length === 0) {
      setMensaje({
        tipo: "warning",
        texto:
          "No existen registros para exportar.",
      });

      return;
    }

    const filas = [
      [
        "Número de factura",
        "Fecha",
        "Cliente",
        "Cédula",
        "Valor factura",
        "Total pagado",
        "Saldo por cobrar",
        "Estado",
      ],

      ...registrosFiltrados.map((fila) => [
        fila.numeroFactura,
        fila.fecha,
        fila.cliente?.nombre ?? "",
        fila.cliente?.cedula ?? "",
        Number(
          fila.valorFactura,
        ).toFixed(2),
        Number(
          fila.totalPagado,
        ).toFixed(2),
        Number(
          fila.saldoPorCobrar,
        ).toFixed(2),
        obtenerPresentacionEstado(
          fila.estado,
        ).texto,
      ]),

      [
        "",
        "",
        "",
        "TOTALES",
        totalFacturado.toFixed(2),
        totalPagado.toFixed(2),
        totalPendiente.toFixed(2),
        "",
      ],
    ];

    const contenido = filas
      .map((fila) =>
        fila.map(escaparCsv).join(","),
      )
      .join("\n");

    const blob = new Blob(
      [`\uFEFF${contenido}`],
      {
        type: "text/csv;charset=utf-8;",
      },
    );

    const url = URL.createObjectURL(blob);

    const enlace =
      document.createElement("a");

    enlace.href = url;

    enlace.download =
      `estado-cuenta-${fechaInicio}-${fechaFin}.csv`;

    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();

    URL.revokeObjectURL(url);
  }

  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Estado de cuenta</h1>

          <p>
            Valores facturados, pagos registrados
            y saldos pendientes por factura.
          </p>
        </div>

        <div className="d-flex flex-wrap gap-2">
          <button
            type="button"
            className="btn btn-outline-primary"
            onClick={cargarReporte}
            disabled={cargando}
          >
            {cargando
              ? "Consultando..."
              : "Actualizar"}
          </button>

          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={() => window.print()}
            disabled={cargando}
          >
            Imprimir
          </button>

          <button
            type="button"
            className="btn btn-success"
            onClick={exportarCsv}
            disabled={
              cargando ||
              registrosFiltrados.length === 0
            }
          >
            Exportar CSV
          </button>
        </div>
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

      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body p-4">
          <h2 className="h5 mb-3">
            Rango de facturación
          </h2>

          <div className="row g-3 align-items-end">
            <div className="col-12 col-md-4">
              <label
                className="form-label"
                htmlFor="fechaInicioEstado"
              >
                Desde
              </label>

              <input
                id="fechaInicioEstado"
                type="date"
                className="form-control"
                value={fechaInicio}
                onChange={(event) =>
                  setFechaInicio(
                    event.target.value,
                  )
                }
                disabled={cargando}
              />
            </div>

            <div className="col-12 col-md-4">
              <label
                className="form-label"
                htmlFor="fechaFinEstado"
              >
                Hasta
              </label>

              <input
                id="fechaFinEstado"
                type="date"
                className="form-control"
                value={fechaFin}
                onChange={(event) =>
                  setFechaFin(
                    event.target.value,
                  )
                }
                disabled={cargando}
              />
            </div>

            <div className="col-12 col-md-4">
              <button
                type="button"
                className="btn btn-primary w-100"
                onClick={cargarReporte}
                disabled={cargando}
              >
                Generar estado de cuenta
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4 mb-4">
        <div className="col-6 col-xl-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <p className="text-secondary mb-2">
                Total facturado
              </p>

              <h2 className="h4 mb-0">
                {formatearDinero(
                  totalFacturado,
                )}
              </h2>
            </div>
          </div>
        </div>

        <div className="col-6 col-xl-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <p className="text-secondary mb-2">
                Total cobrado
              </p>

              <h2 className="h4 mb-0 text-success">
                {formatearDinero(
                  totalPagado,
                )}
              </h2>
            </div>
          </div>
        </div>

        <div className="col-6 col-xl-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <p className="text-secondary mb-2">
                Saldo pendiente
              </p>

              <h2 className="h4 mb-0 text-danger">
                {formatearDinero(
                  totalPendiente,
                )}
              </h2>
            </div>
          </div>
        </div>

        <div className="col-6 col-xl-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <p className="text-secondary mb-2">
                Facturas pendientes
              </p>

              <h2 className="h4 mb-1">
                {facturasPendientes}
              </h2>

              <small className="text-secondary">
                {porcentajeCobrado.toFixed(2)}%
                cobrado
              </small>
            </div>
          </div>
        </div>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-body p-4">
          <div className="row g-3 mb-4">
            <div className="col-12 col-lg">
              <input
                type="search"
                className="form-control"
                value={busqueda}
                onChange={(event) =>
                  setBusqueda(
                    event.target.value,
                  )
                }
                placeholder="Buscar factura, cliente o cédula"
                disabled={cargando}
              />
            </div>

            <div className="col-12 col-lg-3">
              <select
                className="form-select"
                value={filtroEstado}
                onChange={(event) =>
                  setFiltroEstado(
                    event.target.value,
                  )
                }
                disabled={cargando}
              >
                <option value="TODOS">
                  Todos los estados
                </option>

                <option value="PENDIENTE">
                  Pendientes
                </option>

                <option value="PARCIAL">
                  Pagos parciales
                </option>

                <option value="PAGADA">
                  Pagadas
                </option>
              </select>
            </div>
          </div>

          <div className="d-flex justify-content-between align-items-center mb-3">
            <h2 className="h5 mb-0">
              Saldos por factura
            </h2>

            <span className="badge text-bg-primary">
              {registrosFiltrados.length}{" "}
              resultado
              {registrosFiltrados.length === 1
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
                Calculando saldos...
              </p>
            </div>
          ) : registrosFiltrados.length === 0 ? (
            <div className="text-center py-5">
              <h3 className="h6">
                No existen facturas para mostrar
              </h3>

              <p className="text-secondary mb-0">
                Cambia el rango, los filtros o
                registra nuevas facturas.
              </p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead>
                  <tr>
                    <th>Factura</th>
                    <th className="text-end">
                      Valor factura
                    </th>
                    <th className="text-end">
                      Total pagado
                    </th>
                    <th className="text-end">
                      Saldo
                    </th>
                    <th>Estado</th>
                  </tr>
                </thead>

                <tbody>
                  {registrosFiltrados.map(
                    (fila) => {
                      const presentacion =
                        obtenerPresentacionEstado(
                          fila.estado,
                        );

                      return (
                        <tr
                          key={
                            fila.idFactura ??
                            fila.numeroFactura
                          }
                        >
                          <td>
                            <strong>
                              {
                                fila.numeroFactura
                              }
                            </strong>
                          </td>

                          <td className="text-end">
                            {formatearDinero(
                              fila.valorFactura,
                            )}
                          </td>

                          <td className="text-end text-success">
                            {formatearDinero(
                              fila.totalPagado,
                            )}
                          </td>

                          <td
                            className={`text-end fw-bold ${
                              fila.saldoPorCobrar >
                              0
                                ? "text-danger"
                                : "text-success"
                            }`}
                          >
                            {formatearDinero(
                              fila.saldoPorCobrar,
                            )}
                          </td>

                          <td>
                            <span
                              className={`badge ${presentacion.clase}`}
                            >
                              {
                                presentacion.texto
                              }
                            </span>
                          </td>
                        </tr>
                      );
                    },
                  )}
                </tbody>

                <tfoot>
                  <tr>
                    <th colSpan="1">
                      Totales generales
                    </th>

                    <th className="text-end">
                      {formatearDinero(
                        totalFacturado,
                      )}
                    </th>

                    <th className="text-end text-success">
                      {formatearDinero(
                        totalPagado,
                      )}
                    </th>

                    <th className="text-end text-danger">
                      {formatearDinero(
                        totalPendiente,
                      )}
                    </th>

                    <th />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}