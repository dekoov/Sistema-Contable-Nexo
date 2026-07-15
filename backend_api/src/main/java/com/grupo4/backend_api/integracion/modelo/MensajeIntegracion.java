/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.grupo4.backend_api.integracion.modelo;

/**
 *
 * @author dcobe
 */
import jakarta.persistence.*;
import java.io.Serializable;
import java.time.LocalDateTime;

@Entity
@Table(name = "MENSAJE_INTEGRACION")
public class MensajeIntegracion implements Serializable {

    @Id
    @Column(name = "ID_MENSAJE", length = 60)
    private String idMensaje;

    @Column(name = "TIPO_EVENTO", nullable = false, length = 50)
    private String tipoEvento;

    @Column(name = "ORIGEN", nullable = false, length = 30)
    private String origen;

    @Column(name = "DESTINO", nullable = false, length = 30)
    private String destino;

    @Column(name = "ESTADO", nullable = false, length = 20)
    private String estado; // PENDIENTE | PROCESADO

    @Column(name = "FECHA_PUBLICACION", nullable = false)
    private LocalDateTime fechaPublicacion;

    @Column(name = "FECHA_PROCESAMIENTO")
    private LocalDateTime fechaProcesamiento;

    @Column(name = "INTENTOS", nullable = false)
    private int intentos;

    @Lob
    @Column(name = "PAYLOAD")
    private String payload;

    @Column(name = "NUMERO_COMPROBANTE_GENERADO", length = 30)
    private String numeroComprobanteGenerado;

    public MensajeIntegracion() {}

    public String getIdMensaje() { return idMensaje; }
    public void setIdMensaje(String idMensaje) { this.idMensaje = idMensaje; }
    public String getTipoEvento() { return tipoEvento; }
    public void setTipoEvento(String tipoEvento) { this.tipoEvento = tipoEvento; }
    public String getOrigen() { return origen; }
    public void setOrigen(String origen) { this.origen = origen; }
    public String getDestino() { return destino; }
    public void setDestino(String destino) { this.destino = destino; }
    public String getEstado() { return estado; }
    public void setEstado(String estado) { this.estado = estado; }
    public LocalDateTime getFechaPublicacion() { return fechaPublicacion; }
    public void setFechaPublicacion(LocalDateTime fechaPublicacion) { this.fechaPublicacion = fechaPublicacion; }
    public LocalDateTime getFechaProcesamiento() { return fechaProcesamiento; }
    public void setFechaProcesamiento(LocalDateTime fechaProcesamiento) { this.fechaProcesamiento = fechaProcesamiento; }
    public int getIntentos() { return intentos; }
    public void setIntentos(int intentos) { this.intentos = intentos; }
    public String getPayload() { return payload; }
    public void setPayload(String payload) { this.payload = payload; }
    public String getNumeroComprobanteGenerado() { return numeroComprobanteGenerado; }
    public void setNumeroComprobanteGenerado(String numeroComprobanteGenerado) { this.numeroComprobanteGenerado = numeroComprobanteGenerado; }
}