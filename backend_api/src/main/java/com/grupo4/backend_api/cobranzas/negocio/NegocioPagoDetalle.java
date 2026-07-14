package com.grupo4.backend_api.cobranzas.negocio;

import com.grupo4.backend_api.cobranzas.modelo.Cobrador;
import com.grupo4.backend_api.cobranzas.modelo.FormaPago;
import com.grupo4.backend_api.cobranzas.modelo.PagoDetalle;
import com.grupo4.backend_api.core.ApiException;
import com.grupo4.backend_api.facturacion.modelo.FacturaCabecera;
import jakarta.enterprise.context.RequestScoped;
import jakarta.persistence.*;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.core.Response.Status;
import java.util.List;

@RequestScoped
public class NegocioPagoDetalle {

    @PersistenceContext(unitName = "SistemaContablePU")
    private EntityManager em;

    @Transactional
    public int insertar(Integer idFactura, PagoDetalle pagoDetalle) {
        try {
            FacturaCabecera factura = em.find(FacturaCabecera.class, idFactura);
            if (factura == null) throw new ApiException(Status.BAD_REQUEST, "Factura no existe: " + idFactura);
            pagoDetalle.setFactura(factura);

            Cobrador cobradorRef = em.find(Cobrador.class, pagoDetalle.getCobrador().getIdCobrador());
            if (cobradorRef == null) throw new ApiException(Status.BAD_REQUEST, "Cobrador no existe: " + pagoDetalle.getCobrador().getIdCobrador());
            pagoDetalle.setCobrador(cobradorRef);

            FormaPago formaPagoRef = em.find(FormaPago.class, pagoDetalle.getFormaPago().getCodigo());
            if (formaPagoRef == null) throw new ApiException(Status.BAD_REQUEST, "Forma de pago no existe: " + pagoDetalle.getFormaPago().getCodigo());
            pagoDetalle.setFormaPago(formaPagoRef);

            if (pagoDetalle.getIdPagoDetalle() == null) {
                pagoDetalle.setIdPagoDetalle(obtenerSiguienteId());
            }

            em.persist(pagoDetalle);
            return 1;
        } catch (ApiException e) {
            throw e;
        } catch (Exception e) {
            e.printStackTrace();
            return -1;
        }
    }

    @Transactional
    public int eliminar(Integer idPagoDetalle) {
        try {
            PagoDetalle pd = em.find(PagoDetalle.class, idPagoDetalle);
            if (pd != null) em.remove(pd);
            return 1;
        } catch (Exception e) {
            e.printStackTrace();
            return -1;
        }
    }

    @Transactional
    public int modificar(PagoDetalle pagoDetalle) {
        try {
            PagoDetalle pd = em.find(PagoDetalle.class, pagoDetalle.getIdPagoDetalle());
            if (pd == null) return 0;
            pd.setFechaPago(pagoDetalle.getFechaPago());
            pd.setValor(pagoDetalle.getValor());
            em.merge(pd);
            return 1;
        } catch (Exception e) {
            e.printStackTrace();
            return -1;
        }
    }

    public List<PagoDetalle> listarPorFactura(Integer idFactura) {
        return em.createQuery(
                "SELECT p FROM PagoDetalle p WHERE p.factura.idFactura = :idFactura ORDER BY p.fechaPago DESC",
                PagoDetalle.class)
                .setParameter("idFactura", idFactura)
                .getResultList();
    }

    public PagoDetalle buscar(Integer idPagoDetalle) {
        return em.find(PagoDetalle.class, idPagoDetalle);
    }
    
    public List<PagoDetalle> listarTodos() {
    return em.createQuery(
            "SELECT p FROM PagoDetalle p ORDER BY p.fechaPago DESC",
            PagoDetalle.class)
            .getResultList();
}

    public Integer obtenerSiguienteId() {
        Number max = (Number) em.createQuery(
                "SELECT COALESCE(MAX(p.idPagoDetalle), 0) FROM PagoDetalle p")
                .getSingleResult();
        return max.intValue() + 1;
    }
}