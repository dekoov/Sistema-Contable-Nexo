package com.grupo4.backend_api.usuarios.api;

import com.grupo4.backend_api.usuarios.dto.OAuthLoginRequest;
import com.grupo4.backend_api.usuarios.modelo.Usuario;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.UriInfo;
import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

@Path("/auth")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@ApplicationScoped
public class AuthResource {

    @PersistenceContext(unitName = "SistemaContablePU")
    private EntityManager em;

    @Context
    private UriInfo uriInfo;

    // IMPORTANTE: Mínimo 32 caracteres para cumplir con la firma HMAC-SHA256 de JWT
    private static final String SECRET_KEY = "esta_es_una_llave_secreta_super_larga_para_jwt_grupo_4";

    @POST
    @Path("/login")
    @Transactional
    public Response login(OAuthLoginRequest request) {
        String email;
        String name;

        // --- BACKDOOR DE DESARROLLO PARA POSTMAN ---
        if ("test-admin".equals(request.getIdToken())) {
            email = "admin@nexo.com";
            name = "Administrador Espe";
        } else if ("test-user".equals(request.getIdToken())) {
            email = "empleado@nexo.com";
            name = "Empleado Espe";
        } else {
            // Lógica de Producción Real con Google (Descomentar cuando conectes React)
            /*
            try {
                com.google.api-client.googleapis.auth.oauth2.GoogleIdTokenVerifier verifier = 
                    new com.google.api-client.googleapis.auth.oauth2.GoogleIdTokenVerifier.Builder(
                        new com.google.api-client.http.javanet.NetHttpTransport(), 
                        new com.google.api-client.json.gson.GsonFactory())
                    .setAudience(java.util.Collections.singletonList("986512262930-6jel70e2pjhqjq9e5so19gd7s9s5gfnu.apps.googleusercontent.com"))
                    .build();
                com.google.api-client.googleapis.auth.oauth2.GoogleIdToken idToken = verifier.verify(request.getIdToken());
                if (idToken != null) {
                    com.google.api-client.googleapis.auth.oauth2.GoogleIdToken.Payload payload = idToken.getPayload();
                    email = payload.getEmail();
                    name = (String) payload.get("name");
                } else {
                    return Response.status(Response.Status.UNAUTHORIZED).entity("{\"error\":\"Token de Google Inválido\"}").build();
                }
            } catch (Exception e) {
                return Response.status(Response.Status.INTERNAL_SERVER_ERROR).entity("{\"error\":\"Error de autenticación\"}").build();
            }
            */
            return Response.status(Response.Status.UNAUTHORIZED)
                    .entity("{\"error\":\"Para pruebas en Postman usa 'test-admin' o 'test-user'\"}").build();
        }

        Usuario usuario = em.createQuery("SELECT u FROM Usuario u WHERE u.email = :email", Usuario.class)
                .setParameter("email", email)
                .getResultStream()
                .findFirst()
                .orElse(null);

        if (usuario == null) {
            usuario = new Usuario();
            usuario.setEmail(email);
            usuario.setNombre(name);
            usuario.setRol(email.contains("admin") ? "ADMIN" : "USER");
            em.persist(usuario);
        }

        Key key = Keys.hmacShaKeyFor(SECRET_KEY.getBytes(StandardCharsets.UTF_8));
        long tiempoExpiracion = 86400000;

        String jwt = Jwts.builder()
                .subject(usuario.getEmail())
                .claim("rol", usuario.getRol())
                .claim("nombre", usuario.getNombre())
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + tiempoExpiracion))
                .signWith(key)
                .compact();

        // Responder datos al cliente + REQUERIMIENTO DE BALANCEO (Instancia y Puerto Dinámicos)
        Map<String, Object> responseData = new HashMap<>();
        responseData.put("token", jwt);
        responseData.put("email", usuario.getEmail());
        responseData.put("rol", usuario.getRol());
        
        // Obtiene automáticamente el puerto por el que entró la petición HTTP
        int puertoActivo = uriInfo.getBaseUri().getPort();
        responseData.put("instancia", "Instancia-Payara-" + puertoActivo);
        responseData.put("puerto", puertoActivo == -1 ? 80 : puertoActivo);

        return Response.ok(responseData).build();
    }
}
