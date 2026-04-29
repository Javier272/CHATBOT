import { useState } from "react";
import { updateTask, deleteTask as deleteTaskAPI } from "../taskService";

function TaskList({ tasks, setTasks, currentUser }) { 
  // Estados locales para la interfaz
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  
  // Estado del formulario de edición con horas estimadas
  // Se sincronizaron los nombres con tu base de datos (hoursEstimate, realHours)
  const [editData, setEditData] = useState({ 
    title: "", 
    description: "", 
    dueDate: "", 
    hoursEstimate: 0, 
    realHours: 0 
  });

  // Fecha actual para límites en selectores
  const today = new Date().toISOString().split("T")[0];

// FILTRO MEJORADO: Busca por ID o por Nombre de usuario
const myTasks = tasks.filter(t => {
  const matchId = String(t.userId || t.user_id) === String(currentUser?.id);
  const matchNombre = t.userName === currentUser?.name;
  
  return matchId || matchNombre;
});

  // Agrupación de tareas por sprint (usando solo mis tareas)
  const groupedTasks = myTasks.reduce((acc, task) => {
    // Categoría por defecto: Sin Sprint
    const sprint = task.sprint || "Sin Sprint";
    if (!acc[sprint]) acc[sprint] = [];
    acc[sprint].push(task);
    return acc;
  }, {});

  // Datos del formulario para detalles
  const handleOpenDetails = (task) => {
    setSelectedTaskId(task.id);
    setIsEditing(false);
    setEditData({
      title: task.title, 
      description: task.description, 
      dueDate: task.dueDate || "",
      hoursEstimate: task.hoursEstimate || 0, 
      realHours: task.realHours || 0
    });
  };

  // Guardado de cambios desde edición
  const handleSaveEdit = async (task) => {
    const updatedData = { 
      ...task, 
      title: editData.title, 
      description: editData.description, 
      dueDate: editData.dueDate,
      hoursEstimate: Number(editData.hoursEstimate) || 0, 
      realHours: Number(editData.realHours) || 0 
    };

    try {
      // Actualización local inmediata
      setTasks((prev) => prev.map((t) => (t.id === task.id ? updatedData : t)));
      setIsEditing(false);
      setSelectedTaskId(null);
      
      // Sincronización con base de datos
      await updateTask(updatedData);
    } catch (err) {
      console.error("Error al sincronizar con servidor:", err);
    }
  };

  // Alternancia de estado: Pendiente/Progreso
  const toggleStarted = async (task) => {
    const newStatus = task.status === "in_progress" ? "pending" : "in_progress";
    const updatedTask = { ...task, status: newStatus };
    
    // Actualización visual inmediata
    setTasks((prev) => prev.map((t) => (t.id === task.id ? updatedTask : t)));
    
    try { 
      await updateTask(updatedTask); 
    } catch (err) { 
      console.error("Error en toggleStarted:", err); 
    }
  };

  // Cambio a completado con horas reales
  const toggleComplete = async (task) => {
    // Verificación de estado de completado
    const isCompleting = task.status !== "completed";
    
    if (isCompleting) {
      // Entrada de horas reales
      const input = prompt("¿Cuántas horas reales tomó esta tarea?", task.realHours || 0);
      if (input === null) return; 
      
      const realHours = Number(input) || 0;
      const updatedTask = { ...task, status: "completed", realHours };
      
      // Actualización de estados
      setTasks((prev) => prev.map((t) => (t.id === task.id ? updatedTask : t)));
      
      try { 
        await updateTask(updatedTask); 
      } catch (err) { 
        console.error(err); 
      }
    } else {
      // Reversión a estado pendiente
      const updatedTask = { ...task, status: "pending" };
      setTasks((prev) => prev.map((t) => (t.id === task.id ? updatedTask : t)));
      
      try { 
        await updateTask(updatedTask); 
      } catch (err) { 
        console.error(err); 
      }
    }
  };

  // Eliminación de tarea con confirmación
  const deleteTask = async (id) => {
    if (window.confirm("¿Eliminar esta tarea?")) {
      // Eliminación local
      setTasks((prev) => prev.filter((task) => task.id !== id));
      
      try { 
        await deleteTaskAPI(id); 
      } catch (err) { 
        console.error("Error al eliminar:", err); 
      }
    }
  };

  // Clasificación visual de prioridad
  const getPriorityClass = (p) => (p >= 4 ? "high" : p >= 2 ? "medium" : "low");

  return (
    <section className="task-list">
      <h2>My Tasks ({currentUser?.name})</h2>

      {/* Si no hay tareas después del filtro, mostrar mensaje */}
      {myTasks.length === 0 && <p>No tienes tareas asignadas.</p>}

      {/* Renderizado por grupos de sprint */}
      {Object.entries(groupedTasks).map(([sprintName, sprintTasks]) => (
        <div key={sprintName} className="sprint-group">
          
          <h3 className="sprint-title">
            {sprintName === "Sin Sprint" ? sprintName : `Sprint ${sprintName}`}
          </h3>
          
          <div className="task-header">
            <span>Title</span> 
            <span>Est. Hours</span>
            <span>Due date</span> 
            <span>Priority</span> 
            <span>Start</span> 
            <span>Complete</span> 
            <span>Details</span>
          </div>

          {sprintTasks.map((task) => (
            <div key={task.id}>
              <div className="task-row">
                <span>{task.title}</span>
                <span>{task.hoursEstimate}h</span>
                <span>{task.dueDate}</span>
                <span className={`priority ${getPriorityClass(task.priority)}`}>
                  {task.priority >= 4 ? "High" : task.priority >= 2 ? "Medium" : "Low"}
                </span>

                <button 
                  className={`btn-started ${task.status === "in_progress" ? "active" : ""}`} 
                  onClick={() => toggleStarted(task)}
                >
                  {task.status === "in_progress" ? "In Progress" : "Start"}
                </button>

                <button className="btn-complete" onClick={() => toggleComplete(task)}>
                  {task.status === "completed" ? "✔" : "Complete"}
                </button>

                <button className="btn-details" onClick={() => handleOpenDetails(task)}>Details</button>
              </div>

              {selectedTaskId === task.id && (
                <div className="task-details">
                  {isEditing ? (
                    <div className="edit-mode">
                      <label>Title</label>
                      <input 
                        value={editData.title} 
                        onChange={(e) => setEditData({...editData, title: e.target.value})} 
                      />
                      
                      <label>Due Date</label>
                      <input 
                        type="date" 
                        min={today} 
                        value={editData.dueDate} 
                        onChange={(e) => setEditData({...editData, dueDate: e.target.value})} 
                      />

                      <div className="hours-edit-group">
                        <div>
                          <label>Est. Hours</label>
                          <input 
                            type="number" 
                            value={editData.hoursEstimate} 
                            onChange={(e) => setEditData({...editData, hoursEstimate: Number(e.target.value)})} 
                          />
                        </div>
                        <div>
                          <label>Actual Hours</label>
                          <input 
                            type="number" 
                            value={editData.realHours} 
                            onChange={(e) => setEditData({...editData, realHours: Number(e.target.value)})} 
                          />
                        </div>
                      </div>

                      <label>Description</label>
                      <textarea 
                        value={editData.description} 
                        onChange={(e) => setEditData({...editData, description: e.target.value})} 
                      />
                      
                      <div className="details-actions">
                        <button className="btn-save" onClick={() => handleSaveEdit(task)}>Save</button>
                        <button className="btn-cancel" onClick={() => setIsEditing(false)}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div className="view-mode">
                      <p><strong>Due Date:</strong> {task.dueDate || "No date set"}</p>
                      <div className="hours-view">
                        <p><strong>Estimated Hours:</strong> {task.hoursEstimate || 0}</p>
                        {task.status === "completed" && (
                          <p><strong>Actual Hours:</strong> {task.realHours || 0}</p>
                        )}
                      </div>
                      <p><strong>Description:</strong> {task.description || "No description provided."}</p>
                      <p><strong>Status:</strong> {task.status}</p>
                      
                      <div className="details-actions">
                        <button className="btn-edit" onClick={() => setIsEditing(true)}>Edit</button>
                        <button className="btn-delete" onClick={() => deleteTask(task.id)}>Delete Task</button>
                        <button className="btn-close" onClick={() => setSelectedTaskId(null)}>Close</button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      ))}
    </section>
  );
}

export default TaskList;