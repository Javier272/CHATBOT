import { useState } from "react";
import Sidebar from "./Sidebar";
import MyComTasks from "./MyCompletedTasks";
import TaskList from "./TaskList";
import Login from "./Login";
import AddTask from "./AddTask"; // Importación del formulario
import {
  getTasks,
  setTasks as saveTasks,
  getCurrentUser,
  getUsers,      
  setCurrentUser, 
  addUser  
} from "./tasksStore";
import logo from "./assets/logo.png";
import "./App.css";
import "./TaskList.css";
import "./MyCompletedTasks.css";

function App() {
  // Controla qué vista se muestra en pantalla
  const [vista, setVista] = useState("Mypending"); 

  // Estado principal con todas las tareas del sistema
  const [tasks, setTasks] = useState(getTasks());

  // Estado para controlar si el login está abierto
  const [showLogin, setShowLogin] = useState(false);

  // Usuario actual
  const [user, setUser] = useState(getCurrentUser());

  // Filtro dinámico según el usuario logueado
  const tareasFiltradas = tasks.filter(
    (task) => task.responsableId === user.id
  );

  // Maneja el acceso de un usuario existente
  const handleLogin = (selectedUser) => {
    setCurrentUser(selectedUser);
    setUser(selectedUser);
    setShowLogin(false);
  };

  // Maneja la creación de un usuario nuevo
  const handleRegister = (name) => {
    const newUser = addUser(name);
    handleLogin(newUser);
  };

  // Actualiza React y el store local
  const updateTasks = (updatedTasks) => {
    setTasks(updatedTasks);
    saveTasks(updatedTasks);
  };

  // Lógica para guardar la nueva tarea y cerrar el formulario
  const addNewTask = (newTask) => {
    const updatedTasks = [...tasks, newTask];
    updateTasks(updatedTasks); 
    setVista("Mypending"); // Regresa a la lista automáticamente
  };

  return (
    <>
      {/* HEADER */}
      <header className="header">
        <img></img>

        <button className="btn-login" onClick={() => setShowLogin(true)}>
          {user ? `User: ${user.name}` : "Login"}
        </button>

        <div className="header-title-container">
          <img src={logo} alt="Logo" className="hero-logo" />
          <h1>OnTeamTasks</h1>
        </div>
      </header>

      {/* MODAL DE LOGIN */}
      {showLogin && (
        <Login 
          users={getUsers()} 
          onLogin={handleLogin} 
          onRegister={handleRegister}
          onClose={() => setShowLogin(false)}
        />
      )}

      {/* LAYOUT PRINCIPAL */}
      <div className="layout">
        <section id="lateral">
          <Sidebar setVista={setVista} />
        </section>

        <section id="center">
          {/* VISTA AGREGAR: Si el modo es "add", solo se muestra el formulario */}
          {vista === "add" && (
            <AddTask 
              onAddTask={addNewTask} 
              onCancel={() => setVista("Mypending")} 
            />
          )}

          {/* VISTAS DE DATOS: Solo se muestran si no estamos añadiendo una tarea */}
          {vista !== "add" && (
            <>
              {(vista === "MyAnalytics" || vista === "Mycompleted") && (
                <MyComTasks tasks={tareasFiltradas} />
              )}

              {(vista === "Mypending" || vista === "Individual") && (
                <TaskList
                  tasks={tareasFiltradas}
                  allTasks={tasks}
                  setTasks={updateTasks}
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