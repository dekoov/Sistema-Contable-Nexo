package com.grupo4.backend_api.usuarios.api;

import com.grupo4.backend_api.core.ApiResponse;
import com.grupo4.backend_api.usuarios.modelo.Usuario;
import com.grupo4.backend_api.usuarios.negocio.NegocioUsuario;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.List;

@Path("/usuarios")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class UsuarioResource {

    @Inject
    private NegocioUsuario negocioUsuario;

    @GET
    public Response listar() {
        List<Usuario> usuarios = negocioUsuario.listarTodos();
        return Response.ok(new ApiResponse<>(200, "Lista de usuarios obtenida", usuarios)).build();
    }

    @POST
    public Response crear(Usuario usuario) {
        negocioUsuario.insertar(usuario);
        return Response.status(Response.Status.CREATED)
                .entity(new ApiResponse<>(201, "Usuario creado exitosamente", usuario))
                .build();
    }

    @PUT
    @Path("/{id}")
    public Response actualizar(@PathParam("id") Long id, Usuario usuario) {
        usuario.setId(id);
        negocioUsuario.modificar(usuario);
        return Response.ok(new ApiResponse<>(200, "Usuario actualizado exitosamente", usuario)).build();
    }

    @DELETE
    @Path("/{id}")
    public Response eliminar(@PathParam("id") Long id) {
        negocioUsuario.eliminar(id);
        return Response.ok(new ApiResponse<>(200, "Usuario eliminado exitosamente")).build();
    }
}
