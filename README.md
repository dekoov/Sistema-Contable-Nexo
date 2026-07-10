# Configuración del Entorno de Desarrollo - Backend API Nexo

Sigue esta guía para dejar tu entorno listo en NetBeans en pocos minutos.

## 0. Obtener el Proyecto
1. Haz un **Fork** de este repositorio hacia tu cuenta personal de GitHub.
2. Clona el proyecto en tu máquina local: `git clone <url-de-tu-fork>`
3. Abre el proyecto en **NetBeans** (File > Open Project).

---

## 1. Descargas Previas Necesarias
*Pila, cuando vayan a querer ejecutar el proyecto necesitan tener sí o sí el JDK, el servidor Payara y el driver JDBC de PostgreSQL.*

1. **Java JDK 21:** Descarga el *Windows x64 Installer* desde [Oracle JDK 21](https://www.oracle.com/java/technologies/javase/jdk21-archive-downloads.html). Instálalo con siguiente > siguiente.
2. **Servidor Payara 7:** Descarga la versión **"Full"** desde [Payara Platform Community](https://payara.fish/downloads/payara-platform-community-edition/).
3. **Driver JDBC PostgreSQL:** Descarga el archivo `postgresql-42.7.13.jar` (Java 8 version) desde [PostgreSQL JDBC](https://jdbc.postgresql.org/download/).

---

## 2. Configurar Payara y el Driver en NetBeans
1. **Descomprimir Payara:** Extrae el `.zip` de Payara que descargaste. Toma la carpeta resultante llamada `payara7` y colócala en tu carpeta de usuario de Windows (ej. `C:\Users\TuUsuario\payara7`). *Este será nuestro servidor web, de cola de mensajes y contenedor empresarial.*
2. **Instalar el Driver JDBC (¡Paso Clave!):** Copia el archivo `postgresql-42.7.13.jar` que descargaste en el paso 1 y muévelo **EXACTAMENTE** a esta ruta dentro de tu Payara: `payara7/glassfish/domains/domain1/lib`
3. **Añadir Payara a NetBeans:**
   * En NetBeans, ve al panel lateral izquierdo a la pestaña **Services** (Servicios).
   * Despliega la opción **Servers**, da clic derecho y selecciona **Add Server**.
   * Elige **Payara Server** en la lista.
   * Selecciona la ruta donde guardaste tu carpeta `payara7`.
   * Da clic en Siguiente > Siguiente hasta crear el `domain1` y finaliza.

---

## 3. Base de Datos PostgreSQL
Asegúrate de tener PgAdmin o DBeaver a la mano.
1. Crea una nueva base de datos llamada obligatoriamente: `nexo_db`
2. (*Opcional pero recomendado*): Crea un usuario llamado `usuario_nexo` con contraseña `admin123` y dale permisos sobre esa base de datos.

**Nota:** La tabla más importante es crear la BD (`nexo_db`). Las credenciales de usuario y contraseña pueden ser a tu gusto (por ejemplo, usar tu usuario `postgres` por defecto), pero si usas credenciales distintas, **debes modificar el código** como se explica en el siguiente paso.

---

## 4. Pool de Conexiones (DatabaseConfig)
No tienes que entrar a configurar bases de datos en el servidor manualmente. El proyecto usa `@DataSourceDefinition` para automatizar la creación del Pool.

Si decidiste usar un usuario/contraseña diferente en tu PostgreSQL local, ve al archivo: `src/main/java/com/grupo4/backend_api/config/DatabaseConfig.java`

Y modifica los campos `user` y `password` para que coincidan con los tuyos:

```java
package com.grupo4.backend_api.config;

import jakarta.annotation.sql.DataSourceDefinition;
import jakarta.enterprise.context.ApplicationScoped;

@DataSourceDefinition(
    name = "java:global/jdbc/NexoDS",          // Nombre JNDI estandarizado globalmente
    className = "org.postgresql.ds.PGSimpleDataSource",
    user = "usuario_nexo",                     // ⚠️ Cambia esto por tu usuario local
    password = "admin123",                     // ⚠️ Cambia esto por tu contraseña local
    databaseName = "nexo_db",                  // Tu BD (Esta déjala igual)
    serverName = "localhost",
    portNumber = 5432,
    minPoolSize = 2,
    maxPoolSize = 20
)
@ApplicationScoped
public class DatabaseConfig {
    // Esta clase puede estar vacía. 
    // Su único propósito es alojar la anotación para que el servidor la lea al arrancar.
}
