import { useState } from "react";
import { updateTask, deleteTask as deleteTaskAPI } from "./taskService";

function TaskList({ tasks, setTasks }) {
  const [selectedTaskId, setSelectedTaskId] = useState(null);

  // Cambiar a "in_progress"
  const toggleStarted = async (task) => {
    const newStatus =
      task.status === "in_progress" ? "pending" : "in_progress";

    try {
      await updateTask({
        ...task,
        status: newStatus
      });

      setTasks(prev =>
        prev.map(t =>
          t.id === task.id ? { ...t, status: newStatus } : t
        )
      );
    } catch (err) {
      console.error(err);
    }
  };

  // Completar tarea
  const toggleComplete = async (task) => {
    const newStatus =
      task.status === "completed" ? "pending" : "completed";

    try {
      await updateTask({
        ...task,
        status: newStatus
      });

      setTasks(prev =>
        prev.map(t =>
          t.id === task.id ? { ...t, status: newStatus } : t
        )
      );
    } catch (err) {
      console.error(err);
    }
  };

  // Eliminar
  const deleteTask = async (id) => {
    try {
      await deleteTaskAPI(id);
      setTasks(prev => prev.filter(task => task.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  // prioridad visual simple
  const getPriorityLabel = (p) => {
    if (p >= 4) return "High";
    if (p >= 2) return "Medium";
    return "Low";
  };

  return (
    <section className="task-list">
      <h2>My Tasks</h2>

      <div className="task-header">
        <span>Title</span>
        <span>Due date</span>
        <span>Priority</span>
        <span>Start</span>
        <span>Complete</span>
        <span>Edit</span>
      </div>

      {tasks.map(task => (
        <div key={task.id}>
          <div className="task-row">
            <span>{task.title}</span>
            <span>{task.dueDate}</span>

            <span className="priority">
              {getPriorityLabel(task.priority)}
            </span>

            <button 
              className={`btn-started ${task.status === "in_progress" ? "active" : ""}`}
              onClick={() => toggleStarted(task)}
            >
              {task.status === "in_progress" ? "In Progress" : "Start"}
            </button>

            <button 
              className="btn-complete"
              onClick={() => toggleComplete(task)}
            >
              {task.status === "completed" ? "✔" : "Complete"}
            </button>

            <button 
              className="btn-details"
              onClick={() => setSelectedTaskId(task.id)}
            >
              Details
            </button>
          </div>

          {selectedTaskId === task.id && (
            <div className="task-details">
              <p><strong>Title:</strong> {task.title}</p>

              <p>
                <strong>Status:</strong>{" "}
                {task.status === "completed"
                  ? "Done"
                  : task.status === "in_progress"
                  ? "In Progress"
                  : "Pending"}
              </p>

              <p>
                <strong>Delete Task: </strong>
                <button 
                  className="btn-delete"
                  onClick={() => deleteTask(task.id)}
                >
                  X
                </button>
              </p>

              <p><strong>Description:</strong> {task.description}</p>

              <button onClick={() => setSelectedTaskId(null)}>
                Close
              </button>
            </div>
          )}
        </div>
      ))}
    </section>
  );
}

export default TaskList;