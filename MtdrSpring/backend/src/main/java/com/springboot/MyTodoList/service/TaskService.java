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
            
            // Mapeamos los nuevos campos de tu tabla
            task.setTitle(td.getTitle());
            task.setDescription(td.getDescription());
            task.setStatus(td.getStatus());
            task.setPriority(td.getPriority());
            task.setCategory(td.getCategory());
            task.setDueDate(td.getDueDate());
            task.setTeamId(td.getTeamId());
            task.setUserId(td.getUserId());
            task.setIsDeleted(td.getIsDeleted());
            task.setRealHours(td.getRealHours());
            task.setHoursEstimate(td.getHoursEstimate());
            task.setSprint(td.getSprint());
            
            // No actualizamos createdAt manualmente, la base de datos lo maneja
            // El campo updatedAt se actualiza solo gracias a tu trigger trg_tasks_updated_at
            
            return taskRepository.save(task);
        } else {
            return null;
        }
    }
}