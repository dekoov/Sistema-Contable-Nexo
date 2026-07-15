/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.grupo4.backend_api.integracion.dto;

/**
 *
 * @author dcobe
 */
public class MensajeIntegracionDTO {
    private String idMensaje;
    private String tipoEvento;
    private String origen;
    private String destino;
    private String estado;
    private String fechaPublicacion;
    private String fechaProcesamiento;
    private int intentos;
    private String payload;
    private ComprobanteGeneradoDTO comprobanteGenerado;

    public static class ComprobanteGeneradoDTO {
        private String numeroComprobante;
        public ComprobanteGeneradoDTO() {}
        public ComprobanteGeneradoDTO(String numeroComprobante) { this.numeroComprobante = numeroComprobante; }
        public String getNumeroComprobante() { return numeroComprobante; }
        public void setNumeroComprobante(String numeroComprobante) { this.numeroComprobante = numeroComprobante; }
    }

    // getters/setters todos
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
    public String getFechaPublicacion() { return fechaPublicacion; }
    public void setFechaPublicacion(String fechaPublicacion) { this.fechaPublicacion = fechaPublicacion; }
    public String getFechaProcesamiento() { return fechaProcesamiento; }
    public void setFechaProcesamiento(String fechaProcesamiento) { this.fechaProcesamiento = fechaProcesamiento; }
    public int getIntentos() { return intentos; }
    public void setIntentos(int intentos) { this.intentos = intentos; }
    public String getPayload() { return payload; }
    public void setPayload(String payload) { this.payload = payload; }
    public ComprobanteGeneradoDTO getComprobanteGenerado() { return comprobanteGenerado; }
    public void setComprobanteGenerado(ComprobanteGeneradoDTO comprobanteGenerado) { this.comprobanteGenerado = comprobanteGenerado; }
}
