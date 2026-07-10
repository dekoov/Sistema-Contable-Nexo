package com.grupo4.backend_api.cobranzas.negocio;

import com.grupo4.backend_api.cobranzas.modelo.Cobrador;
import jakarta.persistence.*;
import java.util.List;

public class NegocioCobrador {

    private static final String PU = "SistemaContablePU";

    public boolean insertar(Cobrador cobrador) {
        EntityManagerFactory emf = null;
        EntityManager em = null;
        try {
            emf = Persistence.createEntityManagerFactory(PU);
            em = emf.createEntityManager();
            em.getTransaction().begin();


            Integer maxId = em.createQuery("SELECT MAX(c.idCobrador) FROM Cobrador c", Integer.class)
                    .getSingleResult();

            if (maxId == null) {
                cobrador.setIdCobrador(1);
            } else {
                cobrador.setIdCobrador(maxId + 1);
            }

            em.persist(cobrador);
            em.getTransaction().commit();
            return true;
        } catch (Exception e) {
            if (em != null && em.getTransaction().isActive()) {
                em.getTransaction().rollback();
            }
            e.printStackTrace();
            return false;
        } finally {
            if (em != null) em.close();
            if (emf != null) emf.close();
        }
    }

    public int modificar(Cobrador cobrador) {
        EntityManagerFactory emf = null;
        EntityManager em = null;
        EntityTransaction tx = null;
        try {
            emf = Persistence.createEntityManagerFactory(PU);
            em  = emf.createEntityManager();
            tx  = em.getTransaction();
            tx.begin();


            Cobrador c = null;
            try {
                c = em.createQuery("SELECT c FROM Cobrador c WHERE c.cedula = :cedula", Cobrador.class)
                        .setParameter("cedula", cobrador.getCedula())
                        .getSingleResult();
            } catch (NoResultException ex) {

            }

            if (c != null) {

                c.setNombre(cobrador.getNombre());
                c.setDireccion(cobrador.getDireccion());
                em.merge(c);
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

    public int eliminar(String cedula) {
        EntityManagerFactory emf = null;
        EntityManager em = null;
        EntityTransaction tx = null;
        try {
            emf = Persistence.createEntityManagerFactory(PU);
            em  = emf.createEntityManager();
            tx  = em.getTransaction();
            tx.begin();


            Cobrador c = null;
            try {
                c = em.createQuery("SELECT c FROM Cobrador c WHERE c.cedula = :cedula", Cobrador.class)
                        .setParameter("cedula", cedula)
                        .getSingleResult();
            } catch (NoResultException ex) {}

            if (c != null) {
                em.remove(c);
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

    public Cobrador buscar(String cedula) {
        EntityManagerFactory emf = null;
        EntityManager em = null;
        try {
            emf = Persistence.createEntityManagerFactory(PU);
            em  = emf.createEntityManager();


            return em.createQuery("SELECT c FROM Cobrador c WHERE c.cedula = :cedula", Cobrador.class)
                    .setParameter("cedula", cedula)
                    .getSingleResult();

        } catch (NoResultException e) {
            return null;
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        } finally {
            if (em  != null) em.close();
            if (emf != null) emf.close();
        }
    }

    public List<Cobrador> listarTodos() {
        EntityManagerFactory emf = null;
        EntityManager em = null;
        try {
            emf = Persistence.createEntityManagerFactory(PU);
            em  = emf.createEntityManager();
            return em.createQuery("SELECT c FROM Cobrador c ORDER BY c.nombre ASC", Cobrador.class).getResultList();
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        } finally {
            if (em  != null) em.close();
            if (emf != null) emf.close();
        }
    }
}