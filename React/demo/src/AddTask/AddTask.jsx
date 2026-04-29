import { useState, useEffect } from "react";
import { createTask, getUsers } from "../taskService";
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

  // 🏷️ Sprint (número)
  const [sprint, setSprint] = useState("1");

  // 👥 Usuarios
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(""); // 👈 Guardamos el ID

  const [loading, setLoading] = useState(true);

  // 🔄 Cargar usuarios
  useEffect(() => {
    const loadData = async () => {
      try {
        const usersData = await getUsers();
        setUsers(usersData);

        // Al cargar, pre-seleccionamos el ID del primer usuario si existe
        if (usersData.length > 0) {
          setSelectedUserId(usersData[0].id);
        }

      } catch (error) {
        console.error("Error cargando usuarios:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // 📝 Submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Verificación de campos obligatorios
    if (!selectedUserId || !sprint) {
      alert("Completa los campos obligatorios");
      return;
    }

    const priorityNumber =
      priority === "High" ? 5 :
      priority === "Medium" ? 3 : 1;

    // 🚀 OBJETO PARA LA BASE DE DATOS
    const newTask = {
      // ENVIAMOS EL ID COMO NÚMERO (CRÍTICO)
      userId: Number(selectedUserId), 
      title,
      description: desc,
      status: "pending",
      priority: priorityNumber,
      dueDate: date,
      category: null,
      teamId: null,
      isDeleted: 0,

      // Nombre exacto según tu DB: hoursEstimate
      hoursEstimate: Number(estimatedHours) || 0,
      realHours: Number(actualHours) || 0,

      // Sprint como número
      sprint: Number(sprint)
    };

    try {
      console.log("Enviando ID de usuario:", newTask.userId); 
      
      // 1. Guardamos en la base de datos
      await createTask(newTask);
      
      // 2. IMPORTANTE: Forzamos la recarga de tareas en el componente padre
      // Asegúrate de que en el componente padre, reloadTasks() vuelva a llamar a getTasks()
      if (reloadTasks) {
        await reloadTasks();
      }
      
      // 3. Cerramos el formulario
      onCancel();
    } catch (err) {
      console.error("Error creando tarea:", err);
      alert("No se pudo crear la tarea");
    }
  };

  if (loading) return <p>Cargando usuarios...</p>;

  return (
    <section className="add-task-container">
      <h2>Add New Task</h2>

      <form onSubmit={handleSubmit} className="task-form">

        {/* 📌 TASK INFO */}
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

          <input
            type="number"
            placeholder="Estimated Hours"
            value={estimatedHours}
            onChange={(e) => setEstimatedHours(e.target.value)}
          />
        </div>

        {/* ⚙️ SETTINGS */}
        <div className="form-group">
          <h3>Settings</h3>

          <div className="row">

            {/* 👤 Usuario (Select por ID) */}
            <div className="field-container">
              <label>Assign To</label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                required
              >
                <option value="">Select User...</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 🏷️ Sprint */}
            <div className="field-container">
              <label>Sprint</label>
              <input
                type="number"
                min="1"
                value={sprint}
                onChange={(e) => setSprint(e.target.value)}
                required
              />
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

        {/* 🔘 BOTONES */}
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