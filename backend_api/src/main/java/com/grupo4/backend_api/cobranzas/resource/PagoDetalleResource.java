/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.grupo4.backend_api.cobranzas.resource;

/**
 *
 * @author dcobe
 */
import com.grupo4.backend_api.core.ApiException;
import com.grupo4.backend_api.core.ApiResponse;
import com.grupo4.backend_api.cobranzas.modelo.PagoDetalle;
import com.grupo4.backend_api.cobranzas.negocio.NegocioPagoDetalle;
import jakarta.enterprise.context.RequestScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.Response.Status;
import java.util.List;

@Path("/pagos")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@RequestScoped
public class PagoDetalleResource {

    @Inject
    private NegocioPagoDetalle negocioPagoDetalle;

    @GET
    public Response listar(@QueryParam("idFactura") Integer idFactura) {
        List<PagoDetalle> lista = (idFactura != null)
                ? negocioPagoDetalle.listarPorFactura(idFactura)
                : negocioPagoDetalle.listarTodos(); // agregar este método al negocio
        if (lista == null) throw new ApiException(Status.INTERNAL_SERVER_ERROR, "Error interno al consultar pagos.");
        return Response.ok(new ApiResponse<>(200, "Pagos obtenidos exitosamente", lista)).build();
    }

    @POST
    public Response registrarPago(PagoDetalle pagoDetalle) {
        Integer idFactura = pagoDetalle.getFactura() != null ? pagoDetalle.getFactura().getIdFactura() : null;
        if (idFactura == null) throw new ApiException(Status.BAD_REQUEST, "idFactura es requerido en el payload.");
        int resultado = negocioPagoDetalle.insertar(idFactura, pagoDetalle);
        if (resultado == -1) throw new ApiException(Status.INTERNAL_SERVER_ERROR, "Error interno al registrar el pago.");
        return Response.status(Status.CREATED).entity(new ApiResponse<>(201, "Pago registrado exitosamente", pagoDetalle)).build();
    }

    @PUT
    @Path("/{idPagoDetalle}")
    public Response modificarPago(@PathParam("idPagoDetalle") Integer idPagoDetalle, PagoDetalle pagoDetalle) {
        pagoDetalle.setIdPagoDetalle(idPagoDetalle);
        int resultado = negocioPagoDetalle.modificar(pagoDetalle);
        if (resultado == 0) throw new ApiException(Status.NOT_FOUND, "Pago no encontrado con ID: " + idPagoDetalle);
        if (resultado == -1) throw new ApiException(Status.INTERNAL_SERVER_ERROR, "Error interno al actualizar el pago.");
        return Response.ok(new ApiResponse<>(200, "Pago actualizado exitosamente", pagoDetalle)).build();
    }

    @DELETE
    @Path("/{idPagoDetalle}")
    public Response eliminarPago(@PathParam("idPagoDetalle") Integer idPagoDetalle) {
        int resultado = negocioPagoDetalle.eliminar(idPagoDetalle);
        if (resultado == -1) throw new ApiException(Status.INTERNAL_SERVER_ERROR, "Error interno al eliminar el pago.");
        return Response.ok(new ApiResponse<>(200, "Pago eliminado exitosamente")).build();
    }
}