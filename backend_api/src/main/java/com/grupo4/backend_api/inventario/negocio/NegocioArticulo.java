package com.grupo4.backend_api.inventario.negocio;

import com.grupo4.backend_api.inventario.modelo.Articulo;
import jakarta.persistence.*;
import jakarta.transaction.Transactional;
import java.math.BigDecimal;
import java.util.List;

public class NegocioArticulo {

    @PersistenceContext(unitName = "SistemaContablePU")
    private EntityManager em;

    @Transactional
    public int insertar(Articulo articulo) {
        try {
            if (articulo.getIdArticulo() == null) {
                articulo.setIdArticulo(obtenerSiguienteId());
            }
            em.persist(articulo);
            return 1;
        } catch (Exception e) {
            e.printStackTrace();
            return -1;
        }
    }
    
    @Transactional
    public int modificar(Articulo articulo) {
        try {
            Articulo a = em.find(Articulo.class, articulo.getIdArticulo());
            if (a != null) {
                a.setNombre(articulo.getNombre());
                a.setPrecio(articulo.getPrecio());
                // Si tienes fecha u otros campos, actualízalos aquí también
                em.persist(a);
            }
            return 1;
        } catch (Exception e) {
            e.printStackTrace();
            return -1;
        }
    }
    
    @Transactional
    public int eliminar(BigDecimal idArticulo) {
        try {
            Articulo a = em.find(Articulo.class, idArticulo);
            if (a != null)
                em.remove(a);
            return 1;
        } catch (Exception e) {

            e.printStackTrace();
            return -1;
        }
    }

    public List<Articulo> buscarPorNombre(String valor) {
        try {
            String query = "SELECT a FROM Articulo a WHERE LOWER(a.nombre) LIKE :val";
            return em.createQuery(query, Articulo.class)
                    .setParameter("val", "%" + valor.toLowerCase() + "%")
                    .getResultList();
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }

    public List<Articulo> listarTodos() {
        try {
            return em.createQuery("SELECT a FROM Articulo a ORDER BY a.idArticulo", Articulo.class)
                    .getResultList();
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }

    }

    public BigDecimal obtenerSiguienteId() {
        try {
            Number max = (Number) em.createQuery(
                    "SELECT COALESCE(MAX(a.idArticulo), 0) FROM Articulo a")
                    .getSingleResult();
            return new BigDecimal(max.longValue() + 1);
        } catch (Exception e) {
            e.printStackTrace();
            return BigDecimal.ONE;
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
        try {
            return em.find(Articulo.class, idArticulo);
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }
}
