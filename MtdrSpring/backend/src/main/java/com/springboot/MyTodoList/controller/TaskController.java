package com.springboot.MyTodoList.controller;

import com.springboot.MyTodoList.model.Task;
import com.springboot.MyTodoList.repository.TaskRepository;
import com.springboot.MyTodoList.service.TaskService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/tasks") // Ruta default para pedir consultas
public class TaskController {
    
    @Autowired
    private TaskService taskService;

    @Autowired
    private TaskRepository taskRepository;

    @GetMapping
    public List<Task> getAllActiveTasks() {
        // Regresa todas las tareas menos las que estan marcadas como eliminadas
        return taskRepository.findByIsDeletedOrderByCreatedAtDesc(0);
    }

    @GetMapping("/pending")
    public List<Task> getPendingTasks() {
        //regresa todas las tareas con status pendiente y no eliminadas
        return taskRepository.findByStatusAndIsDeletedOrderByCreatedAtDesc("pending", 0);
    }

    @GetMapping("/completed")
    public List<Task> getCompletedTasks() {
        //regresa todas las tareas con status completed y no eliminadas
        return taskRepository.findByStatusAndIsDeletedOrderByCreatedAtDesc("completed", 0);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Task> getTaskById(@PathVariable Long id) {
        // busca tarea por id que recibe y regresa 404 si no la encuentra o si esta marcada como eliminada
        return taskRepository.findByIdAndIsDeleted(id, 0)
                .map(task -> ResponseEntity.ok().body(task))
                .orElse(new ResponseEntity<>(HttpStatus.NOT_FOUND));
    }



    @PostMapping
    public ResponseEntity<Task> addTask(@RequestBody Task task) throws Exception {
        //Crea una nueva tarea
        Task newTask = taskService.addTask(task);
        HttpHeaders responseHeaders = new HttpHeaders();
        responseHeaders.set("location", "" + newTask.getId());
        responseHeaders.set("Access-Control-Expose-Headers", "location");

        return ResponseEntity.ok().headers(responseHeaders).build();
    }

    

    @PutMapping("/{id}")
    public ResponseEntity<Task> updateTask(@RequestBody Task task, @PathVariable Long id) {
        //actualiza una tarea existente, regresa 404 si esta marcada como eliminada
        try {
            Task updatedTask = taskService.updateTask(id, task);
            return new ResponseEntity<>(updatedTask, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(null, HttpStatus.NOT_FOUND);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Boolean> deleteTask(@PathVariable("id") Long id) {
        // Marca tarea como eliminada, regresa 404 si no la encuentra o si ya esta marcada como eliminada
        return taskRepository.findById(id).map(task -> {
            task.setIsDeleted(1); // Marcamos como borrado
            taskRepository.save(task); // Guardamos el cambio
            return new ResponseEntity<>(true, HttpStatus.OK);
        }).orElse(new ResponseEntity<>(false, HttpStatus.NOT_FOUND));
    }
}