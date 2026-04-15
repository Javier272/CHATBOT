import { useState } from "react";
import Sidebar from "./Sidebar";
import MyComTasks from "./MyCompletedTasks";
import logo from './assets/logo.png';
import TaskList from "./TaskList";
import './App.css';
import './TaskList.css';

function App() {

  const [vista, setVista] = useState("null");

  return (
    <> 
      {/* HEADER */}
      <header className="header">
        <img></img>
        
        <button className="btn-login">Login</button>

        <div className="header-title-container">
          <img src={logo} alt="Logo" className="hero-logo" />
          <h1>OnTeamTasks</h1>
        </div>
      </header>

      {/* LAYOUT */}
      <div className="layout">
        {/* SIDEBAR */}
        <section id="lateral">
          <Sidebar setVista={setVista} />
        </section>

        <section id="center">
          {vista === "Mycompleted" && <MyComTasks />}
          {vista === "pending" && <TaskList />}
        </section>
      </div>
      
    </>
  )
}

export default App;