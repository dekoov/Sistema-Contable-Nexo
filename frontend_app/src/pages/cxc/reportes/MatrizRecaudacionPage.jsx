import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  obtenerMatrizRecaudacion,
  obtenerMensajeReporteCxcError,
} from "../../../api/reportesCxcApi";

import {
  listarFormasPago,
} from "../../../api/formasPagoApi";

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

function escaparCsv(valor) {
  const texto = String(valor ?? "");

  return `"${texto.replaceAll('"', '""')}"`;
}

function normalizarClave(valor) {
  return String(valor ?? "")
    .trim()
    .toLowerCase();
}

export default function MatrizRecaudacionPage() {
  const [fechaInicio, setFechaInicio] =
    useState(RANGO_INICIAL.inicio);

  const [fechaFin, setFechaFin] =
    useState(RANGO_INICIAL.fin);

  const [registros, setRegistros] =
    useState([]);

  const [formasPago, setFormasPago] =
    useState([]);

  const [busqueda, setBusqueda] =
    useState("");

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
      const [
        matrizData,
        formasPagoData,
      ] = await Promise.all([
        obtenerMatrizRecaudacion(
          fechaInicio,
          fechaFin,
        ),

        listarFormasPago(),
      ]);

      setRegistros(matrizData);
      setFormasPago(formasPagoData);
    } catch (error) {
      setMensaje({
        tipo: "danger",
        texto:
          obtenerMensajeReporteCxcError(
            error,
            "No fue posible generar la matriz de recaudación.",
          ),
      });
    } finally {
      setCargando(false);
    }
  }, [fechaInicio, fechaFin]);

  useEffect(() => {
    cargarReporte();
  }, [cargarReporte]);

  const formasPagoReporte = useMemo(() => {
    const catalogo = new Map();

    formasPago.forEach((formaPago) => {
      catalogo.set(
        normalizarClave(formaPago.nombre),
        {
          codigo: formaPago.codigo,
          nombre: formaPago.nombre,
        },
      );
    });

    registros.forEach((registro) => {
      const clave = normalizarClave(
        registro.formaPago,
      );

      if (!catalogo.has(clave)) {
        catalogo.set(clave, {
          codigo:
            registro.codigoFormaPago,
          nombre: registro.formaPago,
        });
      }
    });

    return Array.from(
      catalogo.values(),
    ).sort((a, b) =>
      a.nombre.localeCompare(b.nombre),
    );
  }, [formasPago, registros]);

  const mapaRecaudacion = useMemo(() => {
    const mapa = new Map();

    registros.forEach((registro) => {
      const clave = [
        normalizarClave(
          registro.nombreCobrador,
        ),
        normalizarClave(
          registro.formaPago,
        ),
      ].join("::");

      const totalActual =
        mapa.get(clave) ?? 0;

      mapa.set(
        clave,
        totalActual +
          Number(registro.total || 0),
      );
    });

    return mapa;
  }, [registros]);

  function obtenerValor(
    nombreCobrador,
    nombreFormaPago,
  ) {
    const clave = [
      normalizarClave(nombreCobrador),
      normalizarClave(nombreFormaPago),
    ].join("::");

    return Number(
      mapaRecaudacion.get(clave) ?? 0,
    );
  }

  const cobradoresReporte = useMemo(() => {
    const catalogo = new Map();

    registros.forEach((registro) => {
      const clave = normalizarClave(
        registro.nombreCobrador,
      );

      if (!catalogo.has(clave)) {
        catalogo.set(clave, {
          idCobrador:
            registro.idCobrador,
          nombreCobrador:
            registro.nombreCobrador,
        });
      }
    });

    const cobradores = Array.from(
      catalogo.values(),
    );

    return cobradores.sort((a, b) => {
      const totalA = formasPagoReporte.reduce(
        (total, formaPago) =>
          total +
          obtenerValor(
            a.nombreCobrador,
            formaPago.nombre,
          ),
        0,
      );

      const totalB = formasPagoReporte.reduce(
        (total, formaPago) =>
          total +
          obtenerValor(
            b.nombreCobrador,
            formaPago.nombre,
          ),
        0,
      );

      return totalB - totalA;
    });
  }, [
    registros,
    formasPagoReporte,
    mapaRecaudacion,
  ]);

  const cobradoresFiltrados = useMemo(() => {
    const termino = busqueda
      .trim()
      .toLowerCase();

    if (!termino) {
      return cobradoresReporte;
    }

    return cobradoresReporte.filter(
      (cobrador) =>
        cobrador.nombreCobrador
          .toLowerCase()
          .includes(termino),
    );
  }, [cobradoresReporte, busqueda]);

  function obtenerTotalCobrador(
    nombreCobrador,
  ) {
    return formasPagoReporte.reduce(
      (total, formaPago) => {
        return (
          total +
          obtenerValor(
            nombreCobrador,
            formaPago.nombre,
          )
        );
      },
      0,
    );
  }

  function obtenerTotalFormaPago(
    nombreFormaPago,
    cobradores = cobradoresReporte,
  ) {
    return cobradores.reduce(
      (total, cobrador) => {
        return (
          total +
          obtenerValor(
            cobrador.nombreCobrador,
            nombreFormaPago,
          )
        );
      },
      0,
    );
  }

  const totalGeneral = useMemo(() => {
    return registros.reduce(
      (total, registro) =>
        total +
        Number(registro.total || 0),
      0,
    );
  }, [registros]);

  const totalFiltrado = useMemo(() => {
    return cobradoresFiltrados.reduce(
      (total, cobrador) =>
        total +
        obtenerTotalCobrador(
          cobrador.nombreCobrador,
        ),
      0,
    );
  }, [
    cobradoresFiltrados,
    formasPagoReporte,
    mapaRecaudacion,
  ]);

  const cobradorLider = useMemo(() => {
    if (cobradoresReporte.length === 0) {
      return null;
    }

    return cobradoresReporte.reduce(
      (lider, cobrador) => {
        const totalCobrador =
          obtenerTotalCobrador(
            cobrador.nombreCobrador,
          );

        if (
          !lider ||
          totalCobrador > lider.total
        ) {
          return {
            ...cobrador,
            total: totalCobrador,
          };
        }

        return lider;
      },
      null,
    );
  }, [
    cobradoresReporte,
    formasPagoReporte,
    mapaRecaudacion,
  ]);

  const formaPagoLider = useMemo(() => {
    if (formasPagoReporte.length === 0) {
      return null;
    }

    return formasPagoReporte.reduce(
      (lider, formaPago) => {
        const totalForma =
          obtenerTotalFormaPago(
            formaPago.nombre,
          );

        if (
          !lider ||
          totalForma > lider.total
        ) {
          return {
            ...formaPago,
            total: totalForma,
          };
        }

        return lider;
      },
      null,
    );
  }, [
    formasPagoReporte,
    cobradoresReporte,
    mapaRecaudacion,
  ]);

  function exportarCsv() {
    if (
      cobradoresFiltrados.length === 0 ||
      formasPagoReporte.length === 0
    ) {
      setMensaje({
        tipo: "warning",
        texto:
          "No existen datos para exportar.",
      });

      return;
    }

    const encabezado = [
      "Cobrador",

      ...formasPagoReporte.map(
        (formaPago) => formaPago.nombre,
      ),

      "Total recaudado",
    ];

    const filasCobradores =
      cobradoresFiltrados.map(
        (cobrador) => [
          cobrador.nombreCobrador,

          ...formasPagoReporte.map(
            (formaPago) =>
              obtenerValor(
                cobrador.nombreCobrador,
                formaPago.nombre,
              ).toFixed(2),
          ),

          obtenerTotalCobrador(
            cobrador.nombreCobrador,
          ).toFixed(2),
        ],
      );

    const filaTotales = [
      "TOTAL POR FORMA DE PAGO",

      ...formasPagoReporte.map(
        (formaPago) =>
          obtenerTotalFormaPago(
            formaPago.nombre,
            cobradoresFiltrados,
          ).toFixed(2),
      ),

      totalFiltrado.toFixed(2),
    ];

    const contenido = [
      encabezado,
      ...filasCobradores,
      filaTotales,
    ]
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
      `matriz-recaudacion-${fechaInicio}-${fechaFin}.csv`;

    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();

    URL.revokeObjectURL(url);
  }

  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Matriz de recaudación</h1>

          <p>
            Valores cobrados por cobrador y forma
            de pago.
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
              cobradoresFiltrados.length === 0
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
            Rango de pagos
          </h2>

          <div className="row g-3 align-items-end">
            <div className="col-12 col-md-4">
              <label
                className="form-label"
                htmlFor="fechaInicioMatrizCxc"
              >
                Desde
              </label>

              <input
                id="fechaInicioMatrizCxc"
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
                htmlFor="fechaFinMatrizCxc"
              >
                Hasta
              </label>

              <input
                id="fechaFinMatrizCxc"
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
                Generar matriz
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
                Total recaudado
              </p>

              <h2 className="h4 mb-0">
                {formatearDinero(
                  totalGeneral,
                )}
              </h2>
            </div>
          </div>
        </div>

        <div className="col-6 col-xl-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <p className="text-secondary mb-2">
                Cobradores activos
              </p>

              <h2 className="h4 mb-0">
                {cobradoresReporte.length}
              </h2>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-6 col-xl-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <p className="text-secondary mb-2">
                Mayor recaudación
              </p>

              <h2 className="h6 mb-1">
                {cobradorLider
                  ?.nombreCobrador ??
                  "Sin información"}
              </h2>

              <strong>
                {formatearDinero(
                  cobradorLider?.total ?? 0,
                )}
              </strong>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-6 col-xl-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <p className="text-secondary mb-2">
                Forma más utilizada
              </p>

              <h2 className="h6 mb-1">
                {formaPagoLider?.nombre ??
                  "Sin información"}
              </h2>

              <strong>
                {formatearDinero(
                  formaPagoLider?.total ?? 0,
                )}
              </strong>
            </div>
          </div>
        </div>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-body p-4">
          <div className="d-flex flex-wrap justify-content-between gap-3 mb-4">
            <div>
              <h2 className="h5 mb-1">
                Cobradores × Formas de pago
              </h2>

              <span className="badge text-bg-primary">
                {cobradoresFiltrados.length}{" "}
                cobrador
                {cobradoresFiltrados.length === 1
                  ? ""
                  : "es"}
              </span>
            </div>

            <input
              type="search"
              className="form-control"
              style={{ maxWidth: "350px" }}
              value={busqueda}
              onChange={(event) =>
                setBusqueda(
                  event.target.value,
                )
              }
              placeholder="Buscar cobrador"
              disabled={cargando}
            />
          </div>

          {cargando ? (
            <div className="text-center py-5">
              <div
                className="spinner-border text-primary"
                role="status"
              />

              <p className="text-secondary mt-3 mb-0">
                Generando matriz...
              </p>
            </div>
          ) : cobradoresFiltrados.length ===
              0 ? (
            <div className="text-center py-5">
              <h3 className="h6">
                No existen pagos para mostrar
              </h3>

              <p className="text-secondary mb-0">
                Registra pagos o cambia el rango de
                fechas.
              </p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-bordered table-hover align-middle text-nowrap">
                <thead>
                  <tr>
                    <th>Posición</th>
                    <th>Cobrador</th>

                    {formasPagoReporte.map(
                      (formaPago) => (
                        <th
                          key={
                            formaPago.codigo ??
                            formaPago.nombre
                          }
                          className="text-end"
                        >
                          {formaPago.nombre}
                        </th>
                      ),
                    )}

                    <th className="text-end">
                      Total recaudado
                    </th>

                    <th>Participación</th>
                  </tr>
                </thead>

                <tbody>
                  {cobradoresFiltrados.map(
                    (cobrador, indice) => {
                      const totalCobrador =
                        obtenerTotalCobrador(
                          cobrador.nombreCobrador,
                        );

                      const participacion =
                        totalGeneral > 0
                          ? (totalCobrador /
                              totalGeneral) *
                            100
                          : 0;

                      return (
                        <tr
                          key={
                            cobrador.idCobrador ??
                            cobrador.nombreCobrador
                          }
                        >
                          <td>
                            <span className="badge text-bg-light border">
                              #{indice + 1}
                            </span>
                          </td>

                          <td>
                            <strong>
                              {
                                cobrador.nombreCobrador
                              }
                            </strong>
                          </td>

                          {formasPagoReporte.map(
                            (formaPago) => {
                              const valor =
                                obtenerValor(
                                  cobrador.nombreCobrador,
                                  formaPago.nombre,
                                );

                              return (
                                <td
                                  key={
                                    formaPago.codigo ??
                                    formaPago.nombre
                                  }
                                  className="text-end"
                                >
                                  {valor > 0
                                    ? formatearDinero(
                                        valor,
                                      )
                                    : "—"}
                                </td>
                              );
                            },
                          )}

                          <td className="text-end fw-bold">
                            {formatearDinero(
                              totalCobrador,
                            )}
                          </td>

                          <td>
                            {participacion.toFixed(
                              2,
                            )}
                            %
                          </td>
                        </tr>
                      );
                    },
                  )}
                </tbody>

                <tfoot>
                  <tr>
                    <th colSpan="2">
                      Total por forma de pago
                    </th>

                    {formasPagoReporte.map(
                      (formaPago) => (
                        <th
                          key={
                            formaPago.codigo ??
                            formaPago.nombre
                          }
                          className="text-end"
                        >
                          {formatearDinero(
                            obtenerTotalFormaPago(
                              formaPago.nombre,
                              cobradoresFiltrados,
                            ),
                          )}
                        </th>
                      ),
                    )}

                    <th className="text-end">
                      {formatearDinero(
                        totalFiltrado,
                      )}
                    </th>

                    <th>
                      {totalGeneral > 0
                        ? (
                            (totalFiltrado /
                              totalGeneral) *
                            100
                          ).toFixed(2)
                        : "0.00"}
                      %
                    </th>
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