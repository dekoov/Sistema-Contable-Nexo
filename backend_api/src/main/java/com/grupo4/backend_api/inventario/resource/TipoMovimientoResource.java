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
import com.grupo4.backend_api.inventario.modelo.TipoMovimiento;
import com.grupo4.backend_api.inventario.negocio.NegocioTipoMovimiento;

import jakarta.enterprise.context.RequestScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.Response.Status;
import java.math.BigDecimal;
import java.util.List;

@Path("/tipos-movimiento")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@RequestScoped
public class TipoMovimientoResource {

    @Inject
    private NegocioTipoMovimiento negocioTipoMovimiento;

    @GET
    public Response obtenerTiposMovimiento(@QueryParam("nombre") String nombre) {
        List<TipoMovimiento> lista;
        
        if (nombre != null && !nombre.trim().isEmpty()) {
            lista = negocioTipoMovimiento.buscarPorNombre(nombre);
        } else {
            lista = negocioTipoMovimiento.listarTodos();
        }
        
        if (lista == null || lista.isEmpty()) {
            return Response.status(Status.NOT_FOUND)
                    .entity(new ApiResponse<>(404, "No se encontraron tipos de movimiento"))
                    .build();
        }
        
        return Response.ok(new ApiResponse<>(200, "Tipos de movimiento obtenidos exitosamente", lista)).build();
    }

    @GET
    @Path("/{id}")
    public Response buscarPorId(@PathParam("id") BigDecimal idTipoMovimiento) {
        TipoMovimiento tipo = negocioTipoMovimiento.buscar(idTipoMovimiento);
        if (tipo == null) {
            return Response.status(Status.NOT_FOUND)
                    .entity(new ApiResponse<>(404, "Tipo de movimiento no encontrado con ID: " + idTipoMovimiento))
                    .build();
        }
        
        return Response.ok(new ApiResponse<>(200, "Tipo de movimiento encontrado", tipo)).build();
    }

    @POST
    public Response crear(TipoMovimiento tipo) {
        if (tipo.getIdTipoMovimiento() == null) {
            tipo.setIdTipoMovimiento(negocioTipoMovimiento.obtenerSiguienteId());
        }
        
        int resultado = negocioTipoMovimiento.insertar(tipo);
        if (resultado == 1) {
            return Response.status(Status.CREATED)
                    .entity(new ApiResponse<>(201, "Tipo de movimiento creado", tipo))
                    .build();
        }
        
        return Response.status(Status.BAD_REQUEST)
                .entity(new ApiResponse<>(400, "Error de validación o base de datos al crear el registro"))
                .build();
    }

    @PUT
    @Path("/{id}")
    public Response modificar(@PathParam("id") BigDecimal idTipoMovimiento, TipoMovimiento tipo) {
        tipo.setIdTipoMovimiento(idTipoMovimiento);
        int resultado = negocioTipoMovimiento.modificar(tipo);
        
        if (resultado == 1) {
            return Response.ok(new ApiResponse<>(200, "Tipo de movimiento actualizado", tipo)).build();
        }
        
        return Response.status(Status.BAD_REQUEST)
                .entity(new ApiResponse<>(400, "No se pudo actualizar. Verifique las validaciones (tipo debe ser I o E)"))
                .build();
    }

    @DELETE
    @Path("/{id}")
    public Response eliminar(@PathParam("id") BigDecimal idTipoMovimiento) {
        int resultado = negocioTipoMovimiento.eliminar(idTipoMovimiento);
        
        if (resultado == 1) {
            return Response.ok(new ApiResponse<>(200, "Tipo de movimiento eliminado")).build();
        } else if (resultado == 0) {
            return Response.status(Status.NOT_FOUND)
                    .entity(new ApiResponse<>(404, "El tipo de movimiento no existe"))
                    .build();
        }
        
        return Response.status(Status.CONFLICT)
                .entity(new ApiResponse<>(409, "No se puede eliminar porque está asociado a comprobantes existentes"))
                .build();
    }
}
