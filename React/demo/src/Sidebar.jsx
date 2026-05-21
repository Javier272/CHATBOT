import { useState } from "react";
import team from "./assets/team.png";
import user from "./assets/user.png";
import add from "./assets/add.png";
import tasks from "./assets/tasks.png";
import analysis from "./assets/analysis.png";
import ComTasks from "./assets/ComTasks.png";
import PendingTasks from "./assets/PendingTasks.png";
import Resume from "./assets/Resume.png"



function Sidebar({ setVista }) {

  const [modo, setModo] = useState("team");

  return (
    <div>

      <nav className="menu-lateral">

        <button 
          className="btn-menu"
          onClick={() => setModo("individual")}
        >
        <img src={user} alt="user" className="img-sideButton" />

          Individualssssersss
        </button>

        <button 
          className="btn-menu perfil"
          onClick={() => setModo("team")}
        >
        <img src={team} alt="team" className="img-sideButton" />
          Teamssseeess
        </button>

        <hr className="sidebar-divider" />


        <div className="tasks-buttons">
          {modo === "individual" && (
            <>
             
              <h2></h2>

            <button className="btn-Tasks pending" onClick={() => setVista("Mypending")}>
        <img src={tasks} alt="tasks" className="img-sideButton" />

              
              My Pending Tasks
            </button>

            <h2></h2>

            <button className="btn-Tasks completed" onClick={() => setVista("Mycompleted")}>
        <img src={analysis} alt="analysis" className="img-sideButton" />

              My Analytics
            </button>
            </>
          )}

          {modo === "team" && (
            <>

              <button className="btn-Tasks add" onClick={() => setVista("add")}>
              <img src={add} alt="add" className="img-sideButton" />

                Add Task 
              </button>

              <h2></h2>

              <button
                className="btn-Tasks pending"
                onClick={() => setVista("TotalTasks")}
              >
              <img src={tasks} alt="tasks" className="img-sideButton" />

              Total Tasks
              </button>
              <button
                className="btn-Tasks pending"
                onClick={() => setVista("CompletedTasks")}
              >
              <img src={ComTasks} alt="ComTasks" className="img-sideButton" />

              Completed Tasks
              </button>


              <button
                className="btn-Tasks pending"
                onClick={() => setVista("TotalPendingTasks")}
              >
              <img src={PendingTasks} alt="PendingTasks" className="img-sideButton" />

              Pending Tasks
              </button>

              <button className="btn-Tasks completed" onClick={() => setVista("TeamAnalytics")}>
              <img src={analysis} alt="analysis" className="img-sideButton" />

               Tasks Resume per Sprint
              </button>

              <button className="btn-Tasks completed" onClick={() => setVista("TeamAnalytics")}>
              <img src={Resume} alt="analysis" className="img-sideButton" />

               Total Tasks Resume
              </button>

             

            </>
          )}
        </div>
      </nav>
    </div>
  );
}

export default Sidebar;