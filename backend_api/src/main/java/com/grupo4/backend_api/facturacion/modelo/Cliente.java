package com.grupo4.backend_api.facturacion.modelo;

import jakarta.persistence.*;
import java.io.Serializable;

@Entity
@Table(name = "CLIENTE")
public class Cliente implements Serializable {

    @Id
    @Column(name = "ID_CLIENTE")
    private Integer idCliente;

    @Column(name = "CEDULA", unique = true, nullable = false, length = 13)
    private String cedula;

    @Column(name = "NOMBRE", nullable = false, length = 100)
    private String nombre;

    @Column(name = "DIRECCION", length = 4000)
    private String direccion;

    public Cliente() {}

    public Integer getIdCliente() { return idCliente; }
    public void setIdCliente(Integer idCliente) { this.idCliente = idCliente; }
    public String getCedula() { return cedula; }
    public void setCedula(String cedula) { this.cedula = cedula; }
    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }
    public String getDireccion() { return direccion; }
    public void setDireccion(String direccion) { this.direccion = direccion; }
}