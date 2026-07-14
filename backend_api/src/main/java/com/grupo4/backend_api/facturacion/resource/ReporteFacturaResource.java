/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.grupo4.backend_api.facturacion.resource;

/**
 *
 * @author dcobe
 */
import com.grupo4.backend_api.facturacion.negocio.ReporteFactura;
import jakarta.enterprise.context.RequestScoped;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Path("/facturas/reportes")
@Produces(MediaType.APPLICATION_JSON)
@RequestScoped
public class ReporteFacturaResource {

    @PersistenceContext(unitName = "SistemaContablePU")
    private EntityManager em;

    @GET
    @Path("/ventas-por-ciudad")
    public Response getVentasPorCiudad() {
        try {
            ReporteFactura negocio = new ReporteFactura(em);
            List<Object[]> rawData = negocio.obtenerVentasPorCiudad();
            
            // Construimos una respuesta compatible con el normalizador normalizarFilaVentasCiudad de React
            List<Map<String, Object>> responseList = new ArrayList<>();
            for (Object[] row : rawData) {
                Map<String, Object> dto = new HashMap<>();
                dto.put("ciudad", row[0] != null ? row[0].toString() : "Sin ciudad");
                dto.put("total", row[1] != null ? ((Number) row[1]).doubleValue() : 0.0);
                responseList.add(dto);
            }
            
            // Envolver en objeto con propiedad "data" tal como espera extraerData() en frontend
            Map<String, Object> wrapper = new HashMap<>();
            wrapper.put("data", responseList);
            
            return Response.ok(wrapper).build();
        } catch (Exception e) {
            Map<String, String> errorMap = new HashMap<>();
            errorMap.put("error", "Error interno al generar reporte de ciudades: " + e.getMessage());
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR).entity(errorMap).build();
        }
    }

    @GET
    @Path("/matriz-ventas")
    public Response getMatrizVentas() {
        try {
            ReporteFactura negocio = new ReporteFactura(em);
            // Retorna un Map<Integer, Map<Integer, Double>>
            Map<Integer, Map<Integer, Double>> matriz = negocio.obtenerMatrizVentasPorCliente();
            
            // El formato Map de Java se serializa nativamente en JSON como un objeto anidado:
            // {"1": {"2": 50.0}} lo cual coincide exactamente con el "Formato posible 2" del frontend.
            Map<String, Object> wrapper = new HashMap<>();
            wrapper.put("data", matriz);
            
            return Response.ok(wrapper).build();
        } catch (Exception e) {
            Map<String, String> errorMap = new HashMap<>();
            errorMap.put("error", "Error interno al generar matriz de ventas: " + e.getMessage());
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR).entity(errorMap).build();
        }
    }
}