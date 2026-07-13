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
import com.grupo4.backend_api.core.eventos.FacturaCreadaEventDTO;
import com.grupo4.backend_api.core.eventos.FacturaDetalleEventDTO;
import com.grupo4.backend_api.facturacion.mensajeria.FacturaEventPublisher;
import com.grupo4.backend_api.facturacion.modelo.FacturaCabecera;
import com.grupo4.backend_api.facturacion.modelo.FacturaDetalle;
import com.grupo4.backend_api.facturacion.negocio.NegocioFactura;

import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.Response.Status;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.List;

@Path("/facturas")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class FacturaResource {

    @Inject private NegocioFactura negocioFactura;
    @Inject private FacturaEventPublisher eventPublisher;

    private static final SimpleDateFormat ISO = new SimpleDateFormat("yyyy-MM-dd");

    @GET
    @Path("/{id}")
    public Response buscar(@PathParam("id") Integer id) {
        FacturaCabecera f = negocioFactura.buscar(id);
        if (f == null) {
            throw new ApiException(Status.NOT_FOUND, "Factura no encontrada con ID: " + id);
        }
        return Response.ok(new ApiResponse<>(200, "Factura encontrada", f)).build();
    }

    @GET
    public Response listarTodos() {
        List<FacturaCabecera> lista = negocioFactura.listarTodos();
        return Response.ok(new ApiResponse<>(200, "Listado de facturas", lista)).build();
    }

    @POST
    public Response crear(FacturaCabecera factura) {
        if (factura.getIdFactura() == null) {
            factura.setIdFactura(negocioFactura.obtenerSiguienteId());
        }
        if (factura.getDetalles() != null) {
            for (FacturaDetalle det : factura.getDetalles()) {
                // Validación de stock ANTES de persistir — síncrona, no pasa por cola
                negocioFactura.validarStockDisponible(
                        java.math.BigDecimal.valueOf(det.getIdArticulo()), det.getCantidad());
            }
        }

        int resultado = negocioFactura.insertar(factura);
        if (resultado != 1) {
            throw new ApiException(Status.INTERNAL_SERVER_ERROR, "Error al registrar la factura.");
        }

        // --- Productor: se dispara solo tras commit exitoso ---
        List<FacturaDetalleEventDTO> detallesEvento = new ArrayList<>();
        if (factura.getDetalles() != null) {
            for (FacturaDetalle det : factura.getDetalles()) {
                detallesEvento.add(new FacturaDetalleEventDTO(
                        det.getIdArticulo(), det.getCantidad(), det.getPrecio()));
            }
        }
        FacturaCreadaEventDTO evento = new FacturaCreadaEventDTO(
                factura.getIdFactura(), factura.getNumeroFactura(),
                ISO.format(factura.getFecha()), detallesEvento);
        eventPublisher.publicarFacturaCreada(evento);

        return Response.status(Status.CREATED)
                .entity(new ApiResponse<>(201, "Factura creada; egreso de inventario en proceso vía cola", factura))
                .build();
    }

    @DELETE
    @Path("/{id}")
    public Response eliminar(@PathParam("id") Integer id) {
        int resultado = negocioFactura.eliminar(id);
        if (resultado != 1) {
            throw new ApiException(Status.INTERNAL_SERVER_ERROR, "Error al eliminar la factura.");
        }
        return Response.ok(new ApiResponse<>(200, "Factura eliminada exitosamente")).build();
    }
}