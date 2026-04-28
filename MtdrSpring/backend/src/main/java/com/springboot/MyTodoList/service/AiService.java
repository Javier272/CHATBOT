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

    public String analyzeData(String systemPrompt, String userContent) {
        RestTemplate restTemplate = new RestTemplate();
        
        //Configuracion de los headers, incluyendo la clave de API 
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("x-goog-api-key", apiKey);


        // el cuerpo de la petición siguiendo el formato que Gemini espera
        Map<String, Object> requestBody = new HashMap<>();
        
        List<Map<String, Object>> contents = new ArrayList<>();
        Map<String, Object> contentItem = new HashMap<>();
        List<Map<String, Object>> parts = new ArrayList<>();
        Map<String, Object> textPart = new HashMap<>();
        
        // Se une el prompt para enviar el mensaje y los datos a analizar
        String finalPrompt = "INSTRUCCIÓN:\n" + systemPrompt + "\n\nDATOS A ANALIZAR:\n" + userContent;
        
        textPart.put("text", finalPrompt);
        parts.add(textPart);
        contentItem.put("parts", parts);
        contents.add(contentItem);
        
        requestBody.put("contents", contents);

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);

        try {
            // Se envia la petición 
            ResponseEntity<Map> response = restTemplate.postForEntity(apiUrl, request, Map.class);
            Map<String, Object> responseBody = response.getBody();
            
            // 4. Navegamos por la respuesta de Gemini para extraer solo el texto útil
            // Ruta del JSON: candidates[0].content.parts[0].text
            List<Map<String, Object>> candidates = (List<Map<String, Object>>) responseBody.get("candidates");
            Map<String, Object> content = (Map<String, Object>) candidates.get(0).get("content");
            List<Map<String, Object>> responseParts = (List<Map<String, Object>>) content.get("parts");
            
            return (String) responseParts.get(0).get("text");
            
        } catch (Exception e) {
            return "Lo siento, hubo un error de conexión con Gemini: " + e.getMessage();
        }
    }
}