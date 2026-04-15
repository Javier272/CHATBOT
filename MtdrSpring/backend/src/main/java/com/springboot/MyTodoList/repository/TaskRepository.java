package com.springboot.MyTodoList.repository;

import com.springboot.MyTodoList.model.Task;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TaskRepository extends JpaRepository<Task, Long> {
    
    // 1. Todas las tareas que NO estén eliminadas de la mas nueva a la mas antigua
    List<Task> findByIsDeletedOrderByCreatedAtDesc(Integer isDeleted);

    // 2 y 3. Tareas filtradas por estado pending o completed y que NO estén eliminadas
    List<Task> findByStatusAndIsDeletedOrderByCreatedAtDesc(String status, Integer isDeleted);

    // 4. Buscar una tarea por su ID, asegurándose de que NO esté eliminada
    Optional<Task> findByIdAndIsDeleted(Long id, Integer isDeleted);
    
}