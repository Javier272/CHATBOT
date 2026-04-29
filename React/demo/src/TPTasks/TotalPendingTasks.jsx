import React, { useState } from "react";
import { updateTask, deleteTask } from "../taskService";
import "./TotalPendingTasks.css";

function TotalPendingTasks({ tasks = [], setTasks, users = [] }) {
  // Estado para controlar qué tarea se está editando
  const [selectedTaskId, setSelectedTaskId] = useState(null);

  // Estado del formulario de edición
  // NOTA: Usamos hoursEstimate para coincidir con tu base de datos
  const [editData, setEditData] = useState({
    title: "",
    description: "",
    dueDate: "",
    hoursEstimate: 0, 
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
      dueDate: task.dueDate || "",
      hoursEstimate: task.hoursEstimate || 0,
      userId: task.userId || "",
      sprint: task.sprint || ""
    });
  };

  // Guardado de cambios tras editar la tarea
  const handleSaveEdit = async (task) => {
    // 🛠️ MAPEADO DE DATOS: Forzamos tipos numéricos para Sprint y Horas
    const taskToSave = { 
      ...task, 
      ...editData,
      // Convertimos a número porque tu DB lo pide así
      sprint: editData.sprint !== "" ? Number(editData.sprint) : null,
      hoursEstimate: editData.hoursEstimate !== "" ? Number(editData.hoursEstimate) : null,
      userId: editData.userId ? Number(editData.userId) : null
    };

    // Primero actualizamos la UI
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? taskToSave : t))
    );
    setSelectedTaskId(null);

    try {
      // 🚀 Envío a la base de datos (PUT)
      await updateTask(taskToSave);
      console.log("✅ Guardado exitoso en DB");
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
              {sprintName === "Sin Sprint" ? sprintName : `Sprint ${sprintName}`}
            </h3>

            <div className="pending-header">
              <span>Task</span> <span>Description</span> <span>Assigned</span>
              <span>Due Date</span> <span>Priority</span> <span>Est. Hours</span> <span>Actions</span>
            </div>

            {sprintTasks.map((task) => (
              <div key={task.id}>
                <div className="pending-row">
                  <span>{task.title}</span>
                  <span>{task.description || "-"}</span>
                  <span>{getUserName(task.userId)}</span>
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
                      <input
                        value={editData.title}
                        onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                        placeholder="Title"
                      />

                      {/* Selector Persona */}
                      <select
                        value={editData.userId}
                        onChange={(e) => setEditData({ ...editData, userId: e.target.value })}
                      >
                        <option value="">Assign Person...</option>
                        {users.map((u) => (
                          <option key={u.id} value={u.id}>{u.name}</option>
                        ))}
                      </select>

                      {/* Input Sprint (ahora tipo número) */}
                      <input
                        type="number"
                        value={editData.sprint}
                        onChange={(e) => setEditData({ ...editData, sprint: e.target.value })}
                        placeholder="Sprint #"
                      />

                      <input
                        type="date"
                        min={today}
                        value={editData.dueDate}
                        onChange={(e) => setEditData({ ...editData, dueDate: e.target.value })}
                      />

                      <input
                        value={editData.description}
                        onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                        placeholder="Description"
                      />

                      {/* Horas Estimadas (hoursEstimate) */}
                      <input
                        type="number"
                        value={editData.hoursEstimate}
                        onChange={(e) => setEditData({ ...editData, hoursEstimate: e.target.value })}
                        placeholder="Hours"
                      />

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