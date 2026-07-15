/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.grupo4.backend_api.inventario.dto;

/**
 *
 * @author dcobe
 */

public class StockArticuloDTO {
    private int ingresos;
    private int egresos;
    private int stock;

    public StockArticuloDTO() {}

    public StockArticuloDTO(int ingresos, int egresos) {
        this.ingresos = ingresos;
        this.egresos = egresos;
        this.stock = ingresos - egresos;
    }

    public int getIngresos() { return ingresos; }
    public void setIngresos(int ingresos) { this.ingresos = ingresos; }
    public int getEgresos() { return egresos; }
    public void setEgresos(int egresos) { this.egresos = egresos; }
    public int getStock() { return stock; }
    public void setStock(int stock) { this.stock = stock; }
}