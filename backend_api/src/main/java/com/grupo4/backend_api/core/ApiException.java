/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.grupo4.backend_api.core;

/**
 *
 * @author dcobe
 */
import jakarta.ejb.ApplicationException;
import jakarta.ws.rs.core.Response.Status;

@ApplicationException(rollback = true)
public class ApiException extends RuntimeException {
    private final Status status;

    public ApiException(Status status, String message) {
        super(message);
        this.status = status;
    }

    public Status getStatus() {
        return status;
    }
}