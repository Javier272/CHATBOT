package com.springboot.MyTodoList.controller;

import com.springboot.MyTodoList.model.Task;
import com.springboot.MyTodoList.model.User;
import com.springboot.MyTodoList.repository.TaskRepository;
import com.springboot.MyTodoList.repository.UserRepository;
import com.springboot.MyTodoList.service.TaskService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/tasks") 
public class TaskController {
    
    @Autowired
    private TaskService taskService;

    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private UserRepository userRepository;

    public record TaskResponse(
            Long id, 
            String title, 
            String description, 
            String status, 
            Integer priority,
            java.time.LocalDate dueDate,
            Integer hoursEstimate,
            Integer realHours,
            Integer sprint,
            String userName
    ) {}

    private TaskResponse convertToDTO(Task task) {
        String userName = "Usuario Desconocido";
        
        if (task.getUserId() != null) { 
            userName = userRepository.findById(task.getUserId())
                    .map(User::getName) 
                    .orElse("Usuario Desconocido");
        }
        
        return new TaskResponse(
                task.getId(),
                task.getTitle(),
                task.getDescription(),
                task.getStatus(),
                task.getPriority(),
                task.getDueDate(),
                task.getHoursEstimate(),
                task.getRealHours(),
                task.getSprint(),
                userName
        );
    }

    // ==========================================
    // CONSULTAS 'GET' (Perfectas)
    // ==========================================

    @GetMapping
    public List<TaskResponse> getAllActiveTasks() {
        return taskRepository.findByIsDeletedOrderByCreatedAtDesc(0)
                .stream()
                .map(this::convertToDTO)
                .toList();
    }

    @GetMapping("/pending")
    public List<TaskResponse> getPendingTasks() {
        return taskRepository.findByStatusAndIsDeletedOrderByCreatedAtDesc("pending", 0)
                .stream()
                .map(this::convertToDTO)
                .toList();
    }

    @GetMapping("/completed")
    public List<TaskResponse> getCompletedTasks() {
        return taskRepository.findByStatusAndIsDeletedOrderByCreatedAtDesc("completed", 0)
                .stream()
                .map(this::convertToDTO)
                .toList();
    }

    @GetMapping("/{id}")
    public ResponseEntity<TaskResponse> getTaskById(@PathVariable Long id) {
        return taskRepository.findByIdAndIsDeleted(id, 0)
                .map(this::convertToDTO)
                .map(dto -> ResponseEntity.ok().body(dto))
                .orElse(new ResponseEntity<>(HttpStatus.NOT_FOUND));
    }


    // ==========================================
    // ENDPOINTS DE MUTACIÓN (Mejorados con el DTO)
    // ==========================================

    @PostMapping
    public ResponseEntity<TaskResponse> addTask(@RequestBody Task task) throws Exception {
        Task newTask = taskService.addTask(task);
        HttpHeaders responseHeaders = new HttpHeaders();
        responseHeaders.set("location", "" + newTask.getId());
        responseHeaders.set("Access-Control-Expose-Headers", "location");

        // 2. DEVOLVEMOS LA TAREA YA CONVERTIDA AL MOLDE (Con nombre)
        return ResponseEntity.ok().headers(responseHeaders).body(convertToDTO(newTask));
    }

    @PutMapping("/{id}")
    public ResponseEntity<TaskResponse> updateTask(@RequestBody Task task, @PathVariable Long id) {
        try {
            Task updatedTask = taskService.updateTask(id, task);
            // 3. DEVOLVEMOS LA TAREA ACTUALIZADA YA CONVERTIDA AL MOLDE
            return new ResponseEntity<>(convertToDTO(updatedTask), HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(null, HttpStatus.NOT_FOUND);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Boolean> deleteTask(@PathVariable("id") Long id) {
        return taskRepository.findById(id).map(task -> {
            task.setIsDeleted(1); 
            taskRepository.save(task); 
            return new ResponseEntity<>(true, HttpStatus.OK);
        }).orElse(new ResponseEntity<>(false, HttpStatus.NOT_FOUND));
    }
}