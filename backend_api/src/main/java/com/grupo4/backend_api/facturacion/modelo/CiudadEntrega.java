package com.grupo4.backend_api.facturacion.modelo;

import jakarta.persistence.*;
import java.io.Serializable;

@Entity
@Table(name = "CIUDAD_ENTREGA")
public class CiudadEntrega implements Serializable {

    @Id
    @Column(name = "ID_CIUDAD")
    private Integer idCiudad;

    @Column(name = "NOMBRE", nullable = false, length = 100)
    private String nombre;

    public CiudadEntrega() {}

    public Integer getIdCiudad() { return idCiudad; }
    public void setIdCiudad(Integer idCiudad) { this.idCiudad = idCiudad; }
    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }
}