package com.grupo4.backend_api.usuarios.negocio;

import com.grupo4.backend_api.usuarios.modelo.Usuario;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.context.Initialized;
import jakarta.enterprise.event.Observes;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.transaction.Transactional;
import java.util.logging.Logger;

@ApplicationScoped
public class DbInitializer {

    private static final Logger LOGGER = Logger.getLogger(DbInitializer.class.getName());

    @PersistenceContext(unitName = "SistemaContablePU")
    private EntityManager em;

    /**
     * Se ejecuta automáticamente al arrancar la aplicación y cargar el contexto web.
     * Busca la presencia del usuario administrador y lo crea si es necesario.
     */
    @Transactional
    public void init(@Observes @Initialized(ApplicationScoped.class) Object init) {
        LOGGER.info("[INICIALIZACIÓN] Verificando la existencia del usuario administrador por defecto...");
        try {
            Long count = em.createQuery("SELECT COUNT(u) FROM Usuario u WHERE u.email = :email", Long.class)
                    .setParameter("email", "admin")
                    .getSingleResult();

            if (count == 0) {
                LOGGER.info("[INICIALIZACIÓN] No se encontró el usuario 'admin'. Creando credenciales por defecto...");
                
                Usuario admin = new Usuario();
                admin.setEmail("admin");
                admin.setNombre("Administrador");
                admin.setRol("ADMIN");
                admin.setPassword("admin"); // Se guarda de forma literal según requerimiento
                
                em.persist(admin);
                LOGGER.info("[INICIALIZACIÓN] Usuario 'admin' con rol 'ADMIN' y contraseña 'admin' persistido correctamente.");
            } else {
                LOGGER.info("[INICIALIZACIÓN] El usuario administrador 'admin' ya se encuentra registrado.");
            }
        } catch (Exception e) {
            LOGGER.severe("[INICIALIZACIÓN] Error crítico al intentar sembrar el usuario administrador: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
