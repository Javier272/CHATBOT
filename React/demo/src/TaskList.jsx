import { useState } from "react";

function TaskList() {

  const [tasks, setTasks] = useState([
    {
      id: 1,
      title: "Configurar Oracle",
      date: "2026-04-20",
      priority: "High",
      completed: false,
      description: "enar mucho y y si y se haran cosas y asi"
    },
    {
      id: 2,
      title: "Diseñar UI",
      date: "2026-04-22",
      priority: "Medium",
      completed: false,
      description: "en esta tarea se va a trabajarosas y asi"
    },
    {
      id: 3,
      title: "Poner tasks",
      date: "2026-04-21",
      priority: "low",
      completed: false,
      description: "en esta tarea se va a trabajar mucho y y si y se haran cosas y asi"
    }
  ]);

  // marcar como completada
  const toggleComplete = (id) => {
    setTasks(tasks.map(task =>
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
  };

  // eliminar tarea
  const deleteTask = (id) => {
    setTasks(tasks.filter(task => task.id !== id));
  };

  const [selectedTaskId, setSelectedTaskId] = useState(null);

  return (
    <section className="task-list">

      <h2>Mis tareas</h2>

      {/* encabezados */}
      <div className="task-header">
        <span>Title</span>
        <span>Delivery date</span>
        <span>Priority</span>
        <span>Complete</span>
        <span>Edit</span>
      </div>

      {/* filas */}
      {tasks.map(task => (
  <div key={task.id}>
    
    <div className="task-row">
      <span>{task.title}</span>
      <span>{task.date}</span>

      <span className={`priority ${task.priority.toLowerCase()}`}>
        {task.priority}
      </span>

      <button 
        className="btn-complete"
        onClick={() => toggleComplete(task.id)}
      >
        {task.completed ? "✔" : "Complete"}
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
        <p><strong>Status:</strong> {task.completed ? "Done" : "Pending"}</p>

        <p>
          <strong>Delete Task: </strong>
          <button 
            className="btn-delete"
            onClick={() => deleteTask(task.id)}
          >
            ✖
          </button>
        </p>

        <p><strong>Description: </strong>{task.description}</p>

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