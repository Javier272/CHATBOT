import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import MyComTasks from "./MyCompleted/MyCompletedTasks";
import TaskList from "./TaskList/TaskList";
import Login from "./Login/Login";
import ChangePassword from "./Login/ChangePassword"; 
import AddTask from "./AddTask/AddTask";
import TotalCompletedTasks from "./TComTask/TotalCompletedTasks";
import TotalPendingTasks from "./TPTasks/TotalPendingTasks";
import CompletedTasks from "./CompletedTasks/CompletedTasks";
import { getTasks, getUsers, BASE_URL } from "./taskService";
import TotalTasks from "./TotalTasks/TotalTasks";
import SprintOverviewCharts from "./TComTask/SprintOverviewCharts";

import logo from "./assets/logo.png";
import login from "./assets/login.png";
import team from "./assets/team.png";

import "./App.css";
import "./TaskList/TaskList.css";
import "./MyCompleted/MyCompletedTasks.css";
                 
function App() {
  // Control de vistas (navegación interna)
  const [vista, setVista] = useState("TeamAnalytics");

  // Lista global de tareas 
  const [tasks, setTasks] = useState([]);

  // Lista global de usuarios (desde backend)
  const [users, setUsers] = useState([]);

  // Control del modal de login
  const [showLogin, setShowLogin] = useState(false);
  
  // Control del modal de cambio de contraseña
  const [showChangePassword, setShowChangePassword] = useState(false);

  // Usuario actual logueado
  const [user, setUser] = useState(null);

  // Cargar datos al iniciar la app
  useEffect(() => {
    loadTasks();
    loadUsers();
    checkSession();
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

// checkSession()
  const checkSession = async () => {

    const token = localStorage.getItem("token");

    if (!token) {
      setUser(null);
      return;
    }

    try {

      const response = await fetch(`${BASE_URL}/users/me`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Token inválido");
      }

      const data = await response.json();

      setUser(data);

      await loadTasks();
      await loadUsers();

    } catch (error) {

      console.error(error);

      localStorage.removeItem("token");

      setUser(null);
    }
  };

  // Manejo de login (usando backend)
  const handleLogin = async (loginResponse) => {

    console.log("LOGIN:", loginResponse);

    // guardar JWT
    localStorage.setItem("token", loginResponse.token);

    // guardar usuario
    setUser({
      id: loginResponse.id,
      name: loginResponse.name,
      email: loginResponse.email,
    });

    await loadTasks();
    await loadUsers();

    setShowLogin(false);
  };

  // Registro simple (no persistente)
  const handleRegister = (name) => {
    const newUser = { id: Date.now(), name };
    setUser(newUser);
  };

  // NUEVA FUNCIÓN PARA OLVIDASTE CONTRASEÑA
  const handleForgotPassword = () => {
    setShowLogin(false);
    setShowChangePassword(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  // Filtrar tareas del usuario actual (soporta userId y user_id)
  const tareasFiltradas = user
  ? tasks.filter((task) => {
      // Normalizamos IDs a string para evitar errores de tipo
      const taskId = String(task.userId || task.user_id || "");
      const currentUserId = String(user.id);
      
      // Filtramos por ID, que es lo más seguro
      return taskId === currentUserId;
    })
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
<div className="header-actions">
 {user && (
    <button className="btn-logout" onClick={handleLogout}>
      Logout
    </button>
  )}
  {user && (
    <button
      className="btn-change-pw"
      onClick={() => setShowChangePassword(true)}
    >
      <i className="fas fa-key"></i>
      Change Password
    </button>
    
  )}


  <button
    className={`btn-login ${user ? "logged" : ""}`}
    onClick={() => setShowLogin(true)}
  >
    <div className="login-icon-wrapper">
      <img src={login} alt="Login" className="img-login" />
    </div>

    <div className="login-info">
      <span className="login-label">
        {user ? "Connected " : "Account "}
      </span>

      <span className="login-user">
        {user ? user.name : "Login"}
      </span>
    </div>
  </button>
</div>

        {/* Logo */}

        {/* Logo */}
        <div className="header-title-container">
          <div className="logo-wrapper">
            <img src={logo} alt="Logo" className="hero-logo" />
          </div>
        </div>
      </header>

      {/* LOGIN */}
      {showLogin && (
        <Login
          onLogin={handleLogin}
          onRegister={handleRegister}
          onForgotPassword={handleForgotPassword}
          onClose={() => setShowLogin(false)}
          
        />
        
      )}

      {/* MODAL CAMBIO CONTRASEÑA */}
      {/* Así debe quedar para que los usuarios aparezcan */}
      {showChangePassword && (
        <ChangePassword
          users={users} 
          onClose={() => setShowChangePassword(false)}
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
                  currentUser={user}
                />
              )}

              {/* Tareas pendientes del usuario */}
              {(vista === "Mypending") && (
                <TaskList
                  tasks={tareasFiltradas.filter(t => t.status !== 'completed')} // Filtro explícito para pendientes
                  users={users}
                  setTasks={setTasks}
                  currentUser={user} 
                />
              )}

              {(vista === "Mycompleted") && (
                <TaskList
                  tasks={tareasFiltradas.filter(t => t.status === 'completed')} // Filtro explícito para completadas
                  users={users}
                  setTasks={setTasks}
                  currentUser={user} 
                />
              )}

              {/* Todas las tareas pendientes */}
              {vista === "TotalPendingTasks" && (
                <TotalPendingTasks
                  tasks={tasks}
                  setTasks={setTasks}
                  users={users}
                />
              )}

                {/* Todas las tareas Completadas */}
              {vista === "CompletedTasks" && (
                <CompletedTasks
                  tasks={tasks.filter(t => t.status === "completed")}
                  setTasks={setTasks}
                  users={users}
                />
              )}

                {/* Todas las tareas Completadas */}
              {vista === "TotalTasks" && (
                <TotalTasks
                  tasks={tasks}
                  setTasks={setTasks}
                  users={users}
                />
              )}

                {/* Todas las tareas Completadas */}
              {vista === "SprintOverviewCharts " && (
                <SprintOverviewCharts 
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