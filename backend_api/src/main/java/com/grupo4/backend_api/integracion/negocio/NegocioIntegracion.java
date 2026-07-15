/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.grupo4.backend_api.integracion.negocio;

/**
 *
 * @author dcobe
 */
import com.grupo4.backend_api.integracion.modelo.MensajeIntegracion;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.transaction.Transactional;
import java.time.LocalDateTime;
import java.util.List;

@ApplicationScoped
public class NegocioIntegracion {

    @PersistenceContext(unitName = "SistemaContablePU")
    private EntityManager em;

    @Transactional
    public void registrarPublicacion(String idMensaje, String tipoEvento, String origen, String destino, String payloadJson) {
        MensajeIntegracion m = new MensajeIntegracion();
        m.setIdMensaje(idMensaje);
        m.setTipoEvento(tipoEvento);
        m.setOrigen(origen);
        m.setDestino(destino);
        m.setEstado("PENDIENTE");
        m.setFechaPublicacion(LocalDateTime.now());
        m.setIntentos(0);
        m.setPayload(payloadJson);
        em.persist(m);
    }

    public List<MensajeIntegracion> listarPendientes() {
        return em.createQuery(
                "SELECT m FROM MensajeIntegracion m WHERE m.estado = 'PENDIENTE' ORDER BY m.fechaPublicacion",
                MensajeIntegracion.class).getResultList();
    }

    public List<MensajeIntegracion> listarHistorial() {
        return em.createQuery(
                "SELECT m FROM MensajeIntegracion m WHERE m.estado = 'PROCESADO' ORDER BY m.fechaProcesamiento DESC",
                MensajeIntegracion.class).getResultList();
    }

    public MensajeIntegracion buscarPorId(String idMensaje) {
        return em.find(MensajeIntegracion.class, idMensaje);
    }

    public MensajeIntegracion buscarPendiente(String idMensaje) {
        MensajeIntegracion m = em.find(MensajeIntegracion.class, idMensaje);
        if (m == null || !"PENDIENTE".equals(m.getEstado())) return null;
        return m;
    }

    @Transactional
    public void marcarProcesado(String idMensaje, String numeroComprobante) {
        MensajeIntegracion m = em.find(MensajeIntegracion.class, idMensaje);
        if (m != null) {
            m.setEstado("PROCESADO");
            m.setFechaProcesamiento(LocalDateTime.now());
            m.setIntentos(m.getIntentos() + 1);
            m.setNumeroComprobanteGenerado(numeroComprobante);
            em.merge(m);
        }
    }
}