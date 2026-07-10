/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.grupo4.backend_api.inventario.modelo;

import jakarta.json.bind.annotation.JsonbTransient;
import java.io.Serializable;
import java.math.BigDecimal;
import java.util.Collection;
import jakarta.persistence.Basic;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.NamedQueries;
import jakarta.persistence.NamedQuery;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;

/**
 *
 * @author Usuario
 */
@Entity
@Table(name = "TIPO_MOVIMIENTO")
@NamedQueries({
    @NamedQuery(name = "TipoMovimiento.findAll", query = "SELECT t FROM TipoMovimiento t"),
    @NamedQuery(name = "TipoMovimiento.findByIdTipoMovimiento", query = "SELECT t FROM TipoMovimiento t WHERE t.idTipoMovimiento = :idTipoMovimiento"),
    @NamedQuery(name = "TipoMovimiento.findByNombre", query = "SELECT t FROM TipoMovimiento t WHERE t.nombre = :nombre"),
    @NamedQuery(name = "TipoMovimiento.findByTipo", query = "SELECT t FROM TipoMovimiento t WHERE t.tipo = :tipo")})
public class TipoMovimiento implements Serializable {

    private static final long serialVersionUID = 1L;
    // @Max(value=?)  @Min(value=?)//if you know range of your decimal fields consider using these annotations to enforce field validation
    @Id
    @Basic(optional = false)
    @Column(name = "ID_TIPO_MOVIMIENTO")
    private BigDecimal idTipoMovimiento;
    @Basic(optional = false)
    @Column(name = "NOMBRE")
    private String nombre;
    @Basic(optional = false)
    @Column(name = "TIPO")
    private Character tipo;
    @OneToMany(cascade = CascadeType.ALL, mappedBy = "idTipoMovimiento")
    private Collection<ComprobanteCabecera> comprobanteCabeceraCollection;

    public TipoMovimiento() {
    }

    public TipoMovimiento(BigDecimal idTipoMovimiento) {
        this.idTipoMovimiento = idTipoMovimiento;
    }

    public TipoMovimiento(BigDecimal idTipoMovimiento, String nombre, Character tipo) {
        this.idTipoMovimiento = idTipoMovimiento;
        this.nombre = nombre;
        this.tipo = tipo;
    }

    public BigDecimal getIdTipoMovimiento() {
        return idTipoMovimiento;
    }

    public void setIdTipoMovimiento(BigDecimal idTipoMovimiento) {
        this.idTipoMovimiento = idTipoMovimiento;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public Character getTipo() {
        return tipo;
    }

    public void setTipo(Character tipo) {
        this.tipo = tipo;
    }

    @JsonbTransient
    public Collection<ComprobanteCabecera> getComprobanteCabeceraCollection() {
        return comprobanteCabeceraCollection;
    }

    public void setComprobanteCabeceraCollection(Collection<ComprobanteCabecera> comprobanteCabeceraCollection) {
        this.comprobanteCabeceraCollection = comprobanteCabeceraCollection;
    }

    @Override
    public int hashCode() {
        int hash = 0;
        hash += (idTipoMovimiento != null ? idTipoMovimiento.hashCode() : 0);
        return hash;
    }

    @Override
    public boolean equals(Object object) {
        // TODO: Warning - this method won't work in the case the id fields are not set
        if (!(object instanceof TipoMovimiento)) {
            return false;
        }
        TipoMovimiento other = (TipoMovimiento) object;
        if ((this.idTipoMovimiento == null && other.idTipoMovimiento != null) || (this.idTipoMovimiento != null && !this.idTipoMovimiento.equals(other.idTipoMovimiento))) {
            return false;
        }
        return true;
    }

    @Override
    public String toString() {
        return "com.sistema.inventario.modelo.TipoMovimiento[ idTipoMovimiento=" + idTipoMovimiento + " ]";
    }
    
}
