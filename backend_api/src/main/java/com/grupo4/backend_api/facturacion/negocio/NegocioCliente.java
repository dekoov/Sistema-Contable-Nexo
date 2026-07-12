package com.grupo4.backend_api.facturacion.negocio;

import com.grupo4.backend_api.facturacion.modelo.Cliente;
import jakarta.persistence.*;
import java.util.List;

import jakarta.transaction.Transactional;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

@ApplicationScoped
public class NegocioCliente {

    @PersistenceContext(unitName = "SistemaContablePU")
    private EntityManager em;

    @Transactional
    public int insertar(Cliente cliente) {
        try {
            em.persist(cliente);
            return 1;
        } catch (Exception e) {
            e.printStackTrace();
            return -1;
        }
    }

    @Transactional
    public int modificar(Cliente cliente) {
        try {
            Cliente c = em.find(Cliente.class, cliente.getIdCliente());
            if (c == null) {
                return 0;
            }
            c.setCedula(cliente.getCedula());
            c.setNombre(cliente.getNombre());
            c.setDireccion(cliente.getDireccion());
            return 1;
        } catch (Exception e) {
            e.printStackTrace();
            return -1;
        }
    }

    @Transactional
    public int eliminar(Integer idCliente) {
        try {
            Cliente cliente = em.find(Cliente.class, idCliente);
            if (cliente == null) {
                return 0;
            }
            em.remove(cliente);
            return 1;
        } catch (Exception e) {
            e.printStackTrace();
            return -1;
        }
    }

    
    public Cliente buscar(Integer idCliente) {
        try {
            return em.find(Cliente.class, idCliente);
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }

    public List<Cliente> buscarPorCampo(String valor) {
        try {
            return em.createQuery(
                    """
                    SELECT c
                    FROM Cliente c
                    WHERE LOWER(c.nombre) LIKE :valor
                       OR LOWER(c.cedula) LIKE :valor
                       OR LOWER(c.direccion) LIKE :valor
                    """,
                    Cliente.class)
                    .setParameter("valor", "%" + valor.toLowerCase() + "%")
                    .getResultList();
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }

    public List<Cliente> listarTodos() {
        try {
            return em.createQuery(
                    "SELECT c FROM Cliente c ORDER BY c.nombre",
                    Cliente.class)
                    .getResultList();
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }

    public Integer obtenerSiguienteId() {
        try {
            Number max = (Number) em.createQuery(
                    "SELECT COALESCE(MAX(c.idCliente),0) FROM Cliente c")
                    .getSingleResult();
            return max.intValue() + 1;
        } catch (Exception e) {
            e.printStackTrace();
            return 1;
        }
    }
}
