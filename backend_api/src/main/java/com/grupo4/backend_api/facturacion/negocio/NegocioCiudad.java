package com.grupo4.backend_api.facturacion.negocio;

import com.grupo4.backend_api.facturacion.modelo.CiudadEntrega;
import jakarta.persistence.*;
import jakarta.transaction.Transactional;
import java.util.List;

public class NegocioCiudad {

    @PersistenceContext(unitName = "SistemaContablePU")
    private EntityManager em;
    
    @Transactional
    public int insertar(CiudadEntrega ciudad) {
        try {
            em.persist(ciudad);
            return 1;
        } catch (Exception e) {
            e.printStackTrace();
            return -1;
        }
    }

    @Transactional
    public int modificar(CiudadEntrega ciudad) {
        try {
            CiudadEntrega c = em.find(CiudadEntrega.class, ciudad.getIdCiudad());
            if (c != null) {
                c.setNombre(ciudad.getNombre());
                em.persist(c);
            }
            return 1;
        } catch (Exception e) {
            e.printStackTrace();
            return -1;
        }
    }

    @Transactional
    public int eliminar(Integer idCiudad) {
        try {
            CiudadEntrega c = em.find(CiudadEntrega.class, idCiudad);
            if (c == null) {
                return 0;
            }
            em.remove(c);
            return 1;
        } catch (Exception e) {
            e.printStackTrace();
            return -1;
        }
    }

    public CiudadEntrega buscar(Integer idCiudad) {
        try {
            return em.find(CiudadEntrega.class, idCiudad);
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }

    public List<CiudadEntrega> buscarPorNombre(String valor) {
        try {
            return em.createQuery(
                            "SELECT c FROM CiudadEntrega c WHERE LOWER(c.nombre) LIKE :val",
                            CiudadEntrega.class)
                    .setParameter("val", "%" + valor.toLowerCase() + "%")
                    .getResultList();
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }

    public List<CiudadEntrega> listarTodos() {
        try {
            return em.createQuery(
                    "SELECT c FROM CiudadEntrega c ORDER BY c.nombre",
                    CiudadEntrega.class).getResultList();
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }

    public Integer obtenerSiguienteId() {
        try {
            Number max = (Number) em.createQuery(
                            "SELECT COALESCE(MAX(c.idCiudad), 0) FROM CiudadEntrega c")
                    .getSingleResult();
            return max.intValue() + 1;
        } catch (Exception e) {
            e.printStackTrace();
            return 1;
        }
    }
}