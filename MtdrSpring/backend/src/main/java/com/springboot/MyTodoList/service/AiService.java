package com.springboot.MyTodoList.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Service
public class AiService {

    @Value("${gemini.api.url}")
    private String apiUrl;

    @Value("${gemini.api.key}")
    private String apiKey;

    @SuppressWarnings("unchecked")
    public String analyzeData(String systemPrompt, String userContent) {
        RestTemplate restTemplate = new RestTemplate();
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("x-goog-api-key", apiKey);

        Map<String, Object> requestBody = new HashMap<>();
        List<Map<String, Object>> contents = new ArrayList<>();
        Map<String, Object> contentItem = new HashMap<>();
        List<Map<String, Object>> parts = new ArrayList<>();
        Map<String, Object> textPart = new HashMap<>();
        
        String finalPrompt = "INSTRUCCIÓN:\n" + systemPrompt + "\n\nDATOS A ANALIZAR:\n" + userContent;
        
        textPart.put("text", finalPrompt);
        parts.add(textPart);
        contentItem.put("parts", parts);
        contents.add(contentItem);
        
        requestBody.put("contents", contents);

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(apiUrl, request, Map.class);
            Map<String, Object> responseBody = response.getBody();
            
            if (responseBody == null || !responseBody.containsKey("candidates")) {
                return "El motor de IA no devolvió candidatos válidos para el análisis de este Sprint.";
            }

            List<Map<String, Object>> candidates = (List<Map<String, Object>>) responseBody.get("candidates");
            if (candidates == null || candidates.isEmpty()) {
                return "La consulta de métricas no arrojó resultados analizables por la IA.";
            }

            Map<String, Object> content = (Map<String, Object>) candidates.get(0).get("content");
            if (content == null || !content.containsKey("parts")) {
                return "Estructura de respuesta de IA incompleta para este bloque de tareas.";
            }

            List<Map<String, Object>> responseParts = (List<Map<String, Object>>) content.get("parts");
            if (responseParts == null || responseParts.isEmpty()) {
                return "No se pudo extraer texto útil del análisis ágil del Sprint.";
            }
            
            return (String) responseParts.get(0).get("text");
            
        } catch (Exception e) {
            // Logueamos el error real en la consola de tu contenedor para que sepas qué pasó
            System.err.println("Error crítico de conexión en AiService: " + e.getMessage());
            return "Alineando prioridades de Scrum... Ocurrió un retraso en la API: " + e.getMessage();
        }
    }
}