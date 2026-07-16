# Backend — Sistema Contable (Nexo)
API REST en **Jakarta EE 11 / JAX-RS** desplegada sobre **Payara Server**, con persistencia en **PostgreSQL** (clúster de alta disponibilidad con Patroni) y mensajería asíncrona vía **JMS**. Expone los servicios de Facturación, Inventario, Cuentas por Cobrar (CxC), Integración y Usuarios que consume el frontend React (`frontend_app`).

> Este documento cubre **cómo levantar el proyecto y su arquitectura general**. El detalle de cada endpoint, DTO y clase se documentará en un archivo aparte de referencia de API.

## 0. Obtener el Proyecto
1. Haz un **Fork** de este repositorio hacia tu cuenta personal de GitHub.
2. Clona el proyecto en tu máquina local: `git clone <url-de-tu-fork>`
3. Abre el proyecto en **NetBeans** (File > Open Project).

---

## 1. Puesta en marcha con Docker Compose (recomendado)

Esta es la forma soportada y más rápida de tener **todo el sistema funcional**: clúster de base de datos + clúster de aplicación detrás de un balanceador.

### 1.1 Prerrequisitos

- Descargar [Docker Desktop](https://desktop.docker.com/win/main/amd64/Docker%20Desktop%20Installer.exe)
- Descargar [Maven 3.9+](https://dlcdn.apache.org/maven/maven-3/3.9.16/binaries/apache-maven-3.9.16-bin.zip) y [JDK 21](https://download.oracle.com/java/21/archive/jdk-21.0.10_windows-x64_bin.exe) instalados **solo para compilar el `.war`** (el runtime corre 100% en contenedores).
- Puertos libres en el host: `5432` (Postgres vía HAProxy), `2379` (etcd), `8008`-`8010` (API REST de Patroni), `9090` (aplicación vía Nginx).

Una vez se haya descargado Maven se debera extraer el archivo y moverlo a su carpeta de Usuario en Windows, para usarlo en la terminal deberemos actualizar las variables de entorno
```powershell
[System.Environment]::SetEnvironmentVariable("Path", [System.Environment]::GetEnvironmentVariable("Path","User") + ";C:\Users\tu-usuario\apache-maven-3.9.16\bin", "User")
```

### 1.2 Topología que se va a levantar

```
                        ┌───────────────────────────────---┐
                        │   docker-compose-db.yml          │
                        │   (proyecto: nexo-db-cluster)    │
                        │                                  │
                        │   etcd  ← coordinación Patroni   │
                        │   psql1 / psql2 / psql3 (Spilo)  |
                        │   haproxy :5432 → nodo primario  │
                        └───────────────┬─────────────────-┘
                                        │ red: nexo-db-cluster_patroni-net
                        ┌───────────────┴─────────────────--┐
                        │   docker-compose-rest.yml         │
                        │   (proyecto: nexo-app-cluster)    │
                        │                                   │
                        │   payara-nodo1 / nodo2 / nodo3    │
                        │   (cada uno con backend_api.war)  │
                        │   nginx :9090 → balancea 3 nodos  │
                        └───────────────────────────────────┘
```

Los tres nodos Payara **no** publican puertos al host directamente: solo se accede a través de Nginx (`:9090`), que hace _round-robin/least_conn_ entre ellos. La base de datos escala igual: la app siempre se conecta a `haproxy:5432`, que enruta al nodo Postgres que Patroni tenga como primario en ese momento.

### 1.3 Pasos

**a) Compilar el WAR del backend**

```bash
cd backend_api
mvn clean package -DskipTests
```

Esto genera `target/backend_api-1.0-SNAPSHOT.war`.

**b) Copiar el WAR al contexto de build de Payara**

El `Dockerfile` de `docker/payara` espera un archivo llamado exactamente `backend_api.war` en su mismo directorio:

```bash
cp target/backend_api-1.0-SNAPSHOT.war ../docker/payara/backend_api.war
cd ../docker
```

**c) Levantar el clúster de base de datos**

```bash
docker compose -f docker-compose-db.yml up -d
```

Espera unos segundos a que Patroni elija un primario. Puedes verificarlo con los puertos del 8008 hasta el 8010:

```bash
curl http://localhost:8008/primary   # debe responder 200 en el nodo primario
```

**d) Crear la base de datos `nexo_db`**

El clúster Spilo/Patroni arranca con la base `postgres` por defecto; la base de la aplicación **no se crea sola**, hay que crearla una vez contra el HAProxy (que siempre apunta al primario):

> Para crear la BD sin problemas deberas haber verificado que nodo esta como primary y ver cual es el nombre del respectivo nodo `postgres?` estos van del 1 al 3

```bash
docker exec -it postgres? psql -h haproxy -U postgres -c "CREATE DATABASE nexo_db;"
```

(usuario/clave por defecto del clúster: `postgres` / `postgres`, definidos en `docker-compose-db.yml`).

**e) Levantar el clúster de aplicación**

```bash
docker compose -f docker-compose-rest.yml up -d --build
```

Esto construye la imagen de Payara con el `.war` embebido y levanta los 3 nodos + Nginx, conectándose a la red externa creada en el paso (c).

**f) Verificar que quedó funcional**

- App disponible en: **http://localhost:9090**
- Salud de Nginx: `curl http://localhost:9090/nginx-health` → `ok`
- Al desplegar, el backend siembra automáticamente un usuario administrador (`DbInitializer`): **usuario `admin` / contraseña `admin`, rol `ADMIN`** — úsalo para el primer login desde el frontend (endpoint `/api/auth/login-password`).
- El esquema de base de datos se crea automáticamente al arrancar (EclipseLink/Hibernate con `ddl-generation`/`schema-generation` en modo _drop-and-create_ sobre `persistence.xml`), no requiere migraciones manuales.

### 1.4 Apagar / reiniciar

```bash
docker compose -f docker-compose-rest.yml down      # baja la app (conserva la BD)
docker compose -f docker-compose-db.yml down         # baja la BD (con -v también borra los volúmenes/datos)
```

> Si vuelves a construir el `.war` (por modificaciones en el código), repite los pasos (a), (b) y luego `docker compose -f docker-compose-rest.yml up -d --build` para reconstruir la imagen de Payara con el WAR actualizado.

### 1.5 Problemas comunes

|Síntoma|Causa probable|
|---|---|
|`docker compose -f docker-compose-rest.yml up` falla con error de red externa no encontrada|El clúster de BD (paso c) no está levantado todavía, o se bajó con `docker compose down` sin volver a subirlo.|
|La app responde 500 al primer request|La base `nexo_db` no fue creada (paso d) — sin ella, la app no logra crear el esquema.|
|No se puede loguear con `admin`/`admin`|El WAR desplegado es una versión anterior sin `DbInitializer`, o la base ya tenía datos previos con otro esquema — revisar logs de `docker logs payara-nodo1`.|

### 1.6 Alternativa: entorno local sin Docker (desarrollo con NetBeans)

Existe una guía separada mas abajito orientada a instalar JDK 21, Payara 7 y PostgreSQL manualmente en la máquina de desarrollo y desplegar desde NetBeans, para quienes prefieren depurar paso a paso fuera de contenedores. Docker Compose (sección 1) sigue siendo la vía recomendada para tener el sistema completo funcionando rápido y de forma reproducible.

---

## 3. Stack técnico y dependencias principales (`pom.xml`)

|Categoría|Tecnología|
|---|---|
|Plataforma|Jakarta EE 11 (API `jakarta.jakartaee-api` 10.0.0), Java 17|
|Servidor de aplicaciones|Payara Server 7 (imagen `payara/server-full:7.2026.5-jdk25`)|
|Persistencia|JPA vía **EclipseLink** (proveedor configurado en `persistence.xml`) + **Hibernate Core** 6.4.4 como dependencia adicional|
|Base de datos|PostgreSQL (driver `postgresql` 42.7.13)|
|Autenticación|JWT propio con **JJWT** 0.12.5 (`jjwt-api`/`jjwt-impl`/`jjwt-jackson`) + **Google API Client** 2.4.0 (validación de login con Google)|
|JSON|**Yasson** 3.0.4 (implementación de JSON-B usada por JAX-RS)|
|Mensajería|JMS (recursos definidos por anotación, sin dependencia externa — usa la implementación embebida de Payara)|
|Empaquetado|Maven, `maven-war-plugin` → genera `backend_api.war`|

---

## 4. Estructura general del proyecto

```
backend_api/
├── src/main/java/com/grupo4/backend_api/
│   ├── cobranzas/       # Cuentas por cobrar: cobradores, formas de pago, pagos, reportes CxC
│   ├── config/          # Configuración transversal: datasource, JWT, JMS, manejo global de errores
│   ├── core/             # Utilidades y contratos comunes (respuestas API, excepciones, eventos de dominio)
│   ├── facturacion/      # Clientes, ciudades, facturas y sus reportes
│   ├── integracion/      # Cola de integración factura → inventario (mensajería JMS)
│   ├── inventario/       # Artículos, comprobantes, tipos de movimiento y reportes de stock
│   ├── usuarios/         # Autenticación, gestión de usuarios y seed del admin por defecto
│   └── JakartaRestConfiguration.java   # Activación del endpoint base de JAX-RS
├── src/main/resources/META-INF/persistence.xml   # Unidad de persistencia JPA
├── src/main/webapp/WEB-INF/                       # web.xml, payara-web.xml, beans.xml
└── pom.xml
```

Cada módulo de negocio (`cobranzas`, `facturacion`, `inventario`, `integracion`, `usuarios`) sigue el mismo patrón de capas internas:

- **`modelo/`** — entidades JPA.
- **`dto/`** — objetos de transferencia usados en las respuestas/reportes (para no exponer las entidades JPA directamente).
- **`negocio/`** — lógica de negocio (`Negocio*`), llamada desde los recursos.
- **`resource/`** o **`api/`** — endpoints JAX-RS (`@Path`) del módulo.

Los recursos protegidos usan la anotación `@Secured`, interceptada por `JwtAuthFilter` (en `config/`), que valida el JWT recibido en el header `Authorization` antes de dejar pasar la petición al recurso.

---

## 5. Integración entre módulos: Facturación → Inventario (JMS)

Al crear una factura, `facturacion` publica un evento (`FacturaCreadaEventDTO`) en una cola JMS definida en `JmsResourcesConfig` (`config/`). El módulo `inventario` tiene un listener (`EgresoPorVentaListener`) que consume esos mensajes para generar automáticamente el egreso de stock correspondiente, y el módulo `integracion` expone endpoints para inspeccionar el estado de esa cola (mensajes pendientes/historial), consumidos por la pantalla "Integración / Cola JMS" del frontend. Esto desacopla la facturación del descuento de inventario: si el consumidor JMS falla o se reinicia, los mensajes quedan en cola en vez de perderse.

---

## 6. Configuración relevante

| Aspecto           | Dónde                                                                                                                  | Detalle                                                                                                                                                                                                                    |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Datasource JPA    | `config/DatabaseConfig.java` (`@DataSourceDefinition`)                                                                 | JNDI `java:global/jdbc/NexoDS`, apunta a `haproxy:5432` / BD `nexo_db`. Se crea automáticamente al desplegar el `.war`, sin configurarlo a mano en la consola de Payara.                                                   |
| Esquema de BD     | `persistence.xml`                                                                                                      | `schema-generation.database.action=drop-and-create` — el esquema se recrea en cada arranque a partir de las entidades JPA (apto para desarrollo/demo, no para producción con datos persistentes que se quieran conservar). |
| JWT               | `config/JwtAuthFilter.java` + `config/Secured.java`                                                                    | Filtro `@Provider` con `@Priority(AUTHENTICATION)` que exige header `Authorization: Bearer <token>` en todo recurso anotado con `@Secured`.                                                                                |
| Mensajería        | `config/JmsResourcesConfig.java`                                                                                       | Define la connection factory y la cola de forma declarativa (anotaciones), sin necesidad de configurarlas manualmente en Payara.                                                                                           |
| Manejo de errores | `config/GlobalExceptionMapper.java`, `core/ApiExceptionMapper.java`, `core/ApiException.java`, `core/ApiResponse.java` | Formato de respuesta de error uniforme para toda la API.                                                                                                                                                                   |
| Contexto raíz     | `webapp/WEB-INF/payara-web.xml`                                                                                        | `<context-root>/</context-root>` — la API queda montada en la raíz del servidor (por eso el frontend usa `/api` como prefijo lógico, resuelto por el proxy Nginx/Vite hacia el backend).                                   |

---

## 7. Frontend relacionado

El cliente de esta API es el proyecto `frontend_app` (React + Vite) del mismo repositorio. Para desarrollo local del frontend contra este backend dockerizado, apuntar `BACKEND_TARGET`/`VITE_API_URL` del `.env` del frontend a `http://localhost:9090` (la URL de Nginx del clúster de aplicación levantado en la sección 1), no directamente a un nodo Payara individual.

---

# 8. Puesta en marcha entorno local sin Docker

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
