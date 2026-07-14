package com.grupo4.backend_api.usuarios.api;

import com.grupo4.backend_api.usuarios.dto.OAuthLoginRequest;
import com.grupo4.backend_api.usuarios.dto.LocalLoginRequest;
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

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import java.util.Collections;

@Path("/auth")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@ApplicationScoped
public class AuthResource {

    @PersistenceContext(unitName = "SistemaContablePU")
    private EntityManager em;

    @Context
    private UriInfo uriInfo;

    private static final String SECRET_KEY = "esta_es_una_llave_secreta_super_larga_para_jwt_grupo_4";
    private static final String GOOGLE_CLIENT_ID = "986512262930-6jel70e2pjhqjq9e5so19gd7s9s5gfnu.apps.googleusercontent.com";

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
            // Lógica de Producción Real con Google
            try {
                GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(
                        new NetHttpTransport(), 
                        new GsonFactory())
                    .setAudience(Collections.singletonList(GOOGLE_CLIENT_ID))
                    .build();
                
                GoogleIdToken idToken = verifier.verify(request.getIdToken());
                
                if (idToken != null) {
                    GoogleIdToken.Payload payload = idToken.getPayload();
                    email = payload.getEmail();
                    name = (String) payload.get("name");
                } else {
                    return Response.status(Response.Status.UNAUTHORIZED)
                            .entity("{\"error\":\"Token de Google Inválido o Expirado\"}").build();
                }
            } catch (Exception e) {
                return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                        .entity("{\"error\":\"Error de autenticación con Google: " + e.getMessage() + "\"}").build();
            }
        }

        // Búsqueda en PostgreSQL
        Usuario usuario = em.createQuery("SELECT u FROM Usuario u WHERE u.email = :email", Usuario.class)
                .setParameter("email", email)
                .getResultStream()
                .findFirst()
                .orElse(null);

        // Si no existe, se crea (Registro automático vía OAuth)
        if (usuario == null) {
            usuario = new Usuario();
            usuario.setEmail(email);
            usuario.setNombre(name);
            usuario.setRol(email.contains("admin") ? "ADMIN" : "USER");
            em.persist(usuario);
        }

        // Generación de JWT propio del sistema
        Key key = Keys.hmacShaKeyFor(SECRET_KEY.getBytes(StandardCharsets.UTF_8));
        long tiempoExpiracion = 86400000; // 24 horas

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
        String instanciaId = System.getenv("INSTANCE_ID");
        int puertoActivo = uriInfo.getBaseUri().getPort();

        responseData.put("instancia", instanciaId != null ? instanciaId : "Instancia-Payara-" + puertoActivo);
        responseData.put("puerto", puertoActivo == -1 ? 80 : puertoActivo);

        return Response.ok(responseData).build();
    }

    @POST
    @Path("/login-password")
    @Transactional
    public Response loginPassword(LocalLoginRequest request) {
        if (request == null || request.getEmail() == null || request.getPassword() == null) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity("{\"error\":\"Email y contraseña son requeridos\"}").build();
        }

        // Búsqueda en PostgreSQL por el email ingresado
        Usuario usuario = em.createQuery("SELECT u FROM Usuario u WHERE u.email = :email", Usuario.class)
                .setParameter("email", request.getEmail())
                .getResultStream()
                .findFirst()
                .orElse(null);

        // Validar si el usuario existe y si su contraseña coincide
        if (usuario == null || usuario.getPassword() == null || !usuario.getPassword().equals(request.getPassword())) {
            return Response.status(Response.Status.UNAUTHORIZED)
                    .entity("{\"error\":\"Usuario o contraseña incorrectos\"}").build();
        }

        // Generación de JWT propio del sistema con la clave compartida
        Key key = Keys.hmacShaKeyFor(SECRET_KEY.getBytes(StandardCharsets.UTF_8));
        long tiempoExpiracion = 86400000; // 24 horas

        String jwt = Jwts.builder()
                .subject(usuario.getEmail())
                .claim("rol", usuario.getRol())
                .claim("nombre", usuario.getNombre())
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + tiempoExpiracion))
                .signWith(key)
                .compact();

        // Responder datos estructurados + Datos dinámicos para HAProxy/Balanceo
        Map<String, Object> responseData = new HashMap<>();
        responseData.put("token", jwt);
        responseData.put("email", usuario.getEmail());
        responseData.put("rol", usuario.getRol());
        
        String instanciaId = System.getenv("INSTANCE_ID");
        int puertoActivo = uriInfo.getBaseUri().getPort();

        responseData.put("instancia", instanciaId != null ? instanciaId : "Instancia-Payara-" + puertoActivo);
        responseData.put("puerto", puertoActivo == -1 ? 80 : puertoActivo);

        return Response.ok(responseData).build();
    }
}
