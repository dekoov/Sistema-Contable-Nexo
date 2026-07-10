package com.grupo4.backend_api.facturacion.negocio;

import jakarta.persistence.EntityManager;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class ReporteFactura {

    private final EntityManager em;

    // Pasamos el EntityManager por constructor para poder usarlo en las consultas
    public ReporteFactura(EntityManager em) {
        this.em = em;
    }

    /**
     * Obtiene la matriz de ventas agrupada por artículo y cliente.
     * @return Mapa con estructura: <idArticulo, Map<idCliente, TotalDolares>>
     */
    public Map<Integer, Map<Integer, Double>> obtenerMatrizVentasPorCliente() {
        // 1. Consulta agrupada (idArticulo, idCliente, Total)
        String jpql = "SELECT d.idArticulo, c.idCliente, SUM(d.cantidad * d.precio) " +
                      "FROM FacturaDetalle d JOIN d.factura f JOIN f.cliente c " +
                      "GROUP BY d.idArticulo, c.idCliente";
        
        List<Object[]> resultados = em.createQuery(jpql, Object[].class).getResultList();
        
        // 2. Mapa: <idArticulo, Map<idCliente, TotalDolares>>
        Map<Integer, Map<Integer, Double>> matrizVentas = new HashMap<>();
        
        for (Object[] registro : resultados) {
            Integer idArticulo = (Integer) registro[0];
            Integer idCliente = (Integer) registro[1];
            Double totalVendido = (Double) registro[2];
            
            // Si el artículo no existe en el mapa, inicializamos su mapa de clientes
            matrizVentas.computeIfAbsent(idArticulo, k -> new HashMap<>());
            
            // Guardamos el total para ese cliente específico
            matrizVentas.get(idArticulo).put(idCliente, totalVendido);
        }
        
        return matrizVentas;
    }
}