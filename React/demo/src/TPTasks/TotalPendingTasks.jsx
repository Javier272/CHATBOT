import React, { useState } from "react";
import { updateTask, deleteTask } from "../taskService";
import "./TotalPendingTasks.css";

function TotalPendingTasks({ tasks = [], setTasks, users = [] }) {
  const [selectedTaskId, setSelectedTaskId] = useState(null);

  const [editData, setEditData] = useState({
    title: "",
    description: "",
    dueDate: "",
    hoursEstimate: 0,
    realHours: 0,
    userId: "",
    sprint: "",
    status: ""
  });

  const today = new Date().toISOString().split("T")[0];

  // Todas las tareas agrupadas por sprint, sin filtro de estado
  const pendingTasks = tasks.filter(
    (task) => String(task.status).toLowerCase() !== "completed"
  );

  const groupedTasks = pendingTasks.reduce((acc, task) => {
    const sprint = task.sprint || "Sin Sprint";

    if (!acc[sprint]) acc[sprint] = [];

    acc[sprint].push(task);

    return acc;
  }, {});

  const getUserName = (task) => {
    if (task.userName) return task.userName;
    const user = users.find(u => String(u.id) === String(task.userId));
    return user ? user.name : "Unassigned";
  };

  const handleEditClick = (task) => {
    setSelectedTaskId(task.id);
    setEditData({
      title: task.title,
      description: task.description,
      dueDate: task.dueDate || "",
      hoursEstimate: task.hoursEstimate || 0,
      realHours: task.realHours || 0, 
      // Forzamos que sea String para que el <select> lo reconozca
      userId: task.userId ? String(task.userId) : "", 
      sprint: task.sprint || "",
      status: String(task.status || "pending").toLowerCase()
    });
  };

  const handleSaveEdit = async (task) => {

    if (!editData.userId || editData.userId === "") {
    alert("¡Error! No puedes guardar la tarea sin asignar a un responsable.");
    return; // Detiene por completo el guardado
  }

    const updatedTask = {
      ...task,
      ...editData,
      sprint: editData.sprint !== "" ? Number(editData.sprint) : null,
      hoursEstimate: Number(editData.hoursEstimate),
      realHours: Number(editData.realHours),
      userId: editData.userId ? Number(editData.userId) : task.userId
    };

    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? updatedTask : t))
    );
    setSelectedTaskId(null);

    try {
      await updateTask(updatedTask);
    } catch (err) {
      console.error("Error backend (pero UI actualizada):", err);
    }
  };

  const handleDeleteTask = async (id) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    try {
      await deleteTask(id);
    } catch (err) {
      console.error("Error eliminando en backend:", err);
    }
  };

  const hasTasks = Object.keys(groupedTasks).length > 0;

  const getStatusBadge = (status) => {
    const s = (status || "").toLowerCase();
    const styles = {
      completed:   { background: "#1a472a", color: "#6fcf97" },
      pending:     { background: "#3a2a00", color: "#f2c94c" },
      in_progress: { background: "#0d2b45", color: "#56ccf2" },
      started:     { background: "#0d2b45", color: "#56ccf2" },
    };
    const style = styles[s] || { background: "#2a2a2a", color: "#aaa" };
    return (
      <span style={{
        ...style,
        padding: "2px 8px",
        borderRadius: "4px",
        fontSize: "12px",
        fontWeight: 500
      }}>
        {status || "-"}
      </span>
    );
  };

  return (
    <div className="pending-wrapper">
      <h2 className="pending-title-main">Pending Tasks</h2>

      {!hasTasks ? (
        <div className="empty-table">
          <div className="pending-header">
            <span>Task</span><span>Description</span><span>Assigned</span>
            <span>Status</span><span>Due Date</span><span>Priority</span>
            <span>Est. Hours</span>
          </div>
          <div className="pending-row empty-row">
            <span>-</span><span>-</span><span>-</span><span>-</span>
            <span>-</span><span>-</span><span>-</span><span>-</span>
          </div>
        </div>
      ) : (
        Object.entries(groupedTasks).map(([sprintName, sprintTasks]) => (
          <div key={sprintName} className="sprint-group">
            <h3 className="sprint-title">Sprint: {sprintName}</h3>

            <div className="pending-header">
              <span>Task</span><span>Description</span><span>Assigned</span>
              <span>Status</span><span>Due Date</span><span>Priority</span>
              <span>Est. Hours</span>
            </div>

            {sprintTasks.map((task) => (
              <div key={task.id}>
                <div className="pending-row">
                  <span>{task.title}</span>
                  <span>{task.description || "-"}</span>
                  <span>{getUserName(task)}</span>
                  <span>{getStatusBadge(task.status)}</span>
                  <span>{task.dueDate || "-"}</span>
                  <span>{task.priority || "N/A"}</span>
                  <span>{task.hoursEstimate || 0}h</span>
                  <button className="btn-edit-table" onClick={() => handleEditClick(task)}>
                    Edit
                  </button>
                </div>

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
                      <select value={editData.userId} onChange={(e) => setEditData({ ...editData, userId: e.target.value })}>
                        {/* Esta opción solo se activa si userId está vacío */}
                        <option value="">No asignado</option>
                        
                        {users.map((u) => (
                          <option key={u.id} value={String(u.id)}>
                            {u.name}
                          </option>
                        ))}
                      </select>
                    </div>

                      <div className="edit-input-group">
                        <label>Sprint: </label>
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

                      <div className="edit-input-group">
                        <label>Real Hours: </label>
                        <input
                          type="number"
                          step="0.5"
                          value={editData.realHours}
                          onChange={(e) =>
                            setEditData({
                              ...editData,
                              realHours: e.target.value
                            })
                          }
                          placeholder="Real Hours"
                        />
                      </div>

                      <div className="edit-input-group">
                        <label>Status: </label>
                        <select
                          value={editData.status}
                          onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                        >
                          <option value="pending">Pending (To Do)</option>
                          <option value="in_progress">In Progress (Doing)</option>
                          <option value="completed">Completed (Done)</option>
                        </select>
                      </div>

                      <div className="edit-actions">
                        <button className="btn-save2" onClick={() => handleSaveEdit(task)}>Save</button>
                        <button className="btn-delete2" onClick={() => handleDeleteTask(task.id)}>Delete Task</button>
                        <button className="btn-cancel" onClick={() => setSelectedTaskId(null)}>Cancel</button>
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
