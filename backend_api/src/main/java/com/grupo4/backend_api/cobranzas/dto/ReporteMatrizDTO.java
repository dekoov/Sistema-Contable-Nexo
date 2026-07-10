package com.grupo4.backend_api.cobranzas.dto;

import java.util.HashMap;
import java.util.Map;

public class ReporteMatrizDTO {
    private String nombreCobrador;
    private Map<String, Double> valoresPorFormaPago;
    private Double totalRecaudado;

    public ReporteMatrizDTO(String nombreCobrador) {
        this.nombreCobrador = nombreCobrador;
        this.valoresPorFormaPago = new HashMap<>();
        this.totalRecaudado = 0.0;
    }

    public void agregarValor(String formaPago, Double valor) {
        Double valorActual = valoresPorFormaPago.getOrDefault(formaPago, 0.0);
        valoresPorFormaPago.put(formaPago, valorActual + valor);
        this.totalRecaudado += valor;
    }

    public String getNombreCobrador() { return nombreCobrador; }
    public Map<String, Double> getValoresPorFormaPago() { return valoresPorFormaPago; }
    public Double getTotalRecaudado() { return totalRecaudado; }
}