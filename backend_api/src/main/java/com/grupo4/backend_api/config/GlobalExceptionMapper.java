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
import com.grupo4.backend_api.core.PersistenceExceptionUtils;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.ExceptionMapper;
import jakarta.ws.rs.ext.Provider;

import java.util.logging.Level;
import java.util.logging.Logger;

@Provider
public class GlobalExceptionMapper implements ExceptionMapper<Throwable> {

    private static final Logger LOG = Logger.getLogger(GlobalExceptionMapper.class.getName());

    @Override
    public Response toResponse(Throwable ex) {
        // CRÍTICO: sin esto, cualquier bug real queda invisible — solo el cliente ve el mensaje genérico
        LOG.log(Level.SEVERE, "Excepción no controlada en capa REST", ex);

        String mensaje = extraerMensajeUtil(ex);
        int status = PersistenceExceptionUtils.esViolacionForeignKey(ex) ? 409 : 500;

        ApiResponse<Void> response = new ApiResponse<>(status, mensaje);
        return Response.status(status)
                .type(MediaType.APPLICATION_JSON)
                .entity(response)
                .build();
    }

    private String extraerMensajeUtil(Throwable ex) {
        if (PersistenceExceptionUtils.esViolacionForeignKey(ex)) {
            return "No se puede completar la operación: el registro está siendo referenciado por otros datos.";
        }
        return "Error interno del servidor. Contacta al administrador si el problema persiste.";
    }
}