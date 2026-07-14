package com.grupo4.backend_api.facturacion.negocio;

import com.grupo4.backend_api.core.ApiException;
import com.grupo4.backend_api.facturacion.modelo.Cliente;
import jakarta.persistence.*;
import java.util.List;

import jakarta.transaction.Transactional;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.ws.rs.core.Response.Status;

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
        Cliente c = em.find(Cliente.class, idCliente);
        if (c == null) return 0;
        try {
            em.remove(c);
            em.flush(); // fuerza el DELETE ahora, dentro de este try/catch — no en el commit del interceptor
            return 1;
        } catch (jakarta.persistence.PersistenceException e) {
            if (com.grupo4.backend_api.core.PersistenceExceptionUtils.esViolacionForeignKey(e)) {
                throw new ApiException(Status.CONFLICT, "No se puede eliminar: el cliente está referenciado en una o más facturas.");
            }
            e.printStackTrace();
            throw new ApiException(Status.INTERNAL_SERVER_ERROR, "Error interno al eliminar el cliente.");
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
