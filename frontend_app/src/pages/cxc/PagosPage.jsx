import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  actualizarPago,
  crearPago,
  eliminarPago,
  listarPagos,
  obtenerMensajePagoError,
} from "../../api/pagosApi";

import { listarFacturas } from "../../api/facturasApi";
import { listarCobradores } from "../../api/cobradoresApi";
import { listarFormasPago } from "../../api/formasPagoApi";

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

const FORMULARIO_INICIAL = {
  fechaPago: obtenerFechaActual(),
  valor: "",
  idFactura: "",
  idCobrador: "",
  codigoFormaPago: "",
};

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

  const partes = String(fecha)
    .slice(0, 10)
    .split("-");

  if (partes.length !== 3) {
    return fecha;
  }

  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

export default function PagosPage() {
  const [facturas, setFacturas] =
    useState([]);

  const [cobradores, setCobradores] =
    useState([]);

  const [formasPago, setFormasPago] =
    useState([]);

  const [pagos, setPagos] = useState([]);

  const [formulario, setFormulario] =
    useState(FORMULARIO_INICIAL);

  const [
    idPagoEditando,
    setIdPagoEditando,
  ] = useState(null);

  const [busqueda, setBusqueda] =
    useState("");

  const [cargando, setCargando] =
    useState(true);

  const [guardando, setGuardando] =
    useState(false);

  const [eliminandoId, setEliminandoId] =
    useState(null);

  const [mensaje, setMensaje] =
    useState(null);

  const estaEditando =
    idPagoEditando !== null;

  const facturaSeleccionada = useMemo(() => {
    return facturas.find(
      (factura) =>
        Number(factura.idFactura) ===
        Number(formulario.idFactura),
    );
  }, [facturas, formulario.idFactura]);

  const totalPagadoFactura = useMemo(() => {
    if (!formulario.idFactura) {
      return 0;
    }

    return pagos
      .filter((pago) => {
        const mismaFactura =
          Number(pago.factura?.idFactura) ===
          Number(formulario.idFactura);

        const esPagoEditando =
          idPagoEditando !== null &&
          Number(pago.idPagoDetalle) ===
            Number(idPagoEditando);

        return mismaFactura && !esPagoEditando;
      })
      .reduce(
        (total, pago) =>
          total + Number(pago.valor || 0),
        0,
      );
  }, [
    pagos,
    formulario.idFactura,
    idPagoEditando,
  ]);

  const saldoDisponible = Math.max(
    0,
    Number(
      facturaSeleccionada?.valorTotal ?? 0,
    ) - totalPagadoFactura,
  );

  const pagosFiltrados = useMemo(() => {
    const termino = busqueda
      .trim()
      .toLowerCase();

    if (!termino) {
      return pagos;
    }

    return pagos.filter((pago) => {
      return (
        pago.factura?.numeroFactura
          ?.toLowerCase()
          .includes(termino) ||
        pago.factura?.cliente?.nombre
          ?.toLowerCase()
          .includes(termino) ||
        pago.cobrador?.nombre
          ?.toLowerCase()
          .includes(termino) ||
        pago.formaPago?.nombre
          ?.toLowerCase()
          .includes(termino)
      );
    });
  }, [pagos, busqueda]);

  useEffect(() => {
    async function cargarDatos() {
      setCargando(true);

      try {
        const [
          facturasData,
          cobradoresData,
          formasPagoData,
          pagosData,
        ] = await Promise.all([
          listarFacturas(),
          listarCobradores(),
          listarFormasPago(),
          listarPagos(),
        ]);

        setFacturas(facturasData);
        setCobradores(cobradoresData);
        setFormasPago(formasPagoData);
        setPagos(pagosData);
      } catch (error) {
        setMensaje({
          tipo: "danger",
          texto: obtenerMensajePagoError(
            error,
            "No fue posible cargar la pantalla de pagos.",
          ),
        });
      } finally {
        setCargando(false);
      }
    }

    cargarDatos();
  }, []);

  async function recargarPagos() {
    const data = await listarPagos();
    setPagos(data);
  }

  function actualizarCampo(event) {
    const { name, value } = event.target;

    setFormulario((actual) => ({
      ...actual,
      [name]: value,
    }));
  }

  function seleccionarFactura(event) {
    const idFactura = event.target.value;

    const factura = facturas.find(
      (item) =>
        Number(item.idFactura) ===
        Number(idFactura),
    );

    const totalPagado = pagos
      .filter(
        (pago) =>
          Number(pago.factura?.idFactura) ===
          Number(idFactura),
      )
      .reduce(
        (total, pago) =>
          total + Number(pago.valor || 0),
        0,
      );

    const saldo = Math.max(
      0,
      Number(factura?.valorTotal ?? 0) -
        totalPagado,
    );

    setFormulario((actual) => ({
      ...actual,
      idFactura,
      valor:
        idFactura && saldo > 0
          ? saldo.toFixed(2)
          : "",
    }));
  }

  function limpiarFormulario() {
    setFormulario({
      ...FORMULARIO_INICIAL,
      fechaPago: obtenerFechaActual(),
    });

    setIdPagoEditando(null);
  }

  function validarFormulario() {
    const valor = Number(formulario.valor);

    if (!formulario.idFactura) {
      return "Seleccione una factura.";
    }

    if (!formulario.idCobrador) {
      return "Seleccione un cobrador.";
    }

    if (!formulario.codigoFormaPago) {
      return "Seleccione una forma de pago.";
    }

    if (!formulario.fechaPago) {
      return "La fecha del pago es obligatoria.";
    }

    if (
      !Number.isFinite(valor) ||
      valor <= 0
    ) {
      return "El valor debe ser mayor que cero.";
    }

    if (valor > saldoDisponible + 0.001) {
      return `El valor supera el saldo disponible de ${formatearDinero(
        saldoDisponible,
      )}.`;
    }

    return null;
  }

  async function guardarPago(event) {
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

    const factura = facturas.find(
      (item) =>
        Number(item.idFactura) ===
        Number(formulario.idFactura),
    );

    const cobrador = cobradores.find(
      (item) =>
        Number(item.idCobrador) ===
        Number(formulario.idCobrador),
    );

    const formaPago = formasPago.find(
      (item) =>
        Number(item.codigo) ===
        Number(
          formulario.codigoFormaPago,
        ),
    );

    const pago = {
      fechaPago: formulario.fechaPago,
      valor: Number(formulario.valor),
      factura,
      cobrador,
      formaPago,
    };

    setGuardando(true);
    setMensaje(null);

    try {
      if (estaEditando) {
        await actualizarPago(
          idPagoEditando,
          pago,
        );

        setMensaje({
          tipo: "success",
          texto:
            "Pago modificado correctamente.",
        });
      } else {
        await crearPago(pago);

        setMensaje({
          tipo: "success",
          texto:
            "Pago registrado correctamente.",
        });
      }

      limpiarFormulario();
      await recargarPagos();
    } catch (error) {
      setMensaje({
        tipo: "danger",
        texto: obtenerMensajePagoError(
          error,
          "No fue posible guardar el pago.",
        ),
      });
    } finally {
      setGuardando(false);
    }
  }

  function seleccionarParaEditar(pago) {
    setIdPagoEditando(
      pago.idPagoDetalle,
    );

    setFormulario({
      fechaPago: pago.fechaPago,
      valor: String(pago.valor),

      idFactura: String(
        pago.factura?.idFactura ?? "",
      ),

      idCobrador: String(
        pago.cobrador?.idCobrador ?? "",
      ),

      codigoFormaPago: String(
        pago.formaPago?.codigo ?? "",
      ),
    });

    setMensaje(null);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function confirmarEliminacion(pago) {
    const confirmado = window.confirm(
      `¿Eliminar el pago de ${formatearDinero(
        pago.valor,
      )} correspondiente a la factura "${pago.factura?.numeroFactura}"?`,
    );

    if (!confirmado) {
      return;
    }

    setEliminandoId(
      pago.idPagoDetalle,
    );

    try {
      await eliminarPago(
        pago.idPagoDetalle,
      );

      if (
        Number(idPagoEditando) ===
        Number(pago.idPagoDetalle)
      ) {
        limpiarFormulario();
      }

      await recargarPagos();

      setMensaje({
        tipo: "success",
        texto:
          "Pago eliminado correctamente.",
      });
    } catch (error) {
      setMensaje({
        tipo: "danger",
        texto: obtenerMensajePagoError(
          error,
          "No fue posible eliminar el pago.",
        ),
      });
    } finally {
      setEliminandoId(null);
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
          Cargando pagos...
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Pagos</h1>

          <p>
            Registro de abonos y pagos asociados
            a facturas.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-primary"
          onClick={limpiarFormulario}
        >
          Nuevo pago
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
                  ? `Modificar pago #${idPagoEditando}`
                  : "Nuevo pago"}
              </h2>

              <form
                onSubmit={guardarPago}
                noValidate
              >
                <div className="mb-3">
                  <label
                    className="form-label"
                    htmlFor="facturaPago"
                  >
                    Factura
                  </label>

                  <select
                    id="facturaPago"
                    name="idFactura"
                    className="form-select"
                    value={
                      formulario.idFactura
                    }
                    onChange={
                      seleccionarFactura
                    }
                    disabled={guardando}
                  >
                    <option value="">
                      Seleccione
                    </option>

                    {facturas.map((factura) => (
                      <option
                        key={factura.idFactura}
                        value={factura.idFactura}
                      >
                        {factura.numeroFactura} -{" "}
                        {factura.cliente?.nombre ??
                          "Sin cliente"}{" "}
                        -{" "}
                        {formatearDinero(
                          factura.valorTotal,
                        )}
                      </option>
                    ))}
                  </select>
                </div>

                {facturaSeleccionada && (
                  <div className="alert alert-light border">
                    <div>
                      Total:{" "}
                      <strong>
                        {formatearDinero(
                          facturaSeleccionada.valorTotal,
                        )}
                      </strong>
                    </div>

                    <div>
                      Pagado:{" "}
                      <strong>
                        {formatearDinero(
                          totalPagadoFactura,
                        )}
                      </strong>
                    </div>

                    <div>
                      Saldo disponible:{" "}
                      <strong>
                        {formatearDinero(
                          saldoDisponible,
                        )}
                      </strong>
                    </div>
                  </div>
                )}

                <div className="mb-3">
                  <label
                    className="form-label"
                    htmlFor="cobradorPago"
                  >
                    Cobrador
                  </label>

                  <select
                    id="cobradorPago"
                    name="idCobrador"
                    className="form-select"
                    value={
                      formulario.idCobrador
                    }
                    onChange={actualizarCampo}
                    disabled={guardando}
                  >
                    <option value="">
                      Seleccione
                    </option>

                    {cobradores.map(
                      (cobrador) => (
                        <option
                          key={
                            cobrador.idCobrador
                          }
                          value={
                            cobrador.idCobrador
                          }
                        >
                          {cobrador.nombre} -{" "}
                          {cobrador.cedula}
                        </option>
                      ),
                    )}
                  </select>
                </div>

                <div className="mb-3">
                  <label
                    className="form-label"
                    htmlFor="formaPago"
                  >
                    Forma de pago
                  </label>

                  <select
                    id="formaPago"
                    name="codigoFormaPago"
                    className="form-select"
                    value={
                      formulario.codigoFormaPago
                    }
                    onChange={actualizarCampo}
                    disabled={guardando}
                  >
                    <option value="">
                      Seleccione
                    </option>

                    {formasPago.map(
                      (formaPago) => (
                        <option
                          key={formaPago.codigo}
                          value={formaPago.codigo}
                        >
                          {formaPago.nombre}
                        </option>
                      ),
                    )}
                  </select>
                </div>

                <div className="mb-3">
                  <label
                    className="form-label"
                    htmlFor="fechaPago"
                  >
                    Fecha
                  </label>

                  <input
                    id="fechaPago"
                    name="fechaPago"
                    type="date"
                    className="form-control"
                    value={
                      formulario.fechaPago
                    }
                    onChange={actualizarCampo}
                    disabled={guardando}
                  />
                </div>

                <div className="mb-4">
                  <label
                    className="form-label"
                    htmlFor="valorPago"
                  >
                    Valor
                  </label>

                  <div className="input-group">
                    <span className="input-group-text">
                      $
                    </span>

                    <input
                      id="valorPago"
                      name="valor"
                      type="number"
                      min="0.01"
                      step="0.01"
                      className="form-control"
                      value={formulario.valor}
                      onChange={actualizarCampo}
                      disabled={guardando}
                    />
                  </div>
                </div>

                <div className="d-flex gap-2">
                  <button
                    type="submit"
                    className="btn btn-success"
                    disabled={guardando}
                  >
                    {guardando
                      ? "Guardando..."
                      : estaEditando
                        ? "Guardar cambios"
                        : "Registrar pago"}
                  </button>

                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={
                      limpiarFormulario
                    }
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
              <div className="d-flex flex-wrap justify-content-between gap-3 mb-4">
                <div>
                  <h2 className="h5 mb-1">
                    Pagos registrados
                  </h2>

                  <span className="badge text-bg-primary">
                    {pagosFiltrados.length}{" "}
                    registro
                    {pagosFiltrados.length === 1
                      ? ""
                      : "s"}
                  </span>
                </div>

                <input
                  type="search"
                  className="form-control"
                  style={{
                    maxWidth: "350px",
                  }}
                  value={busqueda}
                  onChange={(event) =>
                    setBusqueda(
                      event.target.value,
                    )
                  }
                  placeholder="Buscar factura, cliente o cobrador"
                />
              </div>

              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Factura</th>
                      <th>Fecha</th>
                      <th>Cobrador</th>
                      <th>Forma</th>
                      <th>Valor</th>

                      <th className="text-end">
                        Acciones
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {pagosFiltrados.map(
                      (pago) => (
                        <tr
                          key={
                            pago.idPagoDetalle
                          }
                        >
                          <td>
                            {
                              pago.idPagoDetalle
                            }
                          </td>

                          <td>
                            {
                              pago.factura
                                ?.numeroFactura
                            }

                            <small className="d-block text-secondary">
                              {pago.factura
                                ?.cliente
                                ?.nombre ??
                                "Sin cliente"}
                            </small>
                          </td>

                          <td>
                            {formatearFecha(
                              pago.fechaPago,
                            )}
                          </td>

                          <td>
                            {
                              pago.cobrador
                                ?.nombre
                            }
                          </td>

                          <td>
                            {
                              pago.formaPago
                                ?.nombre
                            }
                          </td>

                          <td>
                            <strong>
                              {formatearDinero(
                                pago.valor,
                              )}
                            </strong>
                          </td>

                          <td>
                            <div className="d-flex justify-content-end gap-2">
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-primary"
                                onClick={() =>
                                  seleccionarParaEditar(
                                    pago,
                                  )
                                }
                                disabled={
                                  eliminandoId ===
                                  pago.idPagoDetalle
                                }
                              >
                                Modificar
                              </button>

                              <button
                                type="button"
                                className="btn btn-sm btn-outline-danger"
                                onClick={() =>
                                  confirmarEliminacion(
                                    pago,
                                  )
                                }
                                disabled={
                                  eliminandoId ===
                                  pago.idPagoDetalle
                                }
                              >
                                {eliminandoId ===
                                pago.idPagoDetalle
                                  ? "Eliminando..."
                                  : "Eliminar"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ),
                    )}

                    {pagosFiltrados.length ===
                      0 && (
                      <tr>
                        <td
                          colSpan="7"
                          className="text-center text-secondary py-5"
                        >
                          No existen pagos para
                          mostrar.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}