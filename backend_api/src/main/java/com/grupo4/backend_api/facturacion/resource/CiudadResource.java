/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.grupo4.backend_api.facturacion.resource;

/**
 *
 * @author dcobe
 */
import com.grupo4.backend_api.core.ApiException;
import com.grupo4.backend_api.core.ApiResponse;
import com.grupo4.backend_api.facturacion.modelo.CiudadEntrega;
import com.grupo4.backend_api.facturacion.negocio.NegocioCiudad;
import jakarta.enterprise.context.RequestScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.Response.Status;
import java.util.List;

@Path("/ciudades")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@RequestScoped
public class CiudadResource {

    @Inject
    private NegocioCiudad negocioCiudad;

    @GET
    public Response obtenerCiudades(@QueryParam("nombre") String nombre) {
        List<CiudadEntrega> lista;
        
        // Flujo condicional: Filtrar por nombre o listar todo el catálogo
        if (nombre != null && !nombre.trim().isEmpty()) {
            lista = negocioCiudad.buscarPorNombre(nombre);
        } else {
            lista = negocioCiudad.listarTodos();
        }
        
        // Validación de existencia de datos
        if (lista == null || lista.isEmpty()) {
            String mensajeError = (nombre != null) 
                ? "No se encontraron ciudades que coincidan con: " + nombre 
                : "No existen ciudades registradas en el sistema.";
            throw new ApiException(Status.NOT_FOUND, mensajeError);
        }
        
        ApiResponse<List<CiudadEntrega>> response = new ApiResponse<>(200, "Ciudades obtenidas exitosamente", lista);
        return Response.ok(response).build();
    }

    @GET
    @Path("/{id}")
    public Response buscarPorId(@PathParam("id") Integer idCiudad) {
        CiudadEntrega ciudad = negocioCiudad.buscar(idCiudad);
        if (ciudad == null) {
            throw new ApiException(Status.NOT_FOUND, "Ciudad no encontrada con ID: " + idCiudad);
        }
        
        ApiResponse<CiudadEntrega> response = new ApiResponse<>(200, "Ciudad obtuvo exitosamente", ciudad);
        return Response.ok(response).build();
    }

    @POST
    public Response crearCiudad(CiudadEntrega ciudad) {
        int resultado = negocioCiudad.insertar(ciudad);
        if (resultado == 0 || resultado == -1) {
            throw new ApiException(Status.INTERNAL_SERVER_ERROR, "Error interno al intentar crear la ciudad.");
        }
        
        ApiResponse<CiudadEntrega> response = new ApiResponse<>(201, "Ciudad creada exitosamente", ciudad);
        return Response.status(Status.CREATED).entity(response).build();
    }

    @PUT
    @Path("/{id}")
    public Response actualizarCiudad(@PathParam("id") Integer idCiudad, CiudadEntrega ciudad) {
        // Aseguramos que el ID del payload sea el mismo de la URL
        ciudad.setIdCiudad(idCiudad);
        
        int resultado = negocioCiudad.modificar(ciudad);
        if (resultado == 0) {
            throw new ApiException(Status.NOT_FOUND, "No se puede actualizar. Ciudad no encontrada con ID: " + idCiudad);
        } else if (resultado == -1) {
            throw new ApiException(Status.INTERNAL_SERVER_ERROR, "Error interno al intentar actualizar la ciudad.");
        }
        
        ApiResponse<CiudadEntrega> response = new ApiResponse<>(200, "Ciudad actualizada exitosamente", ciudad);
        return Response.ok(response).build();
    }

    @DELETE
    @Path("/{id}")
    public Response eliminarCiudad(@PathParam("id") Integer id) {
        int resultado = negocioCiudad.eliminar(id);
        if (resultado == 0) {
            throw new ApiException(Status.NOT_FOUND, "No se puede eliminar. Ciudad no encontrada con ID: " + id);
        } else if (resultado == -1) {
            throw new ApiException(Status.INTERNAL_SERVER_ERROR, "Error interno al intentar eliminar la ciudad.");
        }
        
        ApiResponse<Void> response = new ApiResponse<>(200, "Ciudad eliminada exitosamente");
        return Response.ok(response).build();
    }
}