import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  actualizarComprobante,
  crearComprobante,
  eliminarComprobante,
  listarComprobantes,
  obtenerMensajeComprobanteError,
} from "../../api/comprobantesApi";

import { listarArticulos } from "../../api/articulosApi";

import {
  listarTiposMovimiento,
} from "../../api/tiposMovimientoApi";

function obtenerFechaActual() {
  const fecha = new Date();

  const anio = fecha.getFullYear();

  const mes = String(
    fecha.getMonth() + 1,
  ).padStart(2, "0");

  const dia = String(
    fecha.getDate(),
  ).padStart(2, "0");

  return `${anio}-${mes}-${dia}`;
}

const CABECERA_INICIAL = {
  numeroComprobante: "",
  fecha: obtenerFechaActual(),
  idTipoMovimiento: "",
};

const DETALLE_INICIAL = {
  idArticulo: "",
  cantidad: "1",
  precio: "",
};

function calcularTotal(detalles) {
  return detalles.reduce((total, detalle) => {
    return (
      total +
      Number(detalle.cantidad || 0) *
        Number(detalle.precio || 0)
    );
  }, 0);
}

function formatearDinero(valor) {
  return new Intl.NumberFormat("es-EC", {
    style: "currency",
    currency: "USD",
  }).format(Number(valor) || 0);
}

function formatearFecha(fecha) {
  if (!fecha) {
    return "";
  }

  const partes = fecha.slice(0, 10).split("-");

  if (partes.length !== 3) {
    return fecha;
  }

  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function obtenerNombreTipo(tipoMovimiento) {
  if (tipoMovimiento?.tipo === "I") {
    return "Ingreso";
  }

  if (tipoMovimiento?.tipo === "E") {
    return "Egreso";
  }

  return tipoMovimiento?.nombre || "Desconocido";
}

function obtenerClaseTipo(tipoMovimiento) {
  return tipoMovimiento?.tipo === "I"
    ? "text-bg-success"
    : "text-bg-danger";
}

function enriquecerComprobantes(
  comprobantes,
  tiposMovimiento,
  articulos,
) {
  return comprobantes.map((comprobante) => {
    const tipoCatalogo =
      tiposMovimiento.find(
        (tipoMovimiento) =>
          Number(
            tipoMovimiento.idTipoMovimiento,
          ) ===
          Number(
            comprobante.idTipoMovimiento
              ?.idTipoMovimiento,
          ),
      );

    return {
      ...comprobante,

      idTipoMovimiento: {
        ...tipoCatalogo,
        ...comprobante.idTipoMovimiento,
      },

      detalles: comprobante.detalles.map(
        (detalle) => {
          const articuloCatalogo =
            articulos.find(
              (articulo) =>
                Number(
                  articulo.idArticulo,
                ) ===
                Number(detalle.idArticulo),
            );

          return {
            ...detalle,
            nombreArticulo:
              detalle.nombreArticulo ||
              articuloCatalogo?.nombre ||
              `Artículo #${detalle.idArticulo}`,
          };
        },
      ),
    };
  });
}

export default function ComprobantesPage() {
  const [articulos, setArticulos] =
    useState([]);

  const [
    tiposMovimiento,
    setTiposMovimiento,
  ] = useState([]);

  const [
    comprobantes,
    setComprobantes,
  ] = useState([]);

  const [cabecera, setCabecera] =
    useState(CABECERA_INICIAL);

  const [detalle, setDetalle] =
    useState(DETALLE_INICIAL);

  const [
    detallesTemporales,
    setDetallesTemporales,
  ] = useState([]);

  const [
    idComprobanteEditando,
    setIdComprobanteEditando,
  ] = useState(null);

  const [
    indiceDetalleEditando,
    setIndiceDetalleEditando,
  ] = useState(null);

  const [busqueda, setBusqueda] =
    useState("");

  const [cargando, setCargando] =
    useState(true);

  const [guardando, setGuardando] =
    useState(false);

  const [mensaje, setMensaje] =
    useState(null);

  const estaEditando =
    idComprobanteEditando !== null;

  const totalComprobante = useMemo(
    () => calcularTotal(detallesTemporales),
    [detallesTemporales],
  );

  const comprobantesFiltrados = useMemo(() => {
    const termino = busqueda
      .trim()
      .toLowerCase();

    if (!termino) {
      return comprobantes;
    }

    return comprobantes.filter(
      (comprobante) => {
        return (
          comprobante.numeroComprobante
            .toLowerCase()
            .includes(termino) ||
          comprobante.idTipoMovimiento?.nombre
            ?.toLowerCase()
            .includes(termino) ||
          obtenerNombreTipo(
            comprobante.idTipoMovimiento,
          )
            .toLowerCase()
            .includes(termino)
        );
      },
    );
  }, [comprobantes, busqueda]);

  useEffect(() => {
    async function cargarDatosIniciales() {
      setCargando(true);

      try {
        const [
          articulosData,
          tiposData,
          comprobantesData,
        ] = await Promise.all([
          listarArticulos(),
          listarTiposMovimiento(),
          listarComprobantes(),
        ]);

        setArticulos(articulosData);
        setTiposMovimiento(tiposData);

        setComprobantes(
          enriquecerComprobantes(
            comprobantesData,
            tiposData,
            articulosData,
          ),
        );
      } catch (error) {
        setMensaje({
          tipo: "danger",
          texto:
            obtenerMensajeComprobanteError(
              error,
              "No fue posible cargar los comprobantes.",
            ),
        });
      } finally {
        setCargando(false);
      }
    }

    cargarDatosIniciales();
  }, []);

  async function recargarComprobantes() {
    const data = await listarComprobantes();

    setComprobantes(
      enriquecerComprobantes(
        data,
        tiposMovimiento,
        articulos,
      ),
    );
  }

  function actualizarCabecera(event) {
    const { name, value } = event.target;

    setCabecera((actual) => ({
      ...actual,
      [name]: value,
    }));
  }

  function actualizarDetalle(event) {
    const { name, value } = event.target;

    if (name === "idArticulo") {
      const articulo = articulos.find(
        (item) =>
          Number(item.idArticulo) ===
          Number(value),
      );

      setDetalle((actual) => ({
        ...actual,
        idArticulo: value,
        precio:
          articulo?.precio !== undefined
            ? String(articulo.precio)
            : "",
      }));

      return;
    }

    setDetalle((actual) => ({
      ...actual,
      [name]: value,
    }));
  }

  function limpiarDetalle() {
    setDetalle(DETALLE_INICIAL);
    setIndiceDetalleEditando(null);
  }

  function limpiarComprobante() {
    setCabecera({
      ...CABECERA_INICIAL,
      fecha: obtenerFechaActual(),
    });

    setDetallesTemporales([]);
    setIdComprobanteEditando(null);

    limpiarDetalle();
  }

  function validarDetalle() {
    const cantidad = Number(
      detalle.cantidad,
    );

    const precio = Number(detalle.precio);

    if (!detalle.idArticulo) {
      return "Seleccione un artículo.";
    }

    if (
      !Number.isInteger(cantidad) ||
      cantidad <= 0
    ) {
      return "La cantidad debe ser un entero mayor que cero.";
    }

    if (
      !Number.isFinite(precio) ||
      precio < 0
    ) {
      return "El precio no puede ser negativo.";
    }

    return null;
  }

  function guardarDetalle(event) {
    event.preventDefault();

    const errorValidacion =
      validarDetalle();

    if (errorValidacion) {
      setMensaje({
        tipo: "warning",
        texto: errorValidacion,
      });

      return;
    }

    const articulo = articulos.find(
      (item) =>
        Number(item.idArticulo) ===
        Number(detalle.idArticulo),
    );

    const articuloRepetido =
      detallesTemporales.some(
        (item, indice) =>
          Number(item.idArticulo) ===
            Number(detalle.idArticulo) &&
          indice !== indiceDetalleEditando,
      );

    if (articuloRepetido) {
      setMensaje({
        tipo: "warning",
        texto:
          "El artículo ya se encuentra en el detalle.",
      });

      return;
    }

    const detalleGuardado = {
      idComprobanteDet:
        indiceDetalleEditando !== null
          ? detallesTemporales[
              indiceDetalleEditando
            ].idComprobanteDet
          : null,

      idArticulo: Number(
        detalle.idArticulo,
      ),

      nombreArticulo:
        articulo?.nombre ?? "",

      cantidad: Number(detalle.cantidad),
      precio: Number(detalle.precio),
    };

    if (indiceDetalleEditando !== null) {
      const nuevaLista = [
        ...detallesTemporales,
      ];

      nuevaLista[indiceDetalleEditando] =
        detalleGuardado;

      setDetallesTemporales(nuevaLista);
    } else {
      setDetallesTemporales((actual) => [
        ...actual,
        detalleGuardado,
      ]);
    }

    limpiarDetalle();
    setMensaje(null);
  }

  function editarDetalle(indice) {
    const detalleSeleccionado =
      detallesTemporales[indice];

    setIndiceDetalleEditando(indice);

    setDetalle({
      idArticulo: String(
        detalleSeleccionado.idArticulo,
      ),
      cantidad: String(
        detalleSeleccionado.cantidad,
      ),
      precio: String(
        detalleSeleccionado.precio,
      ),
    });
  }

  function eliminarDetalle(indice) {
    setDetallesTemporales((actual) =>
      actual.filter(
        (_, indiceActual) =>
          indiceActual !== indice,
      ),
    );

    if (indiceDetalleEditando === indice) {
      limpiarDetalle();
    }
  }

  function validarComprobante() {
    if (!cabecera.numeroComprobante.trim()) {
      return "El número de comprobante es obligatorio.";
    }

    if (!cabecera.fecha) {
      return "La fecha es obligatoria.";
    }

    if (!cabecera.idTipoMovimiento) {
      return "Seleccione un tipo de movimiento.";
    }

    if (detallesTemporales.length === 0) {
      return "Agregue al menos un artículo al detalle.";
    }

    return null;
  }

  async function guardarComprobante() {
    const errorValidacion =
      validarComprobante();

    if (errorValidacion) {
      setMensaje({
        tipo: "warning",
        texto: errorValidacion,
      });

      return;
    }

    const tipoMovimiento =
      tiposMovimiento.find(
        (item) =>
          Number(
            item.idTipoMovimiento,
          ) ===
          Number(
            cabecera.idTipoMovimiento,
          ),
      );

    const comprobante = {
      numeroComprobante:
        cabecera.numeroComprobante,
      fecha: cabecera.fecha,
      idTipoMovimiento: tipoMovimiento,
      detalles: detallesTemporales,
    };

    setGuardando(true);
    setMensaje(null);

    try {
      if (estaEditando) {
        await actualizarComprobante(
          idComprobanteEditando,
          comprobante,
        );

        setMensaje({
          tipo: "success",
          texto:
            "Comprobante modificado correctamente.",
        });
      } else {
        await crearComprobante(comprobante);

        setMensaje({
          tipo: "success",
          texto:
            "Comprobante registrado correctamente.",
        });
      }

      limpiarComprobante();
      await recargarComprobantes();
    } catch (error) {
      setMensaje({
        tipo: "danger",
        texto:
          obtenerMensajeComprobanteError(
            error,
            "No fue posible guardar el comprobante.",
          ),
      });
    } finally {
      setGuardando(false);
    }
  }

  function seleccionarComprobante(
    comprobante,
  ) {
    setIdComprobanteEditando(
      comprobante.idComprobante,
    );

    setCabecera({
      numeroComprobante:
        comprobante.numeroComprobante,
      fecha: comprobante.fecha,
      idTipoMovimiento: String(
        comprobante.idTipoMovimiento
          ?.idTipoMovimiento ?? "",
      ),
    });

    setDetallesTemporales(
      comprobante.detalles.map(
        (detalleActual) => ({
          ...detalleActual,
        }),
      ),
    );

    limpiarDetalle();
    setMensaje(null);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function confirmarEliminacion(
    comprobante,
  ) {
    const confirmado = window.confirm(
      `¿Eliminar el comprobante "${comprobante.numeroComprobante}"?\n\nTambién se eliminarán todos sus detalles.`,
    );

    if (!confirmado) {
      return;
    }

    try {
      await eliminarComprobante(
        comprobante.idComprobante,
      );

      if (
        Number(idComprobanteEditando) ===
        Number(comprobante.idComprobante)
      ) {
        limpiarComprobante();
      }

      await recargarComprobantes();

      setMensaje({
        tipo: "success",
        texto:
          "Comprobante eliminado correctamente.",
      });
    } catch (error) {
      setMensaje({
        tipo: "danger",
        texto:
          obtenerMensajeComprobanteError(
            error,
            "No fue posible eliminar el comprobante.",
          ),
      });
    }
  }

  if (cargando) {
    return (
      <div className="text-center py-5">
        <div
          className="spinner-border text-primary"
          role="status"
        />

        <p className="text-secondary mt-3">
          Cargando comprobantes...
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Comprobantes de inventario</h1>

          <p>
            Registro de ingresos y egresos con
            cabecera y detalle.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-primary"
          onClick={limpiarComprobante}
        >
          Nuevo comprobante
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

      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body p-4">
          <h2 className="h5 mb-4">
            {estaEditando
              ? `Modificar comprobante #${idComprobanteEditando}`
              : "Cabecera del comprobante"}
          </h2>

          <div className="row g-3">
            <div className="col-12 col-md-4">
              <label
                className="form-label"
                htmlFor="numeroComprobante"
              >
                Número
              </label>

              <input
                id="numeroComprobante"
                name="numeroComprobante"
                className="form-control"
                value={
                  cabecera.numeroComprobante
                }
                onChange={actualizarCabecera}
                placeholder="Ej. ING-001"
                disabled={guardando}
              />
            </div>

            <div className="col-12 col-md-4">
              <label
                className="form-label"
                htmlFor="fechaComprobante"
              >
                Fecha
              </label>

              <input
                id="fechaComprobante"
                name="fecha"
                type="date"
                className="form-control"
                value={cabecera.fecha}
                onChange={actualizarCabecera}
                disabled={guardando}
              />
            </div>

            <div className="col-12 col-md-4">
              <label
                className="form-label"
                htmlFor="tipoComprobante"
              >
                Tipo de movimiento
              </label>

              <select
                id="tipoComprobante"
                name="idTipoMovimiento"
                className="form-select"
                value={
                  cabecera.idTipoMovimiento
                }
                onChange={actualizarCabecera}
                disabled={guardando}
              >
                <option value="">
                  Seleccione
                </option>

                {tiposMovimiento.map(
                  (tipoMovimiento) => (
                    <option
                      key={
                        tipoMovimiento.idTipoMovimiento
                      }
                      value={
                        tipoMovimiento.idTipoMovimiento
                      }
                    >
                      {tipoMovimiento.nombre} -{" "}
                      {obtenerNombreTipo(
                        tipoMovimiento,
                      )}
                    </option>
                  ),
                )}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body p-4">
          <h2 className="h5 mb-4">
            Detalle del comprobante
          </h2>

          <form
            className="row g-3 align-items-end mb-4"
            onSubmit={guardarDetalle}
          >
            <div className="col-12 col-md-5">
              <label
                className="form-label"
                htmlFor="articuloComprobante"
              >
                Artículo
              </label>

              <select
                id="articuloComprobante"
                name="idArticulo"
                className="form-select"
                value={detalle.idArticulo}
                onChange={actualizarDetalle}
              >
                <option value="">
                  Seleccione
                </option>

                {articulos.map((articulo) => (
                  <option
                    key={articulo.idArticulo}
                    value={articulo.idArticulo}
                  >
                    {articulo.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-6 col-md-2">
              <label
                className="form-label"
                htmlFor="cantidadComprobante"
              >
                Cantidad
              </label>

              <input
                id="cantidadComprobante"
                name="cantidad"
                type="number"
                min="1"
                step="1"
                className="form-control"
                value={detalle.cantidad}
                onChange={actualizarDetalle}
              />
            </div>

            <div className="col-6 col-md-2">
              <label
                className="form-label"
                htmlFor="precioComprobante"
              >
                Precio
              </label>

              <input
                id="precioComprobante"
                name="precio"
                type="number"
                min="0"
                step="0.01"
                className="form-control"
                value={detalle.precio}
                onChange={actualizarDetalle}
              />
            </div>

            <div className="col-12 col-md-3">
              <button
                type="submit"
                className="btn btn-outline-primary w-100"
              >
                {indiceDetalleEditando !== null
                  ? "Guardar línea"
                  : "Agregar línea"}
              </button>
            </div>
          </form>

          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead>
                <tr>
                  <th>Artículo</th>
                  <th>Cantidad</th>
                  <th>Precio</th>
                  <th>Subtotal</th>

                  <th className="text-end">
                    Acciones
                  </th>
                </tr>
              </thead>

              <tbody>
                {detallesTemporales.length ===
                0 ? (
                  <tr>
                    <td
                      colSpan="5"
                      className="text-center text-secondary py-4"
                    >
                      No existen detalles agregados.
                    </td>
                  </tr>
                ) : (
                  detallesTemporales.map(
                    (detalleActual, indice) => (
                      <tr
                        key={
                          detalleActual.idComprobanteDet ??
                          `${detalleActual.idArticulo}-${indice}`
                        }
                      >
                        <td>
                          {
                            detalleActual.nombreArticulo
                          }
                        </td>

                        <td>
                          {
                            detalleActual.cantidad
                          }
                        </td>

                        <td>
                          {formatearDinero(
                            detalleActual.precio,
                          )}
                        </td>

                        <td>
                          {formatearDinero(
                            detalleActual.cantidad *
                              detalleActual.precio,
                          )}
                        </td>

                        <td>
                          <div className="d-flex justify-content-end gap-2">
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-primary"
                              onClick={() =>
                                editarDetalle(indice)
                              }
                            >
                              Modificar
                            </button>

                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger"
                              onClick={() =>
                                eliminarDetalle(
                                  indice,
                                )
                              }
                            >
                              Eliminar
                            </button>
                          </div>
                        </td>
                      </tr>
                    ),
                  )
                )}
              </tbody>

              <tfoot>
                <tr>
                  <th colSpan="3">Total</th>

                  <th>
                    {formatearDinero(
                      totalComprobante,
                    )}
                  </th>

                  <th />
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="d-flex justify-content-end gap-2">
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={limpiarComprobante}
              disabled={guardando}
            >
              Limpiar
            </button>

            <button
              type="button"
              className="btn btn-success"
              onClick={guardarComprobante}
              disabled={guardando}
            >
              {guardando
                ? "Guardando..."
                : estaEditando
                  ? "Guardar cambios"
                  : "Guardar comprobante"}
            </button>
          </div>
        </div>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-body p-4">
          <div className="d-flex flex-wrap justify-content-between gap-3 mb-4">
            <div>
              <h2 className="h5 mb-1">
                Historial de comprobantes
              </h2>

              <span className="badge text-bg-primary">
                {comprobantesFiltrados.length}{" "}
                registro
                {comprobantesFiltrados.length === 1
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
              placeholder="Buscar número o tipo"
            />
          </div>

          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Número</th>
                  <th>Fecha</th>
                  <th>Movimiento</th>
                  <th>Líneas</th>
                  <th>Total</th>

                  <th className="text-end">
                    Acciones
                  </th>
                </tr>
              </thead>

              <tbody>
                {comprobantesFiltrados.map(
                  (comprobante) => (
                    <tr
                      key={
                        comprobante.idComprobante
                      }
                    >
                      <td>
                        {
                          comprobante.idComprobante
                        }
                      </td>

                      <td>
                        {
                          comprobante.numeroComprobante
                        }
                      </td>

                      <td>
                        {formatearFecha(
                          comprobante.fecha,
                        )}
                      </td>

                      <td>
                        <span
                          className={`badge ${obtenerClaseTipo(
                            comprobante.idTipoMovimiento,
                          )}`}
                        >
                          {comprobante
                            .idTipoMovimiento
                            ?.nombre ||
                            obtenerNombreTipo(
                              comprobante.idTipoMovimiento,
                            )}
                        </span>
                      </td>

                      <td>
                        {
                          comprobante.detalles
                            .length
                        }
                      </td>

                      <td>
                        {formatearDinero(
                          calcularTotal(
                            comprobante.detalles,
                          ),
                        )}
                      </td>

                      <td>
                        <div className="d-flex justify-content-end gap-2">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-primary"
                            onClick={() =>
                              seleccionarComprobante(
                                comprobante,
                              )
                            }
                          >
                            Consultar / modificar
                          </button>

                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger"
                            onClick={() =>
                              confirmarEliminacion(
                                comprobante,
                              )
                            }
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ),
                )}

                {comprobantesFiltrados.length ===
                  0 && (
                  <tr>
                    <td
                      colSpan="7"
                      className="text-center text-secondary py-4"
                    >
                      No existen comprobantes para
                      mostrar.
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