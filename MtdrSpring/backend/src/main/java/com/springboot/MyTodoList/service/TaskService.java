package com.springboot.MyTodoList.service;

import com.springboot.MyTodoList.model.Task;
import com.springboot.MyTodoList.repository.TaskRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class TaskService {

    @Autowired
    private TaskRepository taskRepository;

    public List<Task> findAll(){
        // Opcional: Podrías filtrar aquí para que solo devuelva las que no están borradas
        // return taskRepository.findAll().stream().filter(t -> t.getIsDeleted() == 0).toList();
        return taskRepository.findAll();
    }

    // Nota: Cambiamos "int id" por "Long id" porque en Task.java definimos el ID como Long
    public ResponseEntity<Task> getItemById(Long id){
        Optional<Task> taskData = taskRepository.findById(id);
        if (taskData.isPresent()){
            return new ResponseEntity<>(taskData.get(), HttpStatus.OK);
        } else {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }

    public Task getTaskById(Long id){
        Optional<Task> taskData = taskRepository.findById(id);
        return taskData.orElse(null);
    }

    public Task addTask(Task task){
        return taskRepository.save(task);
    }

    public boolean deleteTask(Long id){
        try {
            // Implementación de Soft Delete (Borrado Lógico)
            Optional<Task> taskData = taskRepository.findById(id);
            if(taskData.isPresent()){
                Task task = taskData.get();
                task.setIsDeleted(1); // Marcamos como borrado en lugar de hacer un DELETE de SQL
                taskRepository.save(task); // Esto disparará tu Trigger trg_audit_tasks para registrar el borrado
                return true;
            }
            return false;
        } catch(Exception e){
            return false;
        }
    }

    public Task updateTask(Long id, Task td){
        Optional<Task> taskData = taskRepository.findById(id);
        if(taskData.isPresent()){
            Task task = taskData.get();
            
            // Preserve existing values when an older frontend DTO omits fields.
            if (td.getTitle() != null) task.setTitle(td.getTitle());
            if (td.getDescription() != null) task.setDescription(td.getDescription());
            if (td.getStatus() != null) task.setStatus(td.getStatus());
            if (td.getPriority() != null) task.setPriority(td.getPriority());
            if (td.getCategory() != null) task.setCategory(td.getCategory());
            if (td.getDueDate() != null) task.setDueDate(td.getDueDate());
            if (td.getTeamId() != null) task.setTeamId(td.getTeamId());
            if (td.getUserId() != null) task.setUserId(td.getUserId());
            if (td.getIsDeleted() != null) task.setIsDeleted(td.getIsDeleted());
            if (td.getRealHours() != null) task.setRealHours(td.getRealHours());
            if (td.getHoursEstimate() != null) task.setHoursEstimate(td.getHoursEstimate());
            if (td.getSprint() != null) task.setSprint(td.getSprint());
            
            // No actualizamos createdAt manualmente, la base de datos lo maneja
            // El campo updatedAt se actualiza solo gracias a tu trigger trg_tasks_updated_at
            
            return taskRepository.save(task);
        } else {
            return null;
        }
    }
}
