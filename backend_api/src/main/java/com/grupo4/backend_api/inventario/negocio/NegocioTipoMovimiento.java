package com.grupo4.backend_api.inventario.negocio;

import com.grupo4.backend_api.inventario.modelo.TipoMovimiento;
import java.math.BigDecimal;
import java.util.List;
import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityManagerFactory;
import jakarta.persistence.Persistence;
import jakarta.persistence.TypedQuery;

public class NegocioTipoMovimiento {

    // Misma unidad de persistencia configurada en tu persistence.xml
    private static final EntityManagerFactory emf = Persistence.createEntityManagerFactory("SistemaContablePU");

    /**
     * Obtiene la lista de todos los tipos de movimiento.
     */
    public List<TipoMovimiento> obtenerTodos() {
        EntityManager em = emf.createEntityManager();
        try {
            TypedQuery<TipoMovimiento> query = em.createNamedQuery("TipoMovimiento.findAll", TipoMovimiento.class);
            return query.getResultList();
        } finally {
            em.close();
        }
    }

    /**
     * Guarda un nuevo tipo de movimiento en la base de datos.
     */
    public void guardar(TipoMovimiento tipoMovimiento) throws Exception {
        validarTipoMovimiento(tipoMovimiento);

        EntityManager em = emf.createEntityManager();
        try {
            em.getTransaction().begin();
            em.persist(tipoMovimiento);
            em.getTransaction().commit();
        } catch (Exception e) {
            if (em.getTransaction().isActive()) {
                em.getTransaction().rollback();
            }
            throw new Exception("Error al guardar el tipo de movimiento: " + e.getMessage());
        } finally {
            em.close();
        }
    }

    /**
     * Actualiza un tipo de movimiento existente.
     */
    public void actualizar(TipoMovimiento tipoMovimiento) throws Exception {
        validarTipoMovimiento(tipoMovimiento);
        
        if (tipoMovimiento.getIdTipoMovimiento() == null) {
            throw new Exception("No se puede actualizar un tipo de movimiento sin ID.");
        }

        EntityManager em = emf.createEntityManager();
        try {
            em.getTransaction().begin();
            em.merge(tipoMovimiento);
            em.getTransaction().commit();
        } catch (Exception e) {
            if (em.getTransaction().isActive()) {
                em.getTransaction().rollback();
            }
            throw new Exception("Error al actualizar el tipo de movimiento: " + e.getMessage());
        } finally {
            em.close();
        }
    }

    /**
     * Elimina un tipo de movimiento por su ID.
     */
    public void eliminar(BigDecimal idTipoMovimiento) throws Exception {
        if (idTipoMovimiento == null) {
            throw new Exception("El ID del tipo de movimiento es nulo.");
        }

        EntityManager em = emf.createEntityManager();
        try {
            em.getTransaction().begin();
            
            TipoMovimiento tipoMovimiento = em.find(TipoMovimiento.class, idTipoMovimiento);
            if (tipoMovimiento == null) {
                throw new Exception("El tipo de movimiento no existe en la base de datos.");
            }
            
            // Validar que no se elimine si ya tiene comprobantes asociados (Opcional pero recomendado)
            if (tipoMovimiento.getComprobanteCabeceraCollection() != null && !tipoMovimiento.getComprobanteCabeceraCollection().isEmpty()) {
                 throw new Exception("No se puede eliminar porque existen comprobantes asociados a este tipo de movimiento.");
            }

            em.remove(tipoMovimiento);
            em.getTransaction().commit();
        } catch (Exception e) {
            if (em.getTransaction().isActive()) {
                em.getTransaction().rollback();
            }
            throw new Exception("Error al eliminar el tipo de movimiento: " + e.getMessage());
        } finally {
            em.close();
        }
    }

    /**
     * Reglas de negocio para el Tipo de Movimiento.
     */
    private void validarTipoMovimiento(TipoMovimiento tipoMovimiento) throws Exception {
        if (tipoMovimiento == null) {
            throw new Exception("El tipo de movimiento no puede ser nulo.");
        }
        if (tipoMovimiento.getNombre() == null || tipoMovimiento.getNombre().trim().isEmpty()) {
            throw new Exception("El nombre del tipo de movimiento es obligatorio.");
        }
        if (tipoMovimiento.getTipo() == null) {
            throw new Exception("Debe especificar si es un Ingreso (I) o Egreso (E).");
        }
        
        // Convertimos a mayúscula por seguridad y validamos la regla estricta: 'I' o 'E'
        char tipo = Character.toUpperCase(tipoMovimiento.getTipo());
        if (tipo != 'I' && tipo != 'E') {
            throw new Exception("El tipo solo puede ser 'I' (Ingreso) o 'E' (Egreso). Valor recibido: " + tipo);
        }
        
        // Aseguramos que se guarde en mayúscula en la base de datos
        tipoMovimiento.setTipo(tipo);
    }

    /**
     * Obtiene el siguiente ID disponible usando la técnica MAX + 1.
     */
    public BigDecimal obtenerSiguienteId() {
        EntityManager em = emf.createEntityManager();
        try {
            Number max = (Number) em.createQuery(
                            "SELECT COALESCE(MAX(t.idTipoMovimiento), 0) FROM TipoMovimiento t")
                    .getSingleResult();
            return new BigDecimal(max.longValue() + 1);
        } catch (Exception e) {
            e.printStackTrace();
            return BigDecimal.ONE;
        } finally {
            em.close();
        }
    }
}