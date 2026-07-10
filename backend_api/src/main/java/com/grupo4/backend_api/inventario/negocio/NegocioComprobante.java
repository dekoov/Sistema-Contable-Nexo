package com.grupo4.backend_api.inventario.negocio;

import com.grupo4.backend_api.facturacion.modelo.FacturaCabecera;
import com.grupo4.backend_api.facturacion.modelo.FacturaDetalle;
import com.grupo4.backend_api.inventario.modelo.Articulo;
import com.grupo4.backend_api.inventario.modelo.ComprobanteCabecera;
import com.grupo4.backend_api.inventario.modelo.ComprobanteDetalle;
import com.grupo4.backend_api.inventario.modelo.TipoMovimiento;


import java.math.BigDecimal;
import java.math.BigInteger;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityManagerFactory;
import jakarta.persistence.Persistence;
import jakarta.persistence.TypedQuery;

public class NegocioComprobante {

    private static final EntityManagerFactory emf = Persistence.createEntityManagerFactory("SistemaContablePU");

    /**
     * Guarda la Cabecera y el Detalle en una sola transacción atómica.
     */
    public void registrarTransaccion(ComprobanteCabecera cabecera, List<ComprobanteDetalle> detalles) throws Exception {
        validarTransaccion(cabecera, detalles);

        if (cabecera.getFecha() == null) {
            cabecera.setFecha(new Date());
        }

        EntityManager em = emf.createEntityManager();
        try {
            em.getTransaction().begin();

            // Enlazar bidireccionalmente los objetos para la persistencia
            for (ComprobanteDetalle detalle : detalles) {
                detalle.setIdComprobante(cabecera);
            }
            cabecera.setComprobanteDetalleCollection(detalles);

            // Gracias a CascadeType.ALL, persistir la cabecera guardará los detalles.
            em.merge(cabecera);

            em.getTransaction().commit();
            
        } catch (Exception e) {
            if (em.getTransaction().isActive()) {
                em.getTransaction().rollback();
            }
            throw new Exception("Error al guardar la transacción: " + e.getMessage());
        } finally {
            if (em != null) em.close();
        }
    }

    /**
     * Obtiene el historial de comprobantes generados.
     */
    public List<ComprobanteCabecera> obtenerHistorialComprobantes() {
        EntityManager em = emf.createEntityManager();
        try {
            TypedQuery<ComprobanteCabecera> query = em.createNamedQuery("ComprobanteCabecera.findAll", ComprobanteCabecera.class);
            List<ComprobanteCabecera> lista = query.getResultList();
            
            // Inicialización de colecciones perezosas antes de cerrar el EntityManager
            for (ComprobanteCabecera cab : lista) {
                if (cab.getComprobanteDetalleCollection() != null) {
                    cab.getComprobanteDetalleCollection().size(); 
                }
            }
            
            return lista;
        } finally {
            if (em != null) em.close();
        }
    }

    /**
     * Centraliza las reglas de negocio para asegurar la integridad de los datos.
     */
    private void validarTransaccion(ComprobanteCabecera cabecera, List<ComprobanteDetalle> detalles) throws Exception {
        if (cabecera == null) {
            throw new Exception("Los datos del comprobante están vacíos.");
        }
        if (cabecera.getNumeroComprobante() == null || cabecera.getNumeroComprobante().trim().isEmpty()) {
            throw new Exception("El número de comprobante es obligatorio.");
        }
        if (cabecera.getIdTipoMovimiento() == null) {
            throw new Exception("Debe seleccionar un tipo de movimiento (Ingreso/Egreso).");
        }
        
        if (detalles == null || detalles.isEmpty()) {
            throw new Exception("El comprobante debe tener al menos un artículo en el detalle.");
        }

        for (ComprobanteDetalle det : detalles) {
            if (det.getIdArticulo() == null) {
                throw new Exception("Una de las filas no tiene un artículo seleccionado.");
            }
            
            if (det.getCantidad() == null || det.getCantidad().compareTo(BigInteger.ZERO) <= 0) {
                throw new Exception("Las cantidades de los artículos deben ser mayores a cero.");
            }
            
            if (det.getPrecio() == null || det.getPrecio().compareTo(BigDecimal.ZERO) < 0) {
                throw new Exception("El precio en el detalle no puede ser negativo.");
            }
        }
    }
    
    /**
     * Obtiene el siguiente ID disponible para la Cabecera.
     */
    public BigDecimal obtenerSiguienteId() {
        EntityManager em = emf.createEntityManager();
        try {
            Number max = (Number) em.createQuery(
                            "SELECT COALESCE(MAX(c.idComprobante), 0) FROM ComprobanteCabecera c")
                    .getSingleResult();
            return new BigDecimal(max.longValue() + 1);
        } catch (Exception e) {
            e.printStackTrace();
            return BigDecimal.ONE;
        } finally {
            if (em != null) em.close();
        }
    }

    /**
     * Obtiene el siguiente ID disponible para el Detalle (uso temporal en memoria).
     */
    public BigDecimal obtenerSiguienteIdDetalle() {
        EntityManager em = emf.createEntityManager();
        try {
            Number max = (Number) em.createQuery(
                            "SELECT COALESCE(MAX(d.idComprobanteDet), 0) FROM ComprobanteDetalle d")
                    .getSingleResult();
            return new BigDecimal(max.longValue() + 1);
        } catch (Exception e) {
            e.printStackTrace();
            return BigDecimal.ONE;
        } finally {
            if (em != null) em.close();
        }
    }
    
    /**
     * Modifica un comprobante existente y sus detalles.
     */
    public void modificarTransaccion(ComprobanteCabecera cabeceraUI, List<ComprobanteDetalle> detallesActualizados) throws Exception {
        EntityManager em = emf.createEntityManager();
        try {
            em.getTransaction().begin();

            ComprobanteCabecera cabeceraBD = em.find(ComprobanteCabecera.class, cabeceraUI.getIdComprobante());
            if (cabeceraBD == null) {
                throw new Exception("El comprobante no existe.");
            }

            cabeceraBD.setNumeroComprobante(cabeceraUI.getNumeroComprobante());
            cabeceraBD.setFecha(cabeceraUI.getFecha());
            cabeceraBD.setIdTipoMovimiento(cabeceraUI.getIdTipoMovimiento());

            // Sincronización de la colección mediante Orphan Removal
            cabeceraBD.getComprobanteDetalleCollection().clear();

            for (ComprobanteDetalle det : detallesActualizados) {
                det.setIdComprobante(cabeceraBD); 
                cabeceraBD.getComprobanteDetalleCollection().add(det);
            }

            em.merge(cabeceraBD);
            em.getTransaction().commit();

        } catch (Exception ex) {
            if (em.getTransaction().isActive()) {
                em.getTransaction().rollback();
            }
            throw new Exception("Error al modificar en BD: " + ex.getMessage());
        } finally {
            if (em != null) em.close();
        }
    }

    /**
     * Elimina un comprobante y sus detalles por ID.
     */
    public void eliminarTransaccion(BigDecimal idComprobante) throws Exception {
        EntityManager em = emf.createEntityManager();
        try {
            em.getTransaction().begin();
            ComprobanteCabecera cabecera = em.find(ComprobanteCabecera.class, idComprobante);
            if (cabecera != null) {
                em.remove(cabecera); 
            } else {
                throw new Exception("El comprobante no existe.");
            }
            em.getTransaction().commit();
        } catch (Exception e) {
            if (em.getTransaction().isActive()) em.getTransaction().rollback();
            throw new Exception("Error al eliminar: " + e.getMessage());
        } finally {
            if (em != null) em.close();
        }
    }

    /**
     * Busca un comprobante específico por su ID.
     */
    public ComprobanteCabecera buscarPorId(BigDecimal idComprobante) {
        EntityManager em = emf.createEntityManager();
        try {
            ComprobanteCabecera cabecera = em.find(ComprobanteCabecera.class, idComprobante);
            // Carga forzada de la colección (Lazy Loading) antes del cierre del contexto
            if (cabecera != null && cabecera.getComprobanteDetalleCollection() != null) {
                cabecera.getComprobanteDetalleCollection().size(); 
            }
            return cabecera;
        } finally {
            if (em != null) em.close();
        }
    }
    
    /**
     * Registra un egreso de inventario a partir de una Factura de Venta.
     */
    public boolean registrarEgresoPorVenta(FacturaCabecera factura) {
        EntityManager em = emf.createEntityManager();
        try {
            em.getTransaction().begin();

            TipoMovimiento tipoVenta = em.find(TipoMovimiento.class, new BigDecimal(1));
            if (tipoVenta == null) {
                System.out.println("ERROR INVENTARIO: No se encontró el Tipo Movimiento con ID 1 (Egreso/Venta).");
                return false;
            }

            Number maxIdCab = (Number) em.createQuery(
                    "SELECT COALESCE(MAX(c.idComprobante), 0) FROM ComprobanteCabecera c")
                    .getSingleResult();
            BigDecimal idCabecera = new BigDecimal(maxIdCab.longValue() + 1);

            ComprobanteCabecera cabecera = new ComprobanteCabecera();
            cabecera.setIdComprobante(idCabecera);
            cabecera.setNumeroComprobante("VEN-" + factura.getIdFactura());
            cabecera.setFecha(factura.getFecha());
            cabecera.setIdTipoMovimiento(tipoVenta);

            Number maxIdDet = (Number) em.createQuery(
                    "SELECT COALESCE(MAX(d.idComprobanteDet), 0) FROM ComprobanteDetalle d")
                    .getSingleResult();
            long nextIdDetalle = maxIdDet.longValue() + 1;

            List<ComprobanteDetalle> listaDetalles = new ArrayList<>();
            
            for (FacturaDetalle detFactura : factura.getDetalles()) {
                ComprobanteDetalle detInv = new ComprobanteDetalle();
                
                detInv.setIdComprobanteDet(BigDecimal.valueOf(nextIdDetalle++));
                detInv.setIdComprobante(cabecera); 
                
                // Conversión de tipos para compatibilidad entre módulos
                BigDecimal idArticuloConvertido = BigDecimal.valueOf(detFactura.getIdArticulo());
                Articulo articulo = em.find(Articulo.class, idArticuloConvertido);
                
                if (articulo == null) {
                    System.out.println("ERROR INVENTARIO: El artículo con ID " + idArticuloConvertido + " no existe.");
                    return false;
                }
                detInv.setIdArticulo(articulo);
                
                detInv.setCantidad(BigInteger.valueOf(detFactura.getCantidad()));
                detInv.setPrecio(BigDecimal.valueOf(detFactura.getPrecio()));
                
                listaDetalles.add(detInv);
            }
            
            cabecera.setComprobanteDetalleCollection(listaDetalles);

            em.persist(cabecera);
            em.getTransaction().commit();
            
            System.out.println("INVENTARIO: Comprobante de egreso generado exitosamente.");
            return true;

        } catch (Exception e) {
            if (em.getTransaction().isActive()) {
                em.getTransaction().rollback();
            }
            System.out.println("ERROR AL GENERAR EL COMPROBANTE DE INVENTARIO DESDE FACTURACIÓN:");
            e.printStackTrace();
            return false;
        } finally {
            if (em != null) em.close();
        }
    }
}