package com.springboot.MyTodoList.controller;

import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.springboot.MyTodoList.model.User;
import com.springboot.MyTodoList.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/users")
public class UserController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public record LoginRequest(String email, String password) {}
    
    // Regresa el token y algunos datos del usuario para guardarlos en React
    public record TokenResponse(String token, Long id, String name, String email) {}


    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@RequestBody User user) {
        Optional<User> existingUser = userRepository.findByEmailAndIsDeleted(user.getEmail(), 0);
        if (existingUser.isPresent()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("El email ya está registrado.");
        }

        String hashedPassword = passwordEncoder.encode(user.getPassword());
        user.setPassword(hashedPassword);
        userRepository.save(user);

        return ResponseEntity.ok("Usuario registrado con éxito");
    }


    @PostMapping("/login")
    public ResponseEntity<?> loginUser(@RequestBody LoginRequest loginRequest) {
        Optional<User> userOptional = userRepository.findByEmailAndIsDeleted(loginRequest.email(), 0);

        if (userOptional.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Credenciales incorrectas.");
        }

        User user = userOptional.get();
        boolean isPasswordMatch = passwordEncoder.matches(loginRequest.password(), user.getPassword());

        if (!isPasswordMatch) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Credenciales incorrectas.");
        }

        //si se logea se genera un token con el correo y el ID del usuario adentro,
        //  usando la misma llave secreta que el filtro para que luego el filtro pueda verificarlo
        Algorithm algorithm = Algorithm.HMAC256("Equipo_Dinamita-123");
        
        String token = JWT.create()
                .withSubject(user.getEmail()) // Guardamos el correo en el token
                .withClaim("userId", user.getId()) // Guardamos el ID
                //El token dura 2 horas
                .withExpiresAt(new java.util.Date(System.currentTimeMillis() + 1000 * 60 * 60 * 2)) 
                .sign(algorithm);

        // Se envia a react
        return ResponseEntity.ok(new TokenResponse(token, user.getId(), user.getName(), user.getEmail()));
    }
}