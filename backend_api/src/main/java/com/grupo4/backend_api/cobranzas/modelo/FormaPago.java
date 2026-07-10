package com.grupo4.backend_api.cobranzas.modelo;

import jakarta.persistence.*;
import java.io.Serializable;

@Entity
@Table(name = "FORMA_PAGO")
public class FormaPago implements Serializable {

    @Id
    @Column(name = "CODIGO", length = 10, nullable = false)
    private Integer codigo;

    @Column(name = "NOMBRE", length = 50, nullable = false)
    private String nombre;

    public FormaPago() {
    }

    // Getters y Setters
    public Integer getCodigo() { return codigo; }
    public void setCodigo(Integer codigo) { this.codigo = codigo; }

    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }
}

