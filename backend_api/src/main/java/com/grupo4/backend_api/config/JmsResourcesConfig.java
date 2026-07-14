/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.grupo4.backend_api.config;

/**
 *
 * @author dcobe
 */
import jakarta.ejb.Singleton;
import jakarta.ejb.Startup;
import jakarta.jms.JMSConnectionFactoryDefinition;
import jakarta.jms.JMSDestinationDefinition;

@JMSConnectionFactoryDefinition(
    name = "java:app/jms/facturaConnectionFactory",
    interfaceName = "jakarta.jms.ConnectionFactory"
)
@JMSDestinationDefinition(
    name = "java:app/jms/facturaCreadaQueue",
    interfaceName = "jakarta.jms.Queue",
    destinationName = "PHYSICAL_FACTURA_CREADA_QUEUE"
)
@Singleton
@Startup
public class JmsResourcesConfig {
    // Clase vacía: solo ancla las anotaciones de recursos JMS para que
    // Payara las cree al desplegar el .war. @Startup fuerza su inicialización
    // temprana para detectar errores de config al boot, no en el primer POST.
}