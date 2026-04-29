import { useState } from "react";
import { updateTask, deleteTask as deleteTaskAPI } from "../taskService";

function TaskList({ tasks, setTasks }) {
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [loadingId, setLoadingId] = useState(null);

  const updateTaskStatus = async (task, newStatus) => {
    setLoadingId(task.id);

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
      alert("Error updating task");
    } finally {
      setLoadingId(null);
    }
  };

  const deleteTask = async (id) => {
    if (!confirm("Delete this task?")) return;

    try {
      await deleteTaskAPI(id);
      setTasks(prev => prev.filter(task => task.id !== id));
    } catch (err) {
      console.error(err);
      alert("Error deleting task");
    }
  };

  const getPriorityLabel = (p) => {
    if (p >= 4) return "High";
    if (p >= 2) return "Medium";
    return "Low";
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString();
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
            <span>{formatDate(task.dueDate)}</span>

            <span className="priority">
              {getPriorityLabel(task.priority)}
            </span>

            <button 
              disabled={loadingId === task.id}
              className={`btn-started ${task.status === "in_progress" ? "active" : ""}`}
              onClick={() =>
                updateTaskStatus(
                  task,
                  task.status === "in_progress" ? "pending" : "in_progress"
                )
              }
            >
              {task.status === "in_progress" ? "In Progress" : "Start"}
            </button>

            <button 
              disabled={loadingId === task.id}
              className="btn-complete"
              onClick={() =>
                updateTaskStatus(
                  task,
                  task.status === "completed" ? "pending" : "completed"
                )
              }
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