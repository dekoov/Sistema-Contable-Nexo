package com.grupo4.backend_api.cobranzas.modelo;

import jakarta.persistence.*;
import java.io.Serializable;

@Entity
@Table(name = "COBRADOR")
public class Cobrador implements Serializable {

    @Id
    @Column(name = "ID_COBRADOR")
    private Integer idCobrador;

    @Column(name = "CEDULA", nullable = false, length = 10)
    private String cedula;

    @Column(name = "NOMBRE", nullable = false, length = 100)
    private String nombre;

    @Column(name = "DIRECCION", nullable = false, length = 200)
    private String direccion;

    public Cobrador(){

    }

    public Integer getIdCobrador() {
        return idCobrador;
    }
    public void setIdCobrador(Integer idCobrador) {
        this.idCobrador = idCobrador;
    }

    public String getCedula() {
        return cedula;
    }
    public void setCedula(String cedula) {
        this.cedula = cedula;
    }

    public String getNombre() {
        return nombre;
    }
    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public String getDireccion() { return direccion; }
    public void setDireccion(String direccion) { this.direccion = direccion; }
}