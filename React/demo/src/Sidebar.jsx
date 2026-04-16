import { useState } from "react";

function Sidebar({ setVista }) {

  const [modo, setModo] = useState("individual");

  return (
    <div>

      <nav className="menu-lateral">

        <button 
          className="btn-menu"
          onClick={() => setModo("individual")}
        >
          Individual
        </button>

        <button 
          className="btn-menu perfil"
          onClick={() => setModo("team")}
        >
          Team
        </button>


        <div className="tasks-buttons">
          {modo === "individual" && (
            <>
             
              <h2></h2>

            <button className="btn-Tasks pending" onClick={() => setVista("Mypending")}>
              My Pending Tasks
            </button>

            <h2></h2>

            <button className="btn-Tasks completed" onClick={() => setVista("Mycompleted")}
            >
              My Analytics
            </button>
            </>
          )}

          {modo === "team" && (
            <>

              <button className="btn-Tasks add" onClick={() => setVista("add")}>
                Add Task +
              </button>
              <h2></h2>

              <button className="btn-Tasks pending">
                Pending Tasks
              </button>
              <h2></h2>

              <button className="btn-Tasks completed" onClick={() => setVista("TeamAnalytics")}>
               Tasks Analysis
              </button>

             

            </>
          )}
        </div>
      </nav>
    </div>
  );
}

export default Sidebar;