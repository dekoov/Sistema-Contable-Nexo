package com.grupo4.backend_api.inventario.negocio;

import com.grupo4.backend_api.inventario.dto.ReporteMovimientoDTO;
import jakarta.ejb.Stateless;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import java.math.BigDecimal;
import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

@Stateless
public class NegocioReporteInv {

    @PersistenceContext(unitName = "SistemaContablePU")
    private EntityManager em;

    public List<ReporteMovimientoDTO> obtenerDatosReporte(Date fechaInicio, Date fechaFin) {
        // Agregado d.idArticulo.idArticulo en el SELECT y GROUP BY
        String jpql = "SELECT d.idArticulo.idArticulo, d.idArticulo.nombre, c.idTipoMovimiento.nombre, c.idTipoMovimiento.tipo, SUM(d.cantidad) " +
                      "FROM ComprobanteDetalle d JOIN d.idComprobante c " +
                      "WHERE c.fecha BETWEEN :inicio AND :fin " +
                      "GROUP BY d.idArticulo.idArticulo, d.idArticulo.nombre, c.idTipoMovimiento.nombre, c.idTipoMovimiento.tipo " +
                      "ORDER BY d.idArticulo.nombre";
                      
        List<Object[]> resultados = em.createQuery(jpql, Object[].class)
                 .setParameter("inicio", fechaInicio)
                 .setParameter("fin", fechaFin)
                 .getResultList();
                 
        return resultados.stream().map(obj -> new ReporteMovimientoDTO(
                (BigDecimal) obj[0],
                (String) obj[1],
                (String) obj[2],
                (String) obj[3],
                ((Number) obj[4]).longValue() 
        )).collect(Collectors.toList());
    }

    public int obtenerStockActual(BigDecimal idArticulo) {
        String jpqlIngresos = "SELECT COALESCE(SUM(d.cantidad), 0) FROM ComprobanteDetalle d " +
                              "WHERE d.idArticulo.idArticulo = :idArt AND d.idComprobante.idTipoMovimiento.tipo = 'I'";
        Number ingresos = (Number) em.createQuery(jpqlIngresos)
                .setParameter("idArt", idArticulo)
                .getSingleResult();

        String jpqlEgresos = "SELECT COALESCE(SUM(d.cantidad), 0) FROM ComprobanteDetalle d " +
                             "WHERE d.idArticulo.idArticulo = :idArt AND d.idComprobante.idTipoMovimiento.tipo <> 'I'";
        Number egresos = (Number) em.createQuery(jpqlEgresos)
                .setParameter("idArt", idArticulo)
                .getSingleResult();

        return ingresos.intValue() - egresos.intValue();
    }
}