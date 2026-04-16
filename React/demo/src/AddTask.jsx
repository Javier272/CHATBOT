import { useState } from "react";
import { getUsers } from "./tasksStore";

function AddTask({ onAddTask, onCancel }) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [priority, setPriority] = useState("Low");
  const [respId, setRespId] = useState(1);
  const [desc, setDesc] = useState("");

  const users = getUsers();

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Creamos el objeto con la estructura que ya manejas
    const newTask = {
      id: Date.now(), // ID temporal único
      title,
      date,
      priority,
      completed: false,
      started: false,
      description: desc,
      responsableId: parseInt(respId)
    };

    onAddTask(newTask);
  };

  return (
    <section className="add-task-container">
      <h2>Add New Task</h2>
      <form onSubmit={handleSubmit} className="task-form">
        <input type="text" placeholder="Task Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        
        <select value={priority} onChange={(e) => setPriority(e.target.value)}>
          <option value="Low">Low</option>
          <option value="Medium">Medium</option>
          <option value="High">High</option>
        </select>

        <select value={respId} onChange={(e) => setRespId(e.target.value)}>
          {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>

        <textarea placeholder="Description" value={desc} onChange={(e) => setDesc(e.target.value)} />
        
        <div className="form-buttons">
          <button type="submit" className="btn-save">Save Task</button>
          <button type="button" className="btn-cancel" onClick={onCancel}>Cancel</button>
        </div>
      </form>
    </section>
  );
}

export default AddTask;