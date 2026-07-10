package com.grupo4.backend_api.cobranzas.negocio;

import com.grupo4.backend_api.cobranzas.modelo.PagoDetalle;
import jakarta.persistence.*;
import java.util.List;

public class NegocioPagoDetalle {

    private static final String PU = "SistemaContablePU";

    public int insertar(PagoDetalle pagoDetalle) {
        EntityManagerFactory emf = null;
        EntityManager em = null;
        EntityTransaction tx = null;
        try {
            emf = Persistence.createEntityManagerFactory(PU);
            em  = emf.createEntityManager();
            tx  = em.getTransaction();
            tx.begin();


            if (pagoDetalle.getIdPagoDetalle() == null) {
                pagoDetalle.setIdPagoDetalle(obtenerSiguienteId());
            }

            em.persist(pagoDetalle);



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

    public int eliminar(Integer idPagoDetalle) {
        EntityManagerFactory emf = null;
        EntityManager em = null;
        EntityTransaction tx = null;
        try {
            emf = Persistence.createEntityManagerFactory(PU);
            em  = emf.createEntityManager();
            tx  = em.getTransaction();
            tx.begin();
            PagoDetalle pd = em.find(PagoDetalle.class, idPagoDetalle);
            if (pd != null) {
                em.remove(pd);
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


    public List<PagoDetalle> listarPorFactura(Integer idFactura) {
        EntityManagerFactory emf = null;
        EntityManager em = null;
        try {
            emf = Persistence.createEntityManagerFactory(PU);
            em  = emf.createEntityManager();
            return em.createQuery(
                            "SELECT p FROM PagoDetalle p WHERE p.factura.idFactura = :idFactura ORDER BY p.fechaPago DESC",
                            PagoDetalle.class)
                    .setParameter("idFactura", idFactura)
                    .getResultList();
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        } finally {
            if (em  != null) em.close();
            if (emf != null) emf.close();
        }
    }


    public Integer obtenerSiguienteId() {
        EntityManagerFactory emf = null;
        EntityManager em = null;
        try {
            emf = Persistence.createEntityManagerFactory(PU);
            em  = emf.createEntityManager();
            Number max = (Number) em.createQuery(
                            "SELECT COALESCE(MAX(p.idPagoDetalle), 0) FROM PagoDetalle p")
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

    public PagoDetalle buscar(Integer idPagoDetalle) {
        EntityManagerFactory emf = null;
        EntityManager em = null;
        try {
            emf = Persistence.createEntityManagerFactory(PU);
            em = emf.createEntityManager();
            return em.find(PagoDetalle.class, idPagoDetalle);
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        } finally {
            if (em != null) em.close();
            if (emf != null) emf.close();
        }
    }

    public int modificar(PagoDetalle pagoDetalle) {
        EntityManagerFactory emf = null;
        EntityManager em = null;
        EntityTransaction tx = null;
        try {
            emf = Persistence.createEntityManagerFactory(PU);
            em = emf.createEntityManager();
            tx = em.getTransaction();
            tx.begin();
            em.merge(pagoDetalle);
            tx.commit();
            return 1;
        } catch (Exception e) {
            if (tx != null && tx.isActive()) tx.rollback();
            e.printStackTrace();
            return -1;
        } finally {
            if (em != null) em.close();
            if (emf != null) emf.close();
        }
    }
}