package com.springboot.MyTodoList.util;

import com.springboot.MyTodoList.model.Task;
import com.springboot.MyTodoList.service.AiService;
import com.springboot.MyTodoList.service.TaskService;
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
        WAITING_FOR_ASSIGN_TO
    }
    // --------------------------------------------------

    String requestText;
    long chatId;
    TelegramClient telegramClient;
    boolean exit;

    TaskService taskService;
    AiService aiService;

    public BotActions(TelegramClient tc, TaskService ts, AiService aisvc) {
        telegramClient = tc;
        taskService = ts;
        aiService = aisvc;
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
                    BotHelper.sendMessageToTelegram(chatId, "✅ Título guardado.\n\nAhora, escribe la *Descripción* de la tarea:", telegramClient);
                    break;

                case WAITING_FOR_DESCRIPTION:
                    task.setDescription(messageText);
                    userStates.put(chatId, TaskCreationState.WAITING_FOR_ESTIMATED_HOURS);
                    BotHelper.sendMessageToTelegram(chatId, "✅ Descripción guardada.\n\n¿Cuántas *Horas estimadas* tomará? (Escribe solo el número entero, ej: 6):", telegramClient);
                    break;

                case WAITING_FOR_ESTIMATED_HOURS:
                    task.setHoursEstimate(Integer.parseInt(messageText)); // Mapeado a tu Integer hoursEstimate
                    userStates.put(chatId, TaskCreationState.WAITING_FOR_DUE_DATE);
                    BotHelper.sendMessageToTelegram(chatId, "✅ Horas guardadas.\n\n¿Cuál es la fecha límite (*Due Date*)? (Usa el formato exacto: YYYY-MM-DD):", telegramClient);
                    break;

                case WAITING_FOR_DUE_DATE:
                    task.setDueDate(LocalDate.parse(messageText)); // Mapeado a tu LocalDate dueDate
                    userStates.put(chatId, TaskCreationState.WAITING_FOR_SPRINT);
                    BotHelper.sendMessageToTelegram(chatId, "✅ Fecha guardada.\n\n¿A qué *Sprint* pertenece? (Escribe solo el número, ej: 1):", telegramClient);
                    break;

                case WAITING_FOR_SPRINT:
                    task.setSprint(Integer.parseInt(messageText)); // Mapeado a tu Integer sprint
                    userStates.put(chatId, TaskCreationState.WAITING_FOR_PRIORITY);
                    BotHelper.sendMessageToTelegram(chatId, "✅ Sprint guardado.\n\n¿Cuál es la *Prioridad*? (Escribe un número entero, ej: 1 para Alta, 2 para Media, 3 para Baja):", telegramClient);
                    break;

                case WAITING_FOR_PRIORITY:
                    task.setPriority(Integer.parseInt(messageText)); // Mapeado a tu Integer priority
                    userStates.put(chatId, TaskCreationState.WAITING_FOR_ASSIGN_TO);

                    // Desplegamos el teclado de selección con las personas asignadas
                    ReplyKeyboardMarkup keyboardMarkup = ReplyKeyboardMarkup.builder()
                        .resizeKeyboard(true)
                        .oneTimeKeyboard(true)
                        .keyboardRow(new KeyboardRow("Diego", "Javier"))
                        .keyboardRow(new KeyboardRow("Admin"))
                        .build();

                    BotHelper.sendMessageToTelegram(chatId, "✅ Prioridad guardada.\n\nPor último, ¿a quién se la *asignamos*? (Selecciona un botón del menú):", telegramClient, keyboardMarkup);
                    break;

                case WAITING_FOR_ASSIGN_TO:
                    // Mapeamos los botones de texto a los IDs (Long) reales de tu tabla de usuarios
                    Long assignedUserId = 1L; // Por defecto Admin (ID 1)
                    if (messageText.equalsIgnoreCase("Diego")) assignedUserId = 2L;
                    else if (messageText.equalsIgnoreCase("Javier")) assignedUserId = 3L;

                    task.setUserId(assignedUserId); // Asignamos a la columna user_id
                    task.setStatus("pending");      // Estado inicial por defecto
                    task.setIsDeleted(0);           // Registro activo

                    // Guardamos la entidad usando tu TaskService nativo
                    taskService.addTask(task);

                    // Limpiamos los mapas de memoria para que el chat quede libre
                    userStates.remove(chatId);
                    tempTasks.remove(chatId);

                    BotHelper.sendMessageToTelegram(chatId, "🎉 ¡Excelente! La tarea *" + task.getTitle() + "* se ha creado de manera interactiva y se almacenó con éxito en la base de datos.", telegramClient);
                    break;
            }
        } catch (NumberFormatException e) {
            BotHelper.sendMessageToTelegram(chatId, "⚠️ Error de formato: Debes escribir un número entero válido (ej: 4). Intenta de nuevo:", telegramClient);
        } catch (DateTimeParseException e) {
            BotHelper.sendMessageToTelegram(chatId, "⚠️ Error de formato: La fecha debe cumplir el estándar YYYY-MM-DD (ej: 2026-05-30). Intenta de nuevo:", telegramClient);
        } catch (Exception e) {
            BotHelper.sendMessageToTelegram(chatId, "⚠️ Ocurrió un error inesperado al procesar tu respuesta. Por favor intenta de nuevo:", telegramClient);
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

        List<Task> activeItems = allItems.stream()
                .filter(item -> !item.getStatus().equals("completed") && item.getIsDeleted() == 0)
                .collect(Collectors.toList());

        for (Task item : activeItems) {
            KeyboardRow currentRow = new KeyboardRow();
            currentRow.add(item.getTitle());
            currentRow.add(item.getId() + BotLabels.DASH.getLabel() + BotLabels.DONE.getLabel());
            keyboard.add(currentRow);
        }

        List<Task> doneItems = allItems.stream()
                .filter(item -> item.getStatus().equals("completed") && item.getIsDeleted() == 0)
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
        
        BotHelper.sendMessageToTelegram(chatId, "¡Genial! Vamos a crear una nueva tarea. 📝\n\nPor favor, escribe el *Título* de la tarea:", telegramClient);
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