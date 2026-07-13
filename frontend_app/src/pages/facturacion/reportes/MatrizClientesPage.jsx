import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  obtenerMatrizVentas,
  obtenerMensajeReporteError,
} from "../../../api/reportesFacturacionApi";

import {
  listarClientes,
} from "../../../api/clientesApi";

import {
  listarArticulos,
} from "../../../api/articulosApi";

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

export default function MatrizClientesPage() {
  const [registros, setRegistros] =
    useState([]);

  const [clientes, setClientes] =
    useState([]);

  const [articulos, setArticulos] =
    useState([]);

  const [busqueda, setBusqueda] =
    useState("");

  const [cargando, setCargando] =
    useState(true);

  const [mensaje, setMensaje] =
    useState(null);

  const cargarReporte = useCallback(
    async () => {
      setCargando(true);
      setMensaje(null);

      try {
        const [
          matrizData,
          clientesData,
          articulosData,
        ] = await Promise.all([
          obtenerMatrizVentas(),
          listarClientes(),
          listarArticulos(),
        ]);

        setRegistros(matrizData);
        setClientes(clientesData);
        setArticulos(articulosData);
      } catch (error) {
        setMensaje({
          tipo: "danger",
          texto: obtenerMensajeReporteError(
            error,
            "No fue posible generar la matriz de ventas.",
          ),
        });
      } finally {
        setCargando(false);
      }
    },
    [],
  );

  useEffect(() => {
    cargarReporte();
  }, [cargarReporte]);

  const mapaVentas = useMemo(() => {
    const mapa = new Map();

    registros.forEach((registro) => {
      const clave =
        `${registro.idArticulo}-${registro.idCliente}`;

      mapa.set(clave, Number(registro.total));
    });

    return mapa;
  }, [registros]);

  const clientesReporte = useMemo(() => {
    const catalogo = new Map();

    clientes.forEach((cliente) => {
      catalogo.set(
        Number(cliente.idCliente),
        cliente,
      );
    });

    registros.forEach((registro) => {
      const idCliente = Number(
        registro.idCliente,
      );

      if (!catalogo.has(idCliente)) {
        catalogo.set(idCliente, {
          idCliente,
          cedula: "",
          nombre: `Cliente #${idCliente}`,
        });
      }
    });

    return Array.from(catalogo.values()).sort(
      (a, b) =>
        a.nombre.localeCompare(b.nombre),
    );
  }, [clientes, registros]);

  const articulosReporte = useMemo(() => {
    const idsConVentas = new Set(
      registros.map((registro) =>
        Number(registro.idArticulo),
      ),
    );

    const catalogo = new Map();

    articulos.forEach((articulo) => {
      const idArticulo = Number(
        articulo.idArticulo,
      );

      if (idsConVentas.has(idArticulo)) {
        catalogo.set(
          idArticulo,
          articulo,
        );
      }
    });

    idsConVentas.forEach((idArticulo) => {
      if (!catalogo.has(idArticulo)) {
        catalogo.set(idArticulo, {
          idArticulo,
          nombre: `Artículo #${idArticulo}`,
        });
      }
    });

    return Array.from(catalogo.values()).sort(
      (a, b) =>
        a.nombre.localeCompare(b.nombre),
    );
  }, [articulos, registros]);

  const articulosFiltrados = useMemo(() => {
    const termino = busqueda
      .trim()
      .toLowerCase();

    if (!termino) {
      return articulosReporte;
    }

    return articulosReporte.filter(
      (articulo) => {
        return (
          articulo.nombre
            .toLowerCase()
            .includes(termino) ||
          String(
            articulo.idArticulo,
          ).includes(termino)
        );
      },
    );
  }, [articulosReporte, busqueda]);

  const totalGeneral = useMemo(() => {
    return registros.reduce(
      (total, registro) =>
        total + Number(registro.total || 0),
      0,
    );
  }, [registros]);

  const clientesConVentas = useMemo(() => {
    return new Set(
      registros
        .filter(
          (registro) =>
            Number(registro.total) > 0,
        )
        .map((registro) =>
          Number(registro.idCliente),
        ),
    ).size;
  }, [registros]);

  function obtenerVenta(
    idArticulo,
    idCliente,
  ) {
    const clave =
      `${Number(idArticulo)}-${Number(idCliente)}`;

    return Number(
      mapaVentas.get(clave) ?? 0,
    );
  }

  function obtenerTotalArticulo(
    idArticulo,
  ) {
    return clientesReporte.reduce(
      (total, cliente) => {
        return (
          total +
          obtenerVenta(
            idArticulo,
            cliente.idCliente,
          )
        );
      },
      0,
    );
  }

  function obtenerTotalCliente(
    idCliente,
  ) {
    return articulosReporte.reduce(
      (total, articulo) => {
        return (
          total +
          obtenerVenta(
            articulo.idArticulo,
            idCliente,
          )
        );
      },
      0,
    );
  }

  function exportarCsv() {
    if (
      articulosReporte.length === 0 ||
      clientesReporte.length === 0
    ) {
      setMensaje({
        tipo: "warning",
        texto:
          "No existen datos para exportar.",
      });

      return;
    }

    const encabezado = [
      "ID artículo",
      "Artículo",
      ...clientesReporte.map(
        (cliente) => cliente.nombre,
      ),
      "Total artículo",
    ];

    const filasArticulos =
      articulosReporte.map((articulo) => {
        return [
          articulo.idArticulo,
          articulo.nombre,

          ...clientesReporte.map(
            (cliente) =>
              obtenerVenta(
                articulo.idArticulo,
                cliente.idCliente,
              ).toFixed(2),
          ),

          obtenerTotalArticulo(
            articulo.idArticulo,
          ).toFixed(2),
        ];
      });

    const filaTotales = [
      "",
      "TOTAL CLIENTE",

      ...clientesReporte.map(
        (cliente) =>
          obtenerTotalCliente(
            cliente.idCliente,
          ).toFixed(2),
      ),

      totalGeneral.toFixed(2),
    ];

    const contenido = [
      encabezado,
      ...filasArticulos,
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
      "matriz-ventas-articulos-clientes.csv";

    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();

    URL.revokeObjectURL(url);
  }

  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Matriz de ventas</h1>

          <p>
            Valores vendidos por artículo y
            cliente.
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
              cargando ||
              registros.length === 0
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
                Total vendido
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
                Artículos vendidos
              </p>

              <h2 className="h3 mb-0">
                {articulosReporte.length}
              </h2>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <p className="text-secondary mb-2">
                Clientes con compras
              </p>

              <h2 className="h3 mb-0">
                {clientesConVentas}
              </h2>
            </div>
          </div>
        </div>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-body p-4">
          <div className="d-flex flex-wrap justify-content-between gap-3 mb-4">
            <div>
              <h2 className="h5 mb-1">
                Artículos × Clientes
              </h2>

              <span className="badge text-bg-primary">
                {articulosFiltrados.length}{" "}
                artículo
                {articulosFiltrados.length === 1
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
                setBusqueda(
                  event.target.value,
                )
              }
              placeholder="Buscar artículo"
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
          ) : registros.length === 0 ? (
            <div className="text-center py-5">
              <h3 className="h6">
                No existen ventas para mostrar
              </h3>

              <p className="text-secondary mb-0">
                Registra facturas con artículos
                para generar la matriz.
              </p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-bordered table-hover align-middle text-nowrap">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Artículo</th>

                    {clientesReporte.map(
                      (cliente) => (
                        <th
                          key={
                            cliente.idCliente
                          }
                          className="text-end"
                        >
                          {cliente.nombre}

                          {cliente.cedula && (
                            <small className="d-block fw-normal text-secondary">
                              {cliente.cedula}
                            </small>
                          )}
                        </th>
                      ),
                    )}

                    <th className="text-end">
                      Total artículo
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {articulosFiltrados.map(
                    (articulo) => (
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
                            {articulo.nombre}
                          </strong>
                        </td>

                        {clientesReporte.map(
                          (cliente) => {
                            const total =
                              obtenerVenta(
                                articulo.idArticulo,
                                cliente.idCliente,
                              );

                            return (
                              <td
                                key={
                                  cliente.idCliente
                                }
                                className="text-end"
                              >
                                {total > 0
                                  ? formatearDinero(
                                      total,
                                    )
                                  : "—"}
                              </td>
                            );
                          },
                        )}

                        <td className="text-end fw-bold">
                          {formatearDinero(
                            obtenerTotalArticulo(
                              articulo.idArticulo,
                            ),
                          )}
                        </td>
                      </tr>
                    ),
                  )}

                  {articulosFiltrados.length ===
                    0 && (
                    <tr>
                      <td
                        colSpan={
                          clientesReporte.length +
                          3
                        }
                        className="text-center text-secondary py-4"
                      >
                        No existen artículos que
                        coincidan con la búsqueda.
                      </td>
                    </tr>
                  )}
                </tbody>

                <tfoot>
                  <tr>
                    <th colSpan="2">
                      Total por cliente
                    </th>

                    {clientesReporte.map(
                      (cliente) => (
                        <th
                          key={
                            cliente.idCliente
                          }
                          className="text-end"
                        >
                          {formatearDinero(
                            obtenerTotalCliente(
                              cliente.idCliente,
                            ),
                          )}
                        </th>
                      ),
                    )}

                    <th className="text-end">
                      {formatearDinero(
                        totalGeneral,
                      )}
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