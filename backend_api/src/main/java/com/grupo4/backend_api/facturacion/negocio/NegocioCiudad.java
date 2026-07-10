package com.grupo4.backend_api.facturacion.negocio;

import com.grupo4.backend_api.facturacion.modelo.CiudadEntrega;
import jakarta.persistence.*;
import java.util.List;

public class NegocioCiudad {

    private static final String PU = "SistemaContablePU";

    public int insertar(CiudadEntrega ciudad) {
        EntityManagerFactory emf = null;
        EntityManager em = null;
        EntityTransaction tx = null;
        try {
            emf = Persistence.createEntityManagerFactory(PU);
            em  = emf.createEntityManager();
            tx  = em.getTransaction();
            tx.begin();
            em.persist(ciudad);
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

    public int modificar(CiudadEntrega ciudad) {
        EntityManagerFactory emf = null;
        EntityManager em = null;
        EntityTransaction tx = null;
        try {
            emf = Persistence.createEntityManagerFactory(PU);
            em  = emf.createEntityManager();
            tx  = em.getTransaction();
            tx.begin();
            CiudadEntrega c = em.find(CiudadEntrega.class, ciudad.getIdCiudad());
            if (c != null) {
                c.setNombre(ciudad.getNombre());
                em.persist(c);
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

    public int eliminar(Integer idCiudad) {
        EntityManagerFactory emf = null;
        EntityManager em = null;
        EntityTransaction tx = null;
        try {
            emf = Persistence.createEntityManagerFactory(PU);
            em  = emf.createEntityManager();
            tx  = em.getTransaction();
            tx.begin();
            CiudadEntrega c = em.find(CiudadEntrega.class, idCiudad);
            if (c != null) em.remove(c);
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

    public CiudadEntrega buscar(Integer idCiudad) {
        EntityManagerFactory emf = null;
        EntityManager em = null;
        try {
            emf = Persistence.createEntityManagerFactory(PU);
            em  = emf.createEntityManager();
            return em.find(CiudadEntrega.class, idCiudad);
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        } finally {
            if (em  != null) em.close();
            if (emf != null) emf.close();
        }
    }

    public List<CiudadEntrega> buscarPorNombre(String valor) {
        EntityManagerFactory emf = null;
        EntityManager em = null;
        try {
            emf = Persistence.createEntityManagerFactory(PU);
            em  = emf.createEntityManager();
            return em.createQuery(
                            "SELECT c FROM CiudadEntrega c WHERE LOWER(c.nombre) LIKE :val",
                            CiudadEntrega.class)
                    .setParameter("val", "%" + valor.toLowerCase() + "%")
                    .getResultList();
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        } finally {
            if (em  != null) em.close();
            if (emf != null) emf.close();
        }
    }

    public List<CiudadEntrega> listarTodos() {
        EntityManagerFactory emf = null;
        EntityManager em = null;
        try {
            emf = Persistence.createEntityManagerFactory(PU);
            em  = emf.createEntityManager();
            return em.createQuery(
                    "SELECT c FROM CiudadEntrega c ORDER BY c.nombre",
                    CiudadEntrega.class).getResultList();
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
                            "SELECT COALESCE(MAX(c.idCiudad), 0) FROM CiudadEntrega c")
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
}