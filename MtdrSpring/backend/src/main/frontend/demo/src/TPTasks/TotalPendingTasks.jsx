import React, { useState } from "react";
import { updateTask, deleteTask } from "../taskService";
import "./TotalPendingTasks.css";

function TotalPendingTasks({ tasks = [], setTasks, users = [] }) {
  // Estado para controlar qué tarea se está editando
  const [selectedTaskId, setSelectedTaskId] = useState(null);

  // Estado del formulario de edición con horas estimadas
  const [editData, setEditData] = useState({
    title: "",
    description: "",
    dueDate: "",
    estimatedHours: 0
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

  // Búsqueda de nombre de usuario para mostrar en la tabla
  const getUserName = (id) => {
    const user = users.find(u => String(u.id) === String(id));
    return user ? user.name : "Unassigned";
  };

  // Función para preparar la edición (abre el panel)
  const handleEditClick = (task) => {
    setSelectedTaskId(task.id);
    setEditData({
      title: task.title,
      description: task.description,
      dueDate: task.dueDate,
      estimatedHours: task.estimatedHours || 0
    });
  };

  // Guardado de cambios tras editar la tarea
  const handleSaveEdit = async (task) => {
    try {
      const updatedTask = { ...task, ...editData };
      await updateTask(updatedTask);
      setTasks((prev) => prev.map((t) => (t.id === task.id ? updatedTask : t)));
      setSelectedTaskId(null); // Cerrar panel tras guardar
    } catch (err) {
      console.error(err);
    }
  };

  // Eliminación de tarea
  const handleDeleteTask = async (id) => {
    try {
      await deleteTask(id);
      setTasks((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="pending-wrapper">
      <h2 className="pending-title-main">Total Pending Tasks</h2>

      {/* Renderizado dinámico de grupos de sprints */}
      {Object.entries(groupedTasks).map(([sprintName, sprintTasks]) => (
        <div key={sprintName} className="sprint-group">
          <h3 className="sprint-title">
            {sprintName === "Sin Sprint" ? sprintName : `${sprintName}`}
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
                <span>{getUserName(task.userId)}</span>
                <span>{task.dueDate || "-"}</span>
                <span>{task.priority || "N/A"}</span>
                <span>{task.estimatedHours || 0}h</span>
                <button className="btn-edit-table" onClick={() => handleEditClick(task)}>Edit</button>
              </div>

              {/* Panel de edición desplegable (Inline) */}
              {selectedTaskId === task.id && (
                <div className="edit-row">
                  <div className="edit-form-inline">
                    <input value={editData.title} onChange={(e) => setEditData({...editData, title: e.target.value})} placeholder="Title" />
                    
                    <input type="date" min={today} value={editData.dueDate} onChange={(e) => setEditData({...editData, dueDate: e.target.value})} />
                    
                    <input value={editData.description} onChange={(e) => setEditData({...editData, description: e.target.value})} placeholder="Description" />
                    
                    <input type="number" value={editData.estimatedHours} onChange={(e) => setEditData({...editData, estimatedHours: Number(e.target.value)})} placeholder="Hours" />

                    <button className="btn-save2" onClick={() => handleSaveEdit(task)}>Save</button>
                    <button className="btn-delete2" onClick={() => handleDeleteTask(task.id)}>Delete Task</button>
                    <button className="btn-cancel" onClick={() => setSelectedTaskId(null)}>Cancel</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export default TotalPendingTasks;