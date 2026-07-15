/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.grupo4.backend_api.inventario.mensajeria;

/**
 *
 * @author dcobe
 */
import com.grupo4.backend_api.core.eventos.FacturaCreadaEventDTO;
import com.grupo4.backend_api.inventario.negocio.NegocioComprobante;

import jakarta.ejb.ActivationConfigProperty;
import jakarta.ejb.MessageDriven;
import jakarta.inject.Inject;
import jakarta.jms.JMSException;
import jakarta.jms.Message;
import jakarta.jms.MessageListener;
import jakarta.jms.TextMessage;
import jakarta.json.bind.Jsonb;
import jakarta.json.bind.JsonbBuilder;

public class EgresoPorVentaListener implements MessageListener {

    @Inject
    private NegocioComprobante negocioComprobante;

    @Override
    public void onMessage(Message message) {
        try {
            String json = ((TextMessage) message).getText();
            Jsonb jsonb = JsonbBuilder.create();
            FacturaCreadaEventDTO evento = jsonb.fromJson(json, FacturaCreadaEventDTO.class);

            boolean exito = negocioComprobante.registrarEgresoDesdeEvento(evento);
            if (!exito) {
                // Fallo recuperable (ej. artículo no existe aún por timing).
                // Lanzar RuntimeException fuerza redelivery según política de la cola en Payara.
                throw new RuntimeException("No se pudo procesar egreso para factura "
                        + evento.getIdFactura() + "; se solicitará reintento.");
            }
        } catch (JMSException e) {
            e.printStackTrace();
        }
    }
}