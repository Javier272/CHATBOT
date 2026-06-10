package com.springboot.MyTodoList.util;

import com.springboot.MyTodoList.model.Task;
import com.springboot.MyTodoList.service.AiService;
import com.springboot.MyTodoList.service.TaskService;
import com.springboot.MyTodoList.service.UserService;
import java.util.Comparator;
import com.springboot.MyTodoList.model.User;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.telegram.telegrambots.meta.api.objects.replykeyboard.ReplyKeyboardMarkup;
import org.telegram.telegrambots.meta.api.objects.replykeyboard.buttons.KeyboardRow;
import org.telegram.telegrambots.meta.generics.TelegramClient;

public class BotActions {

    private static final Logger logger = LoggerFactory.getLogger(BotActions.class);

    // --- MEMORIA ESTÁTICA PARA LA MÁQUINA DE ESTADOS ---
    private static final Map<Long, TaskCreationState> userStates = new HashMap<>();
    private static final Map<Long, Task> tempTasks = new HashMap<>();

    public enum TaskCreationState {
        WAITING_FOR_TITLE,
        WAITING_FOR_DESCRIPTION,
        WAITING_FOR_ESTIMATED_HOURS,
        WAITING_FOR_DUE_DATE,
        WAITING_FOR_SPRINT,
        WAITING_FOR_PRIORITY,
        WAITING_FOR_ASSIGN_TO,
        WAITING_FOR_SPRINT_FILTER
    }

    private ReplyKeyboardMarkup getMainKeyboard() {
        return ReplyKeyboardMarkup.builder()
            .resizeKeyboard(true).oneTimeKeyboard(false)
            // Fila 1: Todo y Nueva
            .keyboardRow(new KeyboardRow(BotLabels.LIST_ALL_ITEMS.getLabel(), BotLabels.ADD_NEW_ITEM.getLabel()))
            // Fila 2: NUEVOS BOTONES DE FILTRO
            .keyboardRow(new KeyboardRow("⏳ Pendientes", "🏃 Por Sprint"))
            // Fila 3: Navegación
            .keyboardRow(new KeyboardRow(BotLabels.SHOW_MAIN_SCREEN.getLabel(), BotLabels.HIDE_MAIN_SCREEN.getLabel()))
            .build();
    }


    String requestText;
    long chatId;
    TelegramClient telegramClient;
    boolean exit;

    UserService userService;

    TaskService taskService;
    AiService aiService;

    public BotActions(TelegramClient tc, TaskService ts, AiService aisvc, UserService usvc) {
        telegramClient = tc;
        taskService = ts;
        aiService = aisvc;
        this.userService = usvc;
        exit = false;
    }

    public void setRequestText(String cmd){
        requestText = cmd;
    }

    public void setChatId(long chId){
        chatId = chId;
    }

    public void setTelegramClient(TelegramClient tc){
        telegramClient = tc;
    }

    public void setTaskService(TaskService tsvc){
        taskService = tsvc;
    }

    public TaskService getTaskService(){
        return taskService;
    }

    public void setAiService(AiService aisvc){
        aiService = aisvc;
    }

    public AiService getAiService(){
        return aiService;
    }

    // --- INTERCEPTOR DE ESTADOS INTERACTIVOS ---
    public void fnStateInterceptor() {
        if (exit) return;

        // Si el usuario ya está en medio del flujo de creación de tarea
        if (userStates.containsKey(chatId)) {
            handleTaskCreationFlow(chatId, requestText);
            exit = true; // Activa el freno para que no ejecute otros comandos normales
        }
    }

    private void handleTaskCreationFlow(long chatId, String messageText) {
        TaskCreationState state = userStates.get(chatId);
        Task task = tempTasks.get(chatId);

        try {
            switch (state) {
                case WAITING_FOR_TITLE:
                    task.setTitle(messageText);
                    userStates.put(chatId, TaskCreationState.WAITING_FOR_DESCRIPTION);
                    BotHelper.sendMessageToTelegram(chatId, "Título guardado.\n\nAhora, escribe la Descripción de la tarea:", telegramClient);
                    break;

                case WAITING_FOR_DESCRIPTION:
                    task.setDescription(messageText);
                    userStates.put(chatId, TaskCreationState.WAITING_FOR_ESTIMATED_HOURS);
                    BotHelper.sendMessageToTelegram(chatId, "Descripción guardada.\n\n¿Cuántas Horas estimadas tomará? Escribe solo numeros enteros:", telegramClient);
                    break;

                case WAITING_FOR_ESTIMATED_HOURS:
                    task.setHoursEstimate(Integer.parseInt(messageText));
                    userStates.put(chatId, TaskCreationState.WAITING_FOR_DUE_DATE);
                    BotHelper.sendMessageToTelegram(chatId, "Horas guardadas.\n\n¿Cuál es la fecha límite? Usa el formato exacto: YYYY-MM-DD:", telegramClient);
                    break;

                case WAITING_FOR_DUE_DATE:
                    task.setDueDate(LocalDate.parse(messageText));
                    userStates.put(chatId, TaskCreationState.WAITING_FOR_SPRINT);
                    BotHelper.sendMessageToTelegram(chatId, "Fecha guardada.\n\n¿A qué Sprint pertenece? Escribe solo numeros enteros:", telegramClient);
                    break;

                case WAITING_FOR_SPRINT:
                    task.setSprint(Integer.parseInt(messageText));
                    userStates.put(chatId, TaskCreationState.WAITING_FOR_PRIORITY);
                    BotHelper.sendMessageToTelegram(chatId, "Sprint guardado.\n\n¿Cuál es la Prioridad? Escribe un número entero, ej: 5 para Alta, 1 para Baja", telegramClient);
                    break;


                case WAITING_FOR_SPRINT_FILTER:
                    try {
                        int sprintNum = Integer.parseInt(messageText.trim());
                        
                        // Buscamos y ordenamos descendente
                        List<Task> sprintItems = taskService.findAll().stream()
                                .filter(item -> item.getSprint() != null && item.getSprint() == sprintNum && item.getIsDeleted() == 0)
                                .sorted(java.util.Comparator.comparing(Task::getId).reversed())
                                .collect(java.util.stream.Collectors.toList());

                        userStates.remove(chatId); // Limpiamos estado para que vuelva a la normalidad

                        if (sprintItems.isEmpty()) {
                            BotHelper.sendMessageToTelegram(chatId, "No hay tareas registradas para el Sprint " + sprintNum, telegramClient, getMainKeyboard());
                            break;
                        }

                        ReplyKeyboardMarkup keyboardMarkup = ReplyKeyboardMarkup.builder().resizeKeyboard(true).build();
                        List<KeyboardRow> keyboard = new java.util.ArrayList<>();
                        keyboard.add(new KeyboardRow(BotLabels.SHOW_MAIN_SCREEN.getLabel()));

                        for (Task item : sprintItems) {
                            KeyboardRow currentRow = new KeyboardRow();
                            currentRow.add(item.getTitle() + " (" + item.getStatus() + ")");
                            if("pending".equalsIgnoreCase(item.getStatus())){
                                currentRow.add(item.getId() + BotLabels.DASH.getLabel() + BotLabels.DONE.getLabel());
                            }
                            keyboard.add(currentRow);
                        }
                        
                        keyboardMarkup.setKeyboard(keyboard);
                        BotHelper.sendMessageToTelegram(chatId, "🎯 Tareas del Sprint " + sprintNum + ":", telegramClient, keyboardMarkup);

                    } catch (NumberFormatException e) {
                        BotHelper.sendMessageToTelegram(chatId, "⚠️ Por favor, ingresa un número entero válido para el Sprint:", telegramClient);
                    }
                    break;

                case WAITING_FOR_PRIORITY:
                    task.setPriority(Integer.parseInt(messageText)); 
                    userStates.put(chatId, TaskCreationState.WAITING_FOR_ASSIGN_TO);

                    // 1. OBTENEMOS LOS INTEGRANTES REALES DESDE LA BASE DE DATOS
                    List<User> dbUsers = userService.findAll(); // Ajusta si tu método se llama de otra forma en UserService
                    
                    // 2. CONSTRUIMOS EL TECLADO DINÁMICO
                    ReplyKeyboardMarkup.ReplyKeyboardMarkupBuilder keyboardBuilder = ReplyKeyboardMarkup.builder()
                        .resizeKeyboard(true)
                        .oneTimeKeyboard(true);

                    // Acomodaremos los usuarios en filas (una fila por cada usuario para que no se amontonen)
                    if (dbUsers != null && !dbUsers.isEmpty()) {
                        for (User u : dbUsers) {
                            // Creamos un botón que muestre "ID: [numero] - [Nombre]"
                            keyboardBuilder.keyboardRow(new KeyboardRow("ID: " + u.getId() + " - " + u.getName()));
                        }
                    } else {
                        // Resguardo en caso de que la tabla users esté completamente vacía
                        keyboardBuilder.keyboardRow(new KeyboardRow("Admin"));
                    }

                    BotHelper.sendMessageToTelegram(chatId, "Prioridad guardada.\n\nPor último, ¿A quién se asigna la tarea? Selecciona un integrante del equipo", telegramClient, keyboardBuilder.build());
                    break;

                case WAITING_FOR_ASSIGN_TO:
                    // El mensaje recibido tendrá el formato "ID: 2 - Diego"
                    Long assignedUserId = 1L; // Admin o ID por defecto si algo falla

                    try {
                        if (messageText.contains("ID:") && messageText.contains("-")) {
                            // Cortamos el texto para extraer el ID numérico puro entre "ID:" y el guion "-"
                            String idSection = messageText.split("-")[0].replace("ID:", "").trim();
                            assignedUserId = Long.parseLong(idSection);
                        } else {
                            // Si el usuario prefirió teclear directamente un nombre sin usar los botones
                            List<User> users = userService.findAll();
                            for (User u : users) {
                                if (u.getName().equalsIgnoreCase(messageText.trim())) {
                                    assignedUserId = u.getId();
                                    break;
                                }
                            }
                        }
                    } catch (Exception e) {
                        logger.error("Error al procesar el ID del usuario seleccionado, se asignará ID 1", e);
                    }

                    task.setUserId(assignedUserId); // Asignamos el ID numérico de la BD a user_id
                    task.setStatus("pending");      
                    task.setIsDeleted(0);           

                    // Guardamos la entidad final
                    taskService.addTask(task);

                    // Liberamos la memoria del chat   
                    userStates.remove(chatId);
                    tempTasks.remove(chatId);

                    // Vuelve a mostrar el menú principal
                    ReplyKeyboardMarkup mainScreenKeyboard = ReplyKeyboardMarkup.builder()
                        .resizeKeyboard(true)
                        .oneTimeKeyboard(false)
                        .keyboardRow(new KeyboardRow(BotLabels.LIST_ALL_ITEMS.getLabel(), BotLabels.ADD_NEW_ITEM.getLabel()))
                        .keyboardRow(new KeyboardRow(BotLabels.SHOW_MAIN_SCREEN.getLabel(), BotLabels.HIDE_MAIN_SCREEN.getLabel()))
                        .build();


                    BotHelper.sendMessageToTelegram(chatId, "La tarea " + task.getTitle() + " se ha creado correctamente.", telegramClient, mainScreenKeyboard);
                    break;
            }
        } catch (NumberFormatException e) {
            BotHelper.sendMessageToTelegram(chatId, "Error, debes escribir un número entero válido ej: 4. Intenta de nuevo:", telegramClient);
        } catch (DateTimeParseException e) {
            BotHelper.sendMessageToTelegram(chatId, "Error, la fecha debe tener ek siguiente formato YYYY-MM-DD ej: 2026-05-30. Intenta de nuevo:", telegramClient);
        } catch (Exception e) {
            BotHelper.sendMessageToTelegram(chatId, "Error, ocurrió un error inesperado al procesar tu respuesta. Por favor intenta de nuevo:", telegramClient);
            logger.error("Error en flujo de máquina de estados", e);
        }
    }

    public void fnStart() {
        if (!(requestText.equals(BotCommands.START_COMMAND.getCommand()) || requestText.equals(BotLabels.SHOW_MAIN_SCREEN.getLabel())) || exit) 
            return;

        BotHelper.sendMessageToTelegram(chatId, BotMessages.HELLO_MYTODO_BOT.getMessage(), telegramClient,  ReplyKeyboardMarkup
            .builder()
            .keyboardRow(new KeyboardRow(BotLabels.LIST_ALL_ITEMS.getLabel(), BotLabels.ADD_NEW_ITEM.getLabel()))
            .keyboardRow(new KeyboardRow(BotLabels.SHOW_MAIN_SCREEN.getLabel(), BotLabels.HIDE_MAIN_SCREEN.getLabel()))
            .build()
        );
        exit = true;
    }

    public void fnDone() {
        if (!(requestText.indexOf(BotLabels.DONE.getLabel()) != -1) || exit) 
            return;
            
        String done = requestText.substring(0, requestText.indexOf(BotLabels.DASH.getLabel()));
        Long id = Long.valueOf(done);

        try {
            Task item = taskService.getTaskById(id);
            if(item != null) {
                item.setStatus("completed");
                taskService.updateTask(id, item);
                BotHelper.sendMessageToTelegram(chatId, BotMessages.ITEM_DONE.getMessage(), telegramClient);
            }
        } catch (Exception e) {
            logger.error(e.getLocalizedMessage(), e);
        }
        exit = true;
    }

    public void fnUndo() {
        if (requestText.indexOf(BotLabels.UNDO.getLabel()) == -1 || exit)
            return;

        String undo = requestText.substring(0, requestText.indexOf(BotLabels.DASH.getLabel()));
        Long id = Long.valueOf(undo);

        try {
            Task item = taskService.getTaskById(id);
            if(item != null) {
                item.setStatus("pending");
                taskService.updateTask(id, item);
                BotHelper.sendMessageToTelegram(chatId, BotMessages.ITEM_UNDONE.getMessage(), telegramClient);
            }
        } catch (Exception e) {
            logger.error(e.getLocalizedMessage(), e);
        }
        exit = true;
    }

    public void fnDelete(){
        if (requestText.indexOf(BotLabels.DELETE.getLabel()) == -1 || exit)
            return;

        String delete = requestText.substring(0, requestText.indexOf(BotLabels.DASH.getLabel()));
        Long id = Long.valueOf(delete);

        try {
            taskService.deleteTask(id);
            BotHelper.sendMessageToTelegram(chatId, BotMessages.ITEM_DELETED.getMessage(), telegramClient);
        } catch (Exception e) {
            logger.error(e.getLocalizedMessage(), e);
        }
        exit = true;
    }

    public void fnHide(){
        if (requestText.equals(BotCommands.HIDE_COMMAND.getCommand())
                || requestText.equals(BotLabels.HIDE_MAIN_SCREEN.getLabel()) && !exit)
            BotHelper.sendMessageToTelegram(chatId, BotMessages.BYE.getMessage(), telegramClient);
        else
            return;
        exit = true;
    }

    public void fnListAll(){
        if (!(requestText.equals(BotCommands.TODO_LIST.getCommand())
                || requestText.equals(BotLabels.LIST_ALL_ITEMS.getLabel())
                || requestText.equals(BotLabels.MY_TODO_LIST.getLabel())) || exit)
            return;
            
        List<Task> allItems = taskService.findAll();
        
        ReplyKeyboardMarkup keyboardMarkup = ReplyKeyboardMarkup.builder()
            .resizeKeyboard(true)
            .oneTimeKeyboard(false)
            .selective(true)
            .build();

        List<KeyboardRow> keyboard = new ArrayList<>();

        KeyboardRow mainScreenRowTop = new KeyboardRow();
        mainScreenRowTop.add(BotLabels.SHOW_MAIN_SCREEN.getLabel());
        keyboard.add(mainScreenRowTop);

        KeyboardRow firstRow = new KeyboardRow();
        firstRow.add(BotLabels.ADD_NEW_ITEM.getLabel());
        keyboard.add(firstRow);

        KeyboardRow myTodoListTitleRow = new KeyboardRow();
        myTodoListTitleRow.add(BotLabels.MY_TODO_LIST.getLabel());
        keyboard.add(myTodoListTitleRow);

        // --- ORDENAMIENTO DESCENDENTE TAREAS ACTIVAS ---
        List<Task> activeItems = allItems.stream()
                .filter(item -> !item.getStatus().equals("completed") && item.getIsDeleted() == 0)
                .sorted(Comparator.comparing(Task::getId).reversed()) // <-- NUEVA LÍNEA PARA ORDENAR
                .collect(Collectors.toList());

        for (Task item : activeItems) {
            KeyboardRow currentRow = new KeyboardRow();
            currentRow.add(item.getTitle());
            currentRow.add(item.getId() + BotLabels.DASH.getLabel() + BotLabels.DONE.getLabel());
            keyboard.add(currentRow);
        }

        // --- ORDENAMIENTO DESCENDENTE TAREAS COMPLETADAS ---
        List<Task> doneItems = allItems.stream()
                .filter(item -> item.getStatus().equals("completed") && item.getIsDeleted() == 0)
                .sorted(Comparator.comparing(Task::getId).reversed()) // <-- NUEVA LÍNEA PARA ORDENAR
                .collect(Collectors.toList());

        for (Task item : doneItems) {
            KeyboardRow currentRow = new KeyboardRow();
            currentRow.add(item.getTitle());
            currentRow.add(item.getId() + BotLabels.DASH.getLabel() + BotLabels.UNDO.getLabel());
            currentRow.add(item.getId() + BotLabels.DASH.getLabel() + BotLabels.DELETE.getLabel());
            keyboard.add(currentRow);
        }

        KeyboardRow mainScreenRowBottom = new KeyboardRow();
        mainScreenRowBottom.add(BotLabels.SHOW_MAIN_SCREEN.getLabel());
        keyboard.add(mainScreenRowBottom);

        keyboardMarkup.setKeyboard(keyboard);

        BotHelper.sendMessageToTelegram(chatId, BotLabels.MY_TODO_LIST.getLabel(), telegramClient, keyboardMarkup);
        exit = true;
    }
    public void fnListPending() {
        if (!(requestText.equalsIgnoreCase("⏳ Pendientes")) || exit) return;

        List<Task> pendingItems = taskService.findAll().stream()
                .filter(item -> "pending".equalsIgnoreCase(item.getStatus()) && item.getIsDeleted() == 0)
                .sorted(java.util.Comparator.comparing(Task::getId).reversed())
                .collect(java.util.stream.Collectors.toList());

        if (pendingItems.isEmpty()) {
            BotHelper.sendMessageToTelegram(chatId, "¡Excelente! No tienes tareas pendientes. 🎉", telegramClient, getMainKeyboard());
            exit = true;
            return;
        }

        ReplyKeyboardMarkup keyboardMarkup = ReplyKeyboardMarkup.builder().resizeKeyboard(true).build();
        List<KeyboardRow> keyboard = new java.util.ArrayList<>();
        
        keyboard.add(new KeyboardRow(BotLabels.SHOW_MAIN_SCREEN.getLabel()));

        for (Task item : pendingItems) {
            KeyboardRow currentRow = new KeyboardRow();
            currentRow.add(item.getTitle());
            // Agregamos el botón de completado rápido
            currentRow.add(item.getId() + BotLabels.DASH.getLabel() + BotLabels.DONE.getLabel());
            keyboard.add(currentRow);
        }

        keyboardMarkup.setKeyboard(keyboard);
        BotHelper.sendMessageToTelegram(chatId, "⏳ Aquí están tus tareas pendientes:", telegramClient, keyboardMarkup);
        exit = true;
    }


    public void fnListBySprint() {
        if (!(requestText.equalsIgnoreCase("Por Sprint")) || exit) return;

        // Activamos el estado de la máquina para que intercepte el siguiente mensaje numérico
        userStates.put(chatId, TaskCreationState.WAITING_FOR_SPRINT_FILTER);
        
        BotHelper.sendMessageToTelegram(chatId, "🔍 ¿De qué Sprint quieres ver las tareas?\n\nEscribe el número (ejemplo: 1):", telegramClient);
        exit = true;
    }

    // --- ACTUALIZADO: DETONA E INICIA EL CONTROLADOR DE ESTADOS ---
    public void fnAddItem(){
        if (exit) return;

        // Compara usando tus Enums reales de BotCommands y BotLabels
        if (!(requestText.contains(BotCommands.ADD_ITEM.getCommand())
                || requestText.contains(BotLabels.ADD_NEW_ITEM.getLabel())))
            return;
            
        // Registramos que el usuario inicia la fase WAITING_FOR_TITLE
        userStates.put(chatId, TaskCreationState.WAITING_FOR_TITLE);
        tempTasks.put(chatId, new Task());
        
        BotHelper.sendMessageToTelegram(chatId, "Creando nueva tarea, Escribe el Título de la tarea:", telegramClient);
        exit = true;
    }

    public void fnElse(){
        if(exit) return;
        BotHelper.sendMessageToTelegram(chatId, "Comando no reconocido. Por favor selecciona una opción válida del menú o usa /start.", telegramClient, null);
    }

    public void fnLLM(){
        if (!(requestText.contains(BotCommands.LLM_REQ.getCommand())) || exit)
            return;
        
        String prompt = "Dame los datos del clima en mty";
        String out = "<empty>";
        try{
            out = aiService.analyzeData("efjvn", prompt);
        }catch(Exception exc){
            logger.error(exc.getLocalizedMessage());
        }

        BotHelper.sendMessageToTelegram(chatId, "LLM: " + out, telegramClient, null);
    }
}