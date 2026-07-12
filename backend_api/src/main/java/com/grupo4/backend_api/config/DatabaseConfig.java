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
    name = "java:global/jdbc/NexoDS",          // Nombre JNDI estandarizado globalmente
    className = "org.postgresql.ds.PGSimpleDataSource",
    user = "usuario_nexo",                         // Tu usuario
    password = "admin123",                     // Tu contraseña
    databaseName = "nexo_db",                  // Tu BD
    serverName = "haproxy",
    portNumber = 5432,
    minPoolSize = 2,
    maxPoolSize = 20
)
@ApplicationScoped
public class DatabaseConfig {
    // Esta clase puede estar vacía. 
    // Su único propósito es alojar la anotación para que el servidor la lea al arrancar.
}
