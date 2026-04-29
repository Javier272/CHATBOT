import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import MyComTasks from "./MyCompletedTasks";
import TaskList from "./TaskList";
import Login from "./Login";
import AddTask from "./AddTask";
import TotalCompletedTasks from "./TotalCompletedTasks";
import { getTasks } from "./taskService";

import logo from "./assets/logo.png";
import "./App.css";
import "./TaskList.css";
import "./MyCompletedTasks.css";

function App() {
  const [vista, setVista] = useState("Mypending");
  const [tasks, setTasks] = useState([]);
  const [showLogin, setShowLogin] = useState(false);
  const [user, setUser] = useState(null);

  // cargar tareas del backend
  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const data = await getTasks();
      console.log("DATA BACKEND:", data); 
      setTasks(data);
    } catch (err) {
      console.error(err);
    }
  };

  // login simple (sin store)
  const handleLogin = (selectedUser) => {
    setUser(selectedUser);
    setShowLogin(false);
  };

  const handleRegister = (name) => {
    const newUser = { id: Date.now(), name };
    setUser(newUser);
  };

  // filtrar por userId (formato backend)
  const tareasFiltradas = user
  ? tasks.filter(task => 
      String(task.userId || task.user_id) === String(user.id)
    )
  : [];

  // agregar tarea (simple)
  const addNewTask = (newTask) => {
    setTasks(prev => [...prev, newTask]);
    setVista("Mypending");
  };

  return (
    <>
      {/* HEADER */}
      <header className="header">
        <button className="btn-login" onClick={() => setShowLogin(true)}>
          {user ? `User: ${user.name}` : "Login"}
        </button>

        <div className="header-title-container">
          <img src={logo} alt="Logo" className="hero-logo" />
          <h1>OnTeamTasks</h1>
        </div>
      </header>

      {/* LOGIN */}
      {showLogin && (
        <Login 
          onLogin={handleLogin} 
          onRegister={handleRegister}
          onClose={() => setShowLogin(false)}
        />
      )}

      {/* LAYOUT */}
      <div className="layout">
        <section id="lateral">
          <Sidebar setVista={setVista} />
        </section>

        <section id="center">
          
          {/* ADD */}
          {vista === "add" && (
            <AddTask 
              user={user}
              reloadTasks={loadTasks}
              onCancel={() => setVista("Mypending")}
            />
          )}

          {/* RESTO */}
          {vista !== "add" && (
            <>
              {(vista === "MyAnalytics" || vista === "Mycompleted") && (
                <MyComTasks tasks={tareasFiltradas} />
              )}

              {vista === "TeamAnalytics" && (
                <TotalCompletedTasks tasks={tasks} /> 
              )}

              {(vista === "Mypending" || vista === "Individual") && (
                <TaskList
                  tasks={tareasFiltradas}
                  setTasks={setTasks}
                />
              )}
            </>
          )}
        </section>
      </div>
    </>
  );
}

export default App;