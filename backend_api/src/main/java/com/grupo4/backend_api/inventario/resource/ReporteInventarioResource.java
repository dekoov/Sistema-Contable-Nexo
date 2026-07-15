/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.grupo4.backend_api.inventario.resource;

/**
 *
 * @author dcorrea
 */
import com.grupo4.backend_api.inventario.dto.ReporteMovimientoDTO;
import com.grupo4.backend_api.inventario.negocio.NegocioReporteInv;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.List;

@Path("/inventario/reportes")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class ReporteInventarioResource {

    @Inject
    private NegocioReporteInv negocioReporte;

    @GET
    @Path("/movimientos")
    public Response obtenerMovimientos(@QueryParam("fechaInicio") String fechaInicioStr,
                                        @QueryParam("fechaFin") String fechaFinStr) {
        try {
            LocalDate inicio = LocalDate.parse(fechaInicioStr);
            LocalDate fin = LocalDate.parse(fechaFinStr);

            List<ReporteMovimientoDTO> reporte = negocioReporte.obtenerDatosReporte(inicio, fin);
            return Response.ok(reporte).build();
        } catch (DateTimeParseException e) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity("{\"error\":\"Formato de fecha inválido. Use YYYY-MM-DD\"}").build();
        } catch (Exception e) {
            return Response.serverError().entity("{\"error\":\"Error interno al procesar el reporte\"}").build();
        }
    }
}
