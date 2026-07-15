/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.grupo4.backend_api.integracion.resource;

/**
 *
 * @author dcobe
 */
import com.grupo4.backend_api.core.ApiException;
import com.grupo4.backend_api.core.ApiResponse;
import com.grupo4.backend_api.core.eventos.FacturaCreadaEventDTO;
import com.grupo4.backend_api.integracion.dto.MensajeIntegracionDTO;
import com.grupo4.backend_api.integracion.modelo.MensajeIntegracion;
import com.grupo4.backend_api.integracion.negocio.NegocioIntegracion;
import com.grupo4.backend_api.inventario.negocio.NegocioComprobante;
import jakarta.annotation.Resource;
import jakarta.enterprise.context.RequestScoped;
import jakarta.inject.Inject;
import jakarta.jms.*;
import jakarta.json.bind.Jsonb;
import jakarta.json.bind.JsonbBuilder;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.Response.Status;
import java.util.List;
import java.util.stream.Collectors;

@Path("/integracion")
@Produces(MediaType.APPLICATION_JSON)
@RequestScoped
public class IntegracionResource {

    @Inject private NegocioIntegracion negocioIntegracion;
    @Inject private NegocioComprobante negocioComprobante;

    @Inject
    @JMSConnectionFactory("java:app/jms/facturaConnectionFactory")
    private JMSContext jmsContext;

    @Resource(lookup = "java:app/jms/facturaCreadaQueue")
    private Queue facturaCreadaQueue;

    @GET
    @Path("/cola")
    public Response listarCola() {
        List<MensajeIntegracionDTO> lista = negocioIntegracion.listarPendientes()
                .stream().map(this::toDTO).collect(Collectors.toList());
        return Response.ok(new ApiResponse<>(200, "Cola obtenida exitosamente", lista)).build();
    }

    @GET
    @Path("/historial")
    public Response listarHistorial() {
        List<MensajeIntegracionDTO> lista = negocioIntegracion.listarHistorial()
                .stream().map(this::toDTO).collect(Collectors.toList());
        return Response.ok(new ApiResponse<>(200, "Historial obtenido exitosamente", lista)).build();
    }

    @POST
    @Path("/cola/{idMensaje}/importar")
    public Response importar(@PathParam("idMensaje") String idMensaje) {
        MensajeIntegracion pendiente = negocioIntegracion.buscarPendiente(idMensaje);
        if (pendiente == null) {
            throw new ApiException(Status.NOT_FOUND, "El mensaje ya no se encuentra en la cola.");
        }

        String json;
        try (JMSConsumer consumer = jmsContext.createConsumer(facturaCreadaQueue, "idMensaje = '" + idMensaje + "'")) {
            Message msg = consumer.receive(5000);
            if (msg == null) {
                throw new ApiException(Status.CONFLICT, "El mensaje no se encontró en la cola física.");
            }
            json = ((TextMessage) msg).getText();
        } catch (JMSException e) {
            throw new ApiException(Status.INTERNAL_SERVER_ERROR, "Error al leer la cola JMS: " + e.getMessage());
        }

        Jsonb jsonb = JsonbBuilder.create();
        FacturaCreadaEventDTO evento = jsonb.fromJson(json, FacturaCreadaEventDTO.class);

        boolean exito = negocioComprobante.registrarEgresoDesdeEvento(evento);
        if (!exito) {
            throw new ApiException(Status.INTERNAL_SERVER_ERROR, "No se pudo generar el comprobante de egreso. Verifica que los artículos existan.");
        }

        String numeroComprobante = "VEN-" + evento.getIdFactura();
        negocioIntegracion.marcarProcesado(idMensaje, numeroComprobante);

        MensajeIntegracionDTO dto = toDTO(negocioIntegracion.buscarPorId(idMensaje));
        return Response.ok(new ApiResponse<>(200, "Transacción importada exitosamente", dto)).build();
    }

    private MensajeIntegracionDTO toDTO(MensajeIntegracion m) {
        MensajeIntegracionDTO dto = new MensajeIntegracionDTO();
        dto.setIdMensaje(m.getIdMensaje());
        dto.setTipoEvento(m.getTipoEvento());
        dto.setOrigen(m.getOrigen());
        dto.setDestino(m.getDestino());
        dto.setEstado(m.getEstado());
        dto.setFechaPublicacion(m.getFechaPublicacion() != null ? m.getFechaPublicacion().toString() : null);
        dto.setFechaProcesamiento(m.getFechaProcesamiento() != null ? m.getFechaProcesamiento().toString() : null);
        dto.setIntentos(m.getIntentos());
        dto.setPayload(m.getPayload());
        if (m.getNumeroComprobanteGenerado() != null) {
            dto.setComprobanteGenerado(new MensajeIntegracionDTO.ComprobanteGeneradoDTO(m.getNumeroComprobanteGenerado()));
        }
        return dto;
    }
}