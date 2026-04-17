package com.springboot.MyTodoList.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "users") // Actualizado al nombre de tu nueva tabla en minúsculas
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id; // Compatible con el user_id de Task.java

    @Column(nullable = false, length = 100)
    private String name;

    @Column(unique = true, length = 150)
    private String email; // ¡Nuevo campo!

    @Column(nullable = false, length = 500)
    private String password; // Ajustado a 500 caracteres según tu SQL

    @Column(name = "is_deleted")
    private Integer isDeleted = 0; // 0 activo, 1 borrado

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt; // Para manejar el TIMESTAMP de Oracle

    // Constructor vacío requerido por Spring/JPA
    public User() {
    }

    // --- GETTERS Y SETTERS ---

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public Integer getIsDeleted() { return isDeleted; }
    public void setIsDeleted(Integer isDeleted) { this.isDeleted = isDeleted; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}