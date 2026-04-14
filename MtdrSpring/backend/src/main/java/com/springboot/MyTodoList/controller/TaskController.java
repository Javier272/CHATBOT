package com.springboot.MyTodoList.controller;

import com.springboot.MyTodoList.model.Task;
import com.springboot.MyTodoList.service.TaskService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
public class TaskController {
    
    @Autowired
    private TaskService taskService;

    // Mantenemos la ruta /todolist para no romper tu frontend en React por ahora
    @GetMapping(value = "/todolist")
    public List<Task> getAllTasks(){
        return taskService.findAll();
    }

    @GetMapping(value = "/todolist/{id}")
    public ResponseEntity<Task> getTaskById(@PathVariable Long id){
        try{
            ResponseEntity<Task> responseEntity = taskService.getItemById(id);
            return new ResponseEntity<>(responseEntity.getBody(), HttpStatus.OK);
        }catch (Exception e){
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }

    @PostMapping(value = "/todolist")
    public ResponseEntity<Task> addTask(@RequestBody Task task) throws Exception{
        Task newTask = taskService.addTask(task);
        HttpHeaders responseHeaders = new HttpHeaders();
        responseHeaders.set("location","" + newTask.getId());
        responseHeaders.set("Access-Control-Expose-Headers","location");

        return ResponseEntity.ok().headers(responseHeaders).build();
    }

    @PutMapping(value = "todolist/{id}")
    public ResponseEntity<Task> updateTask(@RequestBody Task task, @PathVariable Long id){
        try{
            Task updatedTask = taskService.updateTask(id, task);
            return new ResponseEntity<>(updatedTask, HttpStatus.OK);
        }catch (Exception e){
            return new ResponseEntity<>(null, HttpStatus.NOT_FOUND);
        }
    }

    @DeleteMapping(value = "todolist/{id}")
    public ResponseEntity<Boolean> deleteTask(@PathVariable("id") Long id){
        Boolean flag = false;
        try{
            flag = taskService.deleteTask(id);
            return new ResponseEntity<>(flag, HttpStatus.OK);
        }catch (Exception e){
            return new ResponseEntity<>(flag, HttpStatus.NOT_FOUND);
        }
    }
}