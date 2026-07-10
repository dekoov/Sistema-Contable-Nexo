package com.grupo4.backend_api.inventario.negocio;

import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityManagerFactory;
import jakarta.persistence.Persistence;
import java.util.Date;
import java.util.List;

public class NegocioReporteInv {

    private static final String PU = "SistemaContablePU";

    /**
     * Retorna datos agrupados para la construcción de reportes visuales basados en un rango de fechas.
     */
    public List<Object[]> obtenerDatosReporte(Date fechaInicio, Date fechaFin) {
        EntityManagerFactory emf = null;
        EntityManager em = null;
        try {
            emf = Persistence.createEntityManagerFactory(PU);
            em = emf.createEntityManager();
            
            String jpql = "SELECT d.idArticulo.nombre, c.idTipoMovimiento.nombre, c.idTipoMovimiento.tipo, SUM(d.cantidad) " +
                          "FROM ComprobanteDetalle d JOIN d.idComprobante c " +
                          "WHERE c.fecha BETWEEN :inicio AND :fin " +
                          "GROUP BY d.idArticulo.nombre, c.idTipoMovimiento.nombre, c.idTipoMovimiento.tipo " +
                          "ORDER BY d.idArticulo.nombre";
                          
            return em.createQuery(jpql)
                     .setParameter("inicio", fechaInicio)
                     .setParameter("fin", fechaFin)
                     .getResultList();
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        } finally {
            if (em != null) em.close();
            if (emf != null) emf.close();
        }
    }

    /**
     * Calcula el stock disponible en tiempo real de un artículo específico basándose en sus movimientos.
     * * @param idArticulo ID único del artículo
     * @return saldo neto disponible en el inventario
     */
    public int obtenerStockActual(java.math.BigDecimal idArticulo) {
        EntityManagerFactory emf = null;
        EntityManager em = null;
        try {
            emf = Persistence.createEntityManagerFactory(PU);
            em = emf.createEntityManager();

            // Sumar Ingresos
            String jpqlIngresos = "SELECT COALESCE(SUM(d.cantidad), 0) FROM ComprobanteDetalle d " +
                                  "WHERE d.idArticulo.idArticulo = :idArt AND d.idComprobante.idTipoMovimiento.tipo = 'I'";
            Number ingresos = (Number) em.createQuery(jpqlIngresos)
                    .setParameter("idArt", idArticulo)
                    .getSingleResult();

            // Sumar Egresos
            String jpqlEgresos = "SELECT COALESCE(SUM(d.cantidad), 0) FROM ComprobanteDetalle d " +
                                 "WHERE d.idArticulo.idArticulo = :idArt AND d.idComprobante.idTipoMovimiento.tipo <> 'I'";
            Number egresos = (Number) em.createQuery(jpqlEgresos)
                    .setParameter("idArt", idArticulo)
                    .getSingleResult();

            return ingresos.intValue() - egresos.intValue();

        } catch (Exception e) {
            e.printStackTrace(); 
            return 0; 
        } finally {
            if (em != null) em.close();
            if (emf != null) emf.close();
        }
    }
}