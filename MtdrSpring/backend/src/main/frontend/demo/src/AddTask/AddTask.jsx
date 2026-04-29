import { useState, useEffect } from "react";
import { createTask, getUsers, getSprints } from "../taskService";
import "./AddTask.css";

function AddTask({ onCancel, reloadTasks }) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [priority, setPriority] = useState("Low");
  const [desc, setDesc] = useState("");
  const [estimatedHours, setEstimatedHours] = useState("");
  const [actualHours, setActualHours] = useState("");
  const [sprint, setSprint] = useState("");
  const [sprints, setSprints] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState("");

  const nombres = { 1: "Diego", 2: "Javier", 3: "Paco", 4: "Álvaro" };

  // 1. Definimos las funciones de carga fuera de los useEffect para que sean accesibles
  const loadInitialData = async () => {
    try {
      // Cargamos ambos en paralelo
      const [userData, sprintData] = await Promise.all([
        getUsers(),
        getSprints()
      ]);

      setUsers(userData);
      if (userData.length > 0) setSelectedUser(userData[0].id);

      setSprints(sprintData);
      if (sprintData.length > 0) setSprint(sprintData[0].id);

    } catch (error) {
      console.error("Error cargando datos iniciales:", error);
    }
  };

  // 2. Un solo useEffect para arrancar todo
 // AddTask.jsx
useEffect(() => {
  if (!localStorage.getItem("token")) return; // 👈 esto falta
  loadInitialData();
}, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedUser) {
      alert("Selecciona un usuario");
      return;
    }

    const priorityNumber =
      priority === "High" ? 5 :
      priority === "Medium" ? 3 : 1;

    const newTask = {
      userId: Number(selectedUser),
      title,
      description: desc,
      status: "pending",
      priority: priorityNumber,
      dueDate: date,
      category: null,
      teamId: null,
      isDeleted: 0,
      estimatedHours: Number(estimatedHours) || 0,
      actualHours: Number(actualHours) || 0,
      sprintId: Number(sprint) // Asegúrate de que el backend espere 'sprintId' o 'sprint'
    };

    try {
      await createTask(newTask);
      await reloadTasks();
      onCancel();
    } catch (err) {
      console.error("Error creando tarea:", err);
      alert("Error al crear la tarea. Revisa la consola.");
    }
  };

  return (
    <section className="add-task-container">
      {/* ... (Tu JSX del formulario se mantiene igual) ... */}
      <h2>Add New Task</h2>
      <form onSubmit={handleSubmit} className="task-form">
        {/* Renderiza tus inputs aquí igual que antes */}
        <div className="form-group">
           <input type="text" placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} required />
           <textarea placeholder="Description" value={desc} onChange={e => setDesc(e.target.value)} />
           <input type="number" placeholder="Hours" value={estimatedHours} onChange={e => setEstimatedHours(e.target.value)} />
        </div>

        <div className="form-group">
          <label>Assign To</label>
          <select value={selectedUser} onChange={e => setSelectedUser(e.target.value)} required>
            {users.map(u => (
              <option key={u.id} value={u.id}>
                {nombres[u.id] || u.name || "Usuario"} (ID: {u.id})
              </option>
            ))}
          </select>

          <label>Sprint</label>
          <select value={sprint} onChange={e => setSprint(e.target.value)}>
            {sprints.map(s => (
              <option key={s.id} value={s.id}>{s.name || `Sprint ${s.id}`}</option>
            ))}
          </select>

          <label>Due Date</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} required />
        </div>

        <div className="form-buttons">
          <button type="submit" className="btn-save">Save Task</button>
          <button type="button" className="btn-cancel" onClick={onCancel}>Cancel</button>
        </div>
      </form>
    </section>
  );
}

export default AddTask;