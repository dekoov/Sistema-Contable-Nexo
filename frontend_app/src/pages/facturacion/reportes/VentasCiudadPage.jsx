import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  obtenerMensajeReporteError,
  obtenerVentasPorCiudad,
} from "../../../api/reportesFacturacionApi";

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

export default function VentasCiudadPage() {
  const [reporte, setReporte] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] =
    useState(true);
  const [mensaje, setMensaje] =
    useState(null);

  const cargarReporte = useCallback(async () => {
    setCargando(true);
    setMensaje(null);

    try {
      const data =
        await obtenerVentasPorCiudad();

      setReporte(data);
    } catch (error) {
      setMensaje({
        tipo: "danger",
        texto: obtenerMensajeReporteError(
          error,
          "No fue posible obtener las ventas por ciudad.",
        ),
      });
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarReporte();
  }, [cargarReporte]);

  const totalGeneral = useMemo(() => {
    return reporte.reduce(
      (total, fila) =>
        total + Number(fila.total || 0),
      0,
    );
  }, [reporte]);

  const ciudadLider = useMemo(() => {
    if (reporte.length === 0) {
      return null;
    }

    return reporte.reduce((mayor, fila) => {
      return fila.total > mayor.total
        ? fila
        : mayor;
    });
  }, [reporte]);

  const reporteFiltrado = useMemo(() => {
    const termino = busqueda
      .trim()
      .toLowerCase();

    if (!termino) {
      return reporte;
    }

    return reporte.filter((fila) =>
      fila.ciudad
        .toLowerCase()
        .includes(termino),
    );
  }, [reporte, busqueda]);

  const totalFiltrado = useMemo(() => {
    return reporteFiltrado.reduce(
      (total, fila) =>
        total + Number(fila.total || 0),
      0,
    );
  }, [reporteFiltrado]);

  const mayorTotal = useMemo(() => {
    return reporte.reduce(
      (mayor, fila) =>
        Math.max(
          mayor,
          Number(fila.total || 0),
        ),
      0,
    );
  }, [reporte]);

  function calcularParticipacion(total) {
    if (totalGeneral <= 0) {
      return 0;
    }

    return (
      (Number(total) / totalGeneral) *
      100
    );
  }

  function calcularBarra(total) {
    if (mayorTotal <= 0) {
      return 0;
    }

    return (
      (Number(total) / mayorTotal) *
      100
    );
  }

  function exportarCsv() {
    if (reporte.length === 0) {
      setMensaje({
        tipo: "warning",
        texto:
          "No existen datos para exportar.",
      });

      return;
    }

    const filas = [
      ["Ciudad", "Total vendido"],
      ...reporte.map((fila) => [
        fila.ciudad,
        Number(fila.total).toFixed(2),
      ]),
      ["TOTAL GENERAL", totalGeneral.toFixed(2)],
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
      "reporte-ventas-por-ciudad.csv";

    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();

    URL.revokeObjectURL(url);
  }

  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Ventas por ciudad</h1>

          <p>
            Total facturado agrupado por ciudad
            de entrega.
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
              ? "Actualizando..."
              : "Actualizar"}
          </button>

          <button
            type="button"
            className="btn btn-success"
            onClick={exportarCsv}
            disabled={
              cargando || reporte.length === 0
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

      <div className="row g-4 mb-4">
        <div className="col-12 col-md-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <p className="text-secondary mb-2">
                Total facturado
              </p>

              <h2 className="h3 mb-0">
                {formatearDinero(
                  totalGeneral,
                )}
              </h2>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <p className="text-secondary mb-2">
                Ciudades con ventas
              </p>

              <h2 className="h3 mb-0">
                {reporte.length}
              </h2>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <p className="text-secondary mb-2">
                Ciudad con mayor venta
              </p>

              <h2 className="h5 mb-1">
                {ciudadLider?.ciudad ??
                  "Sin información"}
              </h2>

              <strong>
                {ciudadLider
                  ? formatearDinero(
                      ciudadLider.total,
                    )
                  : formatearDinero(0)}
              </strong>
            </div>
          </div>
        </div>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-body p-4">
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
            <div>
              <h2 className="h5 mb-1">
                Resumen por ciudad
              </h2>

              <span className="badge text-bg-primary">
                {reporteFiltrado.length}{" "}
                resultado
                {reporteFiltrado.length === 1
                  ? ""
                  : "s"}
              </span>
            </div>

            <input
              type="search"
              className="form-control"
              style={{ maxWidth: "350px" }}
              value={busqueda}
              onChange={(event) =>
                setBusqueda(event.target.value)
              }
              placeholder="Buscar ciudad"
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
                Generando reporte...
              </p>
            </div>
          ) : reporteFiltrado.length === 0 ? (
            <div className="text-center py-5">
              <h3 className="h6">
                No existen ventas para mostrar
              </h3>

              <p className="text-secondary mb-0">
                Registra facturas o cambia el
                criterio de búsqueda.
              </p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead>
                  <tr>
                    <th>Posición</th>
                    <th>Ciudad</th>
                    <th>Total vendido</th>
                    <th>Participación</th>
                    <th style={{ minWidth: "200px" }}>
                      Comparación
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {reporteFiltrado.map(
                    (fila, indice) => {
                      const participacion =
                        calcularParticipacion(
                          fila.total,
                        );

                      const porcentajeBarra =
                        calcularBarra(
                          fila.total,
                        );

                      return (
                        <tr key={fila.ciudad}>
                          <td>
                            <span className="badge text-bg-light border">
                              #{indice + 1}
                            </span>
                          </td>

                          <td>
                            <strong>
                              {fila.ciudad}
                            </strong>
                          </td>

                          <td>
                            {formatearDinero(
                              fila.total,
                            )}
                          </td>

                          <td>
                            {participacion.toFixed(
                              2,
                            )}
                            %
                          </td>

                          <td>
                            <div
                              className="progress"
                              role="progressbar"
                              aria-label={`Ventas de ${fila.ciudad}`}
                              aria-valuenow={
                                porcentajeBarra
                              }
                              aria-valuemin="0"
                              aria-valuemax="100"
                              style={{
                                height: "10px",
                              }}
                            >
                              <div
                                className="progress-bar"
                                style={{
                                  width: `${porcentajeBarra}%`,
                                }}
                              />
                            </div>
                          </td>
                        </tr>
                      );
                    },
                  )}
                </tbody>

                <tfoot>
                  <tr>
                    <th colSpan="2">
                      Total mostrado
                    </th>

                    <th>
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