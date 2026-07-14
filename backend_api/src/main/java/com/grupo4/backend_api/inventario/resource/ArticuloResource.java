/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.grupo4.backend_api.inventario.resource;

/**
 *
 * @author dcobe
 */
import com.grupo4.backend_api.core.ApiResponse;
import com.grupo4.backend_api.inventario.dto.StockResponseDTO;
import com.grupo4.backend_api.inventario.modelo.Articulo;
import com.grupo4.backend_api.inventario.negocio.NegocioArticulo;
import com.grupo4.backend_api.inventario.negocio.NegocioReporteInv;

import jakarta.enterprise.context.RequestScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.Response.Status;
import java.math.BigDecimal;
import java.util.List;

@Path("/articulos")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@RequestScoped
public class ArticuloResource {

    @Inject
    private NegocioArticulo negocioArticulo;
    @Inject
    private NegocioReporteInv negocioReporte;

    @GET
    public Response obtenerArticulos(@QueryParam("nombre") String nombre) {
        List<Articulo> lista;
        
        if (nombre != null && !nombre.trim().isEmpty()) {
            lista = negocioArticulo.buscarPorNombre(nombre);
        } else {
            lista = negocioArticulo.listarTodos();
        }
        
        if (lista == null || lista.isEmpty()) {
            return Response.status(Status.NOT_FOUND)
                    .entity(new ApiResponse<>(404, "No se encontraron artículos"))
                    .build();
        }
        
        return Response.ok(new ApiResponse<>(200, "Artículos obtenidos exitosamente", lista)).build();
    }

    @GET
    @Path("/{id}")
    public Response buscarPorId(@PathParam("id") BigDecimal idArticulo) {
        Articulo articulo = negocioArticulo.buscarPorId(idArticulo);
        if (articulo == null) {
            return Response.status(Status.NOT_FOUND)
                    .entity(new ApiResponse<>(404, "Artículo no encontrado con ID: " + idArticulo))
                    .build();
        }
        
        return Response.ok(new ApiResponse<>(200, "Artículo encontrado", articulo)).build();
    }

    @POST
    public Response crear(Articulo articulo) {
        if (articulo.getIdArticulo() == null) {
            articulo.setIdArticulo(negocioArticulo.obtenerSiguienteId());
        }
        
        int resultado = negocioArticulo.insertar(articulo);
        if (resultado == 1) {
            return Response.status(Status.CREATED)
                    .entity(new ApiResponse<>(201, "Artículo creado exitosamente", articulo))
                    .build();
        }
        
        return Response.status(Status.INTERNAL_SERVER_ERROR)
                .entity(new ApiResponse<>(500, "Error al crear el artículo en la base de datos"))
                .build();
    }

    @PUT
    @Path("/{id}")
    public Response modificar(@PathParam("id") BigDecimal idArticulo, Articulo articulo) {
        articulo.setIdArticulo(idArticulo); // Asegurar integridad
        int resultado = negocioArticulo.modificar(articulo);
        
        if (resultado == 1) {
            return Response.ok(new ApiResponse<>(200, "Artículo actualizado exitosamente", articulo)).build();
        }
        
        return Response.status(Status.INTERNAL_SERVER_ERROR)
                .entity(new ApiResponse<>(500, "No se pudo actualizar el artículo. Verifique si existe."))
                .build();
    }

    @DELETE
    @Path("/{id}")
    public Response eliminar(@PathParam("id") BigDecimal idArticulo) {
        int resultado = negocioArticulo.eliminar(idArticulo);
        
        if (resultado == 1) {
            return Response.ok(new ApiResponse<>(200, "Artículo eliminado exitosamente")).build();
        }
        
        return Response.status(Status.INTERNAL_SERVER_ERROR)
                .entity(new ApiResponse<>(500, "Error al eliminar el artículo. Puede estar relacionado con otras tablas."))
                .build();
    }
    
    @GET
    @Path("/{idArticulo}/stock")
    public Response obtenerStockActual(@PathParam("idArticulo") BigDecimal idArticulo) {
        try {
            int stock = negocioReporte.obtenerStockActual(idArticulo);
            StockResponseDTO response = new StockResponseDTO(stock);
            return Response.ok(response).build();
        } catch (Exception e) {
            return Response.serverError().entity("{\"error\":\"Error al calcular el stock\"}").build();
        }
    }
}