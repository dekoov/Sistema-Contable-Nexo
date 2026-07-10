package com.grupo4.backend_api.inventario.negocio;

import com.grupo4.backend_api.inventario.modelo.Articulo;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.util.List;

public class NegocioArticulo {

    private static final String PU = "SistemaContablePU"; // Revisa que este sea tu Persistence Unit

    public int insertar(Articulo articulo) {
        EntityManagerFactory emf = null;
        EntityManager em = null;
        EntityTransaction tx = null;
        try {
            emf = Persistence.createEntityManagerFactory(PU);
            em  = emf.createEntityManager();
            tx  = em.getTransaction();
            tx.begin();
            em.persist(articulo);
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

    public int modificar(Articulo articulo) {
        EntityManagerFactory emf = null;
        EntityManager em = null;
        EntityTransaction tx = null;
        try {
            emf = Persistence.createEntityManagerFactory(PU);
            em  = emf.createEntityManager();
            tx  = em.getTransaction();
            tx.begin();
            Articulo a = em.find(Articulo.class, articulo.getIdArticulo());
            if (a != null) {
                a.setNombre(articulo.getNombre());
                a.setPrecio(articulo.getPrecio());
                // Si tienes fecha u otros campos, actualízalos aquí también
                em.persist(a);
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

    public int eliminar(BigDecimal idArticulo) {
        EntityManagerFactory emf = null;
        EntityManager em = null;
        EntityTransaction tx = null;
        try {
            emf = Persistence.createEntityManagerFactory(PU);
            em  = emf.createEntityManager();
            tx  = em.getTransaction();
            tx.begin();
            Articulo a = em.find(Articulo.class, idArticulo);
            if (a != null) em.remove(a);
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

    public List<Articulo> buscarPorNombre(String valor) {
        EntityManagerFactory emf = null;
        EntityManager em = null;
        try {
            emf = Persistence.createEntityManagerFactory(PU);
            em  = emf.createEntityManager();
            String query = "SELECT a FROM Articulo a WHERE LOWER(a.nombre) LIKE :val";
            return em.createQuery(query, Articulo.class)
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

    public List<Articulo> listarTodos() {
        EntityManagerFactory emf = null;
        EntityManager em = null;
        try {
            emf = Persistence.createEntityManagerFactory(PU);
            em  = emf.createEntityManager();
            return em.createQuery("SELECT a FROM Articulo a ORDER BY a.idArticulo", Articulo.class)
                     .getResultList();
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        } finally {
            if (em  != null) em.close();
            if (emf != null) emf.close();
        }
    }

    public BigDecimal obtenerSiguienteId() {
        EntityManagerFactory emf = null;
        EntityManager em = null;
        try {
            emf = Persistence.createEntityManagerFactory(PU);
            em  = emf.createEntityManager();
            Number max = (Number) em.createQuery(
                            "SELECT COALESCE(MAX(a.idArticulo), 0) FROM Articulo a")
                    .getSingleResult();
            return new BigDecimal(max.longValue() + 1);
        } catch (Exception e) {
            e.printStackTrace();
            return BigDecimal.ONE;
        } finally {
            if (em  != null) em.close();
            if (emf != null) emf.close();
        }
    }
    
    /**
     * Busca un artículo por su clave primaria en formato int.
     */
    public Articulo buscarPorId(int idArticulo) {
        return buscarPorId(new BigDecimal(idArticulo));
    }

    /**
     * Busca un artículo por su clave primaria en formato BigDecimal.
     */
    public Articulo buscarPorId(BigDecimal idArticulo) {
        EntityManagerFactory emf = null;
        EntityManager em = null;
        try {
            emf = Persistence.createEntityManagerFactory(PU);
            em  = emf.createEntityManager();
            return em.find(Articulo.class, idArticulo);
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        } finally {
            if (em  != null) em.close();
            if (emf != null) emf.close();
        }
    }
}