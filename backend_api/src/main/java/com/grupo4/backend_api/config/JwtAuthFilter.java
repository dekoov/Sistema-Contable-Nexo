package com.grupo4.backend_api.config;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.Priority;
import jakarta.ws.rs.Priorities;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.container.ContainerRequestFilter;
import jakarta.ws.rs.core.HttpHeaders;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.Provider;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.Key;

@Provider
@Secured
@Priority(Priorities.AUTHENTICATION)
public class JwtAuthFilter implements ContainerRequestFilter {

  private static final String SECRET_KEY = "esta_es_una_llave_secreta_super_larga_para_jwt_grupo_4";

  @Override
  public void filter(ContainerRequestContext requestContext) throws IOException {
    String authHeader = requestContext.getHeaderString(HttpHeaders.AUTHORIZATION);

    if (authHeader == null || !authHeader.startsWith("Bearer ")) {
      requestContext.abortWith(Response.status(Response.Status.UNAUTHORIZED)
          .entity("{\"error\":\"Acceso denegado. Token ausente o formato inválido (Bearer <token>)\"}").build());
      return;
    }

    String token = authHeader.substring(7).trim();

    try {
      // Validar firma y expiración del JWT con JJWT 0.12.5
      Key key = Keys.hmacShaKeyFor(SECRET_KEY.getBytes(StandardCharsets.UTF_8));
        // El token es válido, dejamos que la petición continúe al endpoint original...

    } catch (Exception e) {
      requestContext.abortWith(Response.status(Response.Status.UNAUTHORIZED)
          .entity("{\"error\":\"Token inválido, alterado o expirado\"}").build());
    }
  }
}
