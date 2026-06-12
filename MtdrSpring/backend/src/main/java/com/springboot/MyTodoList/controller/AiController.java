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


    //analisis y feedback del equipo por sprint
    @GetMapping("/stats/sprint/{sprintNumber}")
    public ResponseEntity<String> getSprintStatsAnalysis(@PathVariable Integer sprintNumber) {
        // Trae todas las tareas que pertenezcan al Sprint solicitado y que no estén borradas
        List<Task> sprintTasks = taskRepository.findByIsDeletedOrderByCreatedAtDesc(0).stream()
                .filter(t -> sprintNumber.equals(t.getSprint()))
                .toList();

        if (sprintTasks.isEmpty()) {
            return ResponseEntity.ok("No se encontraron tareas registradas para el Sprint " + sprintNumber);
        }

        // Métricas grupales acumuladas de todo el equipo en el Sprint
        long completed = sprintTasks.stream().filter(t -> "completed".equals(t.getStatus())).count();
        long pending = sprintTasks.stream().filter(t -> "pending".equals(t.getStatus())).count();
        int totalEstimated = sprintTasks.stream().mapToInt(t -> t.getHoursEstimate() != null ? t.getHoursEstimate() : 0).sum();
        int totalReal = sprintTasks.stream().mapToInt(t -> t.getRealHours() != null ? t.getRealHours() : 0).sum();

        // Estructura de las metricas agrupadas 
        String sprintData = String.format(
            "Métricas Globales del Sprint %d:\n" +
            "- Tareas finalizadas con éxito: %d\n" +
            "- Tareas remanentes/pendientes: %d\n" +
            "- Carga de horas planeadas/estimadas: %d hrs\n" +
            "- Tiempo real invertido por el equipo: %d hrs",
            sprintNumber, completed, pending, totalEstimated, totalReal
        );

        // Prompt
        String systemPrompt = "Eres un Agile Coach experto participando en una Sprint Retrospective. " +
                              "Analiza el rendimiento general del equipo de desarrollo a partir de los datos que te proveo. " +
                              "Genera un análisis constructivo y motivador de máximo 2 párrafos. " +
                              "Evalúa de forma crítica si el equipo sobreestimó o subestimó el esfuerzo (comparando horas estimadas vs reales), " +
                              "y proporciona un consejo valioso enfocado en mejorar la planeación para el siguiente Sprint.";

        return ResponseEntity.ok(aiService.analyzeData(systemPrompt, sprintData));
    }



    //analisis general de todo el proyecto
    @GetMapping("/stats/sprints/summary")
    public ResponseEntity<String> getAllSprintsSummaryAnalysis() {
        //obtiene todas las tareas activas
        List<Task> allTasks = taskRepository.findByIsDeletedOrderByCreatedAtDesc(0);

        if (allTasks.isEmpty()) {
            return ResponseEntity.ok("No se encontraron tareas registradas en la base de datos.");
        }

        //Agrupa las tareas por número de Sprint
        java.util.Map<Integer, List<Task>> tasksBySprint = allTasks.stream()
                .filter(t -> t.getSprint() != null)
                .collect(java.util.stream.Collectors.groupingBy(Task::getSprint));

        if (tasksBySprint.isEmpty()) {
            return ResponseEntity.ok("No hay tareas asociadas a ningún Sprint válido todavía.");
        }

        StringBuilder historyData = new StringBuilder("Historial Evolutivo por Sprints:\n");
        
        // Se ordenan los sprints y extrae las metricas
        tasksBySprint.keySet().stream().sorted().forEach(sprintNum -> {
            List<Task> sprintTasks = tasksBySprint.get(sprintNum);
            
            long completed = sprintTasks.stream().filter(t -> "completed".equals(t.getStatus())).count();
            long pending = sprintTasks.stream().filter(t -> "pending".equals(t.getStatus())).count();
            int estimated = sprintTasks.stream().mapToInt(t -> t.getHoursEstimate() != null ? t.getHoursEstimate() : 0).sum();
            int real = sprintTasks.stream().mapToInt(t -> t.getRealHours() != null ? t.getRealHours() : 0).sum();

            historyData.append(String.format(
                "- Sprint %d -> Completadas: %d | Pendientes: %d | Horas Planeadas: %d hrs | Horas Reales: %d hrs.\n",
                sprintNum, completed, pending, estimated, real
            ));
        });

        //prompt
        String systemPrompt = "Eres un consultor Senior de Metodologías Ágiles y Agile Coach de la dirección. " +
                              "Analiza el histórico de rendimiento del equipo a lo largo de los sprints entregados. " +
                              "Identifica patrones clave: ¿El equipo está mejorando su velocidad? ¿La brecha entre horas planeadas y reales se está reduciendo o aumentando? " +
                              "Entrega una conclusión ejecutiva de máximo 3 párrafos con viñetas claras que sirva como balance de cierre del proyecto, " +
                              "destacando los logros del equipo y los puntos críticos a corregir en futuros desarrollos.";

        return ResponseEntity.ok(aiService.analyzeData(systemPrompt, historyData.toString()));
    }



    //sugerencia de prioridades por usuario
    @GetMapping("/prioritize/user/{userId}")
    public ResponseEntity<String> getTaskPrioritization(@PathVariable Long userId) {
        // obtiene SOLO las tareas pendientes
        List<Task> pendingTasks = taskRepository.findByStatusAndIsDeletedOrderByCreatedAtDesc("pending", 0).stream()
                .filter(t -> userId.equals(t.getUserId()))
                .toList();

        if (pendingTasks.isEmpty()) {
            return ResponseEntity.ok("No tienes tareas pendientes. ¡Excelente trabajo!");
        }

        // construye resumen de tareas para enviar a Gemini
        StringBuilder tasksText = new StringBuilder("Mis tareas pendientes son:\n");
        for (Task t : pendingTasks) {
            tasksText.append(String.format("- Tarea: %s | Prioridad: %s | Descripción: %s | Estimación: %d hrs.\n",
                    t.getTitle(), t.getPriority(), t.getDescription(), t.getHoursEstimate() != null ? t.getHoursEstimate() : 0));
        }

        String systemPrompt = "Eres un Project Manager estratégico. En base a la lista de tareas pendientes que te envie toma en cuenta la prioridad 1 menor prioridad 5 mayor, la descripción y el tiempo estimado, dime exactamente qué tarea debería hacer primero, cuál después, y por qué. Dame un plan de acción en viñetas rápido de leer.";

        return ResponseEntity.ok(aiService.analyzeData(systemPrompt, tasksText.toString()));
    }
}