/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.grupo4.backend_api.cobranzas.resource;

/**
 *
 * @author dcobe
 */
import com.grupo4.backend_api.cobranzas.dto.ReporteEstadoCuentaDTO;
import com.grupo4.backend_api.cobranzas.dto.ReporteMatrizDTO;
import com.grupo4.backend_api.cobranzas.negocio.NegocioReportes;
import com.grupo4.backend_api.core.ApiException;
import com.grupo4.backend_api.core.ApiResponse;
import jakarta.enterprise.context.RequestScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.Response.Status;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.List;

@Path("/cxc/reportes")
@Produces(MediaType.APPLICATION_JSON)
@RequestScoped
public class ReporteCxcResource {

    @Inject
    private NegocioReportes negocioReportes;

    @GET
    @Path("/estado-cuenta")
    public Response estadoCuenta(@QueryParam("fechaInicio") String fechaInicioStr,
                                  @QueryParam("fechaFin") String fechaFinStr) {
        try {
            LocalDate inicio = LocalDate.parse(fechaInicioStr);
            LocalDate fin = LocalDate.parse(fechaFinStr);
            List<ReporteEstadoCuentaDTO> reporte = negocioReportes.generarEstadoCuentaPorFechas(inicio, fin);
            return Response.ok(new ApiResponse<>(200, "Estado de cuenta obtenido exitosamente", reporte)).build();
        } catch (DateTimeParseException e) {
            throw new ApiException(Status.BAD_REQUEST, "Formato de fecha inválido. Use YYYY-MM-DD.");
        }
    }

    @GET
    @Path("/matriz-recaudacion")
    public Response matrizRecaudacion(@QueryParam("fechaInicio") String fechaInicioStr,
                                       @QueryParam("fechaFin") String fechaFinStr) {
        try {
            LocalDate inicio = LocalDate.parse(fechaInicioStr);
            LocalDate fin = LocalDate.parse(fechaFinStr);
            List<ReporteMatrizDTO> reporte = negocioReportes.generarMatrizCruzada(inicio, fin);
            return Response.ok(new ApiResponse<>(200, "Matriz de recaudación obtenida exitosamente", reporte)).build();
        } catch (DateTimeParseException e) {
            throw new ApiException(Status.BAD_REQUEST, "Formato de fecha inválido. Use YYYY-MM-DD.");
        }
    }
}
