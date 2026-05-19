import { useState, useEffect, useCallback } from "react";
import Sidebar from "./Sidebar";
import MyComTasks from "./MyCompleted/MyCompletedTasks";
import TaskList from "./TaskList/TaskList";
import Login from "./Login/Login";
import ChangePassword from "./Login/ChangePassword"; 
import AddTask from "./AddTask/AddTask";
import TotalCompletedTasks from "./TComTask/TotalCompletedTasks";
import TotalPendingTasks from "./TPTasks/TotalPendingTasks";
import CompletedTasks from "./CompletedTasks/CompletedTasks";
import { getTasks, getUsers } from "./taskService";
import TotalTasks from "./TotalTasks/TotalTasks";

import logo from "./assets/logo.png";
import login from "./assets/login.png";

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
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user")) || null;
    } catch {
      return null;
    }
  });

  // Obtener tareas desde el backend
  const loadTasks = useCallback(async () => {
    try {
      const data = await getTasks();
      console.log("DATA BACKEND:", data);
      setTasks(data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  // Obtener usuarios desde el backend
  const loadUsers = useCallback(async () => {
    try {
      const data = await getUsers();
      setUsers(data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const loadDashboardData = useCallback(async () => {
    await Promise.all([loadTasks(), loadUsers()]);
  }, [loadTasks, loadUsers]);

  // Cargar datos al iniciar la app
  useEffect(() => {
    if (!localStorage.getItem("token")) return;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadDashboardData();
  }, [loadDashboardData]);

  // Manejo de login (usando backend)
  const handleLogin = async (selectedUser) => {
    console.log("USER FINAL:", selectedUser);
    setUser(selectedUser);
    localStorage.setItem("user", JSON.stringify(selectedUser));
    setShowLogin(false);
    await loadDashboardData();
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

  const normalizeText = (value) =>
    String(value ?? "")
      .replace(/['"]+/g, "")
      .trim()
      .toLowerCase();

  const getLoggedInUserId = (value) =>
    value?.id ?? value?.userId ?? value?.user_id ?? value?.USER_ID ?? value?.ID;

  const getTaskOwnerId = (value) =>
    value?.userId ?? value?.user_id ?? value?.USER_ID ?? value?.assignedUserId ?? value?.ownerId;

  const getUserName = (value) =>
    value?.name ?? value?.userName ?? value?.username ?? value?.NAME ?? value?.USERNAME;

  const getUserEmail = (value) =>
    value?.email ?? value?.EMAIL ?? value?.userEmail ?? value?.USER_EMAIL;

  const taskBelongsToUser = (task, currentUser) => {
    if (!currentUser) return false;

    const currentUserId = getLoggedInUserId(currentUser);
    const taskUserId = getTaskOwnerId(task);

    if (currentUserId != null && taskUserId != null) {
      if (String(taskUserId) === String(currentUserId)) {
        return true;
      }
    }

    const currentUserName = normalizeText(getUserName(currentUser));
    const taskUserName = normalizeText(
      task.userName ?? task.username ?? task.assignedTo ?? task.owner ?? task.NAME ?? task.USERNAME
    );

    if (currentUserName && taskUserName) {
      return taskUserName === currentUserName;
    }

    const currentUserEmail = normalizeText(getUserEmail(currentUser));
    const taskUserEmail = normalizeText(
      task.email ?? task.userEmail ?? task.assignedEmail ?? task.ownerEmail ?? task.EMAIL
    );

    return Boolean(currentUserEmail && taskUserEmail && taskUserEmail === currentUserEmail);
  };

  const isDoneStatus = (status) => {
    const normalizedStatus = normalizeText(status).replace(/[\s-]+/g, "_");
    return normalizedStatus === "done" || normalizedStatus === "completed";
  };

  // Filtrar tareas del usuario actual usando ID y nombres como respaldo
  const tareasFiltradas = user
    ? tasks.filter((task) => taskBelongsToUser(task, user))
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
              {/* Analytics del usuario */}
              {vista === "MyAnalytics" && (
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
                  tasks={tareasFiltradas.filter(t => !isDoneStatus(t.status ?? t.STATUS))}
                  users={users}
                  setTasks={setTasks}
                  currentUser={user} 
                  title="My Pending Tasks"
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
            </>
          )}
        </section>
      </div>
    </>
  );
}

export default App;
