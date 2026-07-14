/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.grupo4.backend_api.core.eventos;

/**
 *
 * @author dcobe
 */
import java.util.List;

public class FacturaCreadaEventDTO {
    private Integer idFactura;
    private String numeroFactura;
    private String fecha;
    private List<FacturaDetalleEventDTO> detalles;

    public FacturaCreadaEventDTO() {}

    public FacturaCreadaEventDTO(Integer idFactura, String numeroFactura, String fecha,
                                  List<FacturaDetalleEventDTO> detalles) {
        this.idFactura = idFactura;
        this.numeroFactura = numeroFactura;
        this.fecha = fecha;
        this.detalles = detalles;
    }

    public Integer getIdFactura() { return idFactura; }
    public void setIdFactura(Integer idFactura) { this.idFactura = idFactura; }
    public String getNumeroFactura() { return numeroFactura; }
    public void setNumeroFactura(String numeroFactura) { this.numeroFactura = numeroFactura; }
    public String getFecha() { return fecha; }
    public void setFecha(String fecha) { this.fecha = fecha; }
    public List<FacturaDetalleEventDTO> getDetalles() { return detalles; }
    public void setDetalles(List<FacturaDetalleEventDTO> detalles) { this.detalles = detalles; }
}