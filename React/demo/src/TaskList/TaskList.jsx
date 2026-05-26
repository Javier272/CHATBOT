import { useState } from "react";
// 1. IMPORTAMOS LAS FUNCIONES DEL SERVICIO
import { updateTask, deleteTask as deleteTaskAPI, getAiPriorities } from "../taskService";

const getUserId = (value) =>
  value?.id ?? value?.userId ?? value?.user_id ?? value?.USER_ID ?? value?.ID ?? "";

const getUserName = (value) =>
  value?.name ?? value?.userName ?? value?.username ?? value?.USERNAME ?? value?.NAME ?? "";

function TaskList({ tasks, setTasks, currentUser, completedView = false }) { 
  // Estados para la interfaz
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  
  // Estado del formulario de edición
  const [editData, setEditData] = useState({ 
    title: "", 
    description: "", 
    dueDate: "", 
    hoursEstimate: 0, 
    realHours: 0,
    userId: "",
    sprint: "",
    priority: 3
  });

  // 2. ESTADOS PARA LA IA
  const [aiSuggestion, setAiSuggestion] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  // Vista general: Usamos todas las tareas de la base de datos
  const displayTasks = Array.isArray(tasks) ? tasks : [];

  // Agrupación por Sprint
  const groupedTasks = displayTasks.reduce((acc, task) => {
    const sprint = task.sprint || "Sin Sprint";
    if (!acc[sprint]) acc[sprint] = [];
    acc[sprint].push(task);
    return acc;
  }, {});

  const handleOpenDetails = (task) => {
    setSelectedTaskId(task.id);
    setIsEditing(false);
    setEditData({
      title: task.title, 
      description: task.description, 
      dueDate: task.dueDate || "",
      hoursEstimate: task.hoursEstimate || 0, 
      realHours: task.realHours || 0,
      userId: task.userId || "",
      sprint: task.sprint || "",
      priority: task.priority || 3
    });
  };

  const handleSaveEdit = async (originalTask) => {
    // 🛡️ BLINDAJE DE DATOS PARA EL DASHBOARD:
    // Forzamos conversión a Number para evitar que las gráficas reciban strings
    const updatedData = { 
      ...originalTask, 
      title: editData.title,
      description: editData.description,
      dueDate: editData.dueDate,
      sprint: editData.sprint !== "" ? Number(editData.sprint) : originalTask.sprint,
      hoursEstimate: Number(editData.hoursEstimate),
      realHours: Number(editData.realHours),
      priority: Number(editData.priority),
      userId: editData.userId ? Number(editData.userId) : originalTask.userId
    };

    try {
      setTasks((prev) => prev.map((t) => (t.id === originalTask.id ? updatedData : t)));
      setIsEditing(false);
      setSelectedTaskId(null);
      await updateTask(updatedData);
    } catch (err) {
      console.error("Error al sincronizar:", err);
    }
  };

  const toggleStarted = async (task) => {
    const newStatus = task.status === "in_progress" ? "pending" : "in_progress";
    const updatedTask = { ...task, status: newStatus };
    setTasks((prev) => prev.map((t) => (t.id === task.id ? updatedTask : t)));
    try { await updateTask(updatedTask); } catch (err) { console.error(err); }
  };

const toggleComplete = async (task) => {
  const isCompleting = task.status !== "completed";
  const assignedUserId = task.userId ?? task.user_id ?? task.USER_ID ?? getUserId(currentUser);
  const assignedUserName = task.userName ?? task.USERNAME ?? getUserName(currentUser);
  
  // 1. Clonamos la tarea original para mantener todos sus campos (userId, userName, sprint, etc.)
  // Esto evita que la tarea "desaparezca" si el backend devuelve datos incompletos.
  let updatedTask = {
    ...task,
    userId: assignedUserId ? Number(assignedUserId) : task.userId,
    userName: assignedUserName || task.userName
  }; 

  if (isCompleting) {
    const input = prompt("¿Cuántas horas reales tomó esta tarea?", task.realHours || 0);
    if (input === null) return; // Si el usuario cancela el prompt, no hacemos nada
    
    updatedTask.status = "completed";
    updatedTask.realHours = Number(input) || 0;
  } else {
    updatedTask.status = "pending";
    updatedTask.realHours = 0; // Opcional: resetear horas si vuelve a pendiente
  }
  console.log("ANTES:", task);
  console.log("DESPUÉS:", updatedTask);
  // 2. Actualización Optimista: Actualizamos la UI inmediatamente para una mejor experiencia
  setTasks((prev) => prev.map((t) => (t.id === task.id ? updatedTask : t)));

  // 3. Sincronización con el Servidor
  try {
    const response = await updateTask(updatedTask);
    console.log("Servidor actualizado correctamente:", response);
  } catch (err) {
    console.error("Error al sincronizar con el backend:", err);
    
    // 4. Rollback (Reversión): Si la API falla, devolvemos la tarea a su estado original
    alert("Error de conexión. El cambio no se guardó en el servidor.");
    setTasks((prev) => prev.map((t) => (t.id === task.id ? task : t)));
  }
};

  const deleteTask = async (id) => {
    if (window.confirm("¿Eliminar esta tarea?")) {
      setTasks((prev) => prev.filter((task) => task.id !== id));
      try { await deleteTaskAPI(id); } catch (err) { console.error(err); }
    }
  };

  const markAsUndone = async (task) => {
    const assignedUserId = task.userId ?? task.user_id ?? task.USER_ID ?? getUserId(currentUser);
    const assignedUserName = task.userName ?? task.USERNAME ?? getUserName(currentUser);
    const updatedTask = {
      ...task,
      userId: assignedUserId ? Number(assignedUserId) : task.userId,
      userName: assignedUserName || task.userName,
      status: "pending"
    };

    setTasks((prev) => prev.map((t) => (t.id === task.id ? updatedTask : t)));

    try {
      await updateTask(updatedTask);
    } catch (err) {
      console.error("Error al regresar la tarea a pendiente:", err);
      alert("Error de conexión. El cambio no se guardó en el servidor.");
      setTasks((prev) => prev.map((t) => (t.id === task.id ? task : t)));
    }
  };

  // 3. FUNCIÓN PARA LLAMAR A LA IA
  const handleAskAI = async () => {
    if (!currentUser || !currentUser.id) {
      alert("Por favor inicia sesión para usar la IA.");
      return;
    }
    setIsAiLoading(true);
    setAiSuggestion(""); 
    try {
      const response = await getAiPriorities(currentUser.id);
      setAiSuggestion(response);
    } catch (error) {
      console.error("Error con la IA:", error);
      setAiSuggestion("Ocurrió un error al consultar a la IA.");
    } finally {
      setIsAiLoading(false);
    }
  };

  const getPriorityClass = (p) => (p >= 4 ? "high" : p >= 2 ? "medium" : "low");

  return (
    <section className="task-list">
      <h2>General Task Board (User: {currentUser?.name || "Guest"})</h2>

      {displayTasks.length === 0 && <p>No hay tareas en el sistema.</p>}

      {Object.entries(groupedTasks).map(([sprintName, sprintTasks]) => (
        <div key={sprintName} className="sprint-group">
          <h3 className="sprint-title">
            {sprintName === "Sin Sprint" ? sprintName : `Sprint ${sprintName}`}
          </h3>
          
          <div className="task-header">
            <span>Title</span> 
            <span>Owner</span>
            <span>Est. Hours</span>
            <span>Due date</span> 
            <span>Priority</span> 
            <span>Actions</span>
            <span>Details</span>
          </div>

          {sprintTasks.map((task) => (
            <div key={task.id}>
              <div className={`task-row ${task.userName === currentUser?.name ? "my-own-task" : ""}`}>
                <span>{task.title}</span>
                <span className="owner-tag">{task.userName || "Unassigned"}</span>
                <span>{task.hoursEstimate}h</span>
                <span>{task.dueDate}</span>
                <span className={`priority ${getPriorityClass(task.priority)}`}>
                  {task.priority >= 4 ? "High" : task.priority >= 2 ? "Medium" : "Low"}
                </span>

                <div className="actions-cell">
                  {completedView ? (
                    <button className="btn-complete" onClick={() => markAsUndone(task)}>
                      Mark as Undone
                    </button>
                  ) : (
                    <>
                    <button 
                        className={`btn-started ${task.status === "in_progress" ? "active" : ""}`} 
                        onClick={() => toggleStarted(task)}
                    >
                        {task.status === "in_progress" ? "Doing" : "Start"}
                    </button>
                    <button className="btn-complete" onClick={() => toggleComplete(task)}>
                        {task.status === "completed" ? "✔" : "Done"}
                    </button>
                    </>
                  )}
                </div>

                <button className="btn-details" onClick={() => handleOpenDetails(task)}>Details</button>
              </div>

              {selectedTaskId === task.id && (
                <div className="task-details">
                  {isEditing ? (
                    <div className="edit-mode">
                      <label>Title</label>
                      <input value={editData.title} onChange={(e) => setEditData({...editData, title: e.target.value})} />
                      
                      <label>Due Date</label>
                      <input type="date" min={today} value={editData.dueDate} onChange={(e) => setEditData({...editData, dueDate: e.target.value})} />

                      <div className="hours-edit-group" style={{ display: 'flex', gap: '10px' }}>
                        <div>
                          <label>Est. Hours</label>
                          <input type="number" value={editData.hoursEstimate} onChange={(e) => setEditData({...editData, hoursEstimate: e.target.value})} />
                        </div>
                        <div>
                          <label>Actual Hours</label>
                          <input type="number" value={editData.realHours} onChange={(e) => setEditData({...editData, realHours: e.target.value})} />
                        </div>
                      </div>

                      <label>Description</label>
                      <textarea value={editData.description} onChange={(e) => setEditData({...editData, description: e.target.value})} />
                      
                      <div className="details-actions">
                        <button className="btn-save" onClick={() => handleSaveEdit(task)}>Save Changes</button>
                        <button className="btn-cancel" onClick={() => setIsEditing(false)}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div className="view-mode">
                      <p><strong>Owner:</strong> {task.userName || "Not assigned"}</p>
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

      {/* 4. SECCIÓN DE INTELIGENCIA ARTIFICIAL */}
      <div className="ai-section" style={{ marginTop: "40px", padding: "20px", borderTop: "2px solid #555" }}>
        <button 
          className="btn-ai-magic" 
          onClick={handleAskAI} 
          disabled={isAiLoading}
          style={{ padding: '12px 24px', cursor: 'pointer', backgroundColor: '#9333ea', color: 'white', border: 'none', borderRadius: '8px' }}
        >
          {isAiLoading ? "🧠 Gemini is analyzing..." : "✨ Ask AI for My Priorities"}
        </button>

        {aiSuggestion && (
          <div className="ai-response-card" style={{ marginTop: "20px", padding: "20px", backgroundColor: "#1e1e2e", borderLeft: "5px solid #9333ea", borderRadius: "8px", color: "#e2e2e2" }}>
            <h3 style={{ color: "#a855f7", marginTop: 0 }}>🤖 AI Project Manager:</h3>
            <p style={{ whiteSpace: "pre-wrap", lineHeight: "1.6" }}>
              {aiSuggestion}
            </p>
          </div>
        )}
      </div>

    </section>
  );
}

export default TaskList;
