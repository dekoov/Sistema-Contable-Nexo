/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.grupo4.backend_api.core;

/**
 *
 * @author dcobe
 */
public class PersistenceExceptionUtils {
    public static boolean esViolacionForeignKey(Throwable ex) {
        Throwable actual = ex;
        while (actual != null) {
            String msg = actual.getMessage();
            if (msg != null && msg.contains("violates foreign key constraint")) {
                return true;
            }
            actual = actual.getCause();
        }
        return false;
    }
}