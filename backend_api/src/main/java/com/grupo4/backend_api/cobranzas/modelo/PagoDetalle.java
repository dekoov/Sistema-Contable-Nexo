package com.grupo4.backend_api.cobranzas.modelo;

import com.grupo4.backend_api.facturacion.modelo.FacturaCabecera;
import jakarta.persistence.*;
import java.io.Serializable;
import java.util.Date;

@Entity
@Table(name = "PAGO_DETALLE")
public class PagoDetalle implements Serializable{

    @Id
    @Column(name = "ID_PAGO_DET")
    private Integer idPagoDetalle;

    @Temporal(TemporalType.DATE)
    @Column(name = "FECHA_PAGO", nullable = false)
    private Date fechaPago;

    @Column(name = "VALOR", nullable = false)
    private double valor;

    @ManyToOne
    @JoinColumn(name = "CEDULA_COBRADOR", nullable = false)
    private Cobrador cobrador;

    @ManyToOne
    @JoinColumn(name = "CODIGO_FORMA_PAGO", nullable = false)
    private FormaPago formaPago;

    @ManyToOne
    @JoinColumn(name = "ID_FACTURA", nullable = false)
    private FacturaCabecera factura;

    public PagoDetalle(){
    }

    public Integer getIdPagoDetalle() {
        return idPagoDetalle;
    }
    public void setIdPagoDetalle(Integer idPagoDetalle) {
        this.idPagoDetalle = idPagoDetalle;
    }

    public Date getFechaPago() {
        return fechaPago;
    }
    public void setFechaPago(Date fechaPago) {
        this.fechaPago = fechaPago;
    }

    public double getValor() {
        return valor;
    }
    public void setValor(double valor) {
        this.valor = valor;
    }

    public Cobrador getCobrador() { return cobrador; }
    public void setCobrador(Cobrador cobrador) { this.cobrador = cobrador; }


    public FormaPago getFormaPago() {
        return formaPago;
    }
    public void setFormaPago(FormaPago formaPago) {
        this.formaPago = formaPago; }

    public FacturaCabecera getFactura() {
        return factura;
    }
    public void setFactura(FacturaCabecera factura) {
        this.factura = factura; }


}