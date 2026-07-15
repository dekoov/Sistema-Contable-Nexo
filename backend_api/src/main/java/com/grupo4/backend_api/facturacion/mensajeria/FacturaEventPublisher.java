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
import com.grupo4.backend_api.integracion.negocio.NegocioIntegracion;
import jakarta.annotation.Resource;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.jms.JMSConnectionFactory;
import jakarta.jms.JMSContext;
import jakarta.jms.Queue;
import jakarta.jms.TextMessage;
import jakarta.json.bind.Jsonb;
import jakarta.json.bind.JsonbBuilder;
import java.util.UUID;

@ApplicationScoped
public class FacturaEventPublisher {

    @Inject
    @JMSConnectionFactory("java:app/jms/facturaConnectionFactory")
    private JMSContext jmsContext;

    @Resource(lookup = "java:app/jms/facturaCreadaQueue")
    private Queue facturaCreadaQueue;

    @Inject
    private NegocioIntegracion negocioIntegracion;

    public void publicarFacturaCreada(FacturaCreadaEventDTO evento) {
        try {
            Jsonb jsonb = JsonbBuilder.create();
            String json = jsonb.toJson(evento);
            String idMensaje = UUID.randomUUID().toString();

            TextMessage msg = jmsContext.createTextMessage(json);
            msg.setStringProperty("idMensaje", idMensaje); // clave para consumo selectivo luego

            jmsContext.createProducer().send(facturaCreadaQueue, msg);

            negocioIntegracion.registrarPublicacion(idMensaje, "FACTURA_CREADA", "FACTURACION", "INVENTARIO", json);
        } catch (Exception e) {
            System.out.println("ADVERTENCIA: factura guardada, pero no se pudo publicar evento JMS: " + e.getMessage());
        }
    }
}