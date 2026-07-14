/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.grupo4.backend_api.config;

/**
 *
 * @author dcobe
 */
import jakarta.annotation.sql.DataSourceDefinition;
import jakarta.enterprise.context.ApplicationScoped;

@DataSourceDefinition(
    name = "java:global/jdbc/NexoDS",
    className = "org.postgresql.ds.PGSimpleDataSource",  // revertido — LAO cubre este caso, no necesitas XA real
    user = "postgres",
    password = "131021",
    databaseName = "nexo_db",
    serverName = "localhost",
    portNumber = 5432, // Si tienes un balanceador HAProxy frente a Patroni, asegúrate de apuntar a su puerto.
    minPoolSize = 2,
    maxPoolSize = 20,
    properties = {
        // Obliga a Payara a comprobar si la conexión sigue viva antes de usarla
        "fish.payara.is-connection-validation-required=true",
        "fish.payara.connection-validation-method=custom-validation",
        "fish.payara.validation-classname=org.glassfish.api.jdbc.validation.PostgresConnectionValidation",
        // En caso de que se caiga un nodo, falla rápido y purga las conexiones rotas
        "fish.payara.fail-all-connections=true",
        // Ayuda a evitar que Docker/Balanceadores cierren conexiones por inactividad
        "tcpKeepAlive=true"
    }
)
@ApplicationScoped
public class DatabaseConfig {
    // Hospeda la configuración para inicializar el pool de conexiones en Payara.
}
