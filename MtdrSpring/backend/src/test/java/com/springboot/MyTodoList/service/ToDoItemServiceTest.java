package com.springboot.MyTodoList.service;

import com.springboot.MyTodoList.model.ToDoItem;
import com.springboot.MyTodoList.repository.ToDoItemRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ToDoItemServiceTest {

    @Mock
    private ToDoItemRepository toDoItemRepository;

    @InjectMocks
    private ToDoItemService toDoItemService;

    @Test
    void addToDoItem_shouldSaveNewTask() {
        ToDoItem newTask = new ToDoItem(0, "Create unit tests", OffsetDateTime.now(), false);
        ToDoItem savedTask = new ToDoItem(1, "Create unit tests", newTask.getCreation_ts(), false);

        when(toDoItemRepository.save(newTask)).thenReturn(savedTask);

        ToDoItem result = toDoItemService.addToDoItem(newTask);

        assertNotNull(result);
        assertEquals(1, result.getID());
        assertEquals("Create unit tests", result.getDescription());
        assertFalse(result.isDone());
        verify(toDoItemRepository, times(1)).save(newTask);
    }

    @Test
    void findAll_shouldAllowFilteringCompletedTasksForEvidence() {
        ToDoItem completedTask = new ToDoItem(1, "Finished frontend view", OffsetDateTime.now(), true);
        ToDoItem pendingTask = new ToDoItem(2, "Pending documentation", OffsetDateTime.now(), false);

        when(toDoItemRepository.findAll()).thenReturn(List.of(completedTask, pendingTask));

        List<ToDoItem> allTasks = toDoItemService.findAll();
        List<ToDoItem> completedTasks = allTasks.stream()
                .filter(ToDoItem::isDone)
                .collect(Collectors.toList());

        assertEquals(2, allTasks.size());
        assertEquals(1, completedTasks.size());
        assertTrue(completedTasks.get(0).isDone());
        assertEquals("Finished frontend view", completedTasks.get(0).getDescription());
        verify(toDoItemRepository, times(1)).findAll();
    }

    @Test
    void updateToDoItem_shouldMarkTaskAsDone() {
        OffsetDateTime creationDate = OffsetDateTime.now();

        ToDoItem existingTask = new ToDoItem(1, "Implement dashboard", creationDate, false);
        ToDoItem updatedInput = new ToDoItem(1, "Implement dashboard", creationDate, true);
        ToDoItem savedTask = new ToDoItem(1, "Implement dashboard", creationDate, true);

        when(toDoItemRepository.findById(1)).thenReturn(Optional.of(existingTask));
        when(toDoItemRepository.save(existingTask)).thenReturn(savedTask);

        ToDoItem result = toDoItemService.updateToDoItem(1, updatedInput);

        assertNotNull(result);
        assertTrue(result.isDone());
        assertEquals("Implement dashboard", result.getDescription());
        verify(toDoItemRepository, times(1)).findById(1);
        verify(toDoItemRepository, times(1)).save(existingTask);
    }

    @Test
    void getItemById_shouldReturnOkWhenTaskExists() {
        ToDoItem task = new ToDoItem(1, "Existing task", OffsetDateTime.now(), false);

        when(toDoItemRepository.findById(1)).thenReturn(Optional.of(task));

        ResponseEntity<ToDoItem> response = toDoItemService.getItemById(1);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("Existing task", response.getBody().getDescription());
        verify(toDoItemRepository, times(1)).findById(1);
    }

    @Test
    void getItemById_shouldReturnNotFoundWhenTaskDoesNotExist() {
        when(toDoItemRepository.findById(99)).thenReturn(Optional.empty());

        ResponseEntity<ToDoItem> response = toDoItemService.getItemById(99);

        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        assertNull(response.getBody());
        verify(toDoItemRepository, times(1)).findById(99);
    }

    @Test
    void deleteToDoItem_shouldReturnTrueWhenRepositoryDeletesTask() {
        doNothing().when(toDoItemRepository).deleteById(1);

        boolean result = toDoItemService.deleteToDoItem(1);

        assertTrue(result);
        verify(toDoItemRepository, times(1)).deleteById(1);
    }

    @Test
    void deleteToDoItem_shouldReturnFalseWhenRepositoryThrowsException() {
        doThrow(new RuntimeException("Database error")).when(toDoItemRepository).deleteById(1);

        boolean result = toDoItemService.deleteToDoItem(1);

        assertFalse(result);
        verify(toDoItemRepository, times(1)).deleteById(1);
    }
}