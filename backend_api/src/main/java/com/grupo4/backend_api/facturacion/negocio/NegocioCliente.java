package com.grupo4.backend_api.facturacion.negocio;

import com.grupo4.backend_api.facturacion.modelo.Cliente;
import jakarta.persistence.*;
import java.util.List;

public class NegocioCliente {

    private static final String PU = "SistemaContablePU";

    public int insertar(Cliente cliente) {
        EntityManagerFactory emf = null;
        EntityManager em = null;
        EntityTransaction tx = null;
        try {
            emf = Persistence.createEntityManagerFactory(PU);
            em  = emf.createEntityManager();
            tx  = em.getTransaction();
            tx.begin();
            em.persist(cliente);
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

    public int modificar(Cliente cliente) {
        EntityManagerFactory emf = null;
        EntityManager em = null;
        EntityTransaction tx = null;
        try {
            emf = Persistence.createEntityManagerFactory(PU);
            em  = emf.createEntityManager();
            tx  = em.getTransaction();
            tx.begin();
            Cliente c = em.find(Cliente.class, cliente.getIdCliente());
            if (c != null) {
                c.setCedula(cliente.getCedula());
                c.setNombre(cliente.getNombre());
                c.setDireccion(cliente.getDireccion());
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

    public int eliminar(Integer idCliente) {
        EntityManagerFactory emf = null;
        EntityManager em = null;
        EntityTransaction tx = null;
        try {
            emf = Persistence.createEntityManagerFactory(PU);
            em  = emf.createEntityManager();
            tx  = em.getTransaction();
            tx.begin();
            Cliente c = em.find(Cliente.class, idCliente);
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

    public Cliente buscar(Integer idCliente) {
        EntityManagerFactory emf = null;
        EntityManager em = null;
        try {
            emf = Persistence.createEntityManagerFactory(PU);
            em  = emf.createEntityManager();
            return em.find(Cliente.class, idCliente);
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        } finally {
            if (em  != null) em.close();
            if (emf != null) emf.close();
        }
    }

    public List<Cliente> buscarPorCampo(String valor) {
        EntityManagerFactory emf = null;
        EntityManager em = null;
        try {
            emf = Persistence.createEntityManagerFactory(PU);
            em  = emf.createEntityManager();
            String query = "SELECT c FROM Cliente c WHERE " +
                    "LOWER(c.nombre) LIKE :val OR " +
                    "LOWER(c.cedula) LIKE :val OR " +
                    "LOWER(c.direccion) LIKE :val";
            return em.createQuery(query, Cliente.class)
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

    public List<Cliente> listarTodos() {
        EntityManagerFactory emf = null;
        EntityManager em = null;
        try {
            emf = Persistence.createEntityManagerFactory(PU);
            em  = emf.createEntityManager();
            return em.createQuery(
                    "SELECT c FROM Cliente c ORDER BY c.nombre",
                    Cliente.class).getResultList();
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
                            "SELECT COALESCE(MAX(c.idCliente), 0) FROM Cliente c")
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