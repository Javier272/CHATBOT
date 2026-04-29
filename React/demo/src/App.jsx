import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import MyComTasks from "./MyCompleted/MyCompletedTasks";
import TaskList from "./TaskList/TaskList";
import Login from "./Login/Login";
import AddTask from "./AddTask/AddTask";
import TotalCompletedTasks from "./TComTask/TotalCompletedTasks";
import TotalPendingTasks from "./TPTasks/TotalPendingTasks";
import { getTasks, getUsers } from "./taskService";

import logo from "./assets/logo.png";
import "./App.css";
import "./TaskList/TaskList.css";
import "./MyCompleted/MyCompletedTasks.css";

function App() {
  // Control de vistas (navegación interna)
  const [vista, setVista] = useState("Mypending");

  // Lista global de tareas
  const [tasks, setTasks] = useState([]);

  // Lista global de usuarios (desde backend)
  const [users, setUsers] = useState([]);

  // Control del modal de login
  const [showLogin, setShowLogin] = useState(false);

  // Usuario actual logueado
  const [user, setUser] = useState(null);

  // Cargar datos al iniciar la app
  useEffect(() => {
    loadTasks();
    loadUsers();
  }, []);

  // Obtener tareas desde el backend
  const loadTasks = async () => {
    try {
      const data = await getTasks();
      console.log("DATA BACKEND:", data);
      setTasks(data);
    } catch (err) {
      console.error(err);
    }
  };

  // Obtener usuarios desde el backend
  const loadUsers = async () => {
    try {
      const data = await getUsers();
      setUsers(data);
    } catch (err) {
      console.error(err);
    }
  };

  // Manejo de login (usando backend)
  const handleLogin = (selectedUser) => {
    console.log("USER FINAL:", selectedUser);
    setUser(selectedUser);
    setShowLogin(false);
  };

  // Registro simple (no persistente)
  const handleRegister = (name) => {
    const newUser = { id: Date.now(), name };
    setUser(newUser);
  };

  // Filtrar tareas del usuario actual (soporta userId y user_id)
  const tareasFiltradas = user
    ? tasks.filter(
        (task) =>
          String(task.userId || task.user_id) === String(user.id)
      )
    : [];

  // Refrescar tareas después de crear una nueva
  const addNewTask = async () => {
    await loadTasks(); // importante: sincroniza con backend
    setVista("Mypending");
  };

  return (
    <>
      {/* HEADER */}
      <header className="header">
        {/* Botón de login o usuario actual */}
        <button className="btn-login" onClick={() => setShowLogin(true)}>
          {user ? `User: ${user.name}` : "Login"}
        </button>

        {/* Logo y título */}
        <div className="header-title-container">
          <img src={logo} alt="Logo" className="hero-logo" />
          <h1>OnTeamTasks</h1>
        </div>
      </header>

      {/*LOGIN */}
      {showLogin && (
        <Login
          onLogin={handleLogin}
          onRegister={handleRegister}
          onClose={() => setShowLogin(false)}
        />
      )}

      {/* LAYOUT PRINCIPAL */}
      <div className="layout">
        {/* SIDEBAR */}
        <section id="lateral">
          <Sidebar setVista={setVista} />
        </section>

        {/* CONTENIDO CENTRAL */}
        <section id="center">

          {/* Vista para agregar tarea */}
          {vista === "add" && (
            <AddTask
              user={user}
              reloadTasks={loadTasks} // backend sync directo
              onTaskCreated={addNewTask}
              onCancel={() => setVista("Mypending")}
              
            />
          )}

          {vista !== "add" && (
            <>
              {/* Tareas completadas del usuario */}
              {(vista === "MyAnalytics" || vista === "Mycompleted") && (
                <MyComTasks tasks={tareasFiltradas} />
              )}

              {/* Analytics de todo el equipo */}
              {vista === "TeamAnalytics" && (
                <TotalCompletedTasks
                  tasks={tasks}
                  users={users}
                />
              )}

              {/* Tareas pendientes del usuario */}
              {(vista === "Mypending" || vista === "Individual") && (
                <TaskList
                  tasks={tareasFiltradas}
                  users={users}
                  setTasks={setTasks}
                />
              )}

              {/* Todas las tareas pendientes */}
              {vista === "TotalPending" && (
                <TotalPendingTasks
                  tasks={tasks}
                  setTasks={setTasks}
                  users={users}
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