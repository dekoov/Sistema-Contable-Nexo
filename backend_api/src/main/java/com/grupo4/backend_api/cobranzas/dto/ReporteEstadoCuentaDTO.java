package com.grupo4.backend_api.cobranzas.dto;

public class ReporteEstadoCuentaDTO {
    private String numeroFactura;
    private Double valorFactura;
    private Double totalPagado;
    private Double saldoPorCobrar;

    public ReporteEstadoCuentaDTO(String numeroFactura, Double valorFactura, Double totalPagado) {
        this.numeroFactura = numeroFactura;
        this.valorFactura = valorFactura;
        this.totalPagado = totalPagado;

        this.saldoPorCobrar = valorFactura - totalPagado;
    }


    public String getNumeroFactura() { return numeroFactura; }
    public Double getValorFactura() { return valorFactura; }
    public Double getTotalPagado() { return totalPagado; }
    public Double getSaldoPorCobrar() { return saldoPorCobrar; }
}