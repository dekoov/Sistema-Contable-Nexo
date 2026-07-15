package com.grupo4.backend_api.inventario.negocio;

import com.grupo4.backend_api.inventario.dto.ReporteMovimientoDTO;
import com.grupo4.backend_api.inventario.dto.StockArticuloDTO;
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

    public List<ReporteMovimientoDTO> obtenerDatosReporte(java.time.LocalDate fechaInicio, java.time.LocalDate fechaFin) {
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
                (java.math.BigDecimal) obj[0],
                (String) obj[1],
                (String) obj[2],
                String.valueOf(obj[3]),
                ((Number) obj[4]).longValue()
        )).collect(java.util.stream.Collectors.toList());
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
    
    public StockArticuloDTO obtenerDesgloseStock(java.math.BigDecimal idArticulo) {
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

        return new StockArticuloDTO(ingresos.intValue(), egresos.intValue());
    }
}