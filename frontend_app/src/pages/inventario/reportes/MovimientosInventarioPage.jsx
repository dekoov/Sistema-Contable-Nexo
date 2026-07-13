import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  obtenerMensajeReporteInventarioError,
  obtenerMovimientosInventario,
  obtenerStockArticulos,
} from "../../../api/reportesInventarioApi";

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

function obtenerNombreTipo(tipo) {
  return tipo === "I" ? "Ingreso" : "Egreso";
}

function obtenerClaseTipo(tipo) {
  return tipo === "I"
    ? "text-bg-success"
    : "text-bg-danger";
}

function obtenerEstadoStock(stock) {
  if (stock < 0) {
    return {
      texto: "Stock negativo",
      clase: "text-bg-danger",
    };
  }

  if (stock === 0) {
    return {
      texto: "Agotado",
      clase: "text-bg-warning",
    };
  }

  if (stock <= 5) {
    return {
      texto: "Stock bajo",
      clase: "text-bg-warning",
    };
  }

  return {
    texto: "Disponible",
    clase: "text-bg-success",
  };
}

export default function MovimientosInventarioPage() {
  const [fechaInicio, setFechaInicio] =
    useState(RANGO_INICIAL.inicio);

  const [fechaFin, setFechaFin] =
    useState(RANGO_INICIAL.fin);

  const [movimientos, setMovimientos] =
    useState([]);

  const [stockArticulos, setStockArticulos] =
    useState([]);

  const [busquedaMovimiento, setBusquedaMovimiento] =
    useState("");

  const [busquedaStock, setBusquedaStock] =
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
        movimientosData,
        stockData,
      ] = await Promise.all([
        obtenerMovimientosInventario(
          fechaInicio,
          fechaFin,
        ),
        obtenerStockArticulos(),
      ]);

      setMovimientos(movimientosData);
      setStockArticulos(stockData);
    } catch (error) {
      setMensaje({
        tipo: "danger",
        texto:
          obtenerMensajeReporteInventarioError(
            error,
            "No fue posible cargar el reporte de inventario.",
          ),
      });
    } finally {
      setCargando(false);
    }
  }, [fechaInicio, fechaFin]);

  useEffect(() => {
    cargarReporte();
  }, [cargarReporte]);

  const movimientosFiltrados = useMemo(() => {
    const termino = busquedaMovimiento
      .trim()
      .toLowerCase();

    if (!termino) {
      return movimientos;
    }

    return movimientos.filter(
      (movimiento) => {
        return (
          movimiento.articulo
            .toLowerCase()
            .includes(termino) ||
          movimiento.movimiento
            .toLowerCase()
            .includes(termino) ||
          obtenerNombreTipo(
            movimiento.tipo,
          )
            .toLowerCase()
            .includes(termino)
        );
      },
    );
  }, [movimientos, busquedaMovimiento]);

  const stockFiltrado = useMemo(() => {
    const termino = busquedaStock
      .trim()
      .toLowerCase();

    if (!termino) {
      return stockArticulos;
    }

    return stockArticulos.filter(
      (articulo) => {
        return (
          articulo.articulo
            .toLowerCase()
            .includes(termino) ||
          String(
            articulo.idArticulo,
          ).includes(termino)
        );
      },
    );
  }, [stockArticulos, busquedaStock]);

  const totalIngresos = useMemo(() => {
    return movimientos
      .filter(
        (movimiento) =>
          movimiento.tipo === "I",
      )
      .reduce(
        (total, movimiento) =>
          total +
          Number(movimiento.cantidad || 0),
        0,
      );
  }, [movimientos]);

  const totalEgresos = useMemo(() => {
    return movimientos
      .filter(
        (movimiento) =>
          movimiento.tipo !== "I",
      )
      .reduce(
        (total, movimiento) =>
          total +
          Number(movimiento.cantidad || 0),
        0,
      );
  }, [movimientos]);

  const stockTotal = useMemo(() => {
    return stockArticulos.reduce(
      (total, articulo) =>
        total + Number(articulo.stock || 0),
      0,
    );
  }, [stockArticulos]);

  const valorInventario = useMemo(() => {
    return stockArticulos.reduce(
      (total, articulo) => {
        return (
          total +
          Math.max(
            0,
            Number(articulo.stock || 0),
          ) *
            Number(articulo.precio || 0)
        );
      },
      0,
    );
  }, [stockArticulos]);

  function exportarCsv() {
    if (
      movimientos.length === 0 &&
      stockArticulos.length === 0
    ) {
      setMensaje({
        tipo: "warning",
        texto:
          "No existen datos para exportar.",
      });

      return;
    }

    const filas = [
      [
        "REPORTE DE MOVIMIENTOS",
        fechaInicio,
        fechaFin,
      ],
      [],
      [
        "Artículo",
        "Movimiento",
        "Tipo",
        "Cantidad",
      ],

      ...movimientos.map((movimiento) => [
        movimiento.articulo,
        movimiento.movimiento,
        obtenerNombreTipo(
          movimiento.tipo,
        ),
        movimiento.cantidad,
      ]),

      [],
      ["STOCK ACTUAL"],
      [],
      [
        "ID",
        "Artículo",
        "Ingresos",
        "Egresos",
        "Stock",
        "Precio",
        "Valor inventario",
      ],

      ...stockArticulos.map((articulo) => [
        articulo.idArticulo,
        articulo.articulo,
        articulo.ingresos,
        articulo.egresos,
        articulo.stock,
        Number(articulo.precio).toFixed(2),
        (
          Math.max(0, articulo.stock) *
          articulo.precio
        ).toFixed(2),
      ]),
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
      "reporte-inventario.csv";

    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();

    URL.revokeObjectURL(url);
  }

  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Reporte de inventario</h1>

          <p>
            Movimientos por fechas y stock actual
            de artículos.
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
              : "Consultar"}
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
            disabled={cargando}
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
            Rango de fechas
          </h2>

          <div className="row g-3 align-items-end">
            <div className="col-12 col-md-4">
              <label
                className="form-label"
                htmlFor="fechaInicioReporte"
              >
                Desde
              </label>

              <input
                id="fechaInicioReporte"
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
                htmlFor="fechaFinReporte"
              >
                Hasta
              </label>

              <input
                id="fechaFinReporte"
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
                Generar reporte
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
                Unidades ingresadas
              </p>

              <h2 className="h3 mb-0 text-success">
                {totalIngresos}
              </h2>
            </div>
          </div>
        </div>

        <div className="col-6 col-xl-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <p className="text-secondary mb-2">
                Unidades egresadas
              </p>

              <h2 className="h3 mb-0 text-danger">
                {totalEgresos}
              </h2>
            </div>
          </div>
        </div>

        <div className="col-6 col-xl-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <p className="text-secondary mb-2">
                Stock total
              </p>

              <h2 className="h3 mb-0">
                {stockTotal}
              </h2>
            </div>
          </div>
        </div>

        <div className="col-6 col-xl-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <p className="text-secondary mb-2">
                Valor del inventario
              </p>

              <h2 className="h4 mb-0">
                {formatearDinero(
                  valorInventario,
                )}
              </h2>
            </div>
          </div>
        </div>
      </div>

      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body p-4">
          <div className="d-flex flex-wrap justify-content-between gap-3 mb-4">
            <div>
              <h2 className="h5 mb-1">
                Movimientos agrupados
              </h2>

              <span className="badge text-bg-primary">
                {movimientosFiltrados.length}{" "}
                resultado
                {movimientosFiltrados.length === 1
                  ? ""
                  : "s"}
              </span>
            </div>

            <input
              type="search"
              className="form-control"
              style={{ maxWidth: "350px" }}
              value={busquedaMovimiento}
              onChange={(event) =>
                setBusquedaMovimiento(
                  event.target.value,
                )
              }
              placeholder="Buscar artículo o movimiento"
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
          ) : movimientosFiltrados.length ===
            0 ? (
            <div className="text-center py-5">
              <h3 className="h6">
                No existen movimientos
              </h3>

              <p className="text-secondary mb-0">
                Cambia el rango de fechas o registra
                comprobantes.
              </p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead>
                  <tr>
                    <th>Artículo</th>
                    <th>Movimiento</th>
                    <th>Tipo</th>
                    <th className="text-end">
                      Cantidad
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {movimientosFiltrados.map(
                    (movimiento, indice) => (
                      <tr
                        key={`${movimiento.idArticulo}-${movimiento.movimiento}-${indice}`}
                      >
                        <td>
                          <strong>
                            {movimiento.articulo}
                          </strong>
                        </td>

                        <td>
                          {
                            movimiento.movimiento
                          }
                        </td>

                        <td>
                          <span
                            className={`badge ${obtenerClaseTipo(
                              movimiento.tipo,
                            )}`}
                          >
                            {obtenerNombreTipo(
                              movimiento.tipo,
                            )}
                          </span>
                        </td>

                        <td className="text-end">
                          {
                            movimiento.cantidad
                          }
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>

                <tfoot>
                  <tr>
                    <th colSpan="3">
                      Movimiento neto
                    </th>

                    <th className="text-end">
                      {totalIngresos -
                        totalEgresos}
                    </th>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-body p-4">
          <div className="d-flex flex-wrap justify-content-between gap-3 mb-4">
            <div>
              <h2 className="h5 mb-1">
                Stock actual por artículo
              </h2>

              <span className="badge text-bg-primary">
                {stockFiltrado.length} artículo
                {stockFiltrado.length === 1
                  ? ""
                  : "s"}
              </span>
            </div>

            <input
              type="search"
              className="form-control"
              style={{ maxWidth: "350px" }}
              value={busquedaStock}
              onChange={(event) =>
                setBusquedaStock(
                  event.target.value,
                )
              }
              placeholder="Buscar artículo"
              disabled={cargando}
            />
          </div>

          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Artículo</th>
                  <th className="text-end">
                    Ingresos
                  </th>
                  <th className="text-end">
                    Egresos
                  </th>
                  <th className="text-end">
                    Stock
                  </th>
                  <th>Estado</th>
                  <th className="text-end">
                    Precio
                  </th>
                  <th className="text-end">
                    Valor
                  </th>
                </tr>
              </thead>

              <tbody>
                {stockFiltrado.map(
                  (articulo) => {
                    const estado =
                      obtenerEstadoStock(
                        articulo.stock,
                      );

                    return (
                      <tr
                        key={
                          articulo.idArticulo
                        }
                      >
                        <td>
                          {
                            articulo.idArticulo
                          }
                        </td>

                        <td>
                          <strong>
                            {articulo.articulo}
                          </strong>
                        </td>

                        <td className="text-end text-success">
                          {articulo.ingresos}
                        </td>

                        <td className="text-end text-danger">
                          {articulo.egresos}
                        </td>

                        <td className="text-end fw-bold">
                          {articulo.stock}
                        </td>

                        <td>
                          <span
                            className={`badge ${estado.clase}`}
                          >
                            {estado.texto}
                          </span>
                        </td>

                        <td className="text-end">
                          {formatearDinero(
                            articulo.precio,
                          )}
                        </td>

                        <td className="text-end">
                          {formatearDinero(
                            Math.max(
                              0,
                              articulo.stock,
                            ) *
                              articulo.precio,
                          )}
                        </td>
                      </tr>
                    );
                  },
                )}

                {stockFiltrado.length === 0 && (
                  <tr>
                    <td
                      colSpan="8"
                      className="text-center text-secondary py-5"
                    >
                      No existen artículos para
                      mostrar.
                    </td>
                  </tr>
                )}
              </tbody>

              <tfoot>
                <tr>
                  <th colSpan="4">
                    Totales
                  </th>

                  <th className="text-end">
                    {stockTotal}
                  </th>

                  <th colSpan="2" />

                  <th className="text-end">
                    {formatearDinero(
                      valorInventario,
                    )}
                  </th>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}