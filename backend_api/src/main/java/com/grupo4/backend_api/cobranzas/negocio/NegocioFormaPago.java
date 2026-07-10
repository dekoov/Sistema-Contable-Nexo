package com.grupo4.backend_api.cobranzas.negocio;

import com.grupo4.backend_api.cobranzas.modelo.FormaPago;
import jakarta.persistence.*;
import java.util.List;

public class NegocioFormaPago {

    private static final String PU = "SistemaContablePU";

    public boolean insertar(FormaPago formaPago) {
        EntityManagerFactory emf = null;
        EntityManager em = null;
        try {
            emf = Persistence.createEntityManagerFactory(PU);
            em = emf.createEntityManager();
            em.getTransaction().begin();


            Integer maxId = em.createQuery("SELECT MAX(f.codigo) FROM FormaPago f", Integer.class)
                    .getSingleResult();

            if (maxId == null) {
                formaPago.setCodigo(1);
            } else {
                formaPago.setCodigo(maxId + 1);
            }

            em.persist(formaPago);
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

    public int modificar(FormaPago formaPago) {
        EntityManagerFactory emf = null;
        EntityManager em = null;
        EntityTransaction tx = null;
        try {
            emf = Persistence.createEntityManagerFactory(PU);
            em  = emf.createEntityManager();
            tx  = em.getTransaction();
            tx.begin();

            FormaPago f = em.find(FormaPago.class, formaPago.getCodigo());
            if (f != null) {
                f.setNombre(formaPago.getNombre());
                em.merge(f);
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

    public int eliminar(Integer codigo) {
        EntityManagerFactory emf = null;
        EntityManager em = null;
        EntityTransaction tx = null;
        try {
            emf = Persistence.createEntityManagerFactory(PU);
            em  = emf.createEntityManager();
            tx  = em.getTransaction();
            tx.begin();
            // Búsqueda directa por @Id
            FormaPago f = em.find(FormaPago.class, codigo);
            if (f != null) {
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

    public FormaPago buscar(Integer codigo) {
        EntityManagerFactory emf = null;
        EntityManager em = null;
        try {
            emf = Persistence.createEntityManagerFactory(PU);
            em  = emf.createEntityManager();

            return em.find(FormaPago.class, codigo);
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        } finally {
            if (em  != null) em.close();
            if (emf != null) emf.close();
        }
    }

    public List<FormaPago> listarTodos() {
        EntityManagerFactory emf = null;
        EntityManager em = null;
        try {
            emf = Persistence.createEntityManagerFactory(PU);
            em  = emf.createEntityManager();
            return em.createQuery("SELECT f FROM FormaPago f ORDER BY f.codigo ASC", FormaPago.class).getResultList();
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        } finally {
            if (em  != null) em.close();
            if (emf != null) emf.close();
        }
    }
}