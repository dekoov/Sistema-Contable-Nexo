package com.grupo4.backend_api.inventario.negocio;

import com.grupo4.backend_api.inventario.modelo.TipoMovimiento;
import jakarta.persistence.*;
import jakarta.transaction.Transactional;
import java.math.BigDecimal;
import java.util.List;
import jakarta.persistence.EntityManager;

public class NegocioTipoMovimiento {

    @PersistenceContext(unitName = "SistemaContablePU")
    private EntityManager em;

    @Transactional
    public int insertar(TipoMovimiento tipoMovimiento) {
        if (!validarTipoMovimiento(tipoMovimiento)) {
            return -1;
        }
        try {
            em.persist(tipoMovimiento);
            return 1;
        } catch (Exception e) {
            e.printStackTrace();
            return -1;
        }
    }

    @Transactional
    public int modificar(TipoMovimiento tipoMovimiento) {
        if (!validarTipoMovimiento(tipoMovimiento) || tipoMovimiento.getIdTipoMovimiento() == null) {
            return -1;
        }
        try {
            TipoMovimiento t = em.find(TipoMovimiento.class, tipoMovimiento.getIdTipoMovimiento());
            if (t != null) {
                t.setNombre(tipoMovimiento.getNombre());
                t.setTipo(tipoMovimiento.getTipo());
                em.merge(t);
            }
            return 1;
        } catch (Exception e) {
            e.printStackTrace();
            return -1;
        }
    }

    @Transactional
    public int eliminar(BigDecimal idTipoMovimiento) {
        try {
            TipoMovimiento t = em.find(TipoMovimiento.class, idTipoMovimiento);
            if (t == null) {
                return 0; // No encontrado
            }
            em.remove(t);
            return 1;
        } catch (Exception e) {
            e.printStackTrace();
            return -1;
        }
    }

    public TipoMovimiento buscar(BigDecimal idTipoMovimiento) {
        try {
            return em.find(TipoMovimiento.class, idTipoMovimiento);
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }

    public List<TipoMovimiento> buscarPorNombre(String valor) {
        try {
            return em.createQuery(
                    "SELECT t FROM TipoMovimiento t WHERE LOWER(t.nombre) LIKE :val",
                    TipoMovimiento.class)
                    .setParameter("val", "%" + valor.toLowerCase() + "%")
                    .getResultList();
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }

    public List<TipoMovimiento> listarTodos() {
        try {
            return em.createNamedQuery("TipoMovimiento.findAll", TipoMovimiento.class).getResultList();
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }

    public BigDecimal obtenerSiguienteId() {
        try {
            Number max = (Number) em.createQuery(
                    "SELECT COALESCE(MAX(t.idTipoMovimiento), 0) FROM TipoMovimiento t")
                    .getSingleResult();
            return new BigDecimal(max.longValue() + 1);
        } catch (Exception e) {
            e.printStackTrace();
            return BigDecimal.ONE;
        }
    }

    /**
     * Reglas de negocio para el Tipo de Movimiento adaptadas al retorno booleano.
     */
    private boolean validarTipoMovimiento(TipoMovimiento tipoMovimiento) {
        if (tipoMovimiento == null)
            return false;
        if (tipoMovimiento.getNombre() == null || tipoMovimiento.getNombre().trim().isEmpty())
            return false;
        if (tipoMovimiento.getTipo() == null)
            return false;

        char tipo = Character.toUpperCase(tipoMovimiento.getTipo());
        if (tipo != 'I' && tipo != 'E')
            return false;

        tipoMovimiento.setTipo(tipo); // Estandarizamos a mayúscula
        return true;
    }
}
