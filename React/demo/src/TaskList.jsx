import { useState } from "react";
import { getTasks, setTasks as saveTasks } from "./tasksStore";

function TaskList({ tasks, allTasks, setTasks }) {

  // Función para alternar el estado de "empezado" (started)
  const toggleStarted = (id) => {
    const updated = allTasks.map(task =>
      task.id === id
        ? { ...task, started: !task.started }
        : task
    );

    setTasks(updated);
  };

  // Función para marcar como completada
  const toggleComplete = (id) => {
    const updated = allTasks.map(task =>
      task.id === id
        ? { ...task, completed: !task.completed }
        : task
    );

    setTasks(updated);
  };

  // Función para eliminar tarea de la lista y del store
  const deleteTask = (id) => {
    const updated = allTasks.filter(task => task.id !== id);
    setTasks(updated);
    saveTasks(updated); 
  };

  const [selectedTaskId, setSelectedTaskId] = useState(null);

  return (
    <section className="task-list">
      <h2>My Tasks</h2>

      {/* Encabezados de la tabla - Ahora con 6 columnas */}
      <div className="task-header">
        <span>Title</span>
        <span>Delivery date</span>
        <span>Priority</span>
        <span>Start</span>
        <span>Complete</span>
        <span>Edit</span>
      </div>

      {/* Mapeo de filas de tareas */}
      {tasks.map(task => (
        <div key={task.id}>
          <div className="task-row">
            <span>{task.title}</span>
            <span>{task.date}</span>

            {/* Clase dinámica según la prioridad */}
            <span className={`priority ${task.priority.toLowerCase()}`}>
              {task.priority}
            </span>

            {/* Botón de estado 'Started' */}
            <button 
              className={`btn-started ${task.started ? "active" : ""}`}
              onClick={() => toggleStarted(task.id)}
            >
              {task.started ? "In Progress" : "Start"}
            </button>

            {/* Botón de completado */}
            <button 
              className="btn-complete"
              onClick={() => toggleComplete(task.id)}
            >
              {task.completed ? "✔" : "Complete"}
            </button>

            {/* Botón para ver detalles expandidos */}
            <button 
              className="btn-details"
              onClick={() => setSelectedTaskId(task.id)}
            >
              Details
            </button>
          </div>

          {/* Sección de detalles condicional */}
          {selectedTaskId === task.id && (
            <div className="task-details">
              <p><strong>Title:</strong> {task.title}</p>
              <p>
                <strong>Status:</strong> {task.completed ? "Done" : (task.started ? "In Progress" : "Pending")}
              </p>
              <p>
                <strong>Delete Task: </strong>
                <button className="btn-delete" onClick={() => deleteTask(task.id)}>X</button>
              </p>
              <p><strong>Description: </strong>{task.description}</p>
              <button onClick={() => setSelectedTaskId(null)}>Close</button>
            </div>
          )}
        </div>
      ))}
    </section>
  );
}

export default TaskList;