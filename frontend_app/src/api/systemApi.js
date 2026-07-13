import apiClient from "./apiClient";

// ============================================================================
// SYSTEM
// ============================================================================

export async function getServerInstance() {
  const response = await apiClient.get("/system/instance");
  return response.data;
}

// ============================================================================
// MÓDULO COMUN — Usuario (Origen: NegocioUsuario.java)
// ============================================================================

export async function getUsuarios() {
  const response = await apiClient.get("/usuarios");
  return response.data;
}

export async function getUsuarioById(id) {
  const response = await apiClient.get(`/usuarios/${id}`);
  return response.data;
}

export async function crearUsuario(usuario) {
  const response = await apiClient.post("/usuarios", usuario);
  return response.data;
}

export async function actualizarUsuario(id, usuario) {
  const response = await apiClient.put(`/usuarios/${id}`, usuario);
  return response.data;
}

export async function eliminarUsuario(id) {
  const response = await apiClient.delete(`/usuarios/${id}`);
  return response.data;
}

// ============================================================================
// MÓDULO COBRANZAS (CobradorResource.java & FormaPagoResource.java)
// ============================================================================

// --- Cobradores ---
export async function getCobradores() {
  const response = await apiClient.get("/cobradores");
  return response.data;
}

export async function getCobradorById(id) {
  const response = await apiClient.get(`/cobradores/${id}`);
  return response.data;
}

export async function crearCobrador(cobrador) {
  const response = await apiClient.post("/cobradores", cobrador);
  return response.data;
}

export async function actualizarCobrador(id, cobrador) {
  const response = await apiClient.put(`/cobradores/${id}`, cobrador);
  return response.data;
}

export async function eliminarCobrador(id) {
  const response = await apiClient.delete(`/cobradores/${id}`);
  return response.data;
}

// --- Formas de Pago ---
export async function getFormasPago() {
  const response = await apiClient.get("/formas-pago");
  return response.data;
}

export async function getFormaPagoByCodigo(codigo) {
  const response = await apiClient.get(`/formas-pago/${codigo}`);
  return response.data;
}

export async function crearFormaPago(formaPago) {
  const response = await apiClient.post("/formas-pago", formaPago);
  return response.data;
}

export async function actualizarFormaPago(codigo, formaPago) {
  const response = await apiClient.put(`/formas-pago/${codigo}`, formaPago);
  return response.data;
}

export async function eliminarFormaPago(codigo) {
  const response = await apiClient.delete(`/formas-pago/${codigo}`);
  return response.data;
}

// ============================================================================
// MÓDULO FACTURACIÓN (NegocioCiudad, NegocioCliente, NegocioFactura)
// ============================================================================

// --- Ciudades ---
export async function getCiudades() {
  const response = await apiClient.get("/ciudades");
  return response.data;
}

export async function getCiudadById(id) {
  const response = await apiClient.get(`/ciudades/${id}`);
  return response.data;
}

export async function buscarCiudadesPorNombre(nombre) {
  const response = await apiClient.get("/ciudades/buscar", {
    params: { nombre },
  });
  return response.data;
}

export async function crearCiudad(ciudad) {
  const response = await apiClient.post("/ciudades", ciudad);
  return response.data;
}

export async function actualizarCiudad(id, ciudad) {
  const response = await apiClient.put(`/ciudades/${id}`, ciudad);
  return response.data;
}

export async function eliminarCiudad(id) {
  const response = await apiClient.delete(`/ciudades/${id}`);
  return response.data;
}

// --- Clientes ---
export async function getClientes() {
  const response = await apiClient.get("/clientes");
  return response.data;
}

export async function getClienteById(id) {
  const response = await apiClient.get(`/clientes/${id}`);
  return response.data;
}

export async function buscarClientesPorValor(valor) {
  const response = await apiClient.get("/clientes/buscar", {
    params: { valor },
  });
  return response.data;
}

export async function crearCliente(cliente) {
  const response = await apiClient.post("/clientes", cliente);
  return response.data;
}

export async function actualizarCliente(id, cliente) {
  const response = await apiClient.put(`/clientes/${id}`, cliente);
  return response.data;
}

export async function eliminarCliente(id) {
  const response = await apiClient.delete(`/clientes/${id}`);
  return response.data;
}

// --- Facturas (cabecera-detalle) ---
export async function getFacturas() {
  const response = await apiClient.get("/facturas");
  return response.data;
}

export async function getFacturaById(id) {
  const response = await apiClient.get(`/facturas/${id}`);
  return response.data;
}

export async function crearFactura(factura) {
  const response = await apiClient.post("/facturas", factura);
  return response.data;
}

export async function eliminarFactura(id) {
  const response = await apiClient.delete(`/facturas/${id}`);
  return response.data;
}

export async function actualizarFacturaDetalle(idDetalle, detalle) {
  const response = await apiClient.put(`/facturas/detalle/${idDetalle}`, detalle);
  return response.data;
}

export async function eliminarFacturaDetalle(idDetalle) {
  const response = await apiClient.delete(`/facturas/detalle/${idDetalle}`);
  return response.data;
}

export async function getReporteVentasPorCiudad() {
  const response = await apiClient.get("/facturas/reportes/ventas-por-ciudad");
  return response.data;
}

export async function getReporteMatrizVentas() {
  const response = await apiClient.get("/facturas/reportes/matriz-ventas");
  return response.data;
}

// ============================================================================
// MÓDULO INVENTARIO (NegocioArticulo, NegocioTipoMovimiento, NegocioComprobante)
// ============================================================================

// --- Artículos ---
export async function getArticulos() {
  const response = await apiClient.get("/articulos");
  return response.data;
}

export async function getArticuloById(id) {
  const response = await apiClient.get(`/articulos/${id}`);
  return response.data;
}

export async function buscarArticulosPorNombre(nombre) {
  const response = await apiClient.get("/articulos/buscar", {
    params: { nombre },
  });
  return response.data;
}

export async function crearArticulo(articulo) {
  const response = await apiClient.post("/articulos", articulo);
  return response.data;
}

export async function actualizarArticulo(id, articulo) {
  const response = await apiClient.put(`/articulos/${id}`, articulo);
  return response.data;
}

export async function eliminarArticulo(id) {
  const response = await apiClient.delete(`/articulos/${id}`);
  return response.data;
}

// --- Tipos de Movimiento ---
export async function getTiposMovimiento() {
  const response = await apiClient.get("/tipos-movimiento");
  return response.data;
}

export async function crearTipoMovimiento(tipoMovimiento) {
  const response = await apiClient.post("/tipos-movimiento", tipoMovimiento);
  return response.data;
}

export async function actualizarTipoMovimiento(id, tipoMovimiento) {
  const response = await apiClient.put(`/tipos-movimiento/${id}`, tipoMovimiento);
  return response.data;
}

export async function eliminarTipoMovimiento(id) {
  const response = await apiClient.delete(`/tipos-movimiento/${id}`);
  return response.data;
}

// --- Comprobantes (cabecera-detalle) ---
export async function getComprobantes() {
  const response = await apiClient.get("/comprobantes");
  return response.data;
}

export async function getComprobanteById(id) {
  const response = await apiClient.get(`/comprobantes/${id}`);
  return response.data;
}

export async function crearComprobante(comprobante) {
  const response = await apiClient.post("/comprobantes", comprobante);
  return response.data;
}

export async function actualizarComprobante(id, comprobante) {
  const response = await apiClient.put(`/comprobantes/${id}`, comprobante);
  return response.data;
}

export async function eliminarComprobante(id) {
  const response = await apiClient.delete(`/comprobantes/${id}`);
  return response.data;
}

// --- Reportes y Stock ---
export async function getReporteMovimientos(fechaInicio, fechaFin) {
  const response = await apiClient.get("/inventario/reportes/movimientos", {
    params: { fechaInicio, fechaFin },
  });
  return response.data;
}

export async function getArticuloStock(id) {
  const response = await apiClient.get(`/articulos/${id}/stock`);
  return response.data;
}
