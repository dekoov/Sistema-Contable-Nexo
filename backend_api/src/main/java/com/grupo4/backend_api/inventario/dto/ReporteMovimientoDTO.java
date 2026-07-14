/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.grupo4.backend_api.inventario.dto;

import java.math.BigDecimal;

/**
 *
 * @author dcorrea
 */
public class ReporteMovimientoDTO {
    private BigDecimal idArticulo;
    private String articulo;
    private String movimiento;
    private String tipo;
    private Long cantidad;

    public ReporteMovimientoDTO(BigDecimal idArticulo, String articulo, String movimiento, String tipo, Long cantidad) {
        this.idArticulo = idArticulo;
        this.articulo = articulo;
        this.movimiento = movimiento;
        this.tipo = tipo;
        this.cantidad = cantidad;
    }

    // Getters y Setters
    public BigDecimal getIdArticulo() { return idArticulo; }
    public void setIdArticulo(BigDecimal idArticulo) { this.idArticulo = idArticulo; }
    public String getArticulo() { return articulo; }
    public void setArticulo(String articulo) { this.articulo = articulo; }
    public String getMovimiento() { return movimiento; }
    public void setMovimiento(String movimiento) { this.movimiento = movimiento; }
    public String getTipo() { return tipo; }
    public void setTipo(String tipo) { this.tipo = tipo; }
    public Long getCantidad() { return cantidad; }
    public void setCantidad(Long cantidad) { this.cantidad = cantidad; }
}
