/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.grupo4.backend_api.core;

/**
 *
 * @author dcobe
 */
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.ExceptionMapper;
import jakarta.ws.rs.ext.Provider;

@Provider
public class ApiExceptionMapper implements ExceptionMapper<ApiException> {

    @Override
    public Response toResponse(ApiException exception) {
        ApiResponse<Void> responseDto = new ApiResponse<>(
                exception.getStatus().getStatusCode(),
                exception.getMessage()
        );

        return Response.status(exception.getStatus())
                .entity(responseDto)
                .type(MediaType.APPLICATION_JSON)
                .build();
    }
}