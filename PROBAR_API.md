# Guía de Pruebas de API con CURL

Esta guía contiene los comandos `curl` necesarios para probar todos los endpoints implementados en el backend. 

**Nota:** Se asume que el servidor corre en `http://localhost:8080/api`. Ajusta la URL si es necesario.

## 1. Autenticación y Seguridad

Antes de probar los endpoints protegidos, debes obtener un JWT.

### Login (Backdoor de Desarrollo)
Usa este comando para obtener el token de administrador.
```bash
curl -X POST http://localhost:8080/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"idToken": "test-admin"}'
```
*Copia el valor de `"token"` de la respuesta y úsalo en los siguientes comandos reemplazando `{TOKEN}`.*

---

## 2. Configuración y Sistema

### Ping Jakarta EE
```bash
curl -X GET http://localhost:8080/api/jakartaee11
```

---

## 3. Módulo Cobranzas

### Cobradores
- **Listar todos:**
  ```bash
  curl -X GET http://localhost:8080/api/cobradores \
       -H "Authorization: Bearer {TOKEN}"
  ```
- **Buscar por ID (Ejemplo ID: 1):**
  ```bash
  curl -X GET http://localhost:8080/api/cobradores/1 \
       -H "Authorization: Bearer {TOKEN}"
  ```
- **Crear nuevo:**
  ```bash
  curl -X POST http://localhost:8080/api/cobradores \
       
       -H "Content-Type: application/json" \
       -d '{"idCobrador": 1, "cedula": "1712345678", "nombre": "Juan Perez", "direccion": "Quito Norte"}'
  ```

### Formas de Pago
- **Listar todas:**
  ```bash
  curl -X GET http://localhost:8080/api/formas-pago \
       -H "Authorization: Bearer {TOKEN}"
  ```
- **Crear nueva:**
  ```bash
  curl -X POST http://localhost:8080/api/formas-pago \
       
       -H "Content-Type: application/json" \
       -d '{"codigo": 1, "nombre": "Efectivo"}'
  ```

---

## 4. Módulo Facturación

### Ciudades
- **Listar/Buscar por nombre:**
  ```bash
  curl -X GET "http://localhost:8080/api/ciudades?nombre=Quito" \
       -H "Authorization: Bearer {TOKEN}"
  ```
- **Crear:**
  ```bash
  curl -X POST http://localhost:8080/api/ciudades \
       
       -H "Content-Type: application/json" \
       -d '{"idCiudad": 1, "nombre": "Quito"}'
  ```

### Clientes
- **Listar todos:**
  ```bash
  curl -X GET http://localhost:8080/api/clientes \
       -H "Authorization: Bearer {TOKEN}"
  ```
- **Buscar por valor (cédula/nombre):**
  ```bash
  curl -X GET "http://localhost:8080/api/clientes/buscar?valor=17123" \
       -H "Authorization: Bearer {TOKEN}"
  ```

### Facturas (Cabecera-Detalle)
- **Listar todas:**
  ```bash
  curl -X GET http://localhost:8080/api/facturas \
       -H "Authorization: Bearer {TOKEN}"
  ```
- **Crear Factura (Dispara evento JMS):**
  ```bash
  curl -X POST http://localhost:8080/api/facturas \
       
       -H "Content-Type: application/json" \
       -d '{
         "idFactura": 100,
         "numeroFactura": "F-000100",
         "fecha": "2026-07-12",
         "cliente": {"idCliente": 1},
         "ciudad": {"idCiudad": 1},
         "valorTotal": 150.00,
         "detalles": [
           {"idArticulo": 1, "cantidad": 2, "precio": 75.00}
         ]
       }'
  ```

---

## 5. Módulo Inventario

### Artículos
- **Listar todos:**
  ```bash
  curl -X GET http://localhost:8080/api/articulos \
       -H "Authorization: Bearer {TOKEN}"
  ```
- **Crear artículo:**
  ```bash
  curl -X POST http://localhost:8080/api/articulos \
       
       -H "Content-Type: application/json" \
       -d '{"idArticulo": 1, "nombre": "Laptop Pro", "precio": 1200.00}'
  ```

### Tipos de Movimiento
- **Listar todos:**
  ```bash
  curl -X GET http://localhost:8080/api/tipos-movimiento \
       -H "Authorization: Bearer {TOKEN}"
  ```

### Comprobantes
- **Registrar Transacción (Ingreso/Egreso):**
  ```bash
  curl -X POST http://localhost:8080/api/comprobantes \
       
       -H "Content-Type: application/json" \
       -d '{
         "cabecera": {
           "idComprobante": 50,
           "numeroComprobante": "MOV-50",
           "fecha": "2026-07-12",
           "idTipoMovimiento": {"idTipoMovimiento": 1}
         },
         "detalles": [
           {"idArticulo": {"idArticulo": 1}, "cantidad": 10, "precio": 1200.00}
         ]
       }'
  ```
