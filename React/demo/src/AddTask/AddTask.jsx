import { useState, useEffect } from "react";
import { createTask, getUsers, getSprints } from "../taskService";
import "./AddTask.css";

function AddTask({ onCancel, reloadTasks }) {

  // 🧾 Datos básicos
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [priority, setPriority] = useState("Low");
  const [desc, setDesc] = useState("");

  // ⏱️ Horas
  const [estimatedHours, setEstimatedHours] = useState("");
  const [actualHours] = useState(0);

  // 🚀 Sprint
  const [sprint, setSprint] = useState("");
  const [sprints, setSprints] = useState([]);

  // 👥 Usuarios
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState("");

  const [loading, setLoading] = useState(true);

  // 🔄 Cargar usuarios y sprints
  useEffect(() => {
    const loadData = async () => {
      try {
        const [usersData, sprintsData] = await Promise.all([
          getUsers(),
          getSprints()
        ]);

        setUsers(usersData);
        setSprints(sprintsData);

        if (usersData.length > 0) {
          setSelectedUser(usersData[0].id);
        }

        if (sprintsData.length > 0) {
          setSprint(sprintsData[0].name || sprintsData[0]);
        }

      } catch (error) {
        console.error("Error cargando datos:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // 📝 Submit
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
      sprint
    };

    try {
      await createTask(newTask);
      await reloadTasks();
      onCancel();
    } catch (err) {
      console.error("Error creando tarea:", err);
      alert("No se pudo crear la tarea");
    }
  };

  if (loading) return <p>Cargando...</p>;

  return (
    <section className="add-task-container">
      <h2>Add New Task</h2>

      <form onSubmit={handleSubmit} className="task-form">

        <div className="form-group">
          <h3>Task Info</h3>

          <input 
            type="text"
            placeholder="Task Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <textarea 
            placeholder="Description"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
          />

          <div className="row">
            <input
              type="number"
              placeholder="Estimated Hours"
              value={estimatedHours}
              onChange={(e) => setEstimatedHours(e.target.value)}
            />
          </div>
        </div>

        <div className="form-group">
          <h3>Settings</h3>

          <div className="row">

            {/* 👤 Usuario */}
            <div className="field-container">
              <label>Assign To</label>
              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                required
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} (ID: {u.id})
                  </option>
                ))}
              </select>
            </div>

            {/* 🚀 Sprint */}
            <div className="field-container">
              <label>Sprint</label>
              <select
                value={sprint}
                onChange={(e) => setSprint(e.target.value)}
              >
                {sprints.map((s, i) => (
                  <option key={i} value={s.name || s}>
                    {s.name || s}
                  </option>
                ))}
              </select>
            </div>

            {/* 📅 Fecha */}
            <div className="field-container">
              <label>Due Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>

            {/* ⚡ Prioridad */}
            <div className="field-container">
              <label>Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>

          </div>
        </div>

        <div className="form-buttons">
          <button type="submit" className="btn-save">
            Save Task
          </button>

          <button
            type="button"
            className="btn-cancel"
            onClick={onCancel}
          >
            Cancel
          </button>
        </div>

      </form>
    </section>
  );
}

export default AddTask;