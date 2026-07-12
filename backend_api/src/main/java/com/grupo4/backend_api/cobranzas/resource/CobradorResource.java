package com.grupo4.backend_api.cobranzas.resource;

import com.grupo4.backend_api.core.ApiException;
import com.grupo4.backend_api.core.ApiResponse;
import com.grupo4.backend_api.cobranzas.modelo.Cobrador;
import com.grupo4.backend_api.cobranzas.negocio.NegocioCobrador;

import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.inject.Inject;
import jakarta.ws.rs.core.Response.Status;
import java.util.List;

@Path("/cobradores")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class CobradorResource {

    @Inject
    private NegocioCobrador negocioCobrador;

    @GET
    public Response listarTodos() {
        List<Cobrador> cobradores = negocioCobrador.listarTodos();
        if (cobradores == null) {
            throw new ApiException(Status.INTERNAL_SERVER_ERROR, "Error al recuperar la lista de cobradores.");
        }
        ApiResponse<List<Cobrador>> response = new ApiResponse<>(200, "Lista de cobradores obtenida", cobradores);
        return Response.ok(response).build();
    }

    @GET
    @Path("/{id}")
    public Response buscarPorId(@PathParam("id") Integer id) {
        Cobrador cobrador = negocioCobrador.buscar(id);
        
        if (cobrador == null) {
            throw new ApiException(Status.NOT_FOUND, "Cobrador no encontrado con ID: " + id);
        }
        
        ApiResponse<Cobrador> response = new ApiResponse<>(200, "Cobrador encontrado", cobrador);
        return Response.ok(response).build();
    }

    @POST
    public Response crear(Cobrador nuevoCobrador) {
        // ID se genera en Negocio
        
        boolean resultado = negocioCobrador.insertar(nuevoCobrador);
        if (!resultado) {
            throw new ApiException(Status.INTERNAL_SERVER_ERROR, "Error interno al intentar guardar el cobrador.");
        }
        
        ApiResponse<Cobrador> response = new ApiResponse<>(201, "Cobrador creado exitosamente", nuevoCobrador);
        return Response.status(Status.CREATED).entity(response).build();
    }

    @PUT
    @Path("/{id}")
    public Response actualizar(@PathParam("id") Integer id, Cobrador cobradorActualizar) {
        if (cobradorActualizar == null) {
            throw new ApiException(Status.BAD_REQUEST, "El cuerpo de la petición no puede estar vacío.");
        }
        
        // Sincronizar ID del Path con el payload
        cobradorActualizar.setIdCobrador(id);
        
        int resultado = negocioCobrador.modificar(cobradorActualizar);
        if (resultado == 0) {
            throw new ApiException(Status.NOT_FOUND, "No se puede modificar. Cobrador no encontrado con ID: " + id);
        } else if (resultado == -1) {
            throw new ApiException(Status.INTERNAL_SERVER_ERROR, "Error interno al intentar modificar el cobrador.");
        }
        
        ApiResponse<Cobrador> response = new ApiResponse<>(200, "Cobrador modificado exitosamente", cobradorActualizar);
        return Response.ok(response).build();
    }

    @DELETE
    @Path("/{id}")
    public Response eliminar(@PathParam("id") Integer id) {
        int resultado = negocioCobrador.eliminar(id);
        if (resultado == 0) {
            throw new ApiException(Status.NOT_FOUND, "No se puede eliminar. Cobrador no encontrado con ID: " + id);
        } else if (resultado == -1) {
            throw new ApiException(Status.INTERNAL_SERVER_ERROR, "Error interno al intentar eliminar el cobrador.");
        }
        
        ApiResponse<Void> response = new ApiResponse<>(200, "Cobrador eliminado exitosamente");
        return Response.ok(response).build();
    }
}
