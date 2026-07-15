import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  actualizarFactura,
  crearFactura,
  eliminarFactura,
  listarFacturas,
  obtenerMensajeFacturaError,
} from "../../api/facturasApi";

import { listarClientes } from "../../api/clientesApi";
import { listarCiudades } from "../../api/ciudadesApi";
import { listarArticulos } from "../../api/articulosApi";

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
  numeroFactura: "",
  fecha: obtenerFechaActual(),
  idCliente: "",
  idCiudad: "",
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
      Number(detalle.cantidad) *
        Number(detalle.precio)
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

  if (partes.length === 3) {
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  }

  return fecha;
}

function enriquecerFacturas(
  facturas,
  clientes,
  ciudades,
  articulos,
) {
  return facturas.map((factura) => {
    const clienteCatalogo = clientes.find(
      (cliente) =>
        Number(cliente.idCliente) ===
        Number(
          factura.cliente?.idCliente,
        ),
    );

    const ciudadCatalogo = ciudades.find(
      (ciudad) =>
        Number(ciudad.idCiudad) ===
        Number(factura.ciudad?.idCiudad),
    );

    return {
      ...factura,
      cliente: {
        ...clienteCatalogo,
        ...factura.cliente,
      },
      ciudad: {
        ...ciudadCatalogo,
        ...factura.ciudad,
      },
      detalles: factura.detalles.map(
        (detalle) => {
          const articulo = articulos.find(
            (item) =>
              Number(item.idArticulo) ===
              Number(detalle.idArticulo),
          );

          return {
            ...detalle,
            nombreArticulo:
              detalle.nombreArticulo ||
              articulo?.nombre ||
              `Artículo #${detalle.idArticulo}`,
          };
        },
      ),
    };
  });
}

export default function FacturasPage() {
  const [clientes, setClientes] = useState([]);
  const [ciudades, setCiudades] = useState([]);
  const [articulos, setArticulos] = useState([]);
  const [facturas, setFacturas] = useState([]);

  const [cabecera, setCabecera] = useState(
    CABECERA_INICIAL,
  );

  const [detalle, setDetalle] = useState(
    DETALLE_INICIAL,
  );

  const [
    detallesTemporales,
    setDetallesTemporales,
  ] = useState([]);

  const [
    idFacturaEditando,
    setIdFacturaEditando,
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

  const estaEditando = idFacturaEditando !== null;

  const totalTemporal = useMemo(
    () => calcularTotal(detallesTemporales),
    [detallesTemporales],
  );

  const facturasFiltradas = useMemo(() => {
    const termino = busqueda
      .trim()
      .toLowerCase();

    if (!termino) {
      return facturas;
    }

    return facturas.filter((factura) => {
      return (
        factura.numeroFactura
          .toLowerCase()
          .includes(termino) ||
        factura.cliente?.nombre
          ?.toLowerCase()
          .includes(termino) ||
        factura.ciudad?.nombre
          ?.toLowerCase()
          .includes(termino)
      );
    });
  }, [facturas, busqueda]);

  useEffect(() => {
    async function cargarDatosIniciales() {
      setCargando(true);

      try {
        const [
          clientesData,
          ciudadesData,
          articulosData,
          facturasData,
        ] = await Promise.all([
          listarClientes(),
          listarCiudades(),
          listarArticulos(),
          listarFacturas(),
        ]);

        setClientes(clientesData);
        setCiudades(ciudadesData);
        setArticulos(articulosData);

        setFacturas(
          enriquecerFacturas(
            facturasData,
            clientesData,
            ciudadesData,
            articulosData,
          ),
        );
      } catch (error) {
        setMensaje({
          tipo: "danger",
          texto: obtenerMensajeFacturaError(
            error,
            "No fue posible cargar la pantalla de facturas.",
          ),
        });
      } finally {
        setCargando(false);
      }
    }

    cargarDatosIniciales();
  }, []);

  async function recargarFacturas() {
    const data = await listarFacturas();

    const enriquecidas =
      enriquecerFacturas(
        data,
        clientes,
        ciudades,
        articulos,
      );

    setFacturas(enriquecidas);
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

  function limpiarDetalleTemporal() {
    setDetalle(DETALLE_INICIAL);
    setIndiceDetalleEditando(null);
  }

  function limpiarFactura() {
    setCabecera({
      ...CABECERA_INICIAL,
      fecha: obtenerFechaActual(),
    });

    setDetallesTemporales([]);
    setIdFacturaEditando(null);
    limpiarDetalleTemporal();
  }

  function validarDetalleTemporal() {
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
      return "La cantidad debe ser un número entero mayor que cero.";
    }

    if (
      !Number.isFinite(precio) ||
      precio <= 0
    ) {
      return "El precio debe ser mayor que cero.";
    }

    return null;
  }

  function guardarDetalleTemporal(event) {
    event.preventDefault();

    const errorValidacion =
      validarDetalleTemporal();

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
          "El artículo ya fue agregado al detalle.",
      });

      return;
    }

    const nuevoDetalle = {
      idFacturaDet:
        indiceDetalleEditando !== null
          ? detallesTemporales[
              indiceDetalleEditando
            ].idFacturaDet
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
        nuevoDetalle;

      setDetallesTemporales(nuevaLista);
    } else {
      setDetallesTemporales((actual) => [
        ...actual,
        nuevoDetalle,
      ]);
    }

    limpiarDetalleTemporal();
    setMensaje(null);
  }

  function editarDetalleTemporal(indice) {
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

  function eliminarDetalleTemporal(indice) {
    setDetallesTemporales((actual) =>
      actual.filter(
        (_, indiceActual) =>
          indiceActual !== indice,
      ),
    );

    if (indiceDetalleEditando === indice) {
      limpiarDetalleTemporal();
    }
  }

  function validarFactura() {
    if (!cabecera.numeroFactura.trim()) {
      return "El número de factura es obligatorio.";
    }

    if (!cabecera.fecha) {
      return "La fecha es obligatoria.";
    }

    if (!cabecera.idCliente) {
      return "Seleccione un cliente.";
    }

    if (!cabecera.idCiudad) {
      return "Seleccione una ciudad.";
    }

    if (detallesTemporales.length === 0) {
      return "Agregue al menos un artículo al detalle.";
    }

    return null;
  }

  async function guardarFactura() {
    const errorValidacion =
      validarFactura();

    if (errorValidacion) {
      setMensaje({
        tipo: "warning",
        texto: errorValidacion,
      });

      return;
    }

    const cliente = clientes.find(
      (item) =>
        Number(item.idCliente) ===
        Number(cabecera.idCliente),
    );

    const ciudad = ciudades.find(
      (item) =>
        Number(item.idCiudad) ===
        Number(cabecera.idCiudad),
    );

    setGuardando(true);
    setMensaje(null);

    try {
      if (estaEditando) {
        await actualizarFactura(idFacturaEditando, {
          numeroFactura: cabecera.numeroFactura,
          fecha: cabecera.fecha,
          cliente,
          ciudad,
          detalles: detallesTemporales,
        });

        setMensaje({
          tipo: "success",
          texto:
            "Factura modificada correctamente.",
        });
      } else {
        await crearFactura({
          numeroFactura:
            cabecera.numeroFactura,
          fecha: cabecera.fecha,
          cliente,
          ciudad,
          detalles: detallesTemporales,
        });

        setMensaje({
          tipo: "success",
          texto:
            "Factura registrada correctamente.",
        });
      }

      limpiarFactura();
      await recargarFacturas();
    } catch (error) {
      setMensaje({
        tipo: "danger",
        texto: obtenerMensajeFacturaError(
          error,
          estaEditando
            ? "No fue posible modificar la factura."
            : "No fue posible registrar la factura.",
        ),
      });
    } finally {
      setGuardando(false);
    }
  }

  function seleccionarFactura(factura) {
    setIdFacturaEditando(factura.idFactura);

    setCabecera({
      numeroFactura: factura.numeroFactura,
      fecha: factura.fecha ? factura.fecha.slice(0, 10) : "",
      idCliente: String(factura.cliente?.idCliente ?? ""),
      idCiudad: String(factura.ciudad?.idCiudad ?? ""),
    });

    setDetallesTemporales(
      factura.detalles.map((detalleActual) => ({
        idFacturaDet: detalleActual.idFacturaDet,
        idArticulo: detalleActual.idArticulo,
        nombreArticulo: detalleActual.nombreArticulo,
        cantidad: detalleActual.cantidad,
        precio: detalleActual.precio,
      })),
    );

    limpiarDetalleTemporal();
    setMensaje(null);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function confirmarEliminarFactura(
    factura,
  ) {
    const confirmado = window.confirm(
      `¿Eliminar la factura "${factura.numeroFactura}" completa?\n\nTambién se eliminarán todos sus detalles.`,
    );

    if (!confirmado) {
      return;
    }

    try {
      await eliminarFactura(
        factura.idFactura,
      );

      if (
        Number(idFacturaEditando) === Number(factura.idFactura)
      ) {
        limpiarFactura();
      }

      await recargarFacturas();

      setMensaje({
        tipo: "success",
        texto:
          "Factura eliminada correctamente.",
      });
    } catch (error) {
      setMensaje({
        tipo: "danger",
        texto: obtenerMensajeFacturaError(
          error,
          "No fue posible eliminar la factura.",
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
          Cargando facturación...
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Facturas</h1>

          <p>
            Registro de cabecera y detalle de
            facturación.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-primary"
          onClick={limpiarFactura}
        >
          Nueva factura
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
              ? `Modificar factura #${idFacturaEditando}`
              : "Cabecera de factura"}
          </h2>

          <div className="row g-3">
            <div className="col-12 col-md-6 col-xl-3">
              <label
                className="form-label"
                htmlFor="numeroFactura"
              >
                Número
              </label>

              <input
                id="numeroFactura"
                name="numeroFactura"
                className="form-control"
                value={
                  cabecera.numeroFactura
                }
                onChange={actualizarCabecera}
                maxLength={20}
                placeholder="Ej. F-0001"
                disabled={guardando}
              />
            </div>

            <div className="col-12 col-md-6 col-xl-3">
              <label
                className="form-label"
                htmlFor="fechaFactura"
              >
                Fecha
              </label>

              <input
                id="fechaFactura"
                name="fecha"
                type="date"
                className="form-control"
                value={cabecera.fecha}
                onChange={actualizarCabecera}
                disabled={guardando}
              />
            </div>

            <div className="col-12 col-md-6 col-xl-3">
              <label
                className="form-label"
                htmlFor="clienteFactura"
              >
                Cliente
              </label>

              <select
                id="clienteFactura"
                name="idCliente"
                className="form-select"
                value={cabecera.idCliente}
                onChange={actualizarCabecera}
                disabled={guardando}
              >
                <option value="">
                  Seleccione
                </option>

                {clientes.map((cliente) => (
                  <option
                    key={cliente.idCliente}
                    value={cliente.idCliente}
                  >
                    {cliente.nombre} -{" "}
                    {cliente.cedula}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-12 col-md-6 col-xl-3">
              <label
                className="form-label"
                htmlFor="ciudadFactura"
              >
                Ciudad de entrega
              </label>

              <select
                id="ciudadFactura"
                name="idCiudad"
                className="form-select"
                value={cabecera.idCiudad}
                onChange={actualizarCabecera}
                disabled={guardando}
              >
                <option value="">
                  Seleccione
                </option>

                {ciudades.map((ciudad) => (
                  <option
                    key={ciudad.idCiudad}
                    value={ciudad.idCiudad}
                  >
                    {ciudad.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body p-4">
          <h2 className="h5 mb-4">
            Detalle de factura
          </h2>

          <form
            className="row g-3 align-items-end mb-4"
            onSubmit={guardarDetalleTemporal}
          >
            <div className="col-12 col-md-5">
              <label
                className="form-label"
                htmlFor="articuloDetalle"
              >
                Artículo
              </label>

              <select
                id="articuloDetalle"
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
                htmlFor="cantidadDetalle"
              >
                Cantidad
              </label>

              <input
                id="cantidadDetalle"
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
                htmlFor="precioDetalle"
              >
                Precio
              </label>

              <input
                id="precioDetalle"
                name="precio"
                type="number"
                min="0.01"
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
                      Aún no existen artículos
                      agregados.
                    </td>
                  </tr>
                ) : (
                  detallesTemporales.map(
                    (item, indice) => (
                      <tr
                        key={
                          item.idFacturaDet ??
                          `${item.idArticulo}-${indice}`
                        }
                      >
                        <td>
                          {item.nombreArticulo}
                        </td>
                        <td>{item.cantidad}</td>
                        <td>
                          {formatearDinero(
                            item.precio,
                          )}
                        </td>
                        <td>
                          {formatearDinero(
                            item.cantidad *
                              item.precio,
                          )}
                        </td>
                        <td>
                          <div className="d-flex justify-content-end gap-2">
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-primary"
                              onClick={() =>
                                editarDetalleTemporal(
                                  indice,
                                )
                              }
                            >
                              Modificar
                            </button>

                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger"
                              onClick={() =>
                                eliminarDetalleTemporal(
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
                  <th colSpan="3">
                    Total
                  </th>
                  <th>
                    {formatearDinero(
                      totalTemporal,
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
              onClick={limpiarFactura}
              disabled={guardando}
            >
              Limpiar
            </button>

            <button
              type="button"
              className="btn btn-success"
              onClick={guardarFactura}
              disabled={guardando}
            >
              {guardando
                ? "Guardando..."
                : estaEditando
                  ? "Guardar cambios"
                  : "Guardar factura"}
            </button>
          </div>
        </div>
      </div>

      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body p-4">
          <div className="d-flex flex-wrap justify-content-between gap-3 mb-4">
            <div>
              <h2 className="h5 mb-1">
                Facturas registradas
              </h2>

              <span className="badge text-bg-primary">
                {facturasFiltradas.length}{" "}
                registro
                {facturasFiltradas.length === 1
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
              placeholder="Buscar número, cliente o ciudad"
            />
          </div>

          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead>
                <tr>
                  <th>Número</th>
                  <th>Fecha</th>
                  <th>Cliente</th>
                  <th>Ciudad</th>
                  <th>Total</th>
                  <th className="text-end">
                    Acciones
                  </th>
                </tr>
              </thead>

              <tbody>
                {facturasFiltradas.map(
                  (factura) => (
                    <tr
                      key={factura.idFactura}
                    >
                      <td>
                        {factura.numeroFactura}
                      </td>
                      <td>
                        {formatearFecha(
                          factura.fecha,
                        )}
                      </td>
                      <td>
                        {factura.cliente?.nombre}
                      </td>
                      <td>
                        {factura.ciudad?.nombre}
                      </td>
                      <td>
                        {formatearDinero(
                          factura.valorTotal,
                        )}
                      </td>
                      <td>
                        <div className="d-flex justify-content-end gap-2">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-primary"
                            onClick={() =>
                              seleccionarFactura(
                                factura,
                              )
                            }
                          >
                            Consultar / modificar
                          </button>

                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger"
                            onClick={() =>
                              confirmarEliminarFactura(
                                  factura,
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

                {facturasFiltradas.length ===
                  0 && (
                  <tr>
                    <td
                      colSpan="6"
                      className="text-center text-secondary py-4"
                    >
                      No existen facturas para
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
