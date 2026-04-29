import React, { useState } from "react";
import { updateTask, deleteTask } from "../taskService";
import "./TotalPendingTasks.css";

function TotalPendingTasks({ tasks = [], setTasks, users = [] }) {
  // Estado para controlar qué tarea se está editando
  const [selectedTaskId, setSelectedTaskId] = useState(null);

  // Estado del formulario de edición con horas estimadas
  // Se añadieron userId y sprint para permitir su edición
  const [editData, setEditData] = useState({
    title: "",
    description: "",
    dueDate: "",
    hoursEstimate: 0, // Ajustado al nombre de tu DB
    userId: "",
    sprint: ""
  });

  // Fecha para limitar selección en el date picker
  const today = new Date().toISOString().split("T")[0];

  // Filtrado de tareas que solo están en estado "pending"
  const pendingTasks = tasks.filter((t) => t?.status?.toLowerCase() === "pending");

  // Agrupación de tareas por sprint para visualización
  const groupedTasks = pendingTasks.reduce((acc, task) => {
    const sprint = task.sprint || "Sin Sprint";
    if (!acc[sprint]) acc[sprint] = [];
    acc[sprint].push(task);
    return acc;
  }, {});

  // 🛠️ Búsqueda de nombre de usuario
  // Ahora prioriza 'userName' que viene del backend en la respuesta del JSON
  const getUserName = (task) => {
    if (task.userName) return task.userName; 
    
    // Respaldo: busca en la lista de usuarios por ID si userName no existe
    const user = users.find(u => String(u.id) === String(task.userId));
    return user ? user.name : "Unassigned";
  };

  // Función para preparar la edición (abre el panel)
  const handleEditClick = (task) => {
    setSelectedTaskId(task.id);
    setEditData({
      title: task.title,
      description: task.description,
      dueDate: task.dueDate || "",
      hoursEstimate: task.hoursEstimate || 0,
      userId: task.userId || "",
      sprint: task.sprint || ""
    });
  };

  // Guardado de cambios tras editar la tarea
  const handleSaveEdit = async (task) => {
    const updatedTask = { 
      ...task, 
      ...editData,
      sprint: editData.sprint !== "" ? Number(editData.sprint) : null,
      hoursEstimate: Number(editData.hoursEstimate),
      userId: editData.userId ? Number(editData.userId) : task.userId
    };

    // Primero actualizamos la UI (aunque backend falle)
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? updatedTask : t))
    );
    setSelectedTaskId(null); // Cerrar panel tras guardar

    try {
      await updateTask(updatedTask);
    } catch (err) {
      console.error("Error backend (pero UI actualizada):", err);
    }
  };

  // Eliminación de tarea
  const handleDeleteTask = async (id) => {
    // Eliminamos en UI primero
    setTasks((prev) => prev.filter((t) => t.id !== id));

    try {
      await deleteTask(id);
    } catch (err) {
      console.error("Error eliminando en backend:", err);
    }
  };

  const hasTasks = Object.keys(groupedTasks).length > 0;

  return (
    <div className="pending-wrapper">
      <h2 className="pending-title-main">Total Pending Tasks</h2>

      {/* 👇 TABLA VACÍA PERO ESTRUCTURADA */}
      {!hasTasks ? (
        <div className="empty-table">
          <div className="pending-header">
            <span>Task</span> <span>Description</span> <span>Assigned</span>
            <span>Due Date</span> <span>Priority</span> <span>Est. Hours</span> <span>Actions</span>
          </div>
          <div className="pending-row empty-row">
            <span>-</span><span>-</span><span>-</span><span>-</span><span>-</span><span>-</span><span>-</span>
          </div>
        </div>
      ) : (
        Object.entries(groupedTasks).map(([sprintName, sprintTasks]) => (
          <div key={sprintName} className="sprint-group">
            <h3 className="sprint-title">
             Sprint : {sprintName === "Without Assignation" ? sprintName : `${sprintName}`}
            </h3>

            {/* Cabecera de la lista de tareas */}
            <div className="pending-header">
              <span>Task</span> <span>Description</span> <span>Assigned</span>
              <span>Due Date</span> <span>Priority</span> <span>Est. Hours</span> <span>Actions</span>
            </div>

            {/* Mapeo de cada tarea en el sprint */}
            {sprintTasks.map((task) => (
              <div key={task.id}>
                <div className="pending-row">
                  <span>{task.title}</span>
                  <span>{task.description || "-"}</span>
                  
                  {/* Se usa la función actualizada que lee userName */}
                  <span>{getUserName(task)}</span>
                  
                  <span>{task.dueDate || "-"}</span>
                  <span>{task.priority || "N/A"}</span>
                  <span>{task.hoursEstimate || 0}h</span>

                  <button className="btn-edit-table" onClick={() => handleEditClick(task)}>
                    Edit
                  </button>
                </div>

                {/* Panel de edición desplegable (Inline) */}
                {selectedTaskId === task.id && (
                  <div className="edit-row">
                    <div className="edit-form-inline">
                      
                      <div className="edit-input-group">
                        <label>Title: </label>
                        <input
                          value={editData.title}
                          onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                          placeholder="Title"
                        />
                      </div>

                      <div className="edit-input-group">
                        <label>Assigned To: </label>
                        {/* Selector para asignar persona */}
                        <select
                          value={editData.userId}
                          onChange={(e) => setEditData({ ...editData, userId: e.target.value })}
                        >
                          <option value="">Assign Person...</option>
                          {users.map((u) => (
                            <option key={u.id} value={u.id}>{u.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="edit-input-group">
                        <label>Sprint: </label>
                        {/* Input para cambiar Sprint */}
                        <input
                          type="number"
                          value={editData.sprint}
                          onChange={(e) => setEditData({ ...editData, sprint: e.target.value })}
                          placeholder="Sprint"
                        />
                      </div>

                      <div className="edit-input-group">
                        <label>Due Date: </label>
                        <input
                          type="date"
                          min={today}
                          value={editData.dueDate}
                          onChange={(e) => setEditData({ ...editData, dueDate: e.target.value })}
                        />
                      </div>

                      <div className="edit-input-group">
                        <label>Description: </label>
                        <input
                          value={editData.description}
                          onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                          placeholder="Description"
                        />
                      </div>

                      <div className="edit-input-group">
                        <label>Est. Hours: </label>
                        <input
                          type="number"
                          value={editData.hoursEstimate}
                          onChange={(e) => setEditData({ ...editData, hoursEstimate: e.target.value })}
                          placeholder="Hours"
                        />
                      </div>

                      <div className="edit-actions">
                        <button className="btn-save2" onClick={() => handleSaveEdit(task)}>
                          Save
                        </button>
                        <button className="btn-delete2" onClick={() => handleDeleteTask(task.id)}>
                          Delete Task
                        </button>
                        <button className="btn-cancel" onClick={() => setSelectedTaskId(null)}>
                          Cancel
                        </button>
                      </div>

                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ))
      )}
    </div>
  );
}

export default TotalPendingTasks;