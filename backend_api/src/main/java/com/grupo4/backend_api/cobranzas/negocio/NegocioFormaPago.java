package com.grupo4.backend_api.cobranzas.negocio;

import com.grupo4.backend_api.cobranzas.modelo.FormaPago;
import jakarta.persistence.*;
import jakarta.transaction.Transactional;
import java.util.List;

public class NegocioFormaPago {

    @PersistenceContext(unitName = "SistemaContablePU")
    private EntityManager em;

    @Transactional
    public boolean insertar(FormaPago formaPago) {
        try {
            Integer maxId = em.createQuery("SELECT MAX(f.codigo) FROM FormaPago f", Integer.class)
                    .getSingleResult();

            if (maxId == null) {
                formaPago.setCodigo(1);
            } else {
                formaPago.setCodigo(maxId + 1);
            }

            em.persist(formaPago);
            return true;
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    @Transactional
    public int modificar(FormaPago formaPago) {
        try {
            FormaPago f = em.find(FormaPago.class, formaPago.getCodigo());
            if (f != null) {
                f.setNombre(formaPago.getNombre());
                em.merge(f);
            }
            return 1;
        } catch (Exception e) {
            e.printStackTrace();
            return -1;
        }
    }

    @Transactional
    public int eliminar(Integer codigo) {
        try {
            // Búsqueda directa por @Id
            FormaPago f = em.find(FormaPago.class, codigo);
            if (f != null) {
                em.remove(f);
            }
            return 1;
        } catch (Exception e) {
            e.printStackTrace();
            return -1;
        }
    }

    public FormaPago buscar(Integer codigo) {
        try {
            return em.find(FormaPago.class, codigo);
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }

    public List<FormaPago> listarTodos() {
        try {
            return em.createQuery("SELECT f FROM FormaPago f ORDER BY f.codigo ASC", FormaPago.class).getResultList();
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }
}