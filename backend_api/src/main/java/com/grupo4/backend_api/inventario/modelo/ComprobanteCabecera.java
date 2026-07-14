/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.grupo4.backend_api.inventario.modelo;

import jakarta.json.bind.annotation.JsonbTransient;
import java.io.Serializable;
import java.math.BigDecimal;
import java.util.Collection;
import java.util.Date;
import jakarta.persistence.Basic;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.NamedQueries;
import jakarta.persistence.NamedQuery;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.persistence.Temporal;
import jakarta.persistence.TemporalType;
import java.time.LocalDate;

/**
 *
 * @author Usuario
 */
@Entity
@Table(name = "COMPROBANTE_CABECERA")
@NamedQueries({
        @NamedQuery(name = "ComprobanteCabecera.findAll", query = "SELECT c FROM ComprobanteCabecera c"),
        @NamedQuery(name = "ComprobanteCabecera.findByIdComprobante", query = "SELECT c FROM ComprobanteCabecera c WHERE c.idComprobante = :idComprobante"),
        @NamedQuery(name = "ComprobanteCabecera.findByNumeroComprobante", query = "SELECT c FROM ComprobanteCabecera c WHERE c.numeroComprobante = :numeroComprobante"),
        @NamedQuery(name = "ComprobanteCabecera.findByFecha", query = "SELECT c FROM ComprobanteCabecera c WHERE c.fecha = :fecha") })
public class ComprobanteCabecera implements Serializable {

    private static final long serialVersionUID = 1L;
    // @Max(value=?) @Min(value=?)//if you know range of your decimal fields
    // consider using these annotations to enforce field validation
    @Id
    @Basic(optional = false)
    @Column(name = "ID_COMPROBANTE")
    private BigDecimal idComprobante;
    @Basic(optional = false)
    @Column(name = "NUMERO_COMPROBANTE")
    private String numeroComprobante;
    @Basic(optional = false)
    @Column(name = "FECHA")
    private LocalDate fecha;
    @JoinColumn(name = "ID_TIPO_MOVIMIENTO", referencedColumnName = "ID_TIPO_MOVIMIENTO")
    @ManyToOne(optional = false)
    private TipoMovimiento idTipoMovimiento;
    @OneToMany(cascade = CascadeType.ALL, mappedBy = "idComprobante", orphanRemoval = true)
    private Collection<ComprobanteDetalle> comprobanteDetalleCollection;

    public ComprobanteCabecera() {
    }

    public ComprobanteCabecera(BigDecimal idComprobante) {
        this.idComprobante = idComprobante;
    }

    public ComprobanteCabecera(BigDecimal idComprobante, String numeroComprobante, LocalDate fecha) {
        this.idComprobante = idComprobante;
        this.numeroComprobante = numeroComprobante;
        this.fecha = fecha;
    }

    public BigDecimal getIdComprobante() {
        return idComprobante;
    }

    public void setIdComprobante(BigDecimal idComprobante) {
        this.idComprobante = idComprobante;
    }

    public String getNumeroComprobante() {
        return numeroComprobante;
    }

    public void setNumeroComprobante(String numeroComprobante) {
        this.numeroComprobante = numeroComprobante;
    }

    public LocalDate getFecha() {
        return fecha;
    }

    public void setFecha(LocalDate fecha) {
        this.fecha = fecha;
    }

    public TipoMovimiento getIdTipoMovimiento() {
        return idTipoMovimiento;
    }

    public void setIdTipoMovimiento(TipoMovimiento idTipoMovimiento) {
        this.idTipoMovimiento = idTipoMovimiento;
    }

    public Collection<ComprobanteDetalle> getComprobanteDetalleCollection() {
        return comprobanteDetalleCollection;
    }

    public void setComprobanteDetalleCollection(Collection<ComprobanteDetalle> comprobanteDetalleCollection) {
        this.comprobanteDetalleCollection = comprobanteDetalleCollection;
    }

    @Override
    public int hashCode() {
        int hash = 0;
        hash += (idComprobante != null ? idComprobante.hashCode() : 0);
        return hash;
    }

    @Override
    public boolean equals(Object object) {
        // TODO: Warning - this method won't work in the case the id fields are not set
        if (!(object instanceof ComprobanteCabecera)) {
            return false;
        }
        ComprobanteCabecera other = (ComprobanteCabecera) object;
        if ((this.idComprobante == null && other.idComprobante != null)
                || (this.idComprobante != null && !this.idComprobante.equals(other.idComprobante))) {
            return false;
        }
        return true;
    }

    @Override
    public String toString() {
        return "com.sistema.inventario.modelo.ComprobanteCabecera[ idComprobante=" + idComprobante + " ]";
    }

}
