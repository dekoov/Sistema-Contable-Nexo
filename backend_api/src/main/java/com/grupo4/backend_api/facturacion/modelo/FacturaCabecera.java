package com.grupo4.backend_api.facturacion.modelo;

import jakarta.persistence.*;
import java.io.Serializable;
import java.time.LocalDate;
import java.util.Date;
import java.util.List;

@Entity
@Table(name = "FACTURA_CABECERA")
public class FacturaCabecera implements Serializable {

    @Id
    @Column(name = "ID_FACTURA")
    private Integer idFactura;

    @Column(name = "NUMERO_FACTURA", unique = true, nullable = false, length = 20)
    private String numeroFactura;

    @Column(name = "FECHA", nullable = false)
    private LocalDate fecha;

    @ManyToOne
    @JoinColumn(name = "ID_CLIENTE", nullable = false)
    private Cliente cliente;

    @ManyToOne
    @JoinColumn(name = "ID_CIUDAD", nullable = false)
    private CiudadEntrega ciudad;

    @Column(name = "VALOR_TOTAL")
    private Double valorTotal;

    @OneToMany(mappedBy = "factura", cascade = CascadeType.ALL)
    private List<FacturaDetalle> detalles;

    public FacturaCabecera() {}

    public Integer getIdFactura() { return idFactura; }
    public void setIdFactura(Integer idFactura) { this.idFactura = idFactura; }
    public String getNumeroFactura() { return numeroFactura; }
    public void setNumeroFactura(String numeroFactura) { this.numeroFactura = numeroFactura; }
    public LocalDate getFecha() { return fecha; }
    public void setFecha(LocalDate fecha) { this.fecha = fecha; }
    public Cliente getCliente() { return cliente; }
    public void setCliente(Cliente cliente) { this.cliente = cliente; }
    public CiudadEntrega getCiudad() { return ciudad; }
    public void setCiudad(CiudadEntrega ciudad) { this.ciudad = ciudad; }
    public Double getValorTotal() { return valorTotal; }
    public void setValorTotal(Double valorTotal) { this.valorTotal = valorTotal; }
    public List<FacturaDetalle> getDetalles() { return detalles; }
    public void setDetalles(List<FacturaDetalle> detalles) { this.detalles = detalles; }
}