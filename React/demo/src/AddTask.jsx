import { useState } from "react";
import { createTask } from "./taskService";
import "./AddTask.css";

function AddTask({ onCancel, user, reloadTasks }) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [priority, setPriority] = useState("Low");
  const [desc, setDesc] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 🔄 convertir prioridad
    const priorityNumber =
      priority === "High" ? 5 :
      priority === "Medium" ? 3 : 1;

    const newTask = {
      userId: user.id,
      title: title,
      description: desc,
      status: "pending",
      priority: priorityNumber,
      dueDate: date,
      category: null,
      teamId: null,
      isDeleted: 0
    };

    try {
      await createTask(newTask);
      await reloadTasks(); // 🔥 refresca desde backend
      onCancel();
    } catch (err) {
      console.error(err);
    }
  };

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
        </div>

        <div className="form-group">
          <h3>Settings</h3>
          
          <div className="row">
            <div className="field-container">
              <label>Due Date</label>
              <input 
                type="date" 
                value={date} 
                onChange={(e) => setDate(e.target.value)} 
                required 
              />
            </div>
            
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