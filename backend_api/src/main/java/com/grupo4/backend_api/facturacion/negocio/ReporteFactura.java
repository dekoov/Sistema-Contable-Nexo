package com.grupo4.backend_api.facturacion.negocio;

import jakarta.persistence.EntityManager;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class ReporteFactura {

    private final EntityManager em;

    public ReporteFactura(EntityManager em) {
        this.em = em;
    }

    /**
     * Obtiene la matriz de ventas agrupada por artículo y cliente de forma segura para PostgreSQL.
     */
    public Map<Integer, Map<Integer, Double>> obtenerMatrizVentasPorCliente() {
        String jpql = "SELECT d.idArticulo, c.idCliente, SUM(d.cantidad * d.precio) " +
                      "FROM FacturaDetalle d JOIN d.factura f JOIN f.cliente c " +
                      "GROUP BY d.idArticulo, c.idCliente";
        
        List<Object[]> resultados = em.createQuery(jpql, Object[].class).getResultList();
        Map<Integer, Map<Integer, Double>> matrizVentas = new HashMap<>();
        
        for (Object[] registro : resultados) {
            // Protección contra tipos nativos de PostgreSQL (Number maneja de forma segura Integer/Long/BigDecimal)
            Integer idArticulo = (registro[0] != null) ? ((Number) registro[0]).intValue() : 0;
            Integer idCliente = (registro[1] != null) ? ((Number) registro[1]).intValue() : 0;
            Double totalVendido = (registro[2] != null) ? ((Number) registro[2]).doubleValue() : 0.0;
            
            matrizVentas.computeIfAbsent(idArticulo, k -> new HashMap<>());
            matrizVentas.get(idArticulo).put(idCliente, totalVendido);
        }
        
        return matrizVentas;
    }

    /**
     * Reporte A: Obtiene las ventas totales agrupadas por el nombre de la ciudad.
     * Requerido por: /facturas/reportes/ventas-por-ciudad
     */
    public List<Object[]> obtenerVentasPorCiudad() {
        // En PostgreSQL las ciudades se asocian mediante la cabecera o el cliente. 
        // Asumiendo mapeo estándar donde la FacturaCabecera contiene la relación directa a Ciudad (f.ciudad)
        String jpql = "SELECT c.nombre, SUM(d.cantidad * d.precio) " +
                      "FROM FacturaDetalle d JOIN d.factura f JOIN f.ciudad c " +
                      "GROUP BY c.nombre";
                      
        return em.createQuery(jpql, Object[].class).getResultList();
    }
}