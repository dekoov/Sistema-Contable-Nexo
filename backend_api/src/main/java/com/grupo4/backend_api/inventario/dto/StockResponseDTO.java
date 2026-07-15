/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.grupo4.backend_api.inventario.dto;

/**
 *
 * @author dcorrea
 */

public class StockResponseDTO {
    private int stock;

    public StockResponseDTO(int stock) {
        this.stock = stock;
    }

    // Getters y Setters
    public int getStock() { return stock; }
    public void setStock(int stock) { this.stock = stock; }
}