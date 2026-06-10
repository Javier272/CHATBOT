package com.springboot.MyTodoList.controller;

import com.springboot.MyTodoList.config.BotProps;
import com.springboot.MyTodoList.service.AiService;
import com.springboot.MyTodoList.service.TaskService;
import com.springboot.MyTodoList.util.BotActions;
import com.springboot.MyTodoList.service.UserService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.telegram.telegrambots.client.okhttp.OkHttpTelegramClient;
import org.telegram.telegrambots.longpolling.BotSession;
import org.telegram.telegrambots.longpolling.interfaces.LongPollingUpdateConsumer;
import org.telegram.telegrambots.longpolling.starter.AfterBotRegistration;
import org.telegram.telegrambots.longpolling.starter.SpringLongPollingBot;
import org.telegram.telegrambots.longpolling.util.LongPollingSingleThreadUpdateConsumer;
import org.telegram.telegrambots.meta.api.objects.Update;
import org.telegram.telegrambots.meta.generics.TelegramClient;

@Component
public class TaskBotController implements SpringLongPollingBot, LongPollingSingleThreadUpdateConsumer {

	private static final Logger logger = LoggerFactory.getLogger(TaskBotController.class);
	private TaskService taskService;
	private AiService aiService;
	private final TelegramClient telegramClient;
	private UserService userService;
	
	private final BotProps botProps;

	@Value("${telegram.bot.token}")
	private String telegramBotToken;

	@Override
    public String getBotToken() {
		if(telegramBotToken != null && !telegramBotToken.trim().isEmpty()){
        	return telegramBotToken;
		}else{
			return botProps.getToken();
		}
    }

	public TaskBotController(BotProps bp, TaskService tsvc, AiService aisvc, UserService usvc) {
		this.botProps = bp;
		telegramClient = new OkHttpTelegramClient(getBotToken());
		this.taskService = tsvc;
		this.aiService = aisvc;
		this.userService = usvc;
	}

	@Override
    public LongPollingUpdateConsumer getUpdatesConsumer() {
        return this;
    }

	@Override
    public void consume(Update update) {
        if (!update.hasMessage() || !update.getMessage().hasText()) return;

        String messageTextFromTelegram = update.getMessage().getText();
        long chatId = update.getMessage().getChatId();

        BotActions actions = new BotActions(telegramClient, taskService, aiService, userService);
        actions.setRequestText(messageTextFromTelegram);
        actions.setChatId(chatId);
        
        if(actions.getTaskService() == null){
            logger.info("tasksvc error");
            actions.setTaskService(taskService);
        }

        // --- ¡LA LÍNEA MÁGICA QUE VERIFICA SI ESTAMOS A MITAD DE UNA CREACIÓN! ---
        actions.fnStateInterceptor(); 
        
        actions.fnStart();
        actions.fnDone();
        actions.fnUndo();
        actions.fnDelete();
        actions.fnHide();
        actions.fnListAll();
        actions.fnAddItem();
        actions.fnLLM();
        actions.fnElse();
        
        actions.fnListPending();
        actions.fnListBySprint();
         
    }

	@AfterBotRegistration
    public void afterRegistration(BotSession botSession) {
        System.out.println("Registered bot running state is: " + botSession.isRunning());
    }
}