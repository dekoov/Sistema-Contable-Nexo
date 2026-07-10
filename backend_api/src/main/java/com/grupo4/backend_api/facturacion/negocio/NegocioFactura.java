package com.grupo4.backend_api.facturacion.negocio;

import com.grupo4.backend_api.facturacion.modelo.FacturaCabecera;
import com.grupo4.backend_api.facturacion.modelo.FacturaDetalle;
import com.grupo4.backend_api.inventario.negocio.NegocioComprobante;
import com.grupo4.backend_api.inventario.negocio.NegocioReporteInv;
import jakarta.persistence.*;
import java.util.List;

public class NegocioFactura {

    private static final String PU = "SistemaContablePU";

    /**
     * Inserta una nueva factura en la base de datos y, tras confirmar la transacción,
     * solicita el descuento automático de existencias en el módulo de inventarios.
     */
    public int insertar(FacturaCabecera factura) {
        EntityManagerFactory emf = null;
        EntityManager em = null;
        EntityTransaction tx = null;
        try {
            emf = Persistence.createEntityManagerFactory(PU);
            em  = emf.createEntityManager();
            tx  = em.getTransaction();
            tx.begin();
            
            em.persist(factura);
            for (FacturaDetalle det : factura.getDetalles()) {
                det.setFactura(factura);
                em.persist(det);
            }
            
            tx.commit(); 

            NegocioComprobante negComprobante = new NegocioComprobante();
            boolean egresoExitoso = negComprobante.registrarEgresoPorVenta(factura);
            
            if (!egresoExitoso) {
                System.out.println("Advertencia: La factura se guardó, pero hubo un error al descargar el inventario.");
            }

            return 1;
        } catch (Exception e) {
            if (tx != null && tx.isActive()) tx.rollback();
            e.printStackTrace();
            return -1;
        } finally {
            if (em  != null) em.close();
            if (emf != null) emf.close();
        }
    }

    /**
     * Elimina una factura y remueve sus detalles asociados antes de dar de baja la cabecera.
     */
    public int eliminar(Integer idFactura) {
        EntityManagerFactory emf = null;
        EntityManager em = null;
        EntityTransaction tx = null;
        try {
            emf = Persistence.createEntityManagerFactory(PU);
            em  = emf.createEntityManager();
            tx  = em.getTransaction();
            tx.begin();
            FacturaCabecera f = em.find(FacturaCabecera.class, idFactura);
            if (f != null) {
                List<FacturaDetalle> detalles = f.getDetalles();
                if (detalles != null) {
                    for (FacturaDetalle det : detalles) {
                        em.remove(det);
                    }
                }
                em.remove(f);
            }
            tx.commit();
            return 1;
        } catch (Exception e) {
            if (tx != null && tx.isActive()) tx.rollback();
            e.printStackTrace();
            return -1;
        } finally {
            if (em  != null) em.close();
            if (emf != null) emf.close();
        }
    }

    /**
     * Elimina de forma aislada un ítem específico del detalle de una factura.
     */
    public int eliminarDetalle(Integer idDetalle) {
        EntityManagerFactory emf = null;
        EntityManager em = null;
        EntityTransaction tx = null;
        try {
            emf = Persistence.createEntityManagerFactory(PU);
            em  = emf.createEntityManager();
            tx  = em.getTransaction();
            tx.begin();
            FacturaDetalle det = em.find(FacturaDetalle.class, idDetalle);
            if (det != null) em.remove(det);
            tx.commit();
            return 1;
        } catch (Exception e) {
            if (tx != null && tx.isActive()) tx.rollback();
            e.printStackTrace();
            return -1;
        } finally {
            if (em  != null) em.close();
            if (emf != null) emf.close();
        }
    }

    /**
     * Modifica los valores de cantidad y precio de un detalle existente.
     */
    public int modificarDetalle(FacturaDetalle detalle) {
        EntityManagerFactory emf = null;
        EntityManager em = null;
        EntityTransaction tx = null;
        try {
            emf = Persistence.createEntityManagerFactory(PU);
            em  = emf.createEntityManager();
            tx  = em.getTransaction();
            tx.begin();
            FacturaDetalle det = em.find(FacturaDetalle.class, detalle.getIdFacturaDet());
            if (det != null) {
                det.setCantidad(detalle.getCantidad());
                det.setPrecio(detalle.getPrecio());
                em.persist(det);
            }
            tx.commit();
            return 1;
        } catch (Exception e) {
            if (tx != null && tx.isActive()) tx.rollback();
            e.printStackTrace();
            return -1;
        } finally {
            if (em  != null) em.close();
            if (emf != null) emf.close();
        }
    }

    /**
     * Recupera una factura por su ID inicializando los detalles en la misma consulta
     * para mitigar excepciones de tipo LazyInitializationException.
     */
    public FacturaCabecera buscar(Integer idFactura) {
        EntityManagerFactory emf = null;
        EntityManager em = null;
        try {
            emf = Persistence.createEntityManagerFactory(PU);
            em  = emf.createEntityManager();
            
            return em.createQuery(
                    "SELECT f FROM FacturaCabecera f LEFT JOIN FETCH f.detalles WHERE f.idFactura = :id", 
                    FacturaCabecera.class)
                    .setParameter("id", idFactura)
                    .getSingleResult();
                    
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        } finally {
            if (em  != null) em.close();
            if (emf != null) emf.close();
        }
    }

    /**
     * Obtiene el listado completo de facturas ordenadas de forma cronológica descendente.
     */
    public List<FacturaCabecera> listarTodos() {
        EntityManagerFactory emf = null;
        EntityManager em = null;
        try {
            emf = Persistence.createEntityManagerFactory(PU);
            em  = emf.createEntityManager();
            
            return em.createQuery(
                    "SELECT DISTINCT f FROM FacturaCabecera f LEFT JOIN FETCH f.detalles ORDER BY f.fecha DESC",
                    FacturaCabecera.class).getResultList();
                    
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        } finally {
            if (em  != null) em.close();
            if (emf != null) emf.close();
        }
    }

    /**
     * Genera la sumatoria del valor total facturado agrupado por cada ciudad registrada.
     */
    public List<Object[]> reporteVentasPorCiudad() {
        EntityManagerFactory emf = null;
        EntityManager em = null;
        try {
            emf = Persistence.createEntityManagerFactory(PU);
            em  = emf.createEntityManager();
            return em.createQuery(
                            "SELECT c.nombre, SUM(f.valorTotal) " +
                                    "FROM FacturaCabecera f JOIN f.ciudad c " +
                                    "GROUP BY c.nombre ORDER BY SUM(f.valorTotal) DESC")
                    .getResultList();
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        } finally {
            if (em  != null) em.close();
            if (emf != null) emf.close();
        }
    }

    /**
     * Resuelve el valor entero consecutivo para la clave primaria de la tabla cabecera.
     */
    public Integer obtenerSiguienteId() {
        EntityManagerFactory emf = null;
        EntityManager em = null;
        try {
            emf = Persistence.createEntityManagerFactory(PU);
            em  = emf.createEntityManager();
            Number max = (Number) em.createQuery(
                            "SELECT COALESCE(MAX(f.idFactura), 0) FROM FacturaCabecera f")
                    .getSingleResult();
            return max.intValue() + 1;
        } catch (Exception e) {
            e.printStackTrace();
            return 1;
        } finally {
            if (em  != null) em.close();
            if (emf != null) emf.close();
        }
    }

    /**
     * Resuelve el valor entero consecutivo para la clave primaria de la tabla de detalles.
     */
    public Integer obtenerSiguienteIdDetalle() {
        EntityManagerFactory emf = null;
        EntityManager em = null;
        try {
            emf = Persistence.createEntityManagerFactory(PU);
            em  = emf.createEntityManager();
            Number max = (Number) em.createQuery(
                            "SELECT COALESCE(MAX(d.idFacturaDet), 0) FROM FacturaDetalle d")
                    .getSingleResult();
            return max.intValue() + 1;
        } catch (Exception e) {
            e.printStackTrace();
            return 1;
        } finally {
            if (em  != null) em.close();
            if (emf != null) emf.close();
        }
    }
    
    /**
     * Valida si existe stock suficiente para un artículo específico.
     * @param idArticulo Identificador en formato BigDecimal requerido por inventarios.
     * @param cantidadSolicitada Cantidad de unidades requeridas por la venta.
     * @throws IllegalArgumentException Si el stock es inferior a la demanda.
     */
    public void validarStockDisponible(java.math.BigDecimal idArticulo, int cantidadSolicitada) {
        try {
            NegocioReporteInv reporteInv = new NegocioReporteInv();
            int stockDisponible = reporteInv.obtenerStockActual(idArticulo);

            if (cantidadSolicitada > stockDisponible) {
                throw new IllegalArgumentException("Saldo insuficiente. Stock real: " + stockDisponible);
            }
        } catch (IllegalArgumentException e) {
            // Re-lanzamos nuestra validación de negocio controlada
            throw e;
        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException("Error interno al verificar las existencias en inventario.");
        }
    }
    
    
}