/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.grupo4.backend_api.inventario.resource;

/**
 *
 * @author dcobe
 */
import com.grupo4.backend_api.core.ApiException;
import com.grupo4.backend_api.core.ApiResponse;
import com.grupo4.backend_api.inventario.modelo.ComprobanteCabecera;
import com.grupo4.backend_api.inventario.modelo.ComprobanteDetalle;
import com.grupo4.backend_api.inventario.negocio.NegocioComprobante;

import jakarta.enterprise.context.RequestScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.Response.Status;

import java.math.BigDecimal;
import java.util.List;

@Path("/comprobantes")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@RequestScoped
public class ComprobanteResource {

    @Inject
    private NegocioComprobante negocioComprobante;

    // DTO de request: cabecera + detalles en un solo payload
    public static class ComprobanteRequest {
        public ComprobanteCabecera cabecera;
        public List<ComprobanteDetalle> detalles;
    }

    @GET
    public Response obtenerHistorial() {
        List<ComprobanteCabecera> lista = negocioComprobante.obtenerHistorialComprobantes();
        return Response.ok(new ApiResponse<>(200, "Historial de comprobantes obtenido", lista)).build();
    }

    @GET
    @Path("/{id}")
    public Response buscarPorId(@PathParam("id") BigDecimal id) {
        ComprobanteCabecera cab = negocioComprobante.buscarPorId(id);
        if (cab == null) {
            throw new ApiException(Status.NOT_FOUND, "Comprobante no encontrado con ID: " + id);
        }
        return Response.ok(new ApiResponse<>(200, "Comprobante encontrado", cab)).build();
    }

    @POST
    public Response registrar(ComprobanteRequest req) {
        try {
            if (req.cabecera.getIdComprobante() == null) {
                req.cabecera.setIdComprobante(negocioComprobante.obtenerSiguienteId());
            }
            negocioComprobante.registrarTransaccion(req.cabecera, req.detalles);
            return Response.status(Status.CREATED)
                    .entity(new ApiResponse<>(201, "Comprobante registrado exitosamente", req.cabecera))
                    .build();
        } catch (ApiException e) {
            throw e; // ya trae status+mensaje correcto
        } catch (Exception e) {
            // fallback: desenrollar causa real si vino wrapped (ej EJBTransactionRolledbackException)
            Throwable causa = e.getCause() != null ? e.getCause() : e;
            throw new ApiException(Status.BAD_REQUEST, causa.getMessage());
        }
    }

    @PUT
    @Path("/{id}")
    public Response modificar(@PathParam("id") BigDecimal id, ComprobanteRequest req) {
        try {
            req.cabecera.setIdComprobante(id);
            negocioComprobante.modificarTransaccion(req.cabecera, req.detalles);
            return Response.ok(new ApiResponse<>(200, "Comprobante modificado exitosamente", req.cabecera)).build();
        } catch (ApiException e) {
            throw e; // ya trae status+mensaje correcto
        } catch (Exception e) {
            // fallback: desenrollar causa real si vino wrapped (ej EJBTransactionRolledbackException)
            Throwable causa = e.getCause() != null ? e.getCause() : e;
            throw new ApiException(Status.BAD_REQUEST, causa.getMessage());
        }
    }

    @DELETE
    @Path("/{id}")
    public Response eliminar(@PathParam("id") BigDecimal id) {
        try {
            negocioComprobante.eliminarTransaccion(id);
            return Response.ok(new ApiResponse<>(200, "Comprobante eliminado exitosamente")).build();
        } catch (Exception e) {
            throw new ApiException(Status.NOT_FOUND, e.getMessage());
        }
    }
}