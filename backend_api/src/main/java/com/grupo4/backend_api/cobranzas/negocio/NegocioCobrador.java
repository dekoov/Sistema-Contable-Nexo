package com.grupo4.backend_api.cobranzas.negocio;

import com.grupo4.backend_api.cobranzas.modelo.Cobrador;
import jakarta.persistence.*;
import jakarta.transaction.Transactional;
import java.util.List;

public class NegocioCobrador {

    @PersistenceContext(unitName = "SistemaContablePU")
    private EntityManager em;

    @Transactional
    public boolean insertar(Cobrador cobrador) {
        try {
            Integer maxId = em.createQuery("SELECT MAX(c.idCobrador) FROM Cobrador c", Integer.class)
                    .getSingleResult();

            if (maxId == null) {
                cobrador.setIdCobrador(1);
            } else {
                cobrador.setIdCobrador(maxId + 1);
            }

            em.persist(cobrador);
            return true;
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    @Transactional
    public int modificar(Cobrador cobrador) {
        try {
            Cobrador c = em.find(Cobrador.class, cobrador.getIdCobrador());
            if (c != null) {
                c.setNombre(cobrador.getNombre());
                c.setDireccion(cobrador.getDireccion());
                c.setCedula(cobrador.getCedula());
                em.merge(c);
            }
            return (c != null) ? 1 : 0;
        } catch (Exception e) {
            e.printStackTrace();
            return -1;
        }
    }

    @Transactional
    public int eliminar(Integer idCobrador) {
        try {
            Cobrador c = em.find(Cobrador.class, idCobrador);
            if (c != null) {
                em.remove(c);
                return 1;
            }
            return 0;
        } catch (Exception e) {
            e.printStackTrace();
            return -1;
        }
    }

    public Cobrador buscar(Integer idCobrador) {
        try {
            return em.find(Cobrador.class, idCobrador);
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }

    public List<Cobrador> listarTodos() {
        try {
            return em.createQuery("SELECT c FROM Cobrador c ORDER BY c.nombre ASC", Cobrador.class).getResultList();
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }
}