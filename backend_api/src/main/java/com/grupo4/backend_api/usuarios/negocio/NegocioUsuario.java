package com.grupo4.backend_api.usuarios.negocio;

import com.grupo4.backend_api.usuarios.modelo.Usuario;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.transaction.Transactional;
import java.util.List;

@ApplicationScoped
public class NegocioUsuario {

  @PersistenceContext(unitName = "SistemaContablePU")
  private EntityManager em;

  @Transactional
  public void insertar(Usuario usuario) {
    em.persist(usuario);
  }

  @Transactional
  public void modificar(Usuario usuario) {
    Usuario u = em.find(Usuario.class, usuario.getId());
    if (u != null) {
      u.setNombre(usuario.getNombre());
      u.setRol(usuario.getRol());
      em.merge(u);
    }
  }

  @Transactional
  public void eliminar(Long idUsuario) {
    Usuario u = em.find(Usuario.class, idUsuario);
    if (u != null) {
      em.remove(u);
    }
  }

  public List<Usuario> listarTodos() {
    // Cambiado para ordenar por el nuevo campo email
    return em.createQuery("SELECT u FROM Usuario u ORDER BY u.email", Usuario.class)
        .getResultList();
  }

  public boolean existeAdministrador() {
    Long count = em.createQuery("SELECT COUNT(u) FROM Usuario u WHERE u.rol = 'ADMIN'", Long.class)
        .getSingleResult();
    return count > 0;
  }
}
