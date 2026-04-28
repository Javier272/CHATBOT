package com.springboot.MyTodoList.controller;

import com.springboot.MyTodoList.model.Task;
import com.springboot.MyTodoList.repository.TaskRepository;
import com.springboot.MyTodoList.service.AiService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/ai")
public class AiController {

    @Autowired
    private AiService aiService;

    @Autowired
    private TaskRepository taskRepository;

    // ==========================================
    // 1. RUTA: ESTADÍSTICAS E INTERPRETACIÓN
    // ==========================================
    @GetMapping("/stats/user/{userId}")
    public ResponseEntity<String> getUserStatsAnalysis(@PathVariable Long userId) {
        // Traemos todas las tareas de este usuario
        List<Task> tasks = taskRepository.findByIsDeletedOrderByCreatedAtDesc(0).stream()
                .filter(t -> userId.equals(t.getUserId()))
                .toList();

        // Matemáticas rápidas para el reporte
        long completed = tasks.stream().filter(t -> "completed".equals(t.getStatus())).count();
        long pending = tasks.stream().filter(t -> "pending".equals(t.getStatus())).count();
        int totalEstimated = tasks.stream().mapToInt(t -> t.getHoursEstimate() != null ? t.getHoursEstimate() : 0).sum();
        int totalReal = tasks.stream().mapToInt(t -> t.getRealHours() != null ? t.getRealHours() : 0).sum();

        // El texto que le pasaremos a la IA
        String statsData = String.format(
            "Tareas completadas: %d. Tareas pendientes: %d. Horas estimadas totales: %d. Horas reales totales: %d.",
            completed, pending, totalEstimated, totalReal
        );

        String systemPrompt = "Eres un Agile Coach experto. Analiza estos datos de productividad del desarrollador. Dame una interpretación motivadora, identifica si está tardando más de lo estimado, y dale un consejo constructivo en máximo 2 párrafos.";

        return ResponseEntity.ok(aiService.analyzeData(systemPrompt, statsData));
    }


    // ==========================================
    // 2. RUTA: SUGERENCIA DE PRIORIDADES (PLAN DE ACCIÓN)
    // ==========================================
    @GetMapping("/prioritize/user/{userId}")
    public ResponseEntity<String> getTaskPrioritization(@PathVariable Long userId) {
        // Traemos SOLO las tareas pendientes
        List<Task> pendingTasks = taskRepository.findByStatusAndIsDeletedOrderByCreatedAtDesc("pending", 0).stream()
                .filter(t -> userId.equals(t.getUserId()))
                .toList();

        if (pendingTasks.isEmpty()) {
            return ResponseEntity.ok("No tienes tareas pendientes. ¡Excelente trabajo!");
        }

        // Armamos un resumen de las tareas para la IA
        StringBuilder tasksText = new StringBuilder("Mis tareas pendientes son:\n");
        for (Task t : pendingTasks) {
            tasksText.append(String.format("- Tarea: %s | Prioridad: %s | Descripción: %s | Estimación: %d hrs.\n",
                    t.getTitle(), t.getPriority(), t.getDescription(), t.getHoursEstimate() != null ? t.getHoursEstimate() : 0));
        }

        String systemPrompt = "Eres un Project Manager estratégico. En base a la lista de tareas pendientes que te envie toma en cuenta la prioridad, la descripción y el tiempo estimado, dime exactamente qué tarea debería hacer primero, cuál después, y por qué. Dame un plan de acción en viñetas rápido de leer.";

        return ResponseEntity.ok(aiService.analyzeData(systemPrompt, tasksText.toString()));
    }
}