/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.grupo4.backend_api.facturacion.mensajeria;

/**
 *
 * @author dcobe
 */
import com.grupo4.backend_api.core.eventos.FacturaCreadaEventDTO;
import jakarta.annotation.Resource;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.jms.JMSConnectionFactory;
import jakarta.jms.JMSContext;
import jakarta.jms.Queue;
import jakarta.json.bind.Jsonb;
import jakarta.json.bind.JsonbBuilder;

@ApplicationScoped
public class FacturaEventPublisher {

    @Inject
    @JMSConnectionFactory("java:app/jms/facturaConnectionFactory")
    private JMSContext jmsContext;

    @Resource(lookup = "java:app/jms/facturaCreadaQueue")
    private Queue facturaCreadaQueue;

    /**
     * No lanza excepción hacia el llamador: la factura YA se persistió.
     * Un fallo de publicación se loguea como advertencia, no revierte la venta.
     */
    public void publicarFacturaCreada(FacturaCreadaEventDTO evento) {
        try {
            Jsonb jsonb = JsonbBuilder.create();
            String json = jsonb.toJson(evento);
            jmsContext.createProducer().send(facturaCreadaQueue, json);
        } catch (Exception e) {
            System.out.println("ADVERTENCIA: factura guardada, pero no se pudo publicar evento JMS: "
                    + e.getMessage());
        }
    }
}