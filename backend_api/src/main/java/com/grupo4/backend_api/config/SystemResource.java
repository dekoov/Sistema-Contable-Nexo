/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.grupo4.backend_api.config;

/**
 *
 * @author dcobe
 */
import com.grupo4.backend_api.core.ApiResponse;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.net.InetAddress;
import java.util.HashMap;
import java.util.Map;

@Path("/system")
@Produces(MediaType.APPLICATION_JSON)
public class SystemResource {

    @GET
    @Path("/instance")
    public Response obtenerInstancia() {
        String nombreNodo = System.getenv().getOrDefault("NODO_NAME", "nodo-desconocido");
        String hostname;
        try {
            hostname = InetAddress.getLocalHost().getHostName();
        } catch (Exception e) {
            hostname = "N/D";
        }

        Map<String, Object> data = new HashMap<>();
        data.put("instance", nombreNodo);
        data.put("host", hostname);
        data.put("port", 8080);

        return Response.ok(new ApiResponse<>(200, "Nodo actual", data)).build();
    }
}