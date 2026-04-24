package com.springboot.MyTodoList.security;

import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.interfaces.DecodedJWT;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;

@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    //llave para verificar que el token sea válido
    private static final String SECRET_KEY = "Equipo_Dinamita-123";

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        //Se extrae el texto que viene en la cabecera "Authorization"
        String authHeader = request.getHeader("Authorization");

        //Checa que la cabecera no esté vacía y que empiece con "Bearer "
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7); // Cortamos la palabra "Bearer "
            try {
                //Revisa que el token sea válido y no haya expirado usando la misma llave secreta que se usó para crearlo
                Algorithm algorithm = Algorithm.HMAC256(SECRET_KEY);
                DecodedJWT decodedJWT = JWT.require(algorithm).build().verify(token);
                
                //Se extrae el correo del usuario que viene guardado dentro del token
                String email = decodedJWT.getSubject();

                //Si el token es válido, se crea un objeto de autenticación
                //  con el correo del usuario y se guarda en el contexto de seguridad de Spring
                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(email, null, Collections.emptyList());
                SecurityContextHolder.getContext().setAuthentication(authentication);

            } catch (Exception e) {
                // Si el token es falso o ya expiró, no hacemos nada y Spring le bloqueará el paso
                System.out.println("Token inválido o expirado: " + e.getMessage());
            }
        }

        // 5. Continúa con el flujo normal de la aplicación
        filterChain.doFilter(request, response);
    }
}