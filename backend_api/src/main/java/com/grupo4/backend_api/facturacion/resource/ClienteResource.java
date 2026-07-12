/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.grupo4.backend_api.facturacion.resource;

/**
 *
 * @author dcobe
 */
import com.grupo4.backend_api.core.ApiException;
import com.grupo4.backend_api.core.ApiResponse;
import com.grupo4.backend_api.facturacion.modelo.Cliente;
import com.grupo4.backend_api.facturacion.negocio.NegocioCliente;

import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.inject.Inject;
import jakarta.ws.rs.core.Response.Status;
import java.util.List;

@Path("/clientes")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class ClienteResource {

    @Inject
    private NegocioCliente negocioCliente;

    @GET
    public Response listarTodos() {
        List<Cliente> clientes = negocioCliente.listarTodos();
        if (clientes == null) {
            throw new ApiException(Status.INTERNAL_SERVER_ERROR, "Error al recuperar la lista de clientes.");
        }
        ApiResponse<List<Cliente>> response = new ApiResponse<>(200, "Lista de clientes obtenida", clientes);
        return Response.ok(response).build();
    }

    @GET
    @Path("/{id}")
    public Response buscarPorId(@PathParam("id") Integer id) {
        Cliente cliente = negocioCliente.buscar(id);
        
        if (cliente == null) {
            throw new ApiException(Status.NOT_FOUND, "Cliente no encontrado con ID: " + id);
        }
        
        ApiResponse<Cliente> response = new ApiResponse<>(200, "Cliente encontrado", cliente);
        return Response.ok(response).build();
    }

    @GET
    @Path("/buscar")
    public Response buscarPorCampo(@QueryParam("valor") String valor) {
        if (valor == null || valor.trim().isEmpty()) {
            throw new ApiException(Status.BAD_REQUEST, "El parámetro 'valor' es requerido para la búsqueda.");
        }
        
        List<Cliente> clientes = negocioCliente.buscarPorCampo(valor);
        
        // Corrección: Validar si la lista viene nula o vacía
        if (clientes == null || clientes.isEmpty()) {
            throw new ApiException(Status.NOT_FOUND, "No se encontraron clientes que coincidan con: " + valor);
        }
        
        ApiResponse<List<Cliente>> response = new ApiResponse<>(200, "Resultados de búsqueda", clientes);
        return Response.ok(response).build();
    }

    @POST
    public Response crear(Cliente nuevoCliente) {
        if (nuevoCliente == null || nuevoCliente.getCedula() == null || nuevoCliente.getCedula().trim().isEmpty()) {
            throw new ApiException(Status.BAD_REQUEST, "La cédula del cliente es obligatoria.");
        }
        
        // Manejo manual de ID si es requerido por el modelo legacy o asignación directa
        if (nuevoCliente.getIdCliente() == null) {
            nuevoCliente.setIdCliente(negocioCliente.obtenerSiguienteId());
        }
        
        int resultado = negocioCliente.insertar(nuevoCliente);
        if (resultado == -1) {
            throw new ApiException(Status.INTERNAL_SERVER_ERROR, "Error interno al intentar guardar el cliente.");
        }
        
        ApiResponse<Cliente> response = new ApiResponse<>(201, "Cliente creado exitosamente", nuevoCliente);
        return Response.status(Status.CREATED).entity(response).build();
    }

    @PUT
    @Path("/{id}")
    public Response actualizar(@PathParam("id") Integer id, Cliente clienteActualizar) {
        if (clienteActualizar == null) {
            throw new ApiException(Status.BAD_REQUEST, "El cuerpo de la petición no puede estar vacío.");
        }
        
        // Sincronizar ID del Path con el payload
        clienteActualizar.setIdCliente(id);
        
        int resultado = negocioCliente.modificar(clienteActualizar);
        if (resultado == 0) {
            throw new ApiException(Status.NOT_FOUND, "No se puede modificar. Cliente no encontrado con ID: " + id);
        } else if (resultado == -1) {
            throw new ApiException(Status.INTERNAL_SERVER_ERROR, "Error interno al intentar modificar el cliente.");
        }
        
        ApiResponse<Cliente> response = new ApiResponse<>(200, "Cliente modificado exitosamente", clienteActualizar);
        return Response.ok(response).build();
    }

    @DELETE
    @Path("/{id}")
    public Response eliminar(@PathParam("id") Integer id) {
        int resultado = negocioCliente.eliminar(id);
        if (resultado == 0) {
            throw new ApiException(Status.NOT_FOUND, "No se puede eliminar. Cliente no encontrado con ID: " + id);
        } else if (resultado == -1) {
            throw new ApiException(Status.INTERNAL_SERVER_ERROR, "Error interno al intentar eliminar el cliente.");
        }
        
        ApiResponse<Void> response = new ApiResponse<>(200, "Cliente eliminado exitosamente");
        return Response.ok(response).build();
    }
}