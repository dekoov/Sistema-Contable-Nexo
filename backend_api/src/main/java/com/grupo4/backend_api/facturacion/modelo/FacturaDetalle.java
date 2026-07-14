package com.grupo4.backend_api.facturacion.modelo;

import jakarta.json.bind.annotation.JsonbTransient;
import jakarta.persistence.*;
import java.io.Serializable;

@Entity
@Table(name = "FACTURA_DETALLE")
public class FacturaDetalle implements Serializable {

    @Id
    @Column(name = "ID_FACTURA_DET")
    private Integer idFacturaDet;

    @ManyToOne
    @JoinColumn(name = "ID_FACTURA", nullable = false)
    private FacturaCabecera factura;

    @Column(name = "ID_ARTICULO", nullable = false)
    private Integer idArticulo;

    @Column(name = "CANTIDAD", nullable = false)
    private Integer cantidad;

    @Column(name = "PRECIO", nullable = false)
    private Double precio;

    @Transient
    private String nombreArticulo;

    public FacturaDetalle() {}

    public Integer getIdFacturaDet() { return idFacturaDet; }
    public void setIdFacturaDet(Integer idFacturaDet) { this.idFacturaDet = idFacturaDet; }

    @JsonbTransient   // corta el ciclo — factura ya se conoce por contexto (es el padre), no hace falta ida y vuelta
    public FacturaCabecera getFactura() { return factura; }
    public void setFactura(FacturaCabecera factura) { this.factura = factura; }

    public Integer getIdArticulo() { return idArticulo; }
    public void setIdArticulo(Integer idArticulo) { this.idArticulo = idArticulo; }
    public Integer getCantidad() { return cantidad; }
    public void setCantidad(Integer cantidad) { this.cantidad = cantidad; }
    public Double getPrecio() { return precio; }
    public void setPrecio(Double precio) { this.precio = precio; }
    public String getNombreArticulo() { return nombreArticulo; }
    public void setNombreArticulo(String nombreArticulo) { this.nombreArticulo = nombreArticulo; }
}