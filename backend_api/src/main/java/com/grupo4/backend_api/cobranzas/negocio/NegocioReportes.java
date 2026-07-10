package com.grupo4.backend_api.cobranzas.negocio;


import com.grupo4.backend_api.cobranzas.dto.ReporteEstadoCuentaDTO;
import com.grupo4.backend_api.cobranzas.dto.ReporteMatrizDTO;
import com.grupo4.backend_api.facturacion.modelo.FacturaCabecera;
import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

public class NegocioReportes {

    private static final String PU = "SistemaContablePU";

    public List<ReporteEstadoCuentaDTO> generarEstadoCuentaPorFechas(Date inicio, Date fin) {
        EntityManagerFactory emf = null;
        EntityManager em = null;
        List<ReporteEstadoCuentaDTO> listaReporte = new ArrayList<>();

        try {
            emf = Persistence.createEntityManagerFactory(PU);
            em = emf.createEntityManager();


            TypedQuery<FacturaCabecera> queryFacturas = em.createQuery(
                    "SELECT f FROM FacturaCabecera f WHERE f.fecha BETWEEN :inicio AND :fin ORDER BY f.numeroFactura ASC",
                    FacturaCabecera.class);
            queryFacturas.setParameter("inicio", inicio);
            queryFacturas.setParameter("fin", fin);
            List<FacturaCabecera> facturas = queryFacturas.getResultList();


            for (FacturaCabecera f : facturas) {
                TypedQuery<Double> queryPagos = em.createQuery(
                        "SELECT COALESCE(SUM(p.valor), 0.0) FROM PagoDetalle p WHERE p.factura.idFactura = :idFactura",
                        Double.class);
                queryPagos.setParameter("idFactura", f.getIdFactura());
                Double totalPagado = queryPagos.getSingleResult();


                listaReporte.add(new ReporteEstadoCuentaDTO(
                        f.getNumeroFactura(),
                        f.getValorTotal(),
                        totalPagado
                ));
            }

            return listaReporte;
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        } finally {
            if (em != null) em.close();
            if (emf != null) emf.close();
        }
    }
    public List<ReporteMatrizDTO> generarMatrizCruzada(Date inicio, Date fin) {
        EntityManagerFactory emf = null;
        EntityManager em = null;

        java.util.Map<String, ReporteMatrizDTO> mapaMatriz = new java.util.HashMap<>();

        try {
            emf = Persistence.createEntityManagerFactory(PU);
            em = emf.createEntityManager();


            String jpql = "SELECT p.cobrador.nombre, p.formaPago.nombre, SUM(p.valor) " +
                    "FROM PagoDetalle p " +
                    "WHERE p.fechaPago BETWEEN :inicio AND :fin " +
                    "GROUP BY p.cobrador.nombre, p.formaPago.nombre";

            List<Object[]> resultados = em.createQuery(jpql, Object[].class)
                    .setParameter("inicio", inicio)
                    .setParameter("fin", fin)
                    .getResultList();


            for (Object[] fila : resultados) {
                String cobrador = (String) fila[0];
                String formaPago = (String) fila[1];
                Double sumaValor = (Double) fila[2];


                mapaMatriz.putIfAbsent(cobrador, new ReporteMatrizDTO(cobrador));


                mapaMatriz.get(cobrador).agregarValor(formaPago, sumaValor);
            }

            return new java.util.ArrayList<>(mapaMatriz.values());
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        } finally {
            if (em != null) em.close();
            if (emf != null) emf.close();
        }
    }
}