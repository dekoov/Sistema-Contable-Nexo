package com.grupo4.backend_api.cobranzas.resource;

import com.grupo4.backend_api.core.ApiException;
import com.grupo4.backend_api.core.ApiResponse;
import com.grupo4.backend_api.cobranzas.modelo.FormaPago;
import com.grupo4.backend_api.cobranzas.negocio.NegocioFormaPago;

import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.inject.Inject;
import jakarta.ws.rs.core.Response.Status;
import java.util.List;

@Path("/formas-pago")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class FormaPagoResource {

    @Inject
    private NegocioFormaPago negocioFormaPago;

    @GET
    public Response listarTodos() {
        List<FormaPago> formasPago = negocioFormaPago.listarTodos();
        if (formasPago == null) {
            throw new ApiException(Status.INTERNAL_SERVER_ERROR, "Error al recuperar la lista de formas de pago.");
        }
        ApiResponse<List<FormaPago>> response = new ApiResponse<>(200, "Lista de formas de pago obtenida", formasPago);
        return Response.ok(response).build();
    }

    @GET
    @Path("/{codigo}")
    public Response buscarPorCodigo(@PathParam("codigo") Integer codigo) {
        FormaPago formaPago = negocioFormaPago.buscar(codigo);
        
        if (formaPago == null) {
            throw new ApiException(Status.NOT_FOUND, "Forma de pago no encontrada con código: " + codigo);
        }
        
        ApiResponse<FormaPago> response = new ApiResponse<>(200, "Forma de pago encontrada", formaPago);
        return Response.ok(response).build();
    }

    @POST
    public Response crear(FormaPago nuevaFormaPago) {
        if (nuevaFormaPago == null) {
            throw new ApiException(Status.BAD_REQUEST, "Los datos de la forma de pago son obligatorios.");
        }
        
        boolean resultado = negocioFormaPago.insertar(nuevaFormaPago);
        if (!resultado) {
            throw new ApiException(Status.INTERNAL_SERVER_ERROR, "Error interno al intentar guardar la forma de pago.");
        }
        
        ApiResponse<FormaPago> response = new ApiResponse<>(201, "Forma de pago creada exitosamente", nuevaFormaPago);
        return Response.status(Status.CREATED).entity(response).build();
    }

    @PUT
    @Path("/{codigo}")
    public Response actualizar(@PathParam("codigo") Integer codigo, FormaPago formaPagoActualizar) {
        if (formaPagoActualizar == null) {
            throw new ApiException(Status.BAD_REQUEST, "El cuerpo de la petición no puede estar vacío.");
        }
        
        // Sincronizar Código del Path con el payload
        formaPagoActualizar.setCodigo(codigo);
        
        int resultado = negocioFormaPago.modificar(formaPagoActualizar);
        if (resultado == -1) {
            throw new ApiException(Status.INTERNAL_SERVER_ERROR, "Error interno al intentar modificar la forma de pago.");
        }
        
        ApiResponse<FormaPago> response = new ApiResponse<>(200, "Forma de pago modificada exitosamente", formaPagoActualizar);
        return Response.ok(response).build();
    }

    @DELETE
    @Path("/{codigo}")
    public Response eliminar(@PathParam("codigo") Integer codigo) {
        int resultado = negocioFormaPago.eliminar(codigo);
        if (resultado == -1) {
            throw new ApiException(Status.INTERNAL_SERVER_ERROR, "Error interno al intentar eliminar la forma de pago.");
        }
        
        ApiResponse<Void> response = new ApiResponse<>(200, "Forma de pago eliminada exitosamente");
        return Response.ok(response).build();
    }
}
