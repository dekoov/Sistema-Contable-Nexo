// backend_api/src/main/java/com/grupo4/backend_api/inventario/negocio/NegocioComprobante.java (MODIFICADO)
package com.grupo4.backend_api.inventario.negocio;

import com.grupo4.backend_api.core.eventos.FacturaCreadaEventDTO;
import com.grupo4.backend_api.core.eventos.FacturaDetalleEventDTO;
import com.grupo4.backend_api.inventario.modelo.Articulo;
import com.grupo4.backend_api.inventario.modelo.ComprobanteCabecera;
import com.grupo4.backend_api.inventario.modelo.ComprobanteDetalle;
import com.grupo4.backend_api.inventario.modelo.TipoMovimiento;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.TypedQuery;
import jakarta.transaction.Transactional;

import java.math.BigDecimal;
import java.math.BigInteger;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

@ApplicationScoped
public class NegocioComprobante {

    @PersistenceContext(unitName = "SistemaContablePU")
    private EntityManager em;

    @Transactional
    public void registrarTransaccion(ComprobanteCabecera cabecera, List<ComprobanteDetalle> detalles) throws Exception {
        validarTransaccion(cabecera, detalles);

        if (cabecera.getFecha() == null) {
            cabecera.setFecha(new java.util.Date());
        }

        // Resolver referencia managed real — objeto deserializado del JSON es transient
        TipoMovimiento tipoRef = em.find(TipoMovimiento.class, cabecera.getIdTipoMovimiento().getIdTipoMovimiento());
        if (tipoRef == null) {
            throw new Exception("Tipo de movimiento no existe: " + cabecera.getIdTipoMovimiento().getIdTipoMovimiento());
        }
        cabecera.setIdTipoMovimiento(tipoRef);

        // Auto-asignar idComprobanteDet — mismo rol que el contadorDetalle del JavaFX viejo,
        // ahora en servidor porque frontend ya no lo calcula
        BigDecimal siguienteIdDet = obtenerSiguienteIdDetalle();

        for (ComprobanteDetalle detalle : detalles) {
            Articulo articuloRef = em.find(Articulo.class, detalle.getIdArticulo().getIdArticulo());
            if (articuloRef == null) {
                throw new Exception("Artículo no existe: " + detalle.getIdArticulo().getIdArticulo());
            }
            detalle.setIdArticulo(articuloRef);
            detalle.setIdComprobanteDet(siguienteIdDet);
            siguienteIdDet = siguienteIdDet.add(BigDecimal.ONE);
            detalle.setIdComprobante(cabecera);
        }

        cabecera.setComprobanteDetalleCollection(detalles);
        em.merge(cabecera);
    }

    public List<ComprobanteCabecera> obtenerHistorialComprobantes() {
        TypedQuery<ComprobanteCabecera> query = em.createNamedQuery("ComprobanteCabecera.findAll",
                ComprobanteCabecera.class);
        List<ComprobanteCabecera> lista = query.getResultList();
        for (ComprobanteCabecera cab : lista) {
            if (cab.getComprobanteDetalleCollection() != null) {
                cab.getComprobanteDetalleCollection().size();
            }
        }
        return lista;
    }

    private void validarTransaccion(ComprobanteCabecera cabecera, List<ComprobanteDetalle> detalles) throws Exception {
        if (cabecera == null)
            throw new Exception("Los datos del comprobante están vacíos.");
        if (cabecera.getNumeroComprobante() == null || cabecera.getNumeroComprobante().trim().isEmpty())
            throw new Exception("El número de comprobante es obligatorio.");
        if (cabecera.getIdTipoMovimiento() == null)
            throw new Exception("Debe seleccionar un tipo de movimiento (Ingreso/Egreso).");
        if (detalles == null || detalles.isEmpty())
            throw new Exception("El comprobante debe tener al menos un artículo en el detalle.");
        for (ComprobanteDetalle det : detalles) {
            if (det.getIdArticulo() == null)
                throw new Exception("Una fila no tiene artículo seleccionado.");
            if (det.getCantidad() == null || det.getCantidad().compareTo(BigInteger.ZERO) <= 0)
                throw new Exception("Las cantidades deben ser mayores a cero.");
            if (det.getPrecio() == null || det.getPrecio().compareTo(BigDecimal.ZERO) < 0)
                throw new Exception("El precio no puede ser negativo.");
        }
    }

    public BigDecimal obtenerSiguienteId() {
        Number max = (Number) em.createQuery(
                "SELECT COALESCE(MAX(c.idComprobante), 0) FROM ComprobanteCabecera c").getSingleResult();
        return new BigDecimal(max.longValue() + 1);
    }

    public BigDecimal obtenerSiguienteIdDetalle() {
        Number max = (Number) em.createQuery(
                "SELECT COALESCE(MAX(d.idComprobanteDet), 0) FROM ComprobanteDetalle d").getSingleResult();
        return new BigDecimal(max.longValue() + 1);
    }

    @Transactional
    public void modificarTransaccion(ComprobanteCabecera cabeceraUI, List<ComprobanteDetalle> detallesActualizados)
            throws Exception {
        ComprobanteCabecera cabeceraBD = em.find(ComprobanteCabecera.class, cabeceraUI.getIdComprobante());
        if (cabeceraBD == null)
            throw new Exception("El comprobante no existe.");

        TipoMovimiento tipoRef = em.find(TipoMovimiento.class, cabeceraUI.getIdTipoMovimiento().getIdTipoMovimiento());
        if (tipoRef == null)
            throw new Exception("Tipo de movimiento no existe.");

        cabeceraBD.setNumeroComprobante(cabeceraUI.getNumeroComprobante());
        cabeceraBD.setFecha(cabeceraUI.getFecha());
        cabeceraBD.setIdTipoMovimiento(tipoRef);
        cabeceraBD.getComprobanteDetalleCollection().clear();

        BigDecimal siguienteIdDet = obtenerSiguienteIdDetalle();
        for (ComprobanteDetalle det : detallesActualizados) {
            Articulo articuloRef = em.find(Articulo.class, det.getIdArticulo().getIdArticulo());
            if (articuloRef == null)
                throw new Exception("Artículo no existe: " + det.getIdArticulo().getIdArticulo());
            det.setIdArticulo(articuloRef);
            if (det.getIdComprobanteDet() == null) {
                det.setIdComprobanteDet(siguienteIdDet);
                siguienteIdDet = siguienteIdDet.add(BigDecimal.ONE);
            }
            det.setIdComprobante(cabeceraBD);
            cabeceraBD.getComprobanteDetalleCollection().add(det);
        }
        em.merge(cabeceraBD);
    }

    @Transactional
    public void eliminarTransaccion(BigDecimal idComprobante) throws Exception {
        ComprobanteCabecera cabecera = em.find(ComprobanteCabecera.class, idComprobante);
        if (cabecera == null)
            throw new Exception("El comprobante no existe.");
        em.remove(cabecera);
    }

    public ComprobanteCabecera buscarPorId(BigDecimal idComprobante) {
        ComprobanteCabecera cabecera = em.find(ComprobanteCabecera.class, idComprobante);
        if (cabecera != null && cabecera.getComprobanteDetalleCollection() != null) {
            cabecera.getComprobanteDetalleCollection().size();
        }
        return cabecera;
    }

    /**
     * Consumido EXCLUSIVAMENTE por EgresoPorVentaListener (MDB).
     * Recibe un DTO plano — nunca la entidad FacturaCabecera de otro módulo.
     * Retorna false en fallos recuperables (artículo inexistente) para que
     * el MDB decida si reintenta o descarta el mensaje.
     */
    @Transactional
    public boolean registrarEgresoDesdeEvento(FacturaCreadaEventDTO evento) {
        TipoMovimiento tipoVenta = null;
        try {
            tipoVenta = em.createQuery(
                    "SELECT t FROM TipoMovimiento t WHERE t.tipo = :tipo", TipoMovimiento.class)
                    // CAMBIO CRÍTICO: Usar comillas simples 'E' para pasar un Character en lugar de un String "E"
                    .setParameter("tipo", 'E') 
                    .setMaxResults(1)
                    .getSingleResult();
        } catch (jakarta.persistence.NoResultException e) {
            System.out.println("ERROR INVENTARIO: No existe un TipoMovimiento configurado con tipo = 'E' (Egreso/Venta).");
            return false;
        }

        Number maxIdCab = (Number) em.createQuery(
                "SELECT COALESCE(MAX(c.idComprobante), 0) FROM ComprobanteCabecera c").getSingleResult();
        BigDecimal idCabecera = new BigDecimal(maxIdCab.longValue() + 1);

        ComprobanteCabecera cabecera = new ComprobanteCabecera();
        cabecera.setIdComprobante(idCabecera);
        cabecera.setNumeroComprobante("VEN-" + evento.getIdFactura());
        cabecera.setFecha(Date.from(LocalDate.parse(evento.getFecha().substring(0, 10)) // Asegurar formato ISO_DATE por si llega con hora
                .atStartOfDay(ZoneId.systemDefault()).toInstant()));
        cabecera.setIdTipoMovimiento(tipoVenta);

        Number maxIdDet = (Number) em.createQuery(
                "SELECT COALESCE(MAX(d.idComprobanteDet), 0) FROM ComprobanteDetalle d").getSingleResult();
        long nextIdDetalle = maxIdDet.longValue() + 1;

        List<ComprobanteDetalle> listaDetalles = new ArrayList<>();
        for (FacturaDetalleEventDTO detEvento : evento.getDetalles()) {
            BigDecimal idArticuloConvertido = BigDecimal.valueOf(detEvento.getIdArticulo());
            Articulo articulo = em.find(Articulo.class, idArticuloConvertido);
            
            if (articulo == null) {
                System.out.println("ERROR INVENTARIO: artículo ID " + idArticuloConvertido + " no existe.");
                return false;
            }

            ComprobanteDetalle detInv = new ComprobanteDetalle();
            detInv.setIdComprobanteDet(BigDecimal.valueOf(nextIdDetalle++));
            detInv.setIdComprobante(cabecera);
            detInv.setIdArticulo(articulo);
            detInv.setCantidad(BigInteger.valueOf(detEvento.getCantidad()));
            detInv.setPrecio(BigDecimal.valueOf(detEvento.getPrecio()));
            
            listaDetalles.add(detInv);
        }
        
        cabecera.setComprobanteDetalleCollection(listaDetalles);
        em.persist(cabecera);
        
        System.out.println("INVENTARIO: egreso por venta (factura " + evento.getIdFactura() + ") registrado vía cola.");
        return true;
    }
}
